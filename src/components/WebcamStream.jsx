import { useEffect, useRef, useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { startBroadcasting, joinBroadcast } from '../services/webRservice';
import { useWebcamStreamStore } from '../stores';

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

  // Use webcam stream store
  const getWebcamStream = useWebcamStreamStore(
    (state) => state.getWebcamStream
  );
  const setWebcamLoading = useWebcamStreamStore(
    (state) => state.setWebcamLoading
  );
  const setWebcamError = useWebcamStreamStore((state) => state.setWebcamError);
  const retryWebcamStream = useWebcamStreamStore(
    (state) => state.retryWebcamStream
  );

  // Get store state
  const webcamStream = getWebcamStream(streamId);
  const { hasError, errorMessage, isLoading, retryTrigger } = webcamStream;

  // Refs
  const videoRef = useRef(null);
  const textureRef = useRef(null);
  const streamRef = useRef(null);
  const broadcastControlRef = useRef(null);
  const viewerConnectionRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const isMounted = useRef(true);
  // Stable refs for callback functions to avoid effect re-runs
  const onBroadcastStartedRef = useRef(onBroadcastStarted);
  const onViewerCountChangeRef = useRef(onViewerCountChange);
  const onBroadcastStoppedRef = useRef(onBroadcastStopped);

  // Update refs when callbacks change (but don't trigger effects)
  onBroadcastStartedRef.current = onBroadcastStarted;
  onViewerCountChangeRef.current = onViewerCountChange;
  onBroadcastStoppedRef.current = onBroadcastStopped;
  // Optimized webcam constraints for better performance
  const webcamConstraints = useMemo(
    () => ({
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
    }),
    []
  ); // Broadcasting effect
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
    video.style.display = 'none';
    document.body.appendChild(video);
    videoRef.current = video;

    // Start webcam stream

    navigator.mediaDevices
      .getUserMedia(webcamConstraints)
      .then((stream) => {
        console.log('User media stream obtained:', stream);

        try {
          if (effectCancelled) {
            console.log('Broadcasting effect cancelled, returning early');
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
        const attemptPlay = async () => {
          try {
            await video.play();

            if (effectCancelled) {
              return;
            }

            // Create video texture for local display

            const texture = new THREE.VideoTexture(video);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.format = THREE.RGBAFormat;
            texture.colorSpace = THREE.SRGBColorSpace;
            textureRef.current = texture;

            const currentMesh = currentMeshRef;

            if (currentMesh) {
              // Dispose previous material to prevent memory leaks
              if (
                currentMesh.material &&
                currentMesh.material.map !== texture
              ) {
                if (currentMesh.material.map) {
                  console.log('Disposing previous material map');
                  currentMesh.material.map.dispose();
                }
                console.log('Disposing previous material');
                currentMesh.material.dispose();
              }

              const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide,
              });
              currentMesh.material = material;
            } else {
              console.log('No mesh found to apply texture to');
            }

            setWebcamLoading(streamId, false);

            // Start broadcasting in the background

            startBroadcasting(userId, spaceId, planeId, stream)
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

        video.addEventListener('canplay', () => {
          console.log('Video canplay event fired');
          attemptPlay();
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

    // isMounted.current is already true from initialization
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
      video.style.display = 'none';
      document.body.appendChild(video);
      remoteVideoRef.current = video;
    } else {
      remoteVideoRef.current.srcObject = null;
    }

    const connectToBroadcast = async () => {
      if (!isMounted.current) return;

      try {
        connection = await joinBroadcast(spaceId, currentBroadcastId, userId);

        if (!isMounted.current) {
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

                const texture = new THREE.VideoTexture(remoteVideoRef.current);
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.format = THREE.RGBAFormat;
                texture.colorSpace = THREE.SRGBColorSpace;
                textureRef.current = texture;

                if (currentMesh) {
                  if (
                    currentMesh.material &&
                    currentMesh.material.map !== texture
                  ) {
                    if (currentMesh.material.map) {
                      currentMesh.material.map.dispose();
                    }
                    currentMesh.material.dispose();
                  }

                  const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 1,
                    side: THREE.DoubleSide,
                  });
                  currentMesh.material = material;
                }
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
        if (!isMounted.current) return;
        setWebcamError(streamId, true, `Failed to connect: ${error.message}`);
        setWebcamLoading(streamId, false);
      }
    };

    connectToBroadcast();
    return () => {
      // Don't set isMounted.current = false here as it interferes with broadcasting

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
    broadcastData,
    spaceId,
    userId,
    meshRef,
    planeId,
    retryTrigger,
  ]);

  // Texture update effect
  useEffect(() => {
    if (!active || !textureRef.current) return;

    let frameId;
    let lastUpdateTime = 0;
    const THROTTLE_MS = 16; // ~60fps throttling

    const updateTexture = (currentTime) => {
      if (currentTime - lastUpdateTime >= THROTTLE_MS) {
        if (
          textureRef.current &&
          meshRef.current?.material?.map === textureRef.current
        ) {
          textureRef.current.needsUpdate = true;
        }
        lastUpdateTime = currentTime;
      }
      frameId = requestAnimationFrame(updateTexture);
    };
    frameId = requestAnimationFrame(updateTexture);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [active, meshRef]);

  // Cleanup on unmount
  useEffect(() => {
    const currentMesh = meshRef.current; // Capture reference
    return () => {
      console.log('Component unmounting - setting isMounted to false');
      isMounted.current = false;
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
