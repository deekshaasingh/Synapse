import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(canvasId) {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.once('connect', () => {
    s.emit('join-canvas', canvasId);
  });
  return s;
}

export function disconnectSocket() {
  const s = getSocket();
  if (s.connected) s.disconnect();
}