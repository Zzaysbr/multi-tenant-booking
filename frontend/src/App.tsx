// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'sonner';

import AdminDashboard from './pages/admin/AdminDashboard';
import CreateShopPage from './pages/owner/CreateShopPage'; // ✅ เพิ่ม Import

// Owner Pages
import OverviewPage from './pages/owner/OverviewPage';
import BookingsPage from './pages/owner/BookingsPage';
import StaffsPage from './pages/owner/StaffsPage';
import ServicesPage from './pages/owner/ServicesPage';
import CustomersPage from './pages/owner/CustomersPage';
import ReportsPage from './pages/owner/ReportsPage';
import SettingsPage from './pages/owner/SettingsPage';

// Customer Pages
import AuthPage from './pages/auth/AuthPage';
import HomePage from './pages/customer/HomePage';
import ShopPage from './pages/customer/ShopPage';
import BookingPage from './pages/customer/BookingPage';
import MyBookingsPage from './pages/customer/MyBookingsPage';
import PaymentPage from './pages/customer/PaymentPage';
import QueueBoard from './pages/customer/QueueBoard';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import CustomerLayout from './components/layouts/CustomerLayout';
import ProfilePage from './pages/customer/ProfilePage';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AuthSuccessPage from './pages/auth/AuthSuccessPage';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthPage />} />

        <Route path="/profile" element={<ProfilePage />}/>
        <Route path="/my-bookings" element={<MyBookingsPage />}/>
        <Route path='/forgot-password' element={<ForgotPassword />}/>
        <Route path='/reset-password' element={<ResetPassword />}/>
        <Route path='/auth-success' element={<AuthSuccessPage/>}/>
        
        {/* --- Protected Routes (ต้องล็อกอินก่อน) --- */}
        <Route element={<ProtectedRoute />}>
          
          {/* Admin Dashboard Route */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* --- Protected Owner Routes --- */}
          <Route path="/owner" element={<MainLayout />}>
            <Route path="dashboard" element={<OverviewPage />} />
            <Route path="create-shop" element={<CreateShopPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="staffs" element={<StaffsPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>

        {/* --- Customer Journey --- */}
        <Route path="/:tenantPath" element={<CustomerLayout />}>
          <Route index element={<ShopPage />} />
          <Route path="book" element={<BookingPage />} />
          <Route path="pay/:bookingId" element={<PaymentPage />}/> 
          <Route path="queue" element={<QueueBoard />}/>
        </Route>
        
        {/* --- 404 Redirect --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;