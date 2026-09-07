import axios from 'axios';

let rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
rawBase = rawBase.trim();
if (!rawBase.endsWith('/api') && !rawBase.endsWith('/api/')) {
  rawBase = rawBase.replace(/\/+$/, '') + '/api';
}

const axiosInstance = axios.create({
  baseURL: rawBase,
  withCredentials: true, // Crucial for HTTP-Only cookie transfer
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach bearer authorization token and normalize URL
axiosInstance.interceptors.request.use(
  (config) => {
    // Prevent duplicate /api/ prefix if url is written as /api/...
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api\//, '/');
    }

    const token = localStorage.getItem('kaia_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Normalize errors & handle session expirations
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 1. Network / Connection offline error
    if (!error.response) {
      const networkError = new Error('Unable to connect to server. Please check your internet connection.');
      networkError.isNetworkError = true;
      networkError.statusCode = 0;
      return Promise.reject(networkError);
    }

    // 2. Extract safe error message from standard backend payload
    const { status, data } = error.response;
    const safeMessage = data?.message || error.message || 'An unexpected error occurred. Please try again.';

    // 3. Handle 401 Unauthorized (expired token cleanup)
    if (status === 401) {
      const isAuthPath = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthPath) {
        localStorage.removeItem('kaia_token');
      }
    }

    // Attach normalized safe message to error object
    error.safeMessage = safeMessage;
    return Promise.reject(error);
  }
);

export default axiosInstance;
