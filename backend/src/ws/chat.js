import pool from '../db.js';

// Maps a snake_case chat_messages row (Postgres) into the camelCase shape the
// client renders (msg.id / spaceId / userId / displayName / photoURL / text /
// timestamp), so message avatars, names and "you" markers resolve correctly.
const mapChatRow = (r) => ({
  id: r.id,
  spaceId: r.space_id,
  userId: r.user_id,
  displayName: r.display_name,
  photoURL: r.photo_url,
  text: r.text,
  timestamp: r.timestamp,
});

const HISTORY_LIMIT = 50;

export function registerChatHandlers(io, socket) {
  // Join the shared chat/signaling room `space:<id>` and push the recent history
  // to this socket. chat:join is emitted by the client whenever a chat window
  // opens (SpaceChat.jsx); it also works as a fallback for sockets that never
  // called signaling:join but still want to send/receive group messages.
  socket.on('chat:join', async ({ spaceId }) => {
    if (!spaceId) return;
    socket.join(`space:${spaceId}`);
    try {
      const result = await pool.query(
        `SELECT * FROM chat_messages
         WHERE space_id = $1
         ORDER BY timestamp DESC
         LIMIT $2`,
        [spaceId, HISTORY_LIMIT]
      );
      socket.emit('chat:history', result.rows.reverse().map(mapChatRow));
    } catch (err) {
      console.error('Chat history error:', err);
    }
  });

  // The `space:<id>` room is shared with presence/WebRTC signaling, so leaving
  // it here would cut a user off from those even while still in the space.
  // chat:leave is intentionally a no-op (signaling:leave handles real departures).
  socket.on('chat:leave', () => {});

  socket.on('chat:message', async ({ spaceId, text }) => {
    if (!spaceId || !text) return;
    const userId = socket.user?.sub || socket.guest?.sub;
    const name = socket.user?.name || (socket.isGuest ? 'Guest' : socket.guest?.name) || 'Anonymous';
    const photo = socket.user?.picture || socket.guest?.picture || null;

    try {
      const result = await pool.query(
        `INSERT INTO chat_messages (space_id, user_id, display_name, photo_url, text)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [spaceId, userId, name, photo, text.slice(0, 500)]
      );

      const message = mapChatRow(result.rows[0]);
      io.to(`space:${spaceId}`).emit('chat:message', message);
    } catch (err) {
      console.error('Chat persist error:', err);
    }
  });

  socket.on('chat:history', async ({ spaceId, before, limit = 50 }) => {
    if (!spaceId) return;
    try {
      const result = await pool.query(
        `SELECT * FROM chat_messages
         WHERE space_id = $1 ${before ? 'AND id < $2' : ''}
         ORDER BY timestamp DESC
         LIMIT $${before ? '3' : '2'}`,
        before ? [spaceId, before, limit] : [spaceId, limit]
      );
      socket.emit('chat:history', result.rows.reverse().map(mapChatRow));
    } catch (err) {
      console.error('Chat history error:', err);
    }
  });
}
