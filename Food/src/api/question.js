import axios from './axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const createQuestion = async (payload) => {
  const { data } = await axios.post(`/questions`, payload);
  return data;
};

export const getQuestions = async () => {
  const { data } = await axios.get('/questions');
  return data;
};

export const deleteQuestion = async (id) => {
  const { data } = await axios.delete(`/questions/${id}`);
  return data;
};