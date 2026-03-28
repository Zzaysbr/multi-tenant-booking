import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'sonner';

import AuthPage from './pages/auth/AuthPage';
import DashboardLayout from './layouts/DashboardLayout';
import OverviewPage from './pages/owner/OverviewPage';
import BookingsPage from './pages/owner/BookingsPage';
import StaffsPage from './pages/owner/StaffsPage';
import ServicesPage from './pages/owner/ServicesPage';
import CustomersPage from './pages/owner/CustomersPage';
import ReportsPage from './pages/owner/ReportsPage';
import SettingsPage from './pages/owner/SettingsPage';
import BookingPage from './pages/customer/BookingPage';
import HomePage from './pages/customer/HomePage';
import MyBookingsPage from './pages/customer/MyBookingsPage';
import PaymentPage from './pages/customer/PaymentPage';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" richColors />
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/login" element={<AuthPage />} />
        
        {/* --- Root: หน้าแรกโชว์ร้านค้าทั้งหมด --- */}
        <Route path="/" element={<HomePage />} />
        
        {/* --- Protected Owner Routes --- */}
        {/* เราใช้โครงสร้าง /owner ไปเลย เพราะใน Dashboard ของคุณดึงข้อมูลจาก user.tenantPath อยู่แล้ว */}
        <Route element={<ProtectedRoute />}>
          <Route path="/owner" element={<DashboardLayout />}>
            <Route path="dashboard" element={<OverviewPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="staffs" element={<StaffsPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>

        {/* --- Customer Booking (Dynamic) --- */}
        <Route path="/:tenantPath" element={<BookingPage />} />
        <Route path='/:tenantPath/my-bookings' element={<MyBookingsPage />}/>
        <Route path='/:tenantPath/pay/:bookingId' element={<PaymentPage />}/> 
        
        {/* --- 404 Redirect --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;