import axios from 'axios';

let rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
rawBase = rawBase.trim();
if (!rawBase.endsWith('/api') && !rawBase.endsWith('/api/')) {
  rawBase = rawBase.replace(/\/+$/, '') + '/api';
}

const axiosInstance = axios.create({
  baseURL: rawBase,
  withCredentials: true, // Crucial for HTTP-Only cookie transfer
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('kaia_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
