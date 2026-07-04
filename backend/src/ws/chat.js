import pool from '../db.js';

export function registerChatHandlers(io, socket) {
  socket.on('chat:message', async ({ spaceId, text, displayName, photoUrl }) => {
    if (!spaceId || !text) return;
    const userId = socket.user?.sub || socket.user?.sub;
    const name = displayName || socket.user?.name || 'Anonymous';
    const photo = photoUrl || socket.user?.picture || null;

    try {
      const result = await pool.query(
        `INSERT INTO chat_messages (space_id, user_id, display_name, photo_url, text)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [spaceId, userId, name, photo, text.slice(0, 500)]
      );

      const message = result.rows[0];
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
      socket.emit('chat:history', result.rows.reverse());
    } catch (err) {
      console.error('Chat history error:', err);
    }
  });
}
