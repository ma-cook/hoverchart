import { api, onSocket, emitSocket, connectSocket, disconnectSocket } from '../api-client';

const TURN_URL = import.meta.env.VITE_TURN_URL || 'turn:relay.metered.ca:443';
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || 'e8dd65f183e28d282e8b83b0';
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || 'uWdWNmkhvyqTEswO';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: TURN_URL,
      username: TURN_USERNAME,
      credential: TURN_CREDENTIAL,
    },
  ],
};

class SpaceDataChannel {
  constructor(spaceId, userId) {
    this.spaceId = spaceId;
    this.userId = userId;
    this.peers = new Map();
    this.dataChannels = new Map();
    this.onMessage = null;
    this.onMembers = null;
    this.unsubscribers = [];
    this.connected = false;
  }

  async join() {
    connectSocket();
    this.unsubscribers.push(
      onSocket('signaling:offer', async ({ from, offer }) => {
        if (this.peers.has(from)) return;
        const pc = this._createPeerConnection(from, false);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emitSocket('signaling:answer', { to: from, answer });
      }),
      onSocket('signaling:answer', ({ from, answer }) => {
        const pc = this.peers.get(from);
        if (pc && !pc.currentRemoteDescription) {
          pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(console.error);
        }
      }),
      onSocket('signaling:ice', ({ from, candidate }) => {
        const pc = this.peers.get(from);
        if (pc) {
          pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
        }
      }),
      onSocket('signaling:members', (members) => {
        this._syncPeers(members);
        this.onMembers?.(members);
      })
    );

    emitSocket('signaling:join', { spaceId: this.spaceId });
    this.connected = true;
  }

  leave() {
    this.unsubscribers.forEach((fn) => fn());
    this.unsubscribers = [];
    this._closeAll();
    disconnectSocket();
    this.connected = false;
  }

  send(data) {
    const msg = typeof data === 'string' ? data : JSON.stringify(data);
    this.dataChannels.forEach((dc) => {
      if (dc.readyState === 'open') {
        dc.send(msg);
      }
    });
  }

  _syncPeers(members) {
    const current = new Set(this.peers.keys());
    const target = new Set(members.filter((m) => m !== this.userId));

    current.forEach((peerId) => {
      if (!target.has(peerId)) {
        this._closePeer(peerId);
      }
    });

    target.forEach((peerId) => {
      if (!current.has(peerId)) {
        this._createPeerConnection(peerId, true);
      }
    });
  }

  _createPeerConnection(peerId, initiator) {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.peers.set(peerId, pc);

    const dc = pc.createDataChannel('space', {
      ordered: false,
      maxRetransmits: 0,
    });
    this._setupDataChannel(dc, peerId);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        emitSocket('signaling:ice', { to: peerId, candidate: e.candidate.toJSON() });
      }
    };

    pc.ondatachannel = (e) => {
      this._setupDataChannel(e.channel, peerId);
    };

    pc.oniceconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.iceConnectionState)) {
        this._closePeer(peerId);
      }
    };

    if (initiator) {
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        emitSocket('signaling:offer', { to: peerId, offer });
      }).catch(console.error);
    }

    return pc;
  }

  _setupDataChannel(dc, peerId) {
    this.dataChannels.set(peerId, dc);
    dc.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        this.onMessage?.(peerId, data);
      } catch {
        this.onMessage?.(peerId, e.data);
      }
    };
    dc.onclose = () => this.dataChannels.delete(peerId);
  }

  _closePeer(peerId) {
    const dc = this.dataChannels.get(peerId);
    if (dc) { dc.close(); this.dataChannels.delete(peerId); }
    const pc = this.peers.get(peerId);
    if (pc) { pc.close(); this.peers.delete(peerId); }
  }

  _closeAll() {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.dataChannels.forEach((dc) => dc.close());
    this.dataChannels.clear();
  }
}

let instance = null;

export function getSpaceDataChannel(spaceId, userId) {
  if (instance && instance.spaceId === spaceId) return instance;
  if (instance) instance.leave();
  instance = new SpaceDataChannel(spaceId, userId);
  return instance;
}

export function leaveCurrentSpace() {
  if (instance) {
    instance.leave();
    instance = null;
  }
}
