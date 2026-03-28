import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  // ถ้าไม่มี User เลย ให้ไป Login
  if (!user) return <Navigate to="/login" replace />;

  // 🛡️ ถ้าพยายามเข้าหน้า Owner แต่ Role เป็น CUSTOMER ให้เตะไปหน้าแรก
  if (window.location.pathname.startsWith('/owner') && user.role === 'CUSTOMER') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;