
import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutGrid, Calendar, Users, Scissors, 
  BarChart3, Settings, LogOut, ChevronLeft,
  BellRing, CheckSquare, User, Globe
} from 'lucide-react';
import { getFullImageUrl } from '../../utils/image';

export default function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  useEffect(() => {
    if (user && user.role === 'OWNER' && !user.tenantPath) {
      if (location.pathname !== '/owner/create-shop') {
        navigate('/owner/create-shop');
      }
    }
  }, [user, navigate, location.pathname]);

  const menuItems = [
    { icon: <LayoutGrid size={20} />, label: 'Dashboard', path: '/owner/dashboard' },
    { icon: <CheckSquare size={20} />, label: 'Approvals', path: '/owner/approvals' },
    { icon: <Calendar size={20} />, label: 'Bookings', path: '/owner/bookings' },
    { icon: <Users size={20} />, label: 'Staffs', path: '/owner/staffs' },
    { icon: <Scissors size={20} />, label: 'Services', path: '/owner/services' },
    { icon: <BarChart3 size={20} />, label: 'Reports', path: '/owner/reports' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/owner/settings' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex font-sans No Italic selection:bg-accent/20">
      
      {/* --- 📟 Sidebar (Elevated Design) --- */}
      <aside className={`bg-white border-r border-stone-100 transition-all duration-500 flex flex-col fixed h-full z-50 shadow-2xl shadow-black/2 ${isCollapsed ? 'w-20' : 'w-72'}`}>
        
        <div className="p-6 h-24 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
               <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-accent shadow-premium">
                  <LayoutGrid size={22} />
               </div>
               <div className="leading-none text-left">
                  <p className="text-sm font-black text-primary uppercase tracking-tighter">Cozy</p>
                  <p className="text-[9px] font-black text-accent uppercase tracking-[0.25em]">Partner</p>
               </div>
            </div>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className={`p-2.5 rounded-xl hover:bg-stone-50 text-stone-400 transition-all cursor-pointer ${isCollapsed ? 'rotate-180 mx-auto' : ''}`}>
             <ChevronLeft size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 pt-6">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group cursor-pointer relative ${
                  isActive ? 'bg-primary text-white shadow-premium' : 'text-stone-400 hover:bg-stone-50 hover:text-primary'
                }`}
              >
                <span className={`shrink-0 transition-transform duration-500 group-hover:scale-110 ${isActive ? 'text-accent' : ''}`}>{item.icon}</span>
                {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-[0.15em]">{item.label}</span>}
                {isActive && <div className="absolute right-4 w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-50">
          <button onClick={logout} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-all cursor-pointer group">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* --- 🖥️ Main Viewport --- */}
      <main className={`flex-1 transition-all duration-500 ${isCollapsed ? 'pl-20' : 'pl-72'}`}>
        <header className="h-24 bg-white/60 backdrop-blur-xl border-b border-stone-100 flex items-center justify-between px-10 sticky top-0 z-40">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg text-accent"><Globe size={14}/></div>
              <div className="text-left">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-300 leading-none mb-1">Current Tenant</p>
                <p className="text-[11px] font-black uppercase tracking-widest text-primary leading-none">{user?.tenantPath || 'Global Hub'}</p>
              </div>
           </div>

           <div className="flex items-center gap-5">
              <button className="w-11 h-11 rounded-2xl bg-white border border-stone-100 flex items-center justify-center text-stone-400 hover:text-accent transition-all cursor-pointer shadow-sm relative group">
                 <BellRing size={18} className="group-hover:rotate-12 transition-transform" />
                 <span className="absolute top-3 right-3 w-2 h-2 bg-accent rounded-full border-2 border-white animate-ping" />
              </button>
              
              <div className="h-10 w-px bg-stone-100 mx-2" />
              
              <div className="flex items-center gap-4">
                 <div className="text-right hidden lg:block leading-none">
                    <p className="text-[11px] font-black text-primary uppercase tracking-tight mb-1">{user?.name}</p>
                    <p className="text-[8px] font-bold text-accent uppercase tracking-widest">Administrator</p>
                 </div>
                 <div className="w-11 h-11 bg-secondary rounded-2xl border border-stone-100 shadow-inner flex items-center justify-center text-primary font-black uppercase overflow-hidden">
                    {user?.avatar_url ? <img src={getFullImageUrl(user.avatar_url)} className="w-full h-full object-cover" /> : <User size={20} />}
                 </div>
              </div>
           </div>
        </header>

        <section className="p-10 max-w-7xl mx-auto">
          <Outlet />
        </section>
      </main>
    </div>
  );
}