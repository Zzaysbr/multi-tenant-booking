// src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { 
  ShieldCheck, Store, Users, Calendar, 
  Loader2, ArrowRight, BarChart3, Database 
} from 'lucide-react';
import { getFullImageUrl } from '../../utils/image';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // เด้งออกถ้าไม่ใช่ Admin
    if (user && user.role !== 'ADMIN') {
      toast.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
      navigate('/');
      return;
    }

    const fetchAdminData = async () => {
      try {
        const res = await api.get('/api/admin/dashboard');
        setData(res.data);
      } catch (err: any) {
        toast.error("ไม่สามารถโหลดข้อมูล Admin ได้");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, navigate]);

  if (loading) return (
    <div className="h-screen bg-bg flex flex-col items-center justify-center font-black animate-pulse text-accent">
      <ShieldCheck size={48} className="mb-4" />
      <p className="text-[10px] uppercase tracking-widest">Accessing Super Admin Core...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg font-sans pb-32 No Italic">
      
      {/* 🛡️ Admin Navbar */}
      <nav className="h-20 bg-slate-900 text-white flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} className="text-emerald-400" />
          <span className="text-sm font-black uppercase tracking-[0.2em]">Cozy Platform Admin</span>
        </div>
        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
          <span className="opacity-60">{user?.name}</span>
          <button onClick={logout} className="px-4 py-2 bg-white/10 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer">Sign Out</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-20 space-y-12">
        <header className="space-y-2">
          <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none flex items-center gap-4">
            <Database size={36} /> Platform Overview
          </h1>
          <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em]">SaaS Multi-tenant Control Center</p>
        </header>

        {/* 📊 Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-primary p-10 rounded-card text-white shadow-2xl relative overflow-hidden">
             <Store className="absolute right-[-10px] bottom-[-10px] size-40 opacity-10" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Total Tenants</p>
             <p className="text-6xl font-black mt-2 tracking-tighter">{data?.stats?.totalShops || 0}</p>
             <div className="mt-4 text-[9px] font-black bg-white/20 w-fit px-3 py-1 rounded-full uppercase tracking-widest">Registered Shops</div>
          </div>
          <div className="card-cozy p-10! bg-white border-stone-100">
             <div className="p-4 bg-secondary text-accent rounded-2xl w-fit mb-6"><Users size={24}/></div>
             <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Total Users</p>
             <p className="text-4xl font-black text-primary tracking-tighter mt-1">{data?.stats?.totalUsers || 0}</p>
          </div>
          <div className="card-cozy p-10! bg-white border-stone-100">
             <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-6"><Calendar size={24}/></div>
             <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Global Bookings</p>
             <p className="text-4xl font-black text-primary tracking-tighter mt-1">{data?.stats?.totalBookings || 0}</p>
          </div>
        </div>

        {/* 🏢 Registered Tenants List */}
        <div className="card-cozy p-0 border-stone-100 bg-white overflow-hidden shadow-xl shadow-black/[0.02]">
          <div className="p-8 border-b border-stone-50 bg-stone-50/50 flex justify-between items-center">
            <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em]">Registered Stores</h3>
            <span className="text-[10px] font-black text-accent uppercase tracking-widest">Active Database</span>
          </div>
          
          <div className="divide-y divide-stone-50">
            {data?.shops?.map((shop: any, idx: number) => (
              <div key={shop.id} className="p-6 flex flex-col md:flex-row items-center justify-between hover:bg-stone-50 transition-colors group">
                <div className="flex items-center gap-6">
                   <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center font-black text-primary">
                     {idx + 1}
                   </div>
                   <div>
                     <h4 className="text-lg font-black text-primary uppercase leading-none tracking-tight mb-1">{shop.name}</h4>
                     <p className="text-[9px] font-black text-muted uppercase tracking-widest">Path: /{shop.path_name}</p>
                   </div>
                </div>
                
                <div className="flex items-center gap-10 mt-4 md:mt-0">
                   <div className="text-center">
                     <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Total Bookings</p>
                     <p className="text-xl font-black text-primary leading-none">{shop.bookingCount}</p>
                   </div>
                   <button onClick={() => navigate(`/${shop.path_name}`)} className="p-4 bg-white border border-stone-200 rounded-2xl text-stone-400 group-hover:text-accent group-hover:border-accent transition-all cursor-pointer">
                     <ArrowRight size={20} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}