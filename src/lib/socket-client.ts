import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

/** Shared same-origin Socket.IO connection. Call only from client-side effects. */
export function getSocket() {
  if (!socket) socket = io({ path: '/api/socket', autoConnect: true });
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
