import { useEffect, useState, useRef } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  startBroadcasting,
  joinBroadcast,
  testBroadcastConnectivity,
  findAvailableBroadcasts, // Add this import
} from '../services/webrtcService';

// Add verification console log
console.log('WebcamStream component loaded, webRTC functions:', {
  startBroadcastingExists: !!startBroadcasting,
  joinBroadcastExists: !!joinBroadcast,
  testBroadcastConnectivityExists: !!testBroadcastConnectivity,
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
  const [broadcastDetails, setBroadcastDetails] = useState(null); // Add state for broadcast details

  // Refs
  const videoRef = useRef(null);
  const textureRef = useRef(null);
  const streamRef = useRef(null);
  const broadcastControlRef = useRef(null);
  const viewerConnectionRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Cleanup function for all resources
  const cleanup = () => {
    // Stop media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Stop broadcasting
    if (broadcastControlRef.current) {
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
        if (ref.current.srcObject) {
          ref.current.srcObject = null;
        }
        if (document.body.contains(ref.current)) {
          document.body.removeChild(ref.current);
        }
        ref.current = null;
      }
    });

    // Clear mesh material
    if (meshRef.current?.material?.map) {
      meshRef.current.material.map.dispose();
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
    if (!active || !isReceiving || !broadcastData || !spaceId) return;

    setIsLoading(true);

    console.log(
      '🎬 Initializing receiving mode for remote broadcast:',
      broadcastData
    );

    // Create video element for remote stream
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.style.display = 'none';
    document.body.appendChild(video);
    remoteVideoRef.current = video;

    // Create a diagnostic timer to report if we're not getting video after a reasonable time
    const diagnosticTimer = setTimeout(async () => {
      if (isLoading && active && isReceiving) {
        console.warn('⏰ Still waiting for remote video after timeout');

        try {
          // Try to diagnose the issue
          const connectivityTest = await testBroadcastConnectivity(
            spaceId,
            broadcastData.broadcastId
          );

          console.log('Broadcast connectivity test results:', connectivityTest);

          // Modified check: Use database state first, fall back to memory state
          const broadcastExists =
            connectivityTest.broadcastData?.inDatabase ||
            connectivityTest.success;

          if (!broadcastExists) {
            setErrorMessage(
              `Connection issue: ${
                connectivityTest.error || 'Broadcaster may have disconnected'
              }`
            );
            setHasError(true);
            setIsLoading(false);
          } else if (
            !connectivityTest.success &&
            connectivityTest.broadcastData?.inDatabase
          ) {
            // If broadcast exists in database but not in memory, keep trying
            console.log(
              "Broadcast exists in database but not active in broadcaster's memory"
            );
            // Just continue waiting - connection might still establish
          } else {
            console.log(
              "Broadcast exists but connection hasn't been established"
            );
          }
        } catch (e) {
          console.error('Error running diagnostic:', e);
        }
      }
    }, 10000); // 10 seconds should be enough for a connection

    // Enhanced broadcast fetching and connection logic
    const connectToBroadcast = async () => {
      try {
        // First verify the broadcast exists and get its details
        const broadcasts = await findAvailableBroadcasts(spaceId);
        console.log('Available broadcasts:', broadcasts);

        const matchingBroadcast = broadcasts.find(
          (b) =>
            b.id === broadcastData.broadcastId ||
            b.planeId === broadcastData.planeId
        );

        if (!matchingBroadcast) {
          console.warn(
            'Could not find matching broadcast. Will try direct connection anyway.'
          );
        } else {
          console.log('Found matching broadcast:', matchingBroadcast);
          setBroadcastDetails(matchingBroadcast);
        }

        // Proceed with joining broadcast - use the ID from verification if possible
        const broadcastId = matchingBroadcast?.id || broadcastData.broadcastId;

        console.log(
          `Joining broadcast with ID: ${broadcastId}, User ID: ${userId}`
        );

        // Join the broadcast with more detailed error handling
        joinBroadcast(spaceId, broadcastId, userId, video)
          .then((connection) => {
            viewerConnectionRef.current = connection;

            // Additional logging to track video element state
            console.log('Got connection, video element state:', {
              readyState: video.readyState,
              paused: video.paused,
              networkState: video.networkState,
            });

            // When video starts playing, create texture
            video.onloadedmetadata = () => {
              console.log('Video metadata loaded, dimensions:', {
                width: video.videoWidth,
                height: video.videoHeight,
              });

              // Create video texture from the remote stream
              const texture = new THREE.VideoTexture(video);
              texture.minFilter = THREE.LinearFilter;
              texture.magFilter = THREE.LinearFilter;
              texture.format = THREE.RGBAFormat;
              texture.colorSpace = THREE.SRGBColorSpace;
              texture.generateMipmaps = false;
              texture.wrapS = THREE.ClampToEdgeWrapping;
              texture.wrapT = THREE.ClampToEdgeWrapping;
              textureRef.current = texture;

              // Apply texture to plane material
              if (meshRef.current) {
                const material = meshRef.current.material;
                const newMaterial = material.clone();
                newMaterial.map = texture;
                newMaterial.transparent = true;
                newMaterial.opacity = 1;
                newMaterial.depthWrite = true;
                newMaterial.needsUpdate = true;
                meshRef.current.material = newMaterial;
              }

              setIsLoading(false);
              clearTimeout(diagnosticTimer);
            };

            // Add more event handlers for better diagnostics
            video.onplaying = () => {
              console.log('🎥 Remote video now playing');
              setIsLoading(false);
              clearTimeout(diagnosticTimer);
            };

            // Handle errors
            video.onerror = (e) => {
              console.error('Video element error:', e);
              setIsLoading(false);
              setHasError(true);
              setErrorMessage(
                'Video streaming error: ' +
                  (e.target.error ? e.target.error.message : 'unknown error')
              );
              clearTimeout(diagnosticTimer);
            };
          })
          .catch((error) => {
            console.error('Error joining broadcast:', error);
            setIsLoading(false);
            setHasError(true);
            setErrorMessage('Failed to connect to broadcast: ' + error.message);
            clearTimeout(diagnosticTimer);
          });
      } catch (error) {
        console.error('Error in broadcast connection flow:', error);
        setIsLoading(false);
        setHasError(true);
        setErrorMessage('Connection failed: ' + error.message);
        clearTimeout(diagnosticTimer);
      }
    };

    // Start the connection process
    connectToBroadcast();

    return () => {
      clearTimeout(diagnosticTimer);
      cleanup();
    };
  }, [active, isReceiving, broadcastData, spaceId, userId, meshRef]);

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
      console.log('🧹 WebcamStream UNMOUNTING, cleaning up resources');

      // Call onBroadcastStopped only if we were actually broadcasting
      if (isBroadcasting && broadcastControlRef.current && onBroadcastStopped) {
        console.log('Notifying parent of broadcast stop on unmount');
        onBroadcastStopped();
      }

      // CRITICAL FIX: Add a small delay before cleanup to ensure broadcast has time to setup
      setTimeout(() => {
        cleanup();
      }, 100);
    };
  }, []); // Empty dependency array - only runs on unmount

  // Error display
  if (hasError) {
    return (
      <mesh position={[0, 0, 0.1]}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial color="black" transparent opacity={0.7} />
        <mesh position={[0, 0, 0.1]}>
          <planeGeometry args={[8, 1]} />
          <meshBasicMaterial color="red" transparent opacity={0.8} />
          <Html center position={[0, 0, 0.1]}>
            <div
              style={{
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '5px',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
              }}
            >
              ⚠️ {errorMessage}
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
