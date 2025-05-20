import axios from './axios';

export const sendGameSummary = async (email, gameData) => {
  const { data } = await axios.post('/email/send-summary', {
    email,
    gameData
  });
  return data;
};