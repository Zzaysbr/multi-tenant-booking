import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Settings, LogOut, Bell, Coffee, Menu, X, Scissors, BarChart3 } from 'lucide-react';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
  { icon: LayoutDashboard, label: 'ภาพรวม', path: '/owner/dashboard' },
  { icon: Calendar, label: 'รายการจอง', path: '/owner/bookings' },
  { icon: BarChart3, label: 'รายงานสรุปผล', path: '/owner/reports' },
  { icon: Users, label: 'จัดการพนักงาน', path: '/owner/staffs' },
  { icon: Scissors, label: 'จัดการบริการ', path: '/owner/services' },
  { icon: Users, label: 'ลูกค้าของฉัน', path: '/owner/customers'},
  { icon: Settings, label: 'ตั้งค่าร้านค้า', path: '/owner/settings' },
];

  const NavContent = () => (
    <nav className="flex-1 px-4 space-y-2 mt-4">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link key={item.label} to={item.path} onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-4 px-5 py-3.5 rounded-btn transition-all duration-300 font-medium ${
              isActive ? 'bg-primary text-white shadow-md' : 'text-accent hover:bg-accent/5 hover:text-primary'
            }`}
          >
            <item.icon size={20} />{item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar สำหรับ Desktop */}
      <aside className="hidden lg:flex w-72 bg-secondary border-r border-accent/10 flex-col sticky top-0 h-screen">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg"><Coffee size={24} /></div>
          <span className="text-xl font-bold text-secondary-foreground">CozyBooking</span>
        </div>
        <NavContent />
        <div className="p-6 border-t border-accent/10">
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="flex items-center gap-4 w-full px-5 py-3.5 text-primary font-bold hover:bg-red-50 hover:text-red-500 rounded-btn transition-all group">
            <LogOut size={20} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Overlay สำหรับ Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-secondary shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-8 flex justify-between items-center border-b border-accent/10">
              <span className="font-bold text-primary text-xl">CozyBooking</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-primary"><X size={28} /></button>
            </div>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-accent/10 flex items-center justify-between px-6 md:px-10 sticky top-0 z-40">
          <button className="lg:hidden p-2 text-primary" onClick={() => setIsMobileMenuOpen(true)}><Menu size={28} /></button>
          <h2 className="hidden lg:block text-lg font-semibold text-secondary-foreground">ยินดีต้อนรับ, <span className="text-primary font-bold">เจ้าของร้าน</span></h2>
          <div className="flex items-center gap-4">
            <button className="p-2.5 text-accent hover:bg-secondary rounded-full relative"><Bell size={22} /><span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white"></span></button>
            <div className="w-10 h-10 rounded-full bg-accent/20 border-2 border-white overflow-hidden shadow-sm">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
            </div>
          </div>
        </header>
        <main className="p-6 md:p-10"><Outlet /></main>
      </div>
    </div>
  );
}