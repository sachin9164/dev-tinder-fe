import { io } from 'socket.io-client';
import { API_BASE_URL } from './api-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;
const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH || '/socket.io';

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      path: SOCKET_PATH,
      transports: ['websocket', 'polling'],
    });
  }

  return socket;
}

export function connectSocket(auth = {}) {
  const instance = getSocket();
  instance.auth = auth;

  if (!instance.connected) {
    instance.connect();
  }

  return instance;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function resetSocket() {
  if (!socket) {
    return;
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = undefined;
}
