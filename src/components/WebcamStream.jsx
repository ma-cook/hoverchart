import { useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { startBroadcasting, joinBroadcast } from '../services/webRservice';
import { useWebcamStreamStore } from '../stores';
import { shallow } from 'zustand/shallow';
// Import unified resource cleanup
import { resourceCleanupService } from '../services/resourceCleanupService';

// Module-level constant — never changes, no need for useMemo
const WEBCAM_CONSTRAINTS = {
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: 'user',
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

/**
 * Creates a VideoTexture from a video element and applies it to a mesh.
 * Disposes the previous material to prevent memory leaks.
 * THREE.VideoTexture auto-updates via the renderer each frame — no RAF loop needed.
 */
const applyVideoTexture = (videoEl, mesh, cleanupLabel, textureRef) => {
  const texture = new THREE.VideoTexture(videoEl);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBAFormat;
  texture.colorSpace = THREE.SRGBColorSpace;
  // eslint-disable-next-line no-param-reassign
  textureRef.current = texture;

  if (mesh) {
    if (mesh.material && mesh.material.map !== texture) {
      resourceCleanupService.disposeMaterial(mesh.material, cleanupLabel);
    }
    mesh.material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });
  }
  return texture;
};

const WebcamStream = ({
  active = false,
  meshRef,
  userId,
  spaceId,
  planeId,
  isBroadcasting = false,
  isReceiving = false,
  broadcastData = null,
  onBroadcastStarted,
  onBroadcastStopped,
  onViewerCountChange,
}) => {
  // Create unique stream ID
  const streamId = `${userId}-${spaceId}-${planeId}`;

  // Single subscription for all webcam store actions (4 → 1 subscriptions)
  const {
    getWebcamStream,
    setWebcamLoading,
    setWebcamError,
    retryWebcamStream,
  } = useWebcamStreamStore(
    (state) => ({
      getWebcamStream: state.getWebcamStream,
      setWebcamLoading: state.setWebcamLoading,
      setWebcamError: state.setWebcamError,
      retryWebcamStream: state.retryWebcamStream,
    }),
    shallow
  );

  const webcamStream = getWebcamStream(streamId);
  const { hasError, errorMessage, isLoading, retryTrigger } = webcamStream;

  // Refs
  const videoRef = useRef(null);
  const textureRef = useRef(null);
  const streamRef = useRef(null);
  const broadcastControlRef = useRef(null);
  const viewerConnectionRef = useRef(null);
  const remoteVideoRef = useRef(null);
  // Stable refs for callback functions to avoid effect re-runs
  const onBroadcastStartedRef = useRef(onBroadcastStarted);
  const onViewerCountChangeRef = useRef(onViewerCountChange);
  const onBroadcastStoppedRef = useRef(onBroadcastStopped);

  // Update refs when callbacks change (but don't trigger effects)
  onBroadcastStartedRef.current = onBroadcastStarted;
  onViewerCountChangeRef.current = onViewerCountChange;
  onBroadcastStoppedRef.current = onBroadcastStopped;

  // Broadcasting effect
  useEffect(() => {
    if (!active || !isBroadcasting || !userId || !spaceId || !planeId) {
      return;
    }

    let effectCancelled = false; // Use local cancellation token instead of shared isMounted

    // Capture current values to avoid re-runs when these change
    const currentMeshRef = meshRef.current;
    const currentOnBroadcastStarted = onBroadcastStartedRef.current;
    const currentOnViewerCountChange = onViewerCountChangeRef.current;
    setWebcamLoading(streamId, true);
    setWebcamError(streamId, false); // Create video element
    console.log('Creating video element...');
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    // Use off-screen positioning instead of display:none — mobile browsers
    // skip frame decoding for hidden elements, leaving VideoTexture blank.
    video.style.position = 'fixed';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '-1';
    document.body.appendChild(video);
    videoRef.current = video;

    // Start webcam stream

    navigator.mediaDevices
      .getUserMedia(WEBCAM_CONSTRAINTS)
      .then((stream) => {
        console.log('User media stream obtained:', stream);

        try {
          if (effectCancelled) {
            console.log('Broadcasting effect cancelled, stopping leaked stream');
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          streamRef.current = stream;
          video.srcObject = stream;
        } catch (error) {
          console.error('Error in stream setup:', error);
          setWebcamError(
            streamId,
            true,
            'Error setting up video stream: ' + error.message
          );
          setWebcamLoading(streamId, false);
          return;
        }

        // Function to attempt playing the video (defined first)
        let attemptPlayCalled = false;
        const attemptPlay = async () => {
          if (attemptPlayCalled) return;
          attemptPlayCalled = true;
          try {
            await video.play();

            if (effectCancelled) {
              return;
            }

            // Create video texture and apply to mesh.
            // THREE.VideoTexture auto-updates every render frame via the WebGL renderer —
            // no separate RAF loop required.
            applyVideoTexture(
              video,
              currentMeshRef,
              `webcam-${streamId}-material`,
              textureRef
            );

            setWebcamLoading(streamId, false);

            // Start broadcasting in the background

            startBroadcasting(userId, spaceId, planeId, stream, 'webcam')
              .then((broadcastControl) => {
                if (effectCancelled) return;
                broadcastControlRef.current = broadcastControl;
                broadcastControlRef.current.isActive = true;

                if (currentOnBroadcastStarted && broadcastControl.broadcastId) {
                  currentOnBroadcastStarted({
                    broadcastId: broadcastControl.broadcastId,
                    planeId,
                  });
                }

                // Set up viewer count updates
                if (
                  broadcastControl.getViewerCount &&
                  currentOnViewerCountChange
                ) {
                  const viewerCountInterval = setInterval(() => {
                    if (broadcastControlRef.current?.isActive) {
                      currentOnViewerCountChange(
                        broadcastControl.getViewerCount()
                      );
                    }
                  }, 5000);

                  broadcastControlRef.current.viewerCountInterval =
                    viewerCountInterval;
                }
              })
              .catch((error) => {
                console.log('Broadcast service failed:', error);
                if (effectCancelled) return;
                setWebcamError(
                  streamId,
                  true,
                  'Failed to start broadcast: ' + error.message
                );
                setWebcamLoading(streamId, false);
              });
          } catch (error) {
            console.log('Video play failed with error:', error);
            if (effectCancelled) return;
            setWebcamLoading(streamId, false);
            setWebcamError(
              streamId,
              true,
              'Failed to start video: ' + error.message
            );
          }
        };

        // Add event listeners for better debugging

        video.addEventListener('loadedmetadata', () => {
          console.log('Video loadedmetadata event fired', {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState,
          });
        });

        video.addEventListener('error', (e) => {
          console.log('Video error event fired:', e);
        });

        if (video.readyState >= 3) {
          // HAVE_FUTURE_DATA
          console.log(
            'Video ready state sufficient, calling attemptPlay immediately'
          );
          attemptPlay();
        } else {
          video.addEventListener('canplay', attemptPlay, { once: true });
        }
      })
      .catch((error) => {
        console.log('getUserMedia failed:', error);
        if (effectCancelled) return;
        setWebcamLoading(streamId, false);
        setWebcamError(streamId, true, 'Camera access error: ' + error.message);
      });
    return () => {
      console.log(
        'Broadcasting effect cleanup - setting effectCancelled to true'
      );
      effectCancelled = true;
      // Clean up the video element created in this effect run to prevent DOM leaks
      if (video && document.body.contains(video)) {
        video.pause();
        video.srcObject = null;
        document.body.removeChild(video);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, isBroadcasting, userId, spaceId, planeId, retryTrigger]); // Receiving effect
  useEffect(() => {
    if (!active || !isReceiving || !broadcastData || !spaceId || !userId) {
      if (viewerConnectionRef.current) {
        viewerConnectionRef.current.disconnect();
        viewerConnectionRef.current = null;
      }
      return;
    }

    let effectCancelled = false; // Local cancellation token (safe across StrictMode double-mount)
    let connection = null;
    let currentStream = null;
    const currentBroadcastId = broadcastData.broadcastId;
    const currentMesh = meshRef.current;
    setWebcamLoading(streamId, true);
    setWebcamError(streamId, false);

    // Create or reuse video element for remote stream
    if (!remoteVideoRef.current) {
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      // Off-screen instead of display:none — mobile browsers won't decode
      // frames for hidden videos, causing blank VideoTexture.
      video.style.position = 'fixed';
      video.style.top = '0';
      video.style.left = '0';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';
      video.style.zIndex = '-1';
      document.body.appendChild(video);
      remoteVideoRef.current = video;
    } else {
      remoteVideoRef.current.srcObject = null;
    }

    const connectToBroadcast = async () => {
      if (effectCancelled) return;

      try {
        console.log(`[WebcamStream] Joining broadcast: spaceId=${spaceId}, broadcastId=${currentBroadcastId}, userId=${userId}`);
        connection = await joinBroadcast(spaceId, currentBroadcastId, userId);

        if (effectCancelled) {
          connection?.disconnect();
          return;
        }

        viewerConnectionRef.current = connection;

        connection.peerConnection.ontrack = (event) => {
          if (
            event.streams &&
            event.streams[0] &&
            remoteVideoRef.current &&
            event.track.kind === 'video'
          ) {
            const newStream = event.streams[0];

            if (remoteVideoRef.current.srcObject !== newStream) {
              currentStream = newStream;
              remoteVideoRef.current.srcObject = newStream;

              remoteVideoRef.current.onloadedmetadata = null;
              remoteVideoRef.current.onplaying = null;
              remoteVideoRef.current.onerror = null;

              remoteVideoRef.current.onloadedmetadata = () => {
                if (remoteVideoRef.current?.srcObject !== currentStream) return;

                // Apply video texture using shared helper.
                // THREE.VideoTexture auto-updates via the renderer — no RAF loop needed.
                applyVideoTexture(
                  remoteVideoRef.current,
                  currentMesh,
                  `webcam-${streamId}-material-update`,
                  textureRef
                );
                remoteVideoRef.current
                  .play()
                  .then(() => {
                    setWebcamLoading(streamId, false);
                  })
                  .catch((e) => {
                    if (e.name !== 'AbortError') {
                      setWebcamError(
                        streamId,
                        true,
                        'Remote video playback error'
                      );
                      setWebcamLoading(streamId, false);
                    }
                  });

                remoteVideoRef.current.onloadedmetadata = null;
              };
              remoteVideoRef.current.onplaying = () => {
                if (remoteVideoRef.current?.srcObject !== currentStream) return;
                setWebcamLoading(streamId, false);
              };

              remoteVideoRef.current.onerror = () => {
                if (remoteVideoRef.current?.srcObject !== currentStream) return;
                setWebcamError(streamId, true, 'Remote video playback error');
                setWebcamLoading(streamId, false);
              };
            }
          }
        };
      } catch (error) {
        if (effectCancelled) return;
        setWebcamError(streamId, true, `Failed to connect: ${error.message}`);
        setWebcamLoading(streamId, false);
      }
    };

    connectToBroadcast();
    return () => {
      effectCancelled = true;

      if (connection) {
        connection.disconnect();
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.onloadedmetadata = null;
        remoteVideoRef.current.onplaying = null;
        remoteVideoRef.current.onerror = null;
      }

      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      if (currentMesh?.material?.map) {
        currentMesh.material.map = null;
        currentMesh.material.needsUpdate = true;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    active,
    isReceiving,
    // Use broadcastId string (not the broadcastData object) so a new object reference
    // with the same broadcastId does not trigger a spurious disconnect + reconnect.
    broadcastData?.broadcastId,
    spaceId,
    userId,
    meshRef,
    planeId,
    retryTrigger,
  ]);

  // THREE.VideoTexture marks itself needsUpdate automatically every frame via
  // WebGLRenderer — no separate RAF texture-update loop is needed here.

  // Cleanup on unmount
  useEffect(() => {
    const currentMesh = meshRef.current; // Capture reference
    return () => {
      if (
        isBroadcasting &&
        broadcastControlRef.current &&
        onBroadcastStoppedRef.current
      ) {
        onBroadcastStoppedRef.current();
      }

      // Direct cleanup without dependency issues
      // Stop media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Stop broadcasting
      if (broadcastControlRef.current) {
        if (broadcastControlRef.current.viewerCountInterval) {
          clearInterval(broadcastControlRef.current.viewerCountInterval);
        }
        broadcastControlRef.current.stop();
        broadcastControlRef.current = null;
      }

      // Disconnect as viewer
      if (viewerConnectionRef.current) {
        viewerConnectionRef.current.disconnect();
        viewerConnectionRef.current = null;
      }

      // Dispose texture
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }

      // Remove video elements
      [videoRef, remoteVideoRef].forEach((ref) => {
        if (ref.current) {
          const video = ref.current;
          video.onloadedmetadata = null;
          video.onplaying = null;
          video.onerror = null;
          video.oncanplay = null;
          video.oncanplaythrough = null;

          video.pause();
          video.srcObject = null;
          video.src = '';
          video.load();

          if (document.body.contains(video)) {
            document.body.removeChild(video);
          }
          ref.current = null;
        }
      });

      // Clear mesh material map
      if (currentMesh?.material) {
        if (currentMesh.material.map) {
          currentMesh.material.map.dispose();
          currentMesh.material.map = null;
        }
        currentMesh.material.needsUpdate = true;
      }
    };
  }, [isBroadcasting, meshRef]);

  // Error display
  if (hasError) {
    return (
      <mesh position={[0, 0, 0.1]}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial color="black" transparent opacity={0.7} />
        <mesh position={[0, 0, 0.1]}>
          <planeGeometry args={[8, 2]} />
          <meshBasicMaterial color="red" transparent opacity={0.8} />
          <Html center position={[0, 0, 0.1]}>
            <div
              style={{
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '10px',
                borderRadius: '5px',
                whiteSpace: 'nowrap',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div>⚠️ {errorMessage}</div>{' '}
              <button
                onClick={() => {
                  setWebcamError(streamId, false);
                  setWebcamLoading(streamId, true);
                  retryWebcamStream(streamId);
                }}
                style={{
                  padding: '5px 10px',
                  background: '#4285f4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Retry Connection
              </button>
            </div>
          </Html>
        </mesh>
      </mesh>
    );
  }

  // Loading indicator
  if (isLoading) {
    return (
      <Html center position={[0, 0, 0.1]}>
        <div
          style={{
            color: 'white',
            background: 'rgba(0,0,0,0.5)',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {isBroadcasting ? 'Starting broadcast...' : 'Connecting to stream...'}
        </div>
      </Html>
    );
  }

  // Broadcasting status indicator
  if (isBroadcasting) {
    return (
      <Html position={[4, 4, 0.1]}>
        <div
          style={{
            color: 'white',
            background: 'rgba(255,0,0,0.7)',
            padding: '3px 6px',
            borderRadius: '3px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          LIVE
        </div>
      </Html>
    );
  }

  // Viewing status indicator
  if (isReceiving) {
    return (
      <Html position={[4, 4, 0.1]}>
        <div
          style={{
            color: 'white',
            background: 'rgba(0,0,255,0.7)',
            padding: '3px 6px',
            borderRadius: '3px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          VIEWING
        </div>
      </Html>
    );
  }

  return null;
};

export default WebcamStream;
