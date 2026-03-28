import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token && token !== "undefined" && token !== "null") {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log(`🚀 [ยิง API ฝั่ง Frontend] URL: ${config.url} | มี Token: ${!!token}`);
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ โดนเตะกลับ (401) กำลังไปหน้า Login...");
      localStorage.clear();
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;