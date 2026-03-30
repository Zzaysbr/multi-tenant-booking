export const getFullImageUrl = (path: string | null | undefined) => {
  if (!path) return undefined;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  
  // ✅ ดึง URL หลังบ้านมาลบ /api ออก เพื่อเข้าถึงโฟลเดอร์ uploads ที่ Root
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const backendUrl = apiBase.replace('/api', '');
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${backendUrl}${cleanPath}`;
};