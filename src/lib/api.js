import axios from 'axios';

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://agenticautomation.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

// Request interceptor to attach JWT from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('agentflow_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        const isAuthRoute = window.location.pathname === '/login' || window.location.pathname === '/register';
        if (!isAuthRoute) {
          localStorage.removeItem('agentflow_token');
          localStorage.removeItem('agentflow_user');
          // Optional redirect on session expiry
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
