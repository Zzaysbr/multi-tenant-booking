// frontend/src/utils/image.ts
export const getFullImageUrl = (path: string | null | undefined) => {
  if (!path) return undefined;
  
  // ถ้าเป็น URL เต็มจาก Google หรือ Preview ในเครื่อง (blob) ให้ใช้ของเดิม
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  
  // ✅ ดึง URL หลักของ Render (ลบ /api ออก) เพื่อเข้าถึง Static Assets
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const backendUrl = apiBase.replace('/api', '');
  
  // ตรวจสอบว่า path มี / นำหน้าหรือยัง
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${backendUrl}${cleanPath}`;
};