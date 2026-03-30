export const getFullImageUrl = (path: string | null | undefined) => {
  if (!path) return undefined;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  
  // ✅ baseURL คือ https://.../api เราต้องเอา /api ออกเพื่อไปหา /uploads
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const backendUrl = apiBase.replace('/api', '');
  
  // มั่นใจว่า path คือ /uploads/xxx.png
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${backendUrl}${cleanPath}`;
};