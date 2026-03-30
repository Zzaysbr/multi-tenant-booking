export const getFullImageUrl = (path: string | null | undefined) => {
  if (!path) return undefined;
  
  // ถ้าเป็น URL เต็มอยู่แล้ว (เช่น Google Avatar) หรือ blob ให้คืนค่าเดิม
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  
  // ✅ ดึง URL หลักของ Render (ลบ /api ออก) เพื่อเข้าถึงโฟลเดอร์ public/uploads
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const backendUrl = apiBase.replace('/api', '');
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${backendUrl}${cleanPath}`;
};