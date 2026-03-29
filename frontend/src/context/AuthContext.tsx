import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';


interface User { 
  id: number; 
  name: string; 
  email: string; 
  role: string; 
  tenantPath?: string; 
  phone?: string;       
  avatar_url?: string; 
}

interface AuthContextType { 
  user: User | null; 
  setUser: (user: User | null) => void;
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
    window.location.href = '/login';
  };

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