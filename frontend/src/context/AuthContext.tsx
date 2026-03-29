// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// ✅ 1. เพิ่มฟิลด์ให้ User ครบตามที่ใช้งานจริง
interface User { 
  id: number; 
  name: string; 
  email: string; 
  role: string; 
  tenantPath?: string; 
  phone?: string;       // 👈 เพิ่มเพื่อรองรับหน้า Profile
  avatar_url?: string;  // 👈 เพิ่มเพื่อรองรับรูปโปรไฟล์
}

interface AuthContextType { 
  user: User | null; 
  setUser: (user: User | null) => void; // 👈 เพิ่มเพื่อให้หน้า Profile อัปเดต state ได้
  login: (token: string, userData: User) => void; 
  logout: () => void; 
  loading: boolean; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ตรวจสอบสถานะการล็อกอินเมื่อ Refresh หน้าจอ
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (savedUser && savedUser !== "undefined" && token && token !== "undefined") {
        setUser(JSON.parse(savedUser));
      } else {
        clearAuth();
      }
    } catch { 
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    clearAuth();
    // ✅ ใช้ window.location เพื่อล้าง state ของแอปให้สะอาดที่สุดตอนออก
    window.location.href = '/login';
  };

  // ✅ ทุกครั้งที่มีการ setUser (เช่น อัปเดตโปรไฟล์) ให้บันทึกลง localStorage ด้วย
  const updateUserInfo = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser: updateUserInfo, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};