const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const getFullImageUrl = (path: string | null | undefined) => {
  if (!path) return undefined;
  // ถ้าเป็น URL เต็มอยู่แล้ว หรือเป็น blob (รูปพรีวิวในเครื่อง) ให้คืนค่าเดิมกลับไป
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `${API_BASE}${path}`;
};