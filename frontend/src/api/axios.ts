// frontend/src/api/axios.ts
import axios from 'axios';

const api = axios.create({ 
  // ต้องมั่นใจว่า Vercel Env (VITE_API_BASE_URL) มี /api ต่อท้าย
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  withCredentials: true, 
  headers: {
    'Accept': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && token !== "undefined") {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 🧠 ระบบพ่วง Path อัตโนมัติ:
    // ถ้าเราเรียก api.get('/owner/stats') และ user มี tenantPath 'cozy-cafe'
    // มันจะแปลงเป็น '/cozy-cafe/owner/stats' ให้เองทันที
    if (savedUser && config.url?.startsWith('/') && !config.url.startsWith('/auth')) {
        try {
            const user = JSON.parse(savedUser);
            if (user.tenantPath && !config.url.includes(user.tenantPath)) {
                config.url = `/${user.tenantPath}${config.url}`;
            }
        } catch (e) {
            console.error("Auth Data Corrupt");
        }
    }
    
    if (import.meta.env.DEV) {
      console.log(`🚀 [API Request] ${config.method?.toUpperCase()} -> ${config.url}`);
    }
    return config;
  }, 
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;