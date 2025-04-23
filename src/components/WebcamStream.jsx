import { useEffect, useState, useRef } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  startBroadcasting,
  joinBroadcast,
  findAvailableBroadcasts, // Add this import
} from '../services/webrtcservice';

// Add verification console log
console.log('WebcamStream component loaded, webRTC functions:', {
  startBroadcastingExists: !!startBroadcasting,
  joinBroadcastExists: !!joinBroadcast,
});

const WebcamStream = ({
  meshRef,
  active,
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
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Camera access error');
  const [isLoading, setIsLoading] = useState(true);
  const [broadcastDetails, setBroadcastDetails] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0); // Track connection attempts

  // Refs
  const videoRef = useRef(null);
  const textureRef = useRef(null);
  const streamRef = useRef(null);
  const broadcastControlRef = useRef(null);
  const viewerConnectionRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Cleanup function for all resources
  const cleanup = (options = { fullCleanup: true }) => {
    console.log(`🧹 Cleanup called with options: ${JSON.stringify(options)}`);

    // Stop media tracks (only if full cleanup or specifically requested)
    if (options.fullCleanup || options.stopLocalStream) {
      if (streamRef.current) {
        console.log('Stopping local media tracks');
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    // Stop broadcasting (only if full cleanup or specifically requested)
    if (options.fullCleanup || options.stopBroadcasting) {
      if (broadcastControlRef.current) {
        console.log('Stopping broadcast');
        broadcastControlRef.current.stop();
        broadcastControlRef.current = null;
      }
    }

    // Disconnect as viewer (only if full cleanup or specifically requested)
    if (options.fullCleanup || options.stopViewing) {
      if (viewerConnectionRef.current) {
        console.log('Disconnecting viewer connection');
        viewerConnectionRef.current.disconnect();
        viewerConnectionRef.current = null;
      }
    }

    // Dispose texture (always dispose if it exists)
    if (textureRef.current) {
      console.log('Disposing texture');
      textureRef.current.dispose();
      textureRef.current = null;
    }

    // Remove video elements (only if full cleanup)
    if (options.fullCleanup) {
      console.log('Removing video elements');
      [videoRef, remoteVideoRef].forEach((ref) => {
        if (ref.current) {
          // --- Ensure handlers are removed before srcObject is nulled ---
          ref.current.onloadedmetadata = null;
          ref.current.onplaying = null;
          ref.current.onerror = null;
          ref.current.srcObject = null;
          // --- End handler removal ---
          if (document.body.contains(ref.current)) {
            document.body.removeChild(ref.current);
          }
          ref.current = null;
        }
      });
    } else if (options.stopViewing && remoteVideoRef.current) {
      // If only stopping viewing, clean up remote video specifically
      console.log('Cleaning up remote video element');
      remoteVideoRef.current.onloadedmetadata = null;
      remoteVideoRef.current.onplaying = null;
      remoteVideoRef.current.onerror = null;
      remoteVideoRef.current.srcObject = null;
      // Don't remove the element itself unless full cleanup
    }

    // Clear mesh material map (always clear if it exists)
    if (meshRef.current?.material?.map) {
      console.log('Clearing mesh material map');
      meshRef.current.material.map.dispose(); // Dispose the old map
      meshRef.current.material.map = null;
      meshRef.current.material.needsUpdate = true;
    }
  };

  // Handle broadcasting mode: capture webcam and stream to others
  useEffect(() => {
    if (!active || !isBroadcasting || !userId || !spaceId || !planeId) {
      console.log('Skipping broadcast due to:', {
        active,
        isBroadcasting,
        userId,
        spaceId,
        planeId,
      });
      return () => {
        // Empty cleanup to prevent unintended broadcast stopping during re-renders
        console.log('Empty cleanup function for skipped broadcast');
      };
    }

    // Prevent duplicate effect runs by tracking the mount state
    const isMounted = { current: true };
    console.log(
      '🎬 Starting broadcast effect, isBroadcasting:',
      isBroadcasting
    );

    setIsLoading(true);
    console.log('Initializing broadcast mode for webcam');

    // Create video element
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.style.display = 'none';
    document.body.appendChild(video);
    videoRef.current = video;

    // Start webcam stream with explicit constraints for better compatibility
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: true,
      })
      .then((stream) => {
        console.log(
          'Webcam access granted:',
          stream.getTracks().length,
          'tracks'
        );
        streamRef.current = stream;
        video.srcObject = stream;

        video
          .play()
          .then(() => {
            console.log('Video started playing locally, creating texture');
            // Create video texture for local display
            const texture = new THREE.VideoTexture(video);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.format = THREE.RGBAFormat;
            texture.colorSpace = THREE.SRGBColorSpace;
            textureRef.current = texture;

            // Apply to plane material immediately for local display
            if (meshRef.current) {
              console.log('Applying texture to mesh');
              const material = meshRef.current.material;
              const newMaterial = material.clone();
              newMaterial.map = texture;
              newMaterial.transparent = true;
              newMaterial.opacity = 1;
              newMaterial.needsUpdate = true;
              meshRef.current.material = newMaterial;
            }

            // The webcam is now visible locally - set loading to false
            setIsLoading(false);

            // Now start broadcasting in the background with detailed logging
            console.log(
              'Starting WebRTC broadcast with broadcasting flag:',
              isBroadcasting
            );
            startBroadcasting(userId, spaceId, planeId, stream)
              .then((broadcastControl) => {
                console.log(
                  '🔴 LIVE: Broadcast started with ID:',
                  broadcastControl.broadcastId
                );

                // Store the broadcast control
                broadcastControlRef.current = broadcastControl;

                // CRITICAL FIX: Log success message with more details
                console.log(
                  '✅ Broadcast setup complete and ready for viewers!',
                  {
                    broadcastId: broadcastControl.broadcastId,
                    planeId,
                    spaceId,
                    userId,
                  }
                );

                // Add a flag to prevent automatic cleanup that might stop the broadcast
                broadcastControlRef.current.isActive = true;

                // Double-check that we got a valid ID
                if (!broadcastControl.broadcastId) {
                  console.error(
                    '❌ CRITICAL ERROR: Missing broadcastId from broadcast control'
                  );
                  return;
                }

                // Immediately notify parent with the broadcastId
                if (onBroadcastStarted) {
                  console.log('📣 Notifying parent component of broadcast:', {
                    broadcastId: broadcastControl.broadcastId,
                    planeId,
                  });

                  // Only call parent handler, remove direct database updates
                  onBroadcastStarted({
                    broadcastId: broadcastControl.broadcastId,
                    planeId,
                  });
                }

                // Set up viewer count updates
                const viewerCountInterval = setInterval(() => {
                  if (broadcastControl.getViewerCount && onViewerCountChange) {
                    onViewerCountChange(broadcastControl.getViewerCount());
                  }
                }, 2000);

                broadcastControlRef.current.viewerCountInterval =
                  viewerCountInterval;
              })
              .catch((error) => {
                console.error('❌ Failed to start broadcast:', error);
                // We need to notify the user there was an error
                setErrorMessage('Failed to start broadcast: ' + error.message);
                setHasError(true);
              });
          })
          .catch((error) => {
            console.error('Error starting video playback:', error);
            setIsLoading(false);
            setHasError(true);
            setErrorMessage('Failed to start video');
          });
      })
      .catch((error) => {
        console.error('Error accessing webcam:', error);
        setIsLoading(false);
        setHasError(true);
        setErrorMessage('Camera access error');
      });

    // Modify the return cleanup function to be more defensive
    return () => {
      console.log(
        'Cleanup triggered in broadcasting effect with broadcasting state:',
        isBroadcasting
      );

      // Only clean up if we're unmounting, not on every re-render
      if (!isMounted.current) return;
      isMounted.current = false;

      // Don't call cleanup() here - it might cause premature broadcast stopping
      // We'll rely on the component unmount effect for full cleanup
    };
  }, [active, isBroadcasting, userId, spaceId, planeId, meshRef]);

  // Handle receiving mode: watch someone else's broadcast
  useEffect(() => {
    // --- Guard clause ---
    if (!active || !isReceiving || !broadcastData || !spaceId || !userId) {
      // Add more detail to the skip log
      console.log(
        `[WebcamStream ${planeId}] Skipping receiving effect. Conditions not met:`,
        {
          active,
          isReceiving,
          hasBroadcastData: !!broadcastData,
          broadcastId: broadcastData?.broadcastId,
          spaceId,
          userId,
        }
      );
      // --- If we were previously viewing, ensure cleanup happens ---
      if (viewerConnectionRef.current) {
        console.log(
          `[WebcamStream ${planeId}] Conditions no longer met for receiving, cleaning up previous viewing session.`
        );
        cleanup({ stopViewing: true }); // Clean up only viewing resources
      }
      return;
    }
    // --- End Guard clause ---

    // Prevent duplicate effect runs
    const isMounted = { current: true };
    let connection = null; // To store the connection object for cleanup
    let currentStream = null; // Track the stream being processed
    const currentBroadcastId = broadcastData.broadcastId; // Capture broadcastId for cleanup comparison

    setIsLoading(true);
    setHasError(false);
    // Log entry into the effect
    console.log(
      `[WebcamStream ${planeId}] ✅ Receiving effect triggered for broadcast:`,
      broadcastData
    );

    // Create or reuse video element for remote stream
    if (!remoteVideoRef.current) {
      console.log(`[WebcamStream ${planeId}] Creating remote video element.`);
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.style.display = 'none';
      document.body.appendChild(video);
      remoteVideoRef.current = video;
    } else {
      console.log(
        `[WebcamStream ${planeId}] Reusing existing remote video element.`
      );
      // Ensure it's ready for a new stream
      remoteVideoRef.current.srcObject = null;
    }

    const connectToBroadcast = async () => {
      if (!isMounted.current) {
        console.log(
          `[WebcamStream ${planeId}] Component unmounted before connectToBroadcast could run.`
        );
        return;
      }

      try {
        // Log before calling joinBroadcast
        console.log(
          `[WebcamStream ${planeId}] Attempting to join broadcast ${currentBroadcastId} as viewer ${userId}...`
        );
        connection = await joinBroadcast(
          spaceId,
          currentBroadcastId, // Use captured broadcastId
          userId
        );

        if (!isMounted.current) {
          // Check again after await
          console.log(
            `[WebcamStream ${planeId}] Component unmounted after joinBroadcast returned, disconnecting.`
          );
          connection?.disconnect();
          return;
        }

        // Log successful initiation
        console.log(
          `[WebcamStream ${planeId}] Successfully initiated joinBroadcast call for ${currentBroadcastId}. Waiting for tracks...`
        );
        viewerConnectionRef.current = connection; // Store for potential manual disconnect

        // --- CRITICAL: Refined ontrack handler ---
        connection.peerConnection.ontrack = (event) => {
          console.log(
            `[WebcamStream ${planeId}] 🛤️ Received remote track! Kind: ${event.track.kind}, Stream ID: ${event.streams[0]?.id}`
          );

          if (
            event.streams &&
            event.streams[0] &&
            remoteVideoRef.current &&
            event.track.kind === 'video' // Only process video tracks here
          ) {
            const newStream = event.streams[0];

            // If this is a new stream, assign it and set up handlers
            if (remoteVideoRef.current.srcObject !== newStream) {
              console.log(
                `[WebcamStream ${planeId}] Assigning new stream ${newStream.id} to video element.`
              );
              currentStream = newStream; // Track the stream we are processing
              remoteVideoRef.current.srcObject = newStream;

              // Reset handlers to avoid duplicates from previous streams
              remoteVideoRef.current.onloadedmetadata = null;
              remoteVideoRef.current.onplaying = null;
              remoteVideoRef.current.onerror = null;

              remoteVideoRef.current.onloadedmetadata = () => {
                // --- Check if the stream is still the one we expect ---
                if (remoteVideoRef.current?.srcObject !== currentStream) {
                  console.warn(
                    `[WebcamStream ${planeId}] onloadedmetadata fired for outdated stream. Ignoring.`
                  );
                  return;
                }
                console.log(
                  `[WebcamStream ${planeId}] Remote video metadata loaded for stream ${currentStream.id}, creating texture.`
                );

                const texture = new THREE.VideoTexture(remoteVideoRef.current);
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.format = THREE.RGBAFormat;
                texture.colorSpace = THREE.SRGBColorSpace;
                textureRef.current = texture;

                if (meshRef.current) {
                  console.log(
                    `[WebcamStream ${planeId}] Applying remote stream texture to mesh.`
                  );
                  const material = meshRef.current.material;
                  const newMaterial = material.clone();
                  newMaterial.map = texture;
                  newMaterial.transparent = true;
                  newMaterial.opacity = 1;
                  newMaterial.needsUpdate = true;
                  meshRef.current.material = newMaterial;
                }

                // --- Attempt to play only after metadata is loaded ---
                console.log(
                  `[WebcamStream ${planeId}] Attempting to play video for stream ${currentStream.id}.`
                );
                remoteVideoRef.current
                  .play()
                  .then(() => {
                    console.log(
                      `[WebcamStream ${planeId}] Remote video started playing for stream ${currentStream.id}.`
                    );
                    setIsLoading(false);
                  })
                  .catch((e) => {
                    // Log specific play error
                    console.error(
                      `[WebcamStream ${planeId}] Error playing remote video for stream ${currentStream.id}:`,
                      e
                    );
                    // Avoid setting error state if it's the common AbortError from rapid changes
                    if (e.name !== 'AbortError') {
                      setErrorMessage('Remote video playback error');
                      setHasError(true);
                      setIsLoading(false);
                    } else {
                      console.warn(
                        `[WebcamStream ${planeId}] Playback aborted, likely due to stream change.`
                      );
                    }
                  });

                // Remove handler after first successful load for this stream
                remoteVideoRef.current.onloadedmetadata = null;
              };

              remoteVideoRef.current.onplaying = () => {
                // --- Check if the stream is still the one we expect ---
                if (remoteVideoRef.current?.srcObject !== currentStream) {
                  console.warn(
                    `[WebcamStream ${planeId}] onplaying fired for outdated stream. Ignoring.`
                  );
                  return;
                }
                console.log(
                  `[WebcamStream ${planeId}] Remote video is playing for stream ${currentStream.id}.`
                );
                setIsLoading(false); // Ensure loading is false if play succeeds
              };

              remoteVideoRef.current.onerror = (e) => {
                // --- Check if the stream is still the one we expect ---
                if (remoteVideoRef.current?.srcObject !== currentStream) {
                  console.warn(
                    `[WebcamStream ${planeId}] onerror fired for outdated stream. Ignoring.`
                  );
                  return;
                }
                console.error(
                  `[WebcamStream ${planeId}] Remote video element error for stream ${currentStream.id}:`,
                  e
                );
                setErrorMessage('Remote video playback error');
                setHasError(true);
                setIsLoading(false);
              };
            } else {
              console.log(
                `[WebcamStream ${planeId}] Received ontrack for the same stream ${newStream.id}. Ignoring assignment.`
              );
            }
          } else {
            console.warn(
              `[WebcamStream ${planeId}] ontrack event received, but no stream, video element, or not a video track.`
            );
          }
        };
        // --- End ontrack handler ---
      } catch (error) {
        if (!isMounted.current) return; // Check again after await
        // Log error during joinBroadcast call
        console.error(
          `[WebcamStream ${planeId}] Error calling joinBroadcast for ${broadcastData?.broadcastId}:`,
          error
        );
        setErrorMessage(`Failed to connect: ${error.message}`);
        setHasError(true);
        setIsLoading(false);
      }
    };

    connectToBroadcast();

    // --- Refined Cleanup function for this effect ---
    return () => {
      console.log(
        `[WebcamStream ${planeId}] 🧹 Cleaning up receiving effect for broadcast ${currentBroadcastId}`
      );
      isMounted.current = false; // Mark as unmounted/cleaning up

      // Disconnect the specific viewer connection created in this effect run
      if (connection) {
        console.log(
          `[WebcamStream ${planeId}] Disconnecting specific viewer connection for ${currentBroadcastId}`
        );
        connection.disconnect();
      }
      // If the component is *still* in receiving mode but for a *different* broadcast,
      // we only want to clean up the video/texture part, not stop everything.
      // The main cleanup() call is handled by the unmount effect.
      // However, if isReceiving becomes false, the guard clause handles cleanup.
      // So, we mainly need to clean the video element state here if the broadcastData changes.

      // Clean up video handlers and texture associated with the *previous* stream
      if (remoteVideoRef.current) {
        remoteVideoRef.current.onloadedmetadata = null;
        remoteVideoRef.current.onplaying = null;
        remoteVideoRef.current.onerror = null;
        // Don't null srcObject here if we might immediately receive a new stream
      }
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      if (meshRef.current?.material?.map) {
        meshRef.current.material.map = null; // Remove reference, texture disposed above
        meshRef.current.material.needsUpdate = true;
      }

      // Reset loading/error state for the next potential connection
      // setIsLoading(true); // Resetting might cause flicker if next connection is fast
      // setHasError(false);
    };
    // --- End Refined Cleanup ---
  }, [active, isReceiving, broadcastData, spaceId, userId, meshRef, planeId]);

  // Update texture every frame
  useEffect(() => {
    if (!active || !textureRef.current) return;

    let frameId;
    const updateTexture = () => {
      if (
        textureRef.current &&
        meshRef.current?.material?.map === textureRef.current
      ) {
        textureRef.current.needsUpdate = true;
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

  // Clean up exclusively on component unmount
  useEffect(() => {
    return () => {
      console.log('🧹 WebcamStream UNMOUNTING, performing FULL cleanup');

      // Call onBroadcastStopped only if we were actually broadcasting
      if (isBroadcasting && broadcastControlRef.current && onBroadcastStopped) {
        console.log('Notifying parent of broadcast stop on unmount');
        onBroadcastStopped(); // Notify parent first
      }

      // Perform a full cleanup of all resources
      cleanup({ fullCleanup: true }); // Use the full cleanup option
    };
  }, []); // Empty dependency array - only runs on unmount

  // Error display with retry button
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
              <div>⚠️ {errorMessage}</div>
              <button
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                  setConnectionAttempts((prev) => prev + 1); // Trigger reconnection
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

  // Enhanced status display for viewer
  if (isReceiving) {
    return (
      <>
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
        {broadcastDetails && (
          <Html position={[4, 3, 0.1]}>
            <div
              style={{
                color: 'white',
                background: 'rgba(0,0,0,0.5)',
                padding: '2px 4px',
                borderRadius: '2px',
                fontSize: '10px',
              }}
            >
              ID: {broadcastDetails.id.substring(0, 8)}
            </div>
          </Html>
        )}
      </>
    );
  }

  return null;
};

export default WebcamStream;
