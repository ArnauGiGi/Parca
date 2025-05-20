import axios from './axios';

export const getUsers = async () => {
  const { data } = await axios.get('/users');
  return data;
};

export const updateUserRole = async (userId, role) => {
  const { data } = await axios.patch(`/users/${userId}/role`, { role });
  return data;
};