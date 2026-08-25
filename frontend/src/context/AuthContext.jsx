import { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return JSON.parse(storedUser);
    }

    return null;
  });

  const login = async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password });
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const register = async (username, password, fields) => {
    try {
      const body = { username, password };
      if (Array.isArray(fields)) {
        body.fields = fields;
      }

      const res = await axios.post(`${API_URL}/auth/register`, body);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      return { success: true };
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.error || 'Registration failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
