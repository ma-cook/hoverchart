import pool from '../db.js';

const rooms = new Map();

export function registerSignalingHandlers(io, socket) {
  socket.on('signaling:join', async ({ spaceId }) => {
    if (!spaceId) return;
    const userId = socket.user?.sub || socket.guest?.sub;
    if (!userId) return;

    socket.join(`space:${spaceId}`);
    socket.spaceId = spaceId;

    if (!rooms.has(spaceId)) rooms.set(spaceId, new Set());
    rooms.get(spaceId).add(userId);

    try {
      socket.userData = { displayName: socket.user?.name || socket.guest?.name || 'Anonymous', photoUrl: socket.user?.picture || null, isGuest: !!socket.guest };
      await pool.query(
        `INSERT INTO user_presence (space_id, user_id, display_name, photo_url, is_guest, online, last_seen)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         ON CONFLICT (space_id, user_id)
         DO UPDATE SET online = true, last_seen = NOW(), display_name = $3, photo_url = $4, is_guest = $5`,
        [spaceId, userId, socket.userData.displayName, socket.userData.photoUrl, socket.userData.isGuest]
      );
    } catch (err) {
      console.error('Presence join error:', err);
    }

    const members = Array.from(rooms.get(spaceId));
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
      const members = rooms.has(spaceId) ? Array.from(rooms.get(spaceId)) : [];
      io.to(`space:${spaceId}`).emit('signaling:members', members);
    }
  });
}
