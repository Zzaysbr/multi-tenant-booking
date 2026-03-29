import axios from 'axios';

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  withCredentials: true, 
  
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// --- Request Interceptor  ---
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

// --- Response Interceptor: จัดการสถานะการตอบกลับ ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.warn("🔒 Session Expired: กำลังส่งกลับหน้า Login...");
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    if (status === 500) {
      console.error("🔥 Server Error: หลังบ้านเกิดข้อผิดพลาด");
    }

    return Promise.reject(error);
  }
);

export default api;