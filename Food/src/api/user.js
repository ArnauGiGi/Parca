import axios from './axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getUsers = async () => {
  const { data } = await axios.get('/users');
  return data;
};

export const updateUserRole = async (userId, role) => {
  const { data } = await axios.patch(`/users/${userId}/role`, { role });
  return data;
};