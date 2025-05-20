import axios from './axios';

export const createGame = async () => {
  const { data } = await axios.post('/game/create');
  return data;
};

export const joinGame = async (code) => {
  const { data } = await axios.post(`/game/join/${code}`);
  return data;
};

export const getGame = async (code) => {
  const { data } = await axios.get(`/game/${code}`);
  return data;
};