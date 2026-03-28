import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Store, Calendar, BookUser, LogOut, ChevronRight, Sparkles } from 'lucide-react';

export default function CustomerNavbar() {
  const { tenantPath } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth(); // ดึงข้อมูล user ฝั่งลูกค้า

  // ✅ 1. ตรวจสอบสถานะ active ของแต่ละเมนู
  const isActive = (path: string) => location.pathname === path;

  // 📝 รายการเมนูสำหรับฝั่งลูกค้า
  const navItems = [
    { name: 'หน้าหลัก', path: `/${tenantPath}`, icon: <Store size={20} /> },
    { name: 'จองคิว', path: `/${tenantPath}/book`, icon: <Calendar size={20} /> },
    { name: 'ประวัติการจอง', path: `/${tenantPath}/my-bookings`, icon: <BookUser size={20} /> },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-stone-100 z-50 font-sans text-secondary-foreground No Italic">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        
        {/* --- ☕️ Logo / Shop Name --- */}
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate(`/${tenantPath}`)}>
          <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 transition-transform group-hover:rotate-12">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter uppercase leading-none">Cozy</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Booking</p>
          </div>
        </div>

        {/* --- 🗺️ Navigation Links (Desktop) --- */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 text-sm font-bold transition-all ${
                isActive(item.path) 
                ? 'text-primary' 
                : 'text-stone-400 hover:text-primary'
              }`}
            >
              <div className={`${isActive(item.path) ? 'text-accent' : ''}`}>
                {item.icon}
              </div>
              <span className="tracking-tight">{item.name}</span>
            </button>
          ))}
        </div>

        {/* --- 🚀 Action Area (Mobile & Desktop) --- */}
        <div className="flex items-center gap-5">
          {user ? (
            // ✅ แสดงข้อมูล user และปุ่ม Logout
            <div className="flex items-center gap-4 pl-6 border-l border-stone-100">
              <div className="text-right">
                <p className="text-sm font-black text-primaryleading-none mb-1">{user?.name}</p>
                <p className="text-[9px] font-black text-accent uppercase tracking-[0.2em]">Customer Account</p>
              </div>
              <button 
                onClick={logout} 
                className="p-3 bg-secondary rounded-2xl text-rose-400 hover:text-rose-600 transition-all active:scale-95 shadow-sm"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            // ✅ แสดงปุ่ม Login
            <button 
              onClick={() => navigate(`/${tenantPath}/login`)} 
              className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-primary hover:text-accent transition-colors"
            >
              <LogOut size={16} /> Login
            </button>
          )}

          {/* ปุ่ม "จองคิว" สำหรับมือถือ */}
          <button 
            onClick={() => navigate(`/${tenantPath}/book`)} 
            className="md:hidden p-3 bg-primary text-white rounded-full shadow-lg"
          >
            <Calendar size={18} />
          </button>
        </div>

      </div>
    </nav>
  );
}