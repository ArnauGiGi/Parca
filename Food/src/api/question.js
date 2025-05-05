import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const createQuestion = async ({ question, options, correctAnswer, category, difficulty }) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/questions`,
    { question, options, correctAnswer, category, difficulty },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};