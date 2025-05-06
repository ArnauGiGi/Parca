import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
let socket = null;

// Inicializa la conexión enviando cookies HTTP‑Only
export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true
    });
  }
  return socket;
};

export default initSocket;