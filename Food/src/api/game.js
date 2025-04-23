import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const createGame = async (token) => {
  const response = await axios.post(
    `${API_URL}/game/create`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const joinGame = async (code, token) => {
  const response = await axios.post(
    `${API_URL}/game/join/${code}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getGame = async (gameId, token) => {
  const response = await axios.get(
    `${API_URL}/game/${gameId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};