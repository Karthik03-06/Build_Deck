import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to server, ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket.IO] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error.message);
    });
  }

  return socket;
}

export function subscribeToRoom(roomType, id) {
  const s = getSocket();
  if (s.connected) {
    s.emit(`join:${roomType}`, id);
  } else {
    s.once('connect', () => {
      s.emit(`join:${roomType}`, id);
    });
  }
}

export function unsubscribeFromRoom(roomType, id) {
  const s = getSocket();
  if (s) {
    s.emit(`leave:${roomType}`, id);
  }
}
