import axios from 'axios';

// Base URL for your NestJS backend. Ensure it matches where your backend is running.
// In production, this would typically be an environment variable.
const API_BASE_URL = 'http://localhost:3000'; // Your NestJS backend default port

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Authorization token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // We'll store the JWT here after login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;