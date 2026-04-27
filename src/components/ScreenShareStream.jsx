import { useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { startBroadcasting, joinBroadcast } from '../services/webRservice';
import { useScreenShareStore } from '../stores';
// Import unified resource cleanup
import { resourceCleanupService } from '../services/resourceCleanupService';
// Import unified texture updater
import useTextureUpdater from '../hooks/useTextureUpdater';

const ScreenShareStream = ({
  active = false,
  meshRef,
  userId,
  spaceId,
  planeId,
  isScreenSharing = false,
  isReceiving = false,
  broadcastData = null,
  onBroadcastStarted,
  onBroadcastStopped,
  onViewerCountChange,
}) => {
  // Use screen share store
  const streamId = `${userId}-${spaceId}-${planeId}`;
  const getScreenShare = useScreenShareStore((state) => state.getScreenShare);
  const setScreenShareLoading = useScreenShareStore(
    (state) => state.setScreenShareLoading
  );
  const setScreenShareError = useScreenShareStore(
    (state) => state.setScreenShareError
  );
  const retryScreenShare = useScreenShareStore(
    (state) => state.retryScreenShare
  );

  const screenShare = getScreenShare(streamId);
  const { hasError, errorMessage, isLoading, retryTrigger } = screenShare;

  // Refs
  const videoRef = useRef(null);
  const textureRef = useRef(null);
  const streamRef = useRef(null);
  const broadcastControlRef = useRef(null);
  const viewerConnectionRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const isMounted = useRef(true);
  // Guard: prevents a second getDisplayMedia call while one is already in-flight
  const acquisitionInFlightRef = useRef(false);

  // Stable refs for callback functions to avoid effect re-runs
  const onBroadcastStartedRef = useRef(onBroadcastStarted);
  const onViewerCountChangeRef = useRef(onViewerCountChange);
  const onBroadcastStoppedRef = useRef(onBroadcastStopped);

  // Update refs when callbacks change (but don't trigger effects)
  onBroadcastStartedRef.current = onBroadcastStarted;
  onViewerCountChangeRef.current = onViewerCountChange;
  onBroadcastStoppedRef.current = onBroadcastStopped;

  // Single primitive that gates the screen-sharing effect
  const shouldStart = active && isScreenSharing && !!userId && !!spaceId && !!planeId;

  // Screen sharing effect
  useEffect(() => {
    if (!shouldStart) {
      return;
    }

    // Guard: don't open a second picker if one is already in-flight for this streamId
    if (acquisitionInFlightRef.current) return;
    acquisitionInFlightRef.current = true;

    let effectCancelled = false; // Capture current values to avoid re-runs when these change
    const currentMeshRef = meshRef.current;
    const currentOnBroadcastStarted = onBroadcastStartedRef.current;
    const currentOnViewerCountChange = onViewerCountChangeRef.current;

    setScreenShareLoading(streamId, true);
    setScreenShareError(streamId, false);

    // Create video element
    console.log('Creating video element for screen share...');
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.style.display = 'none';
    document.body.appendChild(video);
    videoRef.current = video;

    // Start screen share stream
    navigator.mediaDevices
      .getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 2560 },
          height: { ideal: 1080, max: 1440 },
          frameRate: { ideal: 15, max: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      .then((stream) => {
        console.log('Screen share stream obtained:', stream);

        try {
          if (effectCancelled) {
            console.log('Screen sharing effect cancelled, returning early');
            return;
          }

          streamRef.current = stream;
          video.srcObject = stream;

          // Listen for stream end (user clicks stop sharing in browser UI)
          stream.getVideoTracks().forEach((track) => {
            track.addEventListener('ended', () => {
              console.log('Screen share ended by user');
              if (onBroadcastStoppedRef.current) {
                onBroadcastStoppedRef.current();
              }
            });
          });
        } catch (error) {
          console.error('Error in screen share setup:', error);
          acquisitionInFlightRef.current = false;
          setScreenShareError(
            streamId,
            true,
            'Error setting up screen share: ' + error.message
          );
          setScreenShareLoading(streamId, false);
          return;
        }

        // Function to attempt playing the video
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
                console.log(
                  'Disposing previous material using unified service'
                );
                resourceCleanupService.disposeMaterial(
                  currentMesh.material,
                  `screenshare-${streamId}-material`
                );
              }

              const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide,
              });
              currentMesh.material = material;
            } else {
              console.log('No mesh found to apply screen share texture to');
            }

            setScreenShareLoading(streamId, false);

            // Start broadcasting the screen share
            startBroadcasting(userId, spaceId, planeId, stream, 'screenshare')
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
                console.log('Screen share broadcast service failed:', error);
                if (effectCancelled) return;
                setScreenShareError(
                  streamId,
                  true,
                  'Failed to start screen share broadcast: ' + error.message
                );
                setScreenShareLoading(streamId, false);
              });
          } catch (error) {
            console.log('Screen share video play failed with error:', error);
            if (effectCancelled) return;
            setScreenShareLoading(streamId, false);
            setScreenShareError(
              streamId,
              true,
              'Failed to start screen share video: ' + error.message
            );
          }
        };

        // Add event listeners
        video.addEventListener('error', (e) => {
          console.log('Screen share video error event fired:', e);
        });

        if (video.readyState >= 3) {
          console.log(
            'Screen share video ready state sufficient, calling attemptPlay immediately'
          );
          attemptPlay();
        } else {
          video.addEventListener('canplay', attemptPlay, { once: true });
        }
      })
      .catch((error) => {
        console.log('getDisplayMedia failed:', error);
        acquisitionInFlightRef.current = false;
        if (effectCancelled) return;
        setScreenShareLoading(streamId, false);
        // User dismissed the screen-picker — don't show an error banner
        if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
          return;
        }
        setScreenShareError(
          streamId,
          true,
          'Screen share access error: ' + error.message
        );
      });

    return () => {
      console.log(
        'Screen sharing effect cleanup - setting effectCancelled to true'
      );
      effectCancelled = true;
      acquisitionInFlightRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldStart, retryTrigger, streamId]);

  // Receiving effect (same as WebcamStream)
  useEffect(() => {
    if (!active || !isReceiving || !broadcastData || !spaceId || !userId) {
      if (viewerConnectionRef.current) {
        viewerConnectionRef.current.disconnect();
        viewerConnectionRef.current = null;
      }
      return;
    }

    let connection = null;
    let currentStream = null;
    const currentBroadcastId = broadcastData.broadcastId;
    const currentMesh = meshRef.current;
    setScreenShareLoading(streamId, true);
    setScreenShareError(streamId, false);

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
                    // Use unified resource cleanup service
                    resourceCleanupService.disposeMaterial(
                      currentMesh.material,
                      `screenshare-${streamId}-material-update`
                    );
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
                    setScreenShareLoading(streamId, false);
                  })
                  .catch((e) => {
                    if (e.name !== 'AbortError') {
                      setScreenShareError(
                        streamId,
                        true,
                        'Remote screen share playback error'
                      );
                      setScreenShareLoading(streamId, false);
                    }
                  });

                remoteVideoRef.current.onloadedmetadata = null;
              };
              remoteVideoRef.current.onplaying = () => {
                if (remoteVideoRef.current?.srcObject !== currentStream) return;
                setScreenShareLoading(streamId, false);
              };

              remoteVideoRef.current.onerror = () => {
                if (remoteVideoRef.current?.srcObject !== currentStream) return;
                setScreenShareError(
                  streamId,
                  true,
                  'Remote screen share playback error'
                );
                setScreenShareLoading(streamId, false);
              };
            }
          }
        };
      } catch (error) {
        if (!isMounted.current) return;
        setScreenShareError(
          streamId,
          true,
          `Failed to connect to screen share: ${error.message}`
        );
        setScreenShareLoading(streamId, false);
      }
    };

    connectToBroadcast();
    return () => {
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
      } // Clear mesh material map
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
    streamId,
  ]);

  // Use unified texture updater with 30fps throttling for screen share
  useTextureUpdater({
    active: active && textureRef.current,
    textureRef,
    meshRef,
    throttleMs: 33, // ~30fps for screen share
  });

  // Cleanup on unmount
  useEffect(() => {
    const currentMesh = meshRef.current;
    return () => {
      console.log(
        'ScreenShareStream component unmounting - setting isMounted to false'
      );
      isMounted.current = false;
      if (
        isScreenSharing &&
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
  }, [isScreenSharing, meshRef]);

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
                  setScreenShareError(streamId, false);
                  setScreenShareLoading(streamId, true);
                  retryScreenShare(streamId);
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
                Retry Screen Share
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
          {isScreenSharing
            ? 'Starting screen share...'
            : 'Connecting to screen share...'}
        </div>
      </Html>
    );
  }

  // Screen sharing status indicator
  if (isScreenSharing) {
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
          SCREEN SHARE
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
          VIEWING SCREEN
        </div>
      </Html>
    );
  }

  return null;
};

export default ScreenShareStream;
