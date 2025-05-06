import axios from './axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const createQuestion = async (payload) => {
  const { data } = await axios.post(`/questions`, payload);
  return data;
};