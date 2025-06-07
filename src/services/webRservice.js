import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  arrayUnion,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';

const activeStreams = new Map();

const getRTCConfiguration = () => ({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:relay.metered.ca:443',
      username: 'e8dd65f183e28d282e8b83b0',
      credential: 'uWdWNmkhvyqTEswO',
    },
  ],
});

export const initWebRTC = () => {
  // WebRTC service initialized
};

class BroadcastSession {
  constructor(broadcastId, stream, userId, spaceId) {
    this.broadcastId = broadcastId;
    this.stream = stream;
    this.userId = userId;
    this.spaceId = spaceId;
    this.peerConnections = new Map();
    this.signalingListeners = new Map();
  }

  async createOfferForViewer(viewerId) {
    if (this.peerConnections.has(viewerId)) {
      console.log(
        `Connection already exists or pending for viewer ${viewerId}`
      );
      return;
    }

    try {
      console.log(
        `Received 'joining' signal from viewer ${viewerId}, creating offer...`
      );
      const peerConnection = new RTCPeerConnection(getRTCConfiguration());

      this.stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, this.stream));

      this.peerConnections.set(viewerId, peerConnection);

      const offer = await peerConnection.createOffer({
        offerToReceiveVideo: false,
        offerToReceiveAudio: false,
      });

      await peerConnection.setLocalDescription(offer);

      const signalingId = `${this.broadcastId}_${viewerId}`;
      const signalingRef = doc(
        db,
        'users',
        window.currentSpaceOwner,
        'spaces',
        this.spaceId,
        'signaling',
        signalingId
      );

      await updateDoc(signalingRef, {
        broadcasterId: this.userId,
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
        broadcasterCandidates: [],
        status: 'offering',
        lastUpdated: serverTimestamp(),
      });
      console.log(
        `Offer sent to signaling document ${signalingId} for viewer ${viewerId}`
      );

      const unsubscribeListener = onSnapshot(signalingRef, async (snapshot) => {
        const data = snapshot.data();
        // --- Only clean up if the connection is truly closed or failed ---
        if (!data) {
          // Do not clean up just because the doc is missing; wait for ICE state or explicit status
          console.log(
            `Signaling doc ${signalingId} missing but connection not closed. Not cleaning up yet.`
          );
          return;
        }

        console.log(
          `Broadcaster received signaling update for ${viewerId}: Status - ${data.status}`
        );

        if (data.answer && !peerConnection.currentRemoteDescription) {
          console.log(`Received answer from ${viewerId}`);
          try {
            // Only set remote description if the connection is not closed
            if (peerConnection.signalingState !== 'closed') {
              await peerConnection.setRemoteDescription(
                new RTCSessionDescription(data.answer)
              );
              console.log(
                `Successfully set remote description (answer) for ${viewerId}`
              );
              await updateDoc(signalingRef, {
                status: 'connected',
                lastUpdated: serverTimestamp(),
              });
              console.log(
                `Signaling status updated to 'connected' for ${viewerId}`
              );
            } else {
              console.warn(
                `PeerConnection for ${viewerId} is already closed, skipping setRemoteDescription.`
              );
            }
          } catch (err) {
            console.error(
              `Error setting remote description for ${viewerId}:`,
              err
            );
            await updateDoc(signalingRef, {
              status: 'failed',
              error: `Broadcaster error setting answer: ${err.message}`,
              lastUpdated: serverTimestamp(),
            }).catch((updateErr) =>
              console.error("Failed to update status to 'failed':", updateErr)
            );
            this.removeViewer(viewerId);
          }
        }

        if (data.viewerCandidates?.length > 0) {
          const candidatesToAdd = data.viewerCandidates;

          for (const candidate of candidatesToAdd) {
            if (!candidate) continue;
            try {
              if (
                peerConnection.signalingState !== 'closed' &&
                peerConnection.remoteDescription
              ) {
                await peerConnection.addIceCandidate(
                  new RTCIceCandidate(candidate)
                );
                console.log(
                  `Added viewer ICE candidate for ${viewerId}:`,
                  candidate.sdpMid || candidate.candidate.substring(0, 20)
                );
              } else {
                console.warn(
                  `Cannot add ICE candidate for ${viewerId}. State: ${
                    peerConnection.signalingState
                  }, RemoteDesc: ${!!peerConnection.remoteDescription}`
                );
              }
            } catch (err) {
              if (!err.message.includes('remote description is not set')) {
                console.warn(
                  `Error adding viewer ICE candidate for ${viewerId}:`,
                  err
                );
              }
            }
          }
        }

        // --- Only clean up if status is 'closed' or 'failed' ---
        if (['closed', 'failed'].includes(data.status)) {
          console.log(
            `Signaling status for ${viewerId} is '${data.status}'. Cleaning up viewer.`
          );
          this.removeViewer(viewerId);
        }
      });

      this.signalingListeners.set(viewerId, unsubscribeListener);

      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          try {
            const currentSignalDoc = await getDoc(signalingRef);
            if (currentSignalDoc.exists()) {
              await updateDoc(signalingRef, {
                broadcasterCandidates: arrayUnion(event.candidate.toJSON()),
                lastUpdated: serverTimestamp(),
              });
              console.log(`Added broadcaster ICE candidate for ${viewerId}`);
            } else {
              console.warn(
                `Signaling document ${signalingId} doesn't exist, cannot add ICE candidate.`
              );
            }
          } catch (err) {
            console.error(
              `Error adding broadcaster ICE candidate for ${viewerId}:`,
              err
            );
          }
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log(
          `ICE Connection State Change for ${viewerId}: ${peerConnection.iceConnectionState}`
        );
        if (
          ['disconnected', 'failed', 'closed'].includes(
            peerConnection.iceConnectionState
          )
        ) {
          console.log(
            `Connection with viewer ${viewerId} lost or failed. Cleaning up.`
          );
          this.removeViewer(viewerId);
        }
      };

      return peerConnection;
    } catch (error) {
      console.error(`Failed to create offer for viewer ${viewerId}:`, error);
      this.removeViewer(viewerId);
    }
  }

  removeViewer(viewerId) {
    const connection = this.peerConnections.get(viewerId);
    if (connection) {
      connection.close();
      this.peerConnections.delete(viewerId);
      console.log(`Closed peer connection for viewer ${viewerId}`);
    }

    const unsubscribe = this.signalingListeners.get(viewerId);
    if (unsubscribe) {
      unsubscribe();
      this.signalingListeners.delete(viewerId);
      console.log(`Removed signaling listener for viewer ${viewerId}`);
    }

    const signalingId = `${this.broadcastId}_${viewerId}`;
    const signalingRef = doc(
      db,
      'users',
      window.currentSpaceOwner,
      'spaces',
      this.spaceId,
      'signaling',
      signalingId
    );
    getDoc(signalingRef)
      .then((docSnap) => {
        if (
          docSnap.exists() &&
          !['failed', 'closed', 'expired'].includes(docSnap.data()?.status)
        ) {
          updateDoc(signalingRef, {
            status: 'closed',
            lastUpdated: serverTimestamp(),
          })
            .then(() =>
              console.log(`Signaling doc ${signalingId} marked as closed.`)
            )
            .catch((err) =>
              console.warn(
                `Failed to mark signaling doc ${signalingId} as closed:`,
                err
              )
            );
        }
      })
      .catch((err) =>
        console.warn(
          `Error checking signaling doc ${signalingId} before cleanup:`,
          err
        )
      );
  }

  cleanup() {
    this.signalingListeners.forEach((unsubscribe) => unsubscribe());
    this.signalingListeners.clear();

    this.peerConnections.forEach((conn, viewerId) => {
      conn.close();
      console.log(
        `Closed peer connection for viewer ${viewerId} during cleanup.`
      );
    });
    this.peerConnections.clear();

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      console.log('Stopped local stream tracks during cleanup.');
    }
  }
}

export const startBroadcasting = async (userId, spaceId, planeId, stream) => {
  try {
    const broadcastId = `broadcast_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 6)}`;

    const spaceOwner = window.currentSpaceOwner || userId;
    console.log('Using space owner path:', spaceOwner);

    // Find the plane object in the spatial partitioning system
    const { findObjectInCells } = await import('./spatialPartitioning');
    const planeResult = await findObjectInCells(spaceOwner, spaceId, planeId);

    if (!planeResult) {
      console.error(`Plane ${planeId} not found in any cell`);
      throw new Error(`Plane ${planeId} not found`);
    }

    // Update the plane object in its cell
    const updatedPlane = {
      ...planeResult.object,
      broadcastId,
      broadcasting: true,
      broadcasterId: userId,
      lastUpdated: new Date(),
    };

    // Update the cell with the modified plane object
    const cellRef = planeResult.cellRef;
    const cellDoc = await getDoc(cellRef);
    const cellData = cellDoc.data();

    cellData.objects[planeId] = updatedPlane;
    await setDoc(cellRef, cellData, { merge: true });

    console.log(
      `Plane ${planeId} updated with broadcastId ${broadcastId} in cell ${planeResult.cellId}`
    );

    const broadcastSession = new BroadcastSession(
      broadcastId,
      stream,
      userId,
      spaceId
    );

    activeStreams.set(`${spaceId}-${planeId}`, {
      broadcastId,
      stream,
      broadcastSession,
    });

    const signalingRef = collection(
      db,
      'users',
      spaceOwner,
      'spaces',
      spaceId,
      'signaling'
    );
    const q = query(
      signalingRef,
      where('broadcastId', '==', broadcastId),
      where('status', '==', 'joining')
    );

    const unsubscribeSignaling = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          const viewerId = data?.viewerId;
          if (viewerId && data.status === 'joining') {
            console.log(
              `Detected viewer ${viewerId} attempting to join broadcast ${broadcastId}`
            );
            broadcastSession.createOfferForViewer(viewerId);
          }
        }
      });
    });

    return {
      broadcastId,
      stop: async () => {
        console.log(`Stopping broadcast ${broadcastId} for plane ${planeId}`);
        unsubscribeSignaling();
        broadcastSession.cleanup();
        activeStreams.delete(`${spaceId}-${planeId}`);
        try {
          // Find the plane object in the spatial partitioning system to stop broadcasting
          const { findObjectInCells } = await import('./spatialPartitioning');
          const planeResult = await findObjectInCells(
            spaceOwner,
            spaceId,
            planeId
          );

          if (planeResult) {
            // Update the plane object in its cell
            const updatedPlane = {
              ...planeResult.object,
              broadcastId: null,
              broadcasting: false,
              broadcasterId: null,
              lastUpdated: new Date(),
            };

            // Update the cell with the modified plane object
            const cellDoc = await getDoc(planeResult.cellRef);
            const cellData = cellDoc.data();
            cellData.objects[planeId] = updatedPlane;
            await setDoc(planeResult.cellRef, cellData, { merge: true });

            console.log(
              `Plane ${planeId} updated to stop broadcasting in cell ${planeResult.cellId}.`
            );
          } else {
            console.warn(`Plane ${planeId} not found when stopping broadcast`);
          }
        } catch (stopError) {
          console.error(
            `Error updating plane ${planeId} on broadcast stop:`,
            stopError
          );
        }
      },
      getViewerCount: () => broadcastSession.peerConnections.size,
    };
  } catch (error) {
    console.error('Error starting broadcast:', error);
    const streamData = activeStreams.get(`${spaceId}-${planeId}`);
    streamData?.broadcastSession?.cleanup();
    activeStreams.delete(`${spaceId}-${planeId}`);
    throw error;
  }
};

export const joinBroadcast = async (spaceId, broadcastId, viewerId) => {
  try {
    console.log(
      `Viewer ${viewerId} attempting to join broadcast: ${broadcastId} in space: ${spaceId}`
    );

    const objectsRef = collection(
      db,
      'users',
      window.currentSpaceOwner,
      'spaces',
      spaceId,
      'objects'
    );
    let snapshot = await getDocs(
      query(
        objectsRef,
        where('broadcastId', '==', broadcastId),
        where('broadcasting', '==', true)
      )
    );
    if (snapshot.empty) {
      throw new Error(`Broadcast plane not found with ID: ${broadcastId}`);
    }
    const planeDoc = snapshot.docs[0];
    const planeData = planeDoc.data();
    console.log('Found broadcast plane to join:', {
      planeId: planeDoc.id,
      broadcasterId: planeData.broadcasterId,
    });

    const peerConnection = new RTCPeerConnection(getRTCConfiguration());
    const signalingId = `${broadcastId}_${viewerId}`;
    const signalingRef = doc(
      db,
      'users',
      window.currentSpaceOwner,
      'spaces',
      spaceId,
      'signaling',
      signalingId
    );

    // Queue for candidates arriving before the offer is set
    let queuedBroadcasterCandidates = [];
    let remoteDescriptionSet = false; // Flag to track if remote description is set

    console.log(
      `Viewer ${viewerId} setting signaling status to 'joining' for ${broadcastId}`
    );
    await setDoc(
      signalingRef,
      {
        created: serverTimestamp(),
        viewerId,
        broadcastId,
        status: 'joining',
        viewerCandidates: [],
        broadcasterCandidates: [],
      },
      { merge: true }
    );

    console.log(
      `PeerConnection created for ${broadcastId}. Caller must add ontrack handler.`
    );

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          const currentSignalDoc = await getDoc(signalingRef);
          if (currentSignalDoc.exists()) {
            await updateDoc(signalingRef, {
              viewerCandidates: arrayUnion(event.candidate.toJSON()),
              lastUpdated: serverTimestamp(),
            });
            console.log(
              `Viewer ${viewerId} added ICE candidate for ${broadcastId}`
            );
          } else {
            console.warn(
              `Signaling document ${signalingId} missing, cannot add ICE candidate.`
            );
          }
        } catch (err) {
          console.error(`Viewer ${viewerId} error adding ICE candidate:`, err);
        }
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(
        `Viewer ICE Connection State Change for ${broadcastId}: ${peerConnection.iceConnectionState}`
      );
      if (
        ['disconnected', 'failed', 'closed'].includes(
          peerConnection.iceConnectionState
        )
      ) {
        console.log(
          `Viewer connection to ${broadcastId} lost or failed. Cleaning up listener.`
        );
      }
    };

    const unsubscribe = onSnapshot(signalingRef, async (snapshot) => {
      const data = snapshot.data();
      if (!data || peerConnection.connectionState === 'closed') {
        console.log(
          `Signaling doc ${signalingId} removed or connection closed. Cleaning up listener.`
        );
        unsubscribe();
        peerConnection.close();
        return;
      }

      console.log(
        `Viewer ${viewerId} received signaling update for ${broadcastId}: Status - ${data.status}`
      );

      // --- Handle Offer ---
      if (
        data.offer &&
        data.status === 'offering' &&
        !peerConnection.currentRemoteDescription && // Ensure offer isn't processed twice
        !remoteDescriptionSet // Use our flag
      ) {
        console.log(
          `Viewer ${viewerId} received offer for ${broadcastId}, creating answer...`
        );
        try {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );
          remoteDescriptionSet = true; // Set the flag
          console.log(
            `Viewer ${viewerId} set remote description (offer) successfully.`
          );

          // Process any queued candidates now that remote description is set
          console.log(
            `Processing ${queuedBroadcasterCandidates.length} queued broadcaster candidates...`
          );
          while (queuedBroadcasterCandidates.length > 0) {
            const candidate = queuedBroadcasterCandidates.shift();
            try {
              await peerConnection.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
              console.log(
                `Viewer ${viewerId} added queued broadcaster ICE candidate for ${broadcastId}:`,
                candidate.sdpMid || candidate.candidate.substring(0, 20)
              );
            } catch (addCandidateError) {
              if (
                !addCandidateError.message.includes(
                  'remote description is not set'
                )
              ) {
                // Avoid redundant logs
                console.warn(
                  `Viewer ${viewerId} error adding QUEUED broadcaster ICE candidate:`,
                  addCandidateError
                );
              }
            }
          }

          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          console.log(
            `Viewer ${viewerId} set local description (answer) successfully.`
          );

          if (data.status !== 'connected' && data.status !== 'answering') {
            await updateDoc(signalingRef, {
              answer: { type: answer.type, sdp: answer.sdp },
              status: 'answering',
              lastUpdated: serverTimestamp(),
            });
            console.log(`Viewer ${viewerId} sent answer for ${broadcastId}.`);
          } else {
            await updateDoc(signalingRef, {
              answer: { type: answer.type, sdp: answer.sdp },
              lastUpdated: serverTimestamp(),
            });
            console.log(
              `Viewer ${viewerId} updated answer for ${broadcastId} (status ${data.status}).`
            );
          }
        } catch (err) {
          console.error(
            `Viewer ${viewerId} error handling offer or creating/sending answer:`,
            err
          );
          remoteDescriptionSet = false; // Reset flag on error
          await updateDoc(signalingRef, {
            status: 'failed',
            error: `Viewer error handling offer: ${err.message}`,
            lastUpdated: serverTimestamp(),
          }).catch((updateErr) =>
            console.error("Failed to update status to 'failed':", updateErr)
          );
          peerConnection.close();
        }
      }

      // --- Handle Broadcaster Candidates ---
      if (data.broadcasterCandidates?.length > 0) {
        const candidatesToAdd = data.broadcasterCandidates;

        for (const candidate of candidatesToAdd) {
          if (!candidate) continue;
          try {
            if (remoteDescriptionSet && peerConnection.remoteDescription) {
              if (
                !queuedBroadcasterCandidates.some(
                  (qc) => qc.candidate === candidate.candidate
                )
              ) {
                await peerConnection.addIceCandidate(
                  new RTCIceCandidate(candidate)
                );
                console.log(
                  `Viewer ${viewerId} added broadcaster ICE candidate for ${broadcastId}:`,
                  candidate.sdpMid || candidate.candidate.substring(0, 20)
                );
              } else {
                console.log(
                  `Skipping already processed candidate: ${candidate.candidate.substring(
                    0,
                    20
                  )}`
                );
              }
            } else {
              if (
                !queuedBroadcasterCandidates.some(
                  (qc) => qc.candidate === candidate.candidate
                )
              ) {
                console.log(
                  `Queuing broadcaster ICE candidate because remote description not set yet.`
                );
                queuedBroadcasterCandidates.push(candidate);
              }
            }
          } catch (err) {
            if (!err.message.includes('remote description is not set')) {
              console.warn(
                `Viewer ${viewerId} error adding broadcaster ICE candidate:`,
                err
              );
            }
          }
        }
      }

      if (data.status === 'connected') {
        console.log(
          `Viewer ${viewerId} confirmed connection established for ${broadcastId} via signaling status.`
        );
      }
    });

    return {
      peerConnection,
      disconnect: () => {
        console.log(
          `Disconnecting viewer ${viewerId} from broadcast ${broadcastId}`
        );
        unsubscribe();
        peerConnection.close();

        updateDoc(signalingRef, {
          status: 'closed',
          lastUpdated: serverTimestamp(),
        }).catch((err) =>
          console.warn(
            `Failed to mark signaling doc ${signalingId} as closed on disconnect:`,
            err
          )
        );
      },
    };
  } catch (error) {
    console.error(
      `Viewer ${viewerId} error joining broadcast ${broadcastId}:`,
      error
    );
    const signalingId = `${broadcastId}_${viewerId}`;
    const signalingRef = doc(
      db,
      'users',
      window.currentSpaceOwner,
      'spaces',
      spaceId,
      'signaling',
      signalingId
    );
    try {
      await updateDoc(signalingRef, {
        status: 'failed',
        error: `Join error: ${error.message}`,
        lastUpdated: serverTimestamp(),
      });
    } catch (cleanupError) {
      console.warn(
        'Failed to update signaling status on join error:',
        cleanupError
      );
    }
    throw error;
  }
};

export const isPlaneBeingBroadcast = async (spaceId, planeId) => {
  try {
    const planeRef = doc(
      db,
      'users',
      window.currentSpaceOwner,
      'spaces',
      spaceId,
      'objects',
      planeId
    );
    const planeDoc = await getDoc(planeRef);
    return planeDoc.exists() && !!planeDoc.data().broadcasting;
  } catch {
    return false;
  }
};

export const findAvailableBroadcasts = async (spaceId) => {
  try {
    // Import spatial partitioning helper
    const { getAllObjectsInSpace } = await import('./spatialPartitioning');
    const spaceOwner = window.currentSpaceOwner;

    // Get all objects in the space across all cells
    const allObjects = await getAllObjectsInSpace(spaceOwner, spaceId);

    // Filter for broadcasting objects
    const broadcasts = [];
    Object.entries(allObjects).forEach(([objectId, objectData]) => {
      if (objectData.broadcasting && objectData.broadcastId) {
        broadcasts.push({
          id: objectData.broadcastId,
          planeId: objectId,
          broadcasterId: objectData.broadcasterId,
          active: true,
          startTime: objectData.broadcastStartTime || Date.now(),
        });
      }
    });

    return broadcasts.filter((b) => b.id && b.id !== 'pending');
  } catch {
    return [];
  }
};

export const cleanupWebRTC = () => {
  console.log('Cleaning up WebRTC resources...');
  activeStreams.forEach(({ broadcastSession }, key) => {
    console.log(`Cleaning up broadcast session for key: ${key}`);
    broadcastSession?.cleanup();
  });
  activeStreams.clear();
};

export const registerUserPresence = async (userId, spaceId) => {
  if (!userId || !spaceId) return;

  window.currentUser = { uid: userId };

  if (!window.currentSpaceOwner) {
    window.currentSpaceOwner = userId;
  }

  const presenceRef = doc(
    db,
    'users',
    window.currentSpaceOwner,
    'spaces',
    spaceId,
    'presence',
    userId
  );

  await setDoc(
    presenceRef,
    {
      online: true,
      userId,
      lastSeen: serverTimestamp(),
    },
    { merge: true }
  );
};

export const subscribeToUsersInSpace = (spaceId, callback) => {
  if (!spaceId || !window.currentSpaceOwner) {
    console.warn(
      'Cannot subscribe to users: spaceId or currentSpaceOwner missing.'
    );
    return () => {};
  }

  const presenceRef = collection(
    db,
    'users',
    window.currentSpaceOwner,
    'spaces',
    spaceId,
    'presence'
  );

  const currentUserId = window.currentUser?.uid;

  const unsubscribePresence = onSnapshot(
    presenceRef,
    (snapshot) => {
      const activeUsers = new Set();
      snapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.online && doc.id !== currentUserId) {
          activeUsers.add(doc.id);
        }
      });
      callback(Array.from(activeUsers));
    },
    (error) => {
      console.error('Error listening to presence collection:', error);
    }
  );

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const signalingRef = collection(
    db,
    'users',
    window.currentSpaceOwner,
    'spaces',
    spaceId,
    'signaling'
  );
  const q = query(signalingRef, where('viewerId', '==', currentUserId));

  const unsubscribeSignaling = onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          if (data?.viewerId === currentUserId) {
            let creationTime = data.created?.toDate
              ? data.created.toDate()
              : new Date(0);
            if (creationTime >= fiveMinutesAgo) {
              console.log(
                `ℹ️ Signaling document change detected: ${change.doc.id}`,
                data?.status
              );
            }
          }
        }
      });
    },
    (error) => {
      console.error('Error listening to signaling collection:', error);
    }
  );

  return () => {
    console.log(
      `Unsubscribing from presence and signaling for space ${spaceId}`
    );
    unsubscribeSignaling();
    unsubscribePresence();
  };
};
