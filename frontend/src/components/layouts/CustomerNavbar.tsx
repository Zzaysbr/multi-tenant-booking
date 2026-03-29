// src/components/layouts/CustomerNavbar.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Settings, LogOut, ChevronDown, 
  Home, Calendar, ClipboardList, LayoutGrid
} from 'lucide-react';

export default function CustomerNavbar() {
  const { tenantPath } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const isPortal = location.pathname === '/' || location.pathname === '/profile' || location.pathname === '/my-bookings';

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-b border-stone-100 z-100 font-sans No Italic">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        <Link to="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-accent shadow-lg transition-all group-hover:rotate-12">
             <LayoutGrid size={22} />
          </div>
          <div className="leading-none hidden sm:block text-left">
             <p className="text-sm font-black text-primary uppercase tracking-tighter">Cozy</p>
             <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Bookings</p>
          </div>
        </Link>

        {!isPortal && tenantPath && (
          <div className="hidden md:flex items-center bg-stone-100/50 p-1.5 rounded-3xl border border-stone-100 animate-in fade-in slide-in-from-top-2">
             <NavTab to={`/${tenantPath}`} icon={<Home size={16}/>} label="หน้าหลัก" active={location.pathname === `/${tenantPath}`} />
             <NavTab to={`/${tenantPath}/book`} icon={<Calendar size={16}/>} label="จองคิว" active={location.pathname.includes('/book')} />
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-4" ref={menuRef}>
           {user ? (
             <>
                <button 
                  onClick={() => navigate('/my-bookings')}
                  className={`p-3 rounded-2xl transition-all cursor-pointer ${location.pathname === '/my-bookings' ? 'bg-primary text-white shadow-lg' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}`}
                  title="ประวัติการจองทั้งหมด"
                >
                   <ClipboardList size={20} />
                </button>

                <div className="relative">
                   <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`flex items-center gap-3 pl-3 pr-2 py-2 bg-white border rounded-2xl transition-all cursor-pointer ${isMenuOpen ? 'border-accent ring-4 ring-accent/5' : 'border-stone-200'}`}>
                      <div className="text-right hidden lg:block leading-none">
                         <p className="text-[11px] font-black text-primary uppercase mb-1">{user.name}</p>
                         <p className="text-[8px] font-bold text-accent uppercase tracking-widest">Customer</p>
                      </div>
                      <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary border border-stone-100 shadow-inner overflow-hidden">
                         {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <User size={20} />}
                      </div>
                      <ChevronDown size={14} className={`text-stone-300 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                   </button>

                   {isMenuOpen && (
                     <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-4xl border border-stone-100 shadow-premium p-3 animate-in fade-in zoom-in duration-200 origin-top-right">
                        <DropdownItem onClick={() => { navigate('/profile'); setIsMenuOpen(false); }} icon={<Settings size={16}/>} label="Profile Settings" />
                        <div className="h-px bg-stone-50 my-2 mx-2" />
                        <DropdownItem onClick={() => { logout(); navigate('/login'); }} icon={<LogOut size={16}/>} label="Sign Out" variant="danger" />
                     </div>
                   )}
                </div>
             </>
           ) : (
             <button onClick={() => navigate('/login')} className="btn-boutique-primary px-7 py-3 text-[10px] cursor-pointer shadow-none hover:shadow-lg transition-all">Sign In</button>
           )}
        </div>
      </div>
    </nav>
  );
}

function NavTab({ to, icon, label, active }: any) {
  return (
    <Link to={to} className={`flex items-center gap-2 px-6 py-2.5 rounded-btn text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer ${active ? 'bg-white text-primary shadow-sm ring-1 ring-stone-100' : 'text-muted hover:text-primary hover:bg-white/60'}`}>
      <span className={active ? 'text-accent' : 'text-stone-300'}>{icon}</span> {label}
    </Link>
  );
}

function DropdownItem({ onClick, icon, label, variant = 'default' }: any) {
  const isDanger = variant === 'danger';
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all cursor-pointer group ${isDanger ? 'hover:bg-rose-50' : 'hover:bg-stone-50'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isDanger ? 'bg-rose-50 text-rose-400 group-hover:bg-rose-500 group-hover:text-white' : 'bg-stone-50 text-stone-400 group-hover:bg-primary group-hover:text-white'}`}>{icon}</div>
      <span className={`text-[11px] font-black uppercase tracking-wider ${isDanger ? 'text-primary group-hover:text-rose-600' : 'text-primary'}`}>{label}</span>
    </button>
  );
}