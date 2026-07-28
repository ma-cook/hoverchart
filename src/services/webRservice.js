import { api, emitSocket, onSocket, connectSocket, getSocket } from '../api-client';
import { getSpaceDataChannel } from './spaceDataChannel';

let _rtcInitialized = false;

export const initWebRTC = (userId) => {
  if (_rtcInitialized || !userId) return;
  _rtcInitialized = true;
  connectSocket();
  const socket = getSocket();
  if (!socket) return;
  socket.on('connect', () => {
    getSpaceDataChannel();
  });
};

const TURN_URL = import.meta.env.VITE_TURN_URL || 'turn:relay.metered.ca:443';
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || 'e8dd65f183e28d282e8b83b0';
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || 'uWdWNmkhvyqTEswO';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: TURN_URL, username: TURN_USERNAME, credential: TURN_CREDENTIAL },
  ],
};

const activeStreams = new Map();

class BroadcastSession {
  constructor(broadcastId, stream, userId, spaceId) {
    this.broadcastId = broadcastId;
    this.stream = stream;
    this.userId = userId;
    this.spaceId = spaceId;
    this.peerConnections = new Map();
  }

  async createOfferForViewer(viewerId) {
    if (this.peerConnections.has(viewerId)) return;
    try {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      this.stream.getTracks().forEach((track) => pc.addTrack(track, this.stream));
      this.peerConnections.set(viewerId, pc);

      const offer = await pc.createOffer({ offerToReceiveVideo: false, offerToReceiveAudio: false });
      await pc.setLocalDescription(offer);
      emitSocket('signaling:offer', { to: viewerId, offer: { type: offer.type, sdp: offer.sdp } });

      const _unsubscribeOffer = onSocket('signaling:answer', ({ from, answer }) => {
        if (from === viewerId && !pc.currentRemoteDescription) {
          pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(console.error);
        }
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) emitSocket('signaling:ice', { to: viewerId, candidate: e.candidate.toJSON() });
      };

      pc.oniceconnectionstatechange = () => {
        if (['disconnected', 'failed', 'closed'].includes(pc.iceConnectionState)) {
          this.removeViewer(viewerId);
        }
      };

      this.peerConnections.set(viewerId, pc);
    } catch (err) {
      console.error('Offer creation error:', err);
      this.removeViewer(viewerId);
    }
  }

  removeViewer(viewerId) {
    const pc = this.peerConnections.get(viewerId);
    if (pc) { pc.close(); this.peerConnections.delete(viewerId); }
  }

  cleanup() {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
    }
  }
}

export const startBroadcasting = async (userId, spaceId, planeId, stream) => {
  const broadcastId = `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  connectSocket();

  const broadcastSession = new BroadcastSession(broadcastId, stream, userId, spaceId);
  activeStreams.set(`${spaceId}-${planeId}`, { broadcastId, stream, broadcastSession });

  const unsubOffer = onSocket('signaling:offer', async ({ from, _offer }) => {
    if (from === userId) return;
    broadcastSession.createOfferForViewer(from);
  });

  try {
    await api.get('/api/auth/verify', { retries: 0 }).catch(() => null);
    await api.patch(`/api/spaces/${spaceId}/objects/${planeId}`, {
      metadata: { broadcastId, broadcasting: true, broadcasterId: userId, broadcastType: 'webcam' },
    });
  } catch { /* object update best-effort */ }

  return {
    broadcastId,
    stop: async () => {
      unsubOffer();
      broadcastSession.cleanup();
      activeStreams.delete(`${spaceId}-${planeId}`);
      try {
        await api.patch(`/api/spaces/${spaceId}/objects/${planeId}`, {
          metadata: { broadcastId: null, broadcasting: false, broadcasterId: null },
        });
      } catch { /* best-effort */ }
    },
    getViewerCount: () => broadcastSession.peerConnections.size,
  };
};

export const joinBroadcast = async (spaceId, broadcastId, viewerId) => {
  connectSocket();
  const pc = new RTCPeerConnection(RTC_CONFIG);

  pc.onicecandidate = (e) => {
    if (e.candidate) emitSocket('signaling:ice', { to: broadcastId, candidate: e.candidate.toJSON() });
  };

  const unsubAnswer = onSocket('signaling:offer', async ({ from, offer }) => {
    if (from === viewerId) return;
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    emitSocket('signaling:answer', { to: from, answer });
  });

  return {
    peerConnection: pc,
    disconnect: () => { unsubAnswer(); pc.close(); },
  };
};

export const isPlaneBeingBroadcast = async (spaceId, planeId) => {
  try {
    const res = await api.get(`/api/spaces/${spaceId}/objects?limit=500`).catch(() => []);
    const obj = res.find((o) => o.id === planeId);
    return obj?.metadata?.broadcasting || false;
  } catch { return false; }
};

export const findAvailableBroadcasts = async (spaceId) => {
  try {
    const res = await api.get(`/api/spaces/${spaceId}/objects?limit=500`).catch(() => []);
    return res
      .filter((o) => o.metadata?.broadcasting && o.metadata?.broadcastId)
      .map((o) => ({ id: o.metadata.broadcastId, planeId: o.id, broadcasterId: o.metadata.broadcasterId, active: true }));
  } catch { return []; }
};

export const cleanupWebRTC = () => {
  activeStreams.forEach(({ broadcastSession }) => broadcastSession?.cleanup());
  activeStreams.clear();
};

export const registerUserPresence = async (userId, spaceId) => {
  if (!userId || !spaceId) return;
  window.currentUser = { sub: userId };
  connectSocket();
  emitSocket('signaling:join', { spaceId });
};

export const subscribeToUsersInSpace = (spaceId, callback) => {
  if (!spaceId) return () => {};
  return onSocket('signaling:members', (members) => {
    callback(members);
  });
};
