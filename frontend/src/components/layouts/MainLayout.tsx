import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, Settings, LogOut, Scissors, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'ภาพรวม', path: '/owner/dashboard', icon: <LayoutDashboard size={22} /> },
    { name: 'รายการจอง', path: '/owner/bookings', icon: <CalendarDays size={22} /> },
    { name: 'พนักงาน', path: '/owner/staffs', icon: <Users size={22} /> },
    { name: 'บริการ', path: '/owner/services', icon: <Scissors size={22} /> },
    { name: 'ลูกค้า', path: '/owner/customers', icon: <ShoppingBag size={22} /> },
    { name: 'ตั้งค่า', path: '/owner/settings', icon: <Settings size={22} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row font-sans text-secondary-foreground">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-72 bg-primary text-white flex-col sticky top-0 h-screen shadow-2xl z-50">
        <div className="p-10 mb-6">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/owner/dashboard')}>
            <div className="w-11 h-11 bg-accent rounded-2xl flex items-center justify-center shadow-lg"><ShoppingBag size={22} /></div>
            <div>
              <h2 className="text-xl font-black tracking-tighter uppercase leading-none">Cozy</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Booking</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1.5">
          {menuItems.map((item) => (
            <button key={item.name} onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${isActive(item.path) ? 'bg-accent text-white shadow-xl' : 'hover:bg-white/5 text-white/50 hover:text-white'}`}>
              {item.icon} {item.name}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/10">
          <button onClick={logout} className="w-full flex items-center gap-3 text-white/30 hover:text-rose-400 font-bold text-xs px-6 py-4">
            <LogOut size={18} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex bg-white/60 backdrop-blur-xl border-b border-stone-100 px-12 py-5 justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3 text-[10px] font-black text-muted uppercase tracking-[0.2em]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Store Online: {user?.tenantPath}
          </div>
          <div className="flex items-center gap-4 pl-8 border-l border-stone-100 text-right">
             <div><p className="text-sm font-black text-primary leading-none">{user?.name}</p></div>
             <div className="w-11 h-11 bg-secondary rounded-2xl flex items-center justify-center font-black text-primary border border-stone-200">{user?.name?.charAt(0)}</div>
          </div>
        </header>
        <div className="p-6 md:p-14 max-w-7xl w-full mx-auto pb-32"><Outlet /></div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-4 py-3 flex justify-around z-50">
        {menuItems.slice(0, 5).map((item) => (
          <button key={item.name} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 ${isActive(item.path) ? 'text-primary' : 'text-stone-300'}`}>
            {item.icon} <span className="text-[9px] font-black uppercase tracking-tighter">{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}