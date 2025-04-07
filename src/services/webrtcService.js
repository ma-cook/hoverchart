import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  deleteField,
} from 'firebase/firestore';

const activeStreams = {};

// Updated configuration with more reliable TURN servers
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Updated TURN servers - more reliable options
    {
      urls: [
        'turn:global.turn.twilio.com:3478?transport=udp',
        'turn:global.turn.twilio.com:3478?transport=tcp',
        'turn:global.turn.twilio.com:443?transport=tcp',
      ],
      username:
        'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d',
      credential: 'w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:relay.metered.ca:443',
      username: 'e8dd65f183e28d282e8b83b0',
      credential: 'uWdWNmkhvyqTEswO',
    },
  ],
  iceCandidatePoolSize: 10,
  sdpSemantics: 'unified-plan',
};

// Store these in module scope
let currentUserId = null;

// Add user initialization function
export const initWebRTC = (userId) => {
  currentUserId = userId;
  console.log('WebRTC service initialized for user:', userId);
};

/**
 * Start broadcasting a stream with direct database updates to ensure broadcast ID is set
 */
export const startBroadcasting = async (userId, spaceId, planeId, stream) => {
  console.log('⭐ startBroadcasting called with:', {
    userId,
    spaceId,
    planeId,
  });
  console.trace('Call stack:');

  try {
    const spaceOwner = window.currentSpaceOwner || userId;
    const broadcastId = `broadcast_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 6)}`;

    // Get reference to the plane object
    const planeRef = doc(
      db,
      'users',
      spaceOwner,
      'spaces',
      spaceId,
      'objects',
      planeId
    );

    // First read the current state to make sure we don't override any important flags
    const planeDoc = await getDoc(planeRef);
    if (!planeDoc.exists()) {
      throw new Error(`Plane ${planeId} not found`);
    }

    const planeData = planeDoc.data();

    // Check if already broadcasting
    if (
      planeData.broadcasting &&
      planeData.broadcastId &&
      planeData.broadcastId !== 'pending'
    ) {
      console.log(
        `Plane ${planeId} is already broadcasting with ID ${planeData.broadcastId}`
      );

      // Store connection in memory with existing ID
      activeStreams[`${spaceId}-${planeId}`] = {
        broadcastId: planeData.broadcastId,
        stream,
        peerConnection: new RTCPeerConnection(configuration),
        viewers: [],
        iceCandidates: [],
        userId,
      };

      // Add tracks to the connection
      stream
        .getTracks()
        .forEach((track) =>
          activeStreams[`${spaceId}-${planeId}`].peerConnection.addTrack(
            track,
            stream
          )
        );

      // Set up ICE handling and connection polling
      setupInMemoryIceCandidateCollection(
        activeStreams[`${spaceId}-${planeId}`].peerConnection,
        spaceId,
        planeId,
        planeData.broadcastId
      );

      const unsubscribe = setupConnectionPolling(
        spaceOwner,
        spaceId,
        planeId,
        planeData.broadcastId,
        activeStreams[`${spaceId}-${planeId}`].peerConnection
      );

      // Return control with existing broadcast ID
      return {
        broadcastId: planeData.broadcastId,
        peerConnection: activeStreams[`${spaceId}-${planeId}`].peerConnection,
        stop: async () => {
          // Clean up broadcast data from object
          try {
            await updateDoc(planeRef, {
              broadcastId: null,
              broadcasting: false,
              broadcastStarting: false,
              broadcastData: null,
            });
          } catch (err) {
            console.warn('Cleanup warning:', err);
          }

          if (activeStreams[`${spaceId}-${planeId}`]?.peerConnection)
            activeStreams[`${spaceId}-${planeId}`].peerConnection.close();
          delete activeStreams[`${spaceId}-${planeId}`];
          unsubscribe();
        },
        getViewerCount: () =>
          activeStreams[`${spaceId}-${planeId}`]?.viewers?.length || 0,
      };
    }

    // Log any existing streams to help debug
    if (activeStreams[`${spaceId}-${planeId}`]) {
      console.log(
        '⚠️ Found existing stream for this plane, will replace it:',
        activeStreams[`${spaceId}-${planeId}`]
      );
    }

    // ONLY update the plane object with all the broadcast data
    // Don't try to create any subcollections
    await updateDoc(planeRef, {
      broadcastId,
      broadcasting: true,
      broadcastStarting: false,
      broadcasterId: userId,
      broadcastData: {
        active: true,
        created: serverTimestamp(),
        viewers: [],
        viewers_: [], // Separate array for tracking viewers through object updates
        iceCandidates: [], // Store ICE candidates directly in the object
        connections: {}, // Store connections in an object map
      },
      _updateTime: Date.now(),
    });

    console.log(
      `✅ Successfully updated plane ${planeId} with broadcast metadata`
    );

    // Create peer connection
    const peerConnection = new RTCPeerConnection(configuration);
    stream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, stream));

    // Store connection in memory
    activeStreams[`${spaceId}-${planeId}`] = {
      broadcastId,
      stream,
      peerConnection,
      viewers: [],
      iceCandidates: [],
      userId,
    };

    // Set up ICE handling - store candidates in memory only
    setupInMemoryIceCandidateCollection(
      peerConnection,
      spaceId,
      planeId,
      broadcastId
    );

    // Set up connection listener - poll for connections in the object data
    const unsubscribe = setupConnectionPolling(
      spaceOwner,
      spaceId,
      planeId,
      broadcastId,
      peerConnection
    );

    return {
      broadcastId,
      peerConnection,
      stop: async () => {
        console.log(
          `🛑 Explicitly stopping broadcast ${broadcastId} via stop() method`
        );
        console.trace();

        // Clean up broadcast data from object
        try {
          await updateDoc(planeRef, {
            broadcastId: null,
            broadcasting: false,
            broadcastStarting: false,
            broadcastData: null,
          });
        } catch (err) {
          console.warn('Cleanup warning:', err);
        }

        if (peerConnection) peerConnection.close();
        delete activeStreams[`${spaceId}-${planeId}`];
        unsubscribe();
      },
      getViewerCount: () =>
        activeStreams[`${spaceId}-${planeId}`]?.viewers?.length || 0,
    };
  } catch (error) {
    console.error('❌ Fatal error in startBroadcasting:', error);
    throw error;
  }
};

// Use a memory-based approach for ICE candidates and connections
const inMemoryIceCandidates = {};
const connectionResponses = {};

/**
 * Set up ICE candidate collection using in-memory storage only
 */
function setupInMemoryIceCandidateCollection(
  peerConnection,
  spaceId,
  planeId,
  broadcastId
) {
  // Add connection state monitoring
  peerConnection.onconnectionstatechange = () => {
    console.log(`WebRTC connection state: ${peerConnection.connectionState}`);
    if (peerConnection.connectionState === 'failed') {
      console.error('WebRTC connection failed, attempting to restart ICE');
      peerConnection.restartIce();
    }
  };

  peerConnection.oniceconnectionstatechange = () => {
    console.log(`ICE connection state: ${peerConnection.iceConnectionState}`);
  };

  peerConnection.onicecandidate = async (event) => {
    if (!event.candidate) return;

    // Only store in memory
    const key = `${spaceId}-${broadcastId}`;
    if (!inMemoryIceCandidates[key]) {
      inMemoryIceCandidates[key] = [];
    }
    inMemoryIceCandidates[key].push(event.candidate.toJSON());

    // Also keep in active streams
    if (activeStreams[`${spaceId}-${planeId}`]) {
      if (!activeStreams[`${spaceId}-${planeId}`].iceCandidates) {
        activeStreams[`${spaceId}-${planeId}`].iceCandidates = [];
      }
      activeStreams[`${spaceId}-${planeId}`].iceCandidates.push(
        event.candidate.toJSON()
      );
    }

    console.log('Added ICE candidate to in-memory storage');
  };
}

/**
 * Set up connection polling for new connection requests in the object data
 */
function setupConnectionPolling(
  spaceOwner,
  spaceId,
  planeId,
  broadcastId,
  peerConnection
) {
  const planeRef = doc(
    db,
    'users',
    spaceOwner,
    'spaces',
    spaceId,
    'objects',
    planeId
  );

  // Poll for connection requests in the object data
  const pollInterval = setInterval(async () => {
    try {
      // Get the latest object data
      const planeDoc = await getDoc(planeRef);
      if (!planeDoc.exists()) {
        console.warn('Plane object no longer exists');
        clearInterval(pollInterval);
        return;
      }

      const planeData = planeDoc.data();
      if (!planeData.broadcastData || !planeData.broadcastData.connections) {
        // No connections data
        return;
      }

      // Process any new connection requests
      const connections = planeData.broadcastData.connections;
      Object.entries(connections).forEach(([connectionId, connectionData]) => {
        // Skip connections we've already processed
        if (connectionResponses[connectionId]) return;

        // Skip connections that don't have an offer
        if (!connectionData.offer) return;

        // Process this connection request
        processConnectionRequest(
          spaceOwner,
          spaceId,
          planeId,
          broadcastId,
          connectionId,
          connectionData,
          peerConnection
        );

        // Mark as processed
        connectionResponses[connectionId] = true;
      });
    } catch (err) {
      console.error('Error polling for connections:', err);
    }
  }, 2000);

  // Return cleanup function
  return () => {
    clearInterval(pollInterval);
  };
}

/**
 * Process a connection request by generating an answer
 */
async function processConnectionRequest(
  spaceOwner,
  spaceId,
  planeId,
  broadcastId,
  connectionId,
  connectionData,
  peerConnection
) {
  try {
    console.log(`Processing connection request: ${connectionId}`);

    // Set remote description from the offer
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(connectionData.offer)
    );

    // Create an answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Add ICE candidates from the viewer if available
    if (
      connectionData.iceCandidates &&
      connectionData.iceCandidates.length > 0
    ) {
      console.log(
        `Adding ${connectionData.iceCandidates.length} ICE candidates from viewer`
      );
      for (const candidate of connectionData.iceCandidates) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Could not add ICE candidate from viewer:', err);
        }
      }
    }

    // Store the answer in the plane object's connections data
    const planeRef = doc(
      db,
      'users',
      spaceOwner,
      'spaces',
      spaceId,
      'objects',
      planeId
    );

    // Update just this connection's answer in the object
    await updateDoc(planeRef, {
      [`broadcastData.connections.${connectionId}.answer`]: {
        type: answer.type,
        sdp: answer.sdp,
      },
      [`broadcastData.connections.${connectionId}.status`]: 'answered',
      [`broadcastData.connections.${connectionId}.answeredAt`]:
        serverTimestamp(),
      [`broadcastData.connections.${connectionId}.broadcasterIceCandidates`]:
        activeStreams[`${spaceId}-${planeId}`]?.iceCandidates || [],
    });

    // Track this viewer in memory
    if (activeStreams[`${spaceId}-${planeId}`]) {
      if (
        !activeStreams[`${spaceId}-${planeId}`].viewers.includes(connectionId)
      ) {
        activeStreams[`${spaceId}-${planeId}`].viewers.push(connectionId);
      }
    }

    // Also update the viewers_ array in the object
    await updateDoc(planeRef, {
      [`broadcastData.viewers_`]: arrayUnion(connectionId),
    });
  } catch (err) {
    console.error(`Error processing connection ${connectionId}:`, err);

    // Update connection status to error
    try {
      const planeRef = doc(
        db,
        'users',
        spaceOwner,
        'spaces',
        spaceId,
        'objects',
        planeId
      );
      await updateDoc(planeRef, {
        [`broadcastData.connections.${connectionId}.status`]: 'error',
        [`broadcastData.connections.${connectionId}.error`]: err.message,
      });
    } catch (updateErr) {
      console.error('Error updating connection status:', updateErr);
    }
  }
}

/**
 * Join a broadcast as a viewer
 */
export const joinBroadcast = async (
  spaceId,
  broadcastId,
  viewerId,
  videoElement
) => {
  console.log('⭐ joinBroadcast called with:', {
    spaceId,
    broadcastId,
    viewerId,
  });

  try {
    const spaceOwner = window.currentSpaceOwner || currentUserId;

    // Find the object with this broadcast ID
    const objectsRef = collection(
      db,
      'users',
      spaceOwner,
      'spaces',
      spaceId,
      'objects'
    );
    const q = query(objectsRef, where('broadcastId', '==', broadcastId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error(`Broadcast ${broadcastId} not found`);
    }

    const planeDoc = snapshot.docs[0];
    const planeId = planeDoc.id;
    const planeData = planeDoc.data();

    // Create a peer connection
    const peerConnection = new RTCPeerConnection(configuration);

    // Add connection state monitoring
    peerConnection.onconnectionstatechange = () => {
      console.log(
        `Viewer WebRTC connection state: ${peerConnection.connectionState}`
      );
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(
        `Viewer ICE connection state: ${peerConnection.iceConnectionState}`
      );
    };

    // Set up video display when we get remote tracks
    peerConnection.ontrack = (event) => {
      console.log('Received remote track', event.track);
      if (videoElement && event.streams && event.streams[0]) {
        videoElement.srcObject = event.streams[0];
        videoElement
          .play()
          .then(() => console.log('Remote video playing'))
          .catch((e) => console.error('Error playing video:', e));
      } else {
        console.warn('Got track but missing video element or stream', {
          videoElement: !!videoElement,
          hasStreams: !!event.streams && event.streams.length > 0,
        });
      }
    };

    // Create a unique connection ID
    const connectionId = `${viewerId}_${Date.now()}`;

    // Set up ICE candidate collection in memory
    const iceCandidates = [];
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        iceCandidates.push(event.candidate.toJSON());
        console.log('Added viewer ICE candidate to memory');

        // Also update the connection data with new ICE candidates
        try {
          const planeRef = doc(
            db,
            'users',
            spaceOwner,
            'spaces',
            spaceId,
            'objects',
            planeId
          );

          updateDoc(planeRef, {
            [`broadcastData.connections.${connectionId}.iceCandidates`]:
              arrayUnion(event.candidate.toJSON()),
          }).catch((err) =>
            console.warn('Failed to update ICE candidates:', err)
          );
        } catch (err) {
          console.warn('Error updating ICE candidates:', err);
        }
      }
    };

    // Create an offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Add the connection to the plane object
    const planeRef = doc(
      db,
      'users',
      spaceOwner,
      'spaces',
      spaceId,
      'objects',
      planeId
    );
    await updateDoc(planeRef, {
      [`broadcastData.connections.${connectionId}`]: {
        viewerId,
        connectionId,
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
        status: 'requested',
        requestedAt: serverTimestamp(),
        iceCandidates: [],
      },
    });

    // Poll for the answer
    let answerPollInterval;
    let unsubscribePlane = null;

    // Create a promise that resolves when we get an answer
    const answerPromise = new Promise((resolve, reject) => {
      // Set a timeout to reject if we don't get an answer
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for broadcast answer'));
        if (unsubscribePlane) unsubscribePlane();
        clearInterval(answerPollInterval);
      }, 30000);

      // Subscribe to changes on the plane object
      unsubscribePlane = onSnapshot(planeRef, (doc) => {
        if (!doc.exists()) {
          reject(new Error('Broadcast plane no longer exists'));
          clearTimeout(timeout);
          return;
        }

        const data = doc.data();
        if (!data.broadcastData || !data.broadcastData.connections) {
          return;
        }

        const connectionData = data.broadcastData.connections[connectionId];
        if (!connectionData || !connectionData.answer) {
          return;
        }

        // We have an answer!
        clearTimeout(timeout);
        resolve(connectionData.answer);
      });

      // Also use polling as a backup
      answerPollInterval = setInterval(async () => {
        try {
          const doc = await getDoc(planeRef);
          if (!doc.exists()) {
            reject(new Error('Broadcast plane no longer exists'));
            clearTimeout(timeout);
            clearInterval(answerPollInterval);
            return;
          }

          const data = doc.data();
          if (!data.broadcastData || !data.broadcastData.connections) {
            return;
          }

          const connectionData = data.broadcastData.connections[connectionId];
          if (!connectionData || !connectionData.answer) {
            return;
          }

          // We have an answer!
          clearTimeout(timeout);
          clearInterval(answerPollInterval);
          resolve(connectionData.answer);
        } catch (err) {
          console.error('Error polling for answer:', err);
        }
      }, 2000);
    });

    // Wait for the answer
    const answer = await answerPromise;

    // Set the remote description from the answer
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer)
    );
    console.log('Set remote description from broadcaster answer');

    // Add any ICE candidates from the broadcaster
    if (planeData.broadcastData && planeData.broadcastData.iceCandidates) {
      for (const candidate of planeData.broadcastData.iceCandidates) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('Added broadcaster ICE candidate from plane data');
        } catch (err) {
          console.error('Error adding broadcaster ICE candidate:', err);
        }
      }
    }

    // Check for direct ICE candidates in the connection data
    const updatedPlaneDoc = await getDoc(planeRef);
    const updatedData = updatedPlaneDoc.data();
    const connectionData =
      updatedData?.broadcastData?.connections?.[connectionId];

    if (connectionData?.broadcasterIceCandidates?.length > 0) {
      console.log(
        `Adding ${connectionData.broadcasterIceCandidates.length} broadcaster ICE candidates`
      );
      for (const candidate of connectionData.broadcasterIceCandidates) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Could not add ICE candidate from broadcaster:', err);
        }
      }
    }

    // Poll for new ICE candidates from the broadcaster
    const icePollInterval = setInterval(async () => {
      try {
        const doc = await getDoc(planeRef);
        if (!doc.exists()) return;

        const data = doc.data();
        if (!data.broadcastData || !data.broadcastData.iceCandidates) return;

        // For any new ICE candidates, add them
        for (const candidate of data.broadcastData.iceCandidates) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (err) {
            console.error('Error adding broadcaster ICE candidate:', err);
          }
        }
      } catch (err) {
        console.error('Error polling for ICE candidates:', err);
      }
    }, 5000);

    // Return control object
    return {
      disconnect: async () => {
        console.log(`Disconnecting from broadcast ${broadcastId}`);

        // Clean up polling
        if (answerPollInterval) clearInterval(answerPollInterval);
        if (icePollInterval) clearInterval(icePollInterval);
        if (unsubscribePlane) unsubscribePlane();

        // Clean up connection
        if (peerConnection) {
          peerConnection.close();
        }

        // Clean up video
        if (videoElement && videoElement.srcObject) {
          videoElement.srcObject.getTracks().forEach((track) => track.stop());
          videoElement.srcObject = null;
        }

        // Remove connection from object data
        try {
          await updateDoc(planeRef, {
            [`broadcastData.connections.${connectionId}`]: deleteField(),
            [`broadcastData.viewers_`]: arrayRemove(connectionId),
          });
        } catch (e) {
          console.error('Error removing connection:', e);
        }
      },
    };
  } catch (error) {
    console.error('Error joining broadcast:', error);
    throw error;
  }
};

// Utility functions
export const isPlaneBeingBroadcast = async (spaceId, planeId) => {
  console.log('⭐ isPlaneBeingBroadcast check:', { spaceId, planeId });

  // First check in memory for quick response
  const isActive = !!activeStreams[`${spaceId}-${planeId}`];
  console.log(
    `Broadcasting status for plane ${planeId} in memory: ${
      isActive ? 'ACTIVE' : 'inactive'
    }`
  );

  // If not active in memory, check database as fallback
  if (!isActive && spaceId && planeId) {
    try {
      const spaceOwner = window.currentSpaceOwner || currentUserId;
      const planeRef = doc(
        db,
        'users',
        spaceOwner,
        'spaces',
        spaceId,
        'objects',
        planeId
      );

      const planeDoc = await getDoc(planeRef);
      if (planeDoc.exists()) {
        const planeData = planeDoc.data();
        const isBroadcasting =
          !!planeData.broadcasting &&
          !!planeData.broadcastId &&
          planeData.broadcastId !== 'pending';

        console.log(
          `Broadcasting status for plane ${planeId} in database: ${
            isBroadcasting ? 'ACTIVE' : 'inactive'
          }`
        );

        return isBroadcasting;
      }
    } catch (err) {
      console.error('Error checking broadcast status in database:', err);
    }
  }

  return isActive;
};

export const findAvailableBroadcasts = async (spaceId) => {
  console.log('⭐ findAvailableBroadcasts called for space:', spaceId);
  try {
    const spaceOwner = window.currentSpaceOwner || currentUserId;
    const objectsRef = collection(
      db,
      'users',
      spaceOwner,
      'spaces',
      spaceId,
      'objects'
    );
    const q = query(objectsRef, where('broadcasting', '==', true));
    const snapshot = await getDocs(q);

    const broadcasts = snapshot.docs
      .map((doc) => ({
        id: doc.data().broadcastId,
        planeId: doc.id,
        broadcasterId: doc.data().broadcasterId,
        active: true,
        startTime: doc.data().broadcastStartTime || Date.now(),
      }))
      .filter((b) => b.id && b.id !== 'pending'); // Filter out any undefined or pending broadcastIds

    console.log(`Found ${broadcasts.length} active broadcasts:`, broadcasts);
    return broadcasts;
  } catch (error) {
    console.error('Error finding broadcasts:', error);
    return [];
  }
};

export const cleanupWebRTC = () => {
  // Clean up all peer connections
  Object.values(activeStreams).forEach((info) => {
    if (info.peerConnection) {
      info.peerConnection.close();
    }
  });

  // Clear the map
  Object.keys(activeStreams).forEach((key) => {
    delete activeStreams[key];
  });
};
