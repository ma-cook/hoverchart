import pool from '../db.js';

const rooms = new Map(); // spaceId -> Map<userId, member object>

export function registerSignalingHandlers(io, socket) {
  socket.on('signaling:join', async ({ spaceId, displayName, photoUrl, isGuest }) => {
    if (!spaceId) return;
    const userId = socket.user?.sub || socket.guest?.sub;
    if (!userId) return;

    socket.join(`space:${spaceId}`);
    socket.spaceId = spaceId;

    // Build a full member object (mirrors client field names: userId,
    // displayName, photoURL, isGuest) so presence chips render real avatars and
    // initials instead of a bare "?" fallback.
    const member = {
      userId,
      displayName: displayName || socket.user?.name || (socket.isGuest ? 'Guest' : socket.guest?.name) || 'Guest',
      photoURL: photoUrl || socket.user?.picture || socket.guest?.picture || null,
      isGuest: !!isGuest || !!socket.isGuest,
      online: true,
    };

    if (!rooms.has(spaceId)) rooms.set(spaceId, new Map());
    rooms.get(spaceId).set(userId, member);

    try {
      socket.userData = { displayName: member.displayName, photoUrl: member.photoURL, isGuest: member.isGuest };
      await pool.query(
        `INSERT INTO user_presence (space_id, user_id, display_name, photo_url, is_guest, online, last_seen)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         ON CONFLICT (space_id, user_id)
         DO UPDATE SET online = true, last_seen = NOW(), display_name = $3, photo_url = $4, is_guest = $5`,
        [spaceId, userId, member.displayName, member.photoURL, member.isGuest]
      );
    } catch (err) {
      console.error('Presence join error:', err);
    }

    const members = Array.from(rooms.get(spaceId).values());
    io.to(`space:${spaceId}`).emit('signaling:members', members);
  });

  socket.on('signaling:offer', ({ to, offer }) => {
    if (!socket.spaceId || !to || !offer) return;
    socket.to(`space:${socket.spaceId}`).emit('signaling:offer', { from: socket.id, offer });
  });

  socket.on('signaling:answer', ({ to, answer }) => {
    if (!socket.spaceId || !to || !answer) return;
    socket.to(`space:${socket.spaceId}`).emit('signaling:answer', { from: socket.id, answer });
  });

  socket.on('signaling:ice', ({ to, candidate }) => {
    if (!socket.spaceId || !to || !candidate) return;
    socket.to(`space:${socket.spaceId}`).emit('signaling:ice', { from: socket.id, candidate });
  });

  socket.on('disconnect', async () => {
    const spaceId = socket.spaceId;
    const userId = socket.user?.sub || socket.guest?.sub;
    if (spaceId && userId) {
      if (rooms.has(spaceId)) {
        rooms.get(spaceId).delete(userId);
        if (rooms.get(spaceId).size === 0) rooms.delete(spaceId);
      }
      try {
        await pool.query(
          `UPDATE user_presence SET online = false, last_seen = NOW()
           WHERE space_id = $1 AND user_id = $2`,
          [spaceId, userId]
        );
      } catch (err) {
        console.error('Presence disconnect error:', err);
      }
      const members = rooms.has(spaceId) ? Array.from(rooms.get(spaceId).values()) : [];
      io.to(`space:${spaceId}`).emit('signaling:members', members);
    }
  });
}