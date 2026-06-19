import { io } from 'socket.io-client';
import { getSessionToken, API_BASE_URL } from './api';

let socket = null;

export function getSocket() {
  if (socket) return socket;
  socket = io(API_BASE_URL || undefined, { autoConnect: false, auth: { token: getSessionToken() } });
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  s.auth = { token: getSessionToken() };
  if (!s.connected) s.connect();
  return s;
}
