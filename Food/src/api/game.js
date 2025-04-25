import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const createGame = async (token) => {
  // Revisa en consola la URL y el token:
  console.log('API_URL:', API_URL);
  console.log('createGame Bearer token:', token);

  const response = await axios.post(
    `${API_URL}/game/create`,
    {}, // body vacío
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data; // debe devolver { gameId, code }
};

export const joinGame = async (code, token) => {
  const response = await axios.post(
    `${API_URL}/game/join/${code}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data; 
};

export const getGame = async (gameId, token) => {
  const response = await axios.get(`${API_URL}/game/${gameId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
