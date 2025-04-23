import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
let socket;

export const initSocket = (token) => {
  socket = io(SOCKET_URL, {
    auth: { token }
  });
  return socket;
};

export { socket };