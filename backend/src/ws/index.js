import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

export function createWSServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
    transports: ['websocket'],
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      socket.isGuest = false;
      next();
    } catch {
      try {
        const decoded = jwt.verify(token, process.env.JWT_GUEST_SECRET);
        socket.user = decoded;
        socket.isGuest = true;
        next();
      } catch {
        next(new Error('Invalid or expired token'));
      }
    }
  });

  return io;
}
