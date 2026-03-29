// src/api/axios.ts
import axios from 'axios';

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  withCredentials: true, 
  headers: {
    'Accept': 'application/json'
  }
});

// --- Request Interceptor ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const isValidToken = token && token !== "undefined" && token !== "null";

    if (isValidToken) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (import.meta.env.DEV) {
      console.log(`🚀 [API Request] ${config.method?.toUpperCase()} -> ${config.url}`);
    }
    return config;
  }, 
  (error) => Promise.reject(error)
);

// --- Response Interceptor ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorData = error.response?.data;

    if (status === 401) {
      console.warn("🔒 Session Expired");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    // 🔥 สรุป Error ให้ชัดเจนสำหรับ Prod
    if (import.meta.env.DEV) {
      console.error(`❌ [API Error] Status: ${status} | Message:`, errorData);
    }

    return Promise.reject(error);
  }
);

export default api;