import axios from 'axios';

const api = axios.create({ 
  // มั่นใจว่า Vercel Env (VITE_API_BASE_URL) คือ https://xxx.onrender.com/api
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

    // 🧠 ระบบ Auto-Tenant Prefix:
    // ถ้าเรียก path เริ่มต้นด้วย / และไม่ใช่กลุ่ม /auth หรือ /user หรือ /admin
    // และในเครื่องมีข้อมูล tenantPath ระบบจะพ่วงเข้าไปให้เองอัตโนมัติ
    if (savedUser && config.url?.startsWith('/') && 
        !config.url.startsWith('/auth') && 
        !config.url.startsWith('/user') && 
        !config.url.startsWith('/admin')) {
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