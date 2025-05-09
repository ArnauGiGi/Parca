import axios from './axios';

export const register = async ({ username, email, password }) => {
  const response = await axios.post('/auth/register', {
    username,
    email,
    password,
  });
  return response.data;
};

export const login = async ({ email, password }) => {
  const response = await axios.post('/auth/login', { email, password });
  return response.data;
};

export const logout = async () => {
  await axios.post('/auth/logout');
};

export const me = async () => {
  try {
    const { data } = await axios.get('/auth/me');
    return data.user;
  } catch (err) {
    if (err.response?.status === 401) {
      return null;
    }
    throw err;
  }
};