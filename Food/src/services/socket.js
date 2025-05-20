import { io } from 'socket.io-client';

let socket = null;

export const initSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socket = io('http://parca.local', {
    withCredentials: true,
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default initSocket;