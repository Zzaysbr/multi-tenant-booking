import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { 
  ShieldCheck, Store, Users, Calendar, 
  Loader2, Trash2, Database, ShieldAlert,
  UserCog
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // State จัดการ Tab และข้อมูล
  const [activeTab, setActiveTab] = useState<'overview' | 'shops' | 'users'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    // 🛡️ Guard: ดีดออกถ้าไม่ใช่ Admin
    if (user && user.role !== 'ADMIN') {
      toast.error("Unauthorized: Super Admin Access Only");
      navigate('/');
      return;
    }
    fetchAllData();
  }, [user, navigate]);

  // 🔄 โหลดข้อมูลทุุกอย่างของ Admin
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [dashRes, usersRes] = await Promise.all([
        api.get('/api/admin/dashboard'), // ได้ Stats + Shops
        api.get('/api/admin/users')      // ได้ Users ทั้งระบบ
      ]);
      setStats(dashRes.data.stats);
      setShops(dashRes.data.shops || []);
      setUsersList(usersRes.data.users || []);
    } catch (err: any) {
      toast.error("ไม่สามารถโหลดข้อมูลระบบได้");
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Action: ลบร้านค้า (ลบแข็ง)
  const handleDeleteShop = async (shopId: number, shopName: string) => {
    const confirmDelete = window.confirm(`⚠️ อันตราย: คุณต้องการลบร้าน "${shopName}" และข้อมูลทั้งหมดออกจากระบบใช่หรือไม่?`);
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/admin/tenants/${shopId}`);
      toast.success(`ลบร้าน ${shopName} ออกจากแพลตฟอร์มแล้ว`);
      fetchAllData(); // รีเฟรชข้อมูล
    } catch (err) {
      toast.error("ไม่สามารถลบร้านค้าได้ (อาจติด Constraint ใน DB)");
    }
  };

  // 👑 Action: เปลี่ยนสิทธิ์ผู้ใช้ (Change Role)
  const handleRoleChange = async (userId: number, newRole: string) => {
    const confirmChange = window.confirm(`ยืนยันการเปลี่ยนสิทธิ์เป็น ${newRole}?`);
    if (!confirmChange) return;

    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      toast.success("อัปเดตสิทธิ์การใช้งานสำเร็จ");
      fetchAllData(); // รีเฟรชข้อมูล
    } catch (err) {
      toast.error("เปลี่ยนสิทธิ์ไม่สำเร็จ");
    }
  };

  if (loading) return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center font-black animate-pulse text-emerald-400">
      <ShieldCheck size={56} className="mb-4" />
      <p className="text-[10px] uppercase tracking-[0.4em]">Initializing Super Admin Core...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32 No Italic">
      
      {/* --- 🛡️ Admin Super Navbar --- */}
      <nav className="h-20 bg-slate-900 text-white flex items-center justify-between px-10 sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg"><ShieldCheck size={24} className="text-emerald-400" /></div>
          <span className="text-sm font-black uppercase tracking-[0.2em]">Cozy Admin Core</span>
        </div>
        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
          <span className="opacity-60 flex items-center gap-2"><UserCog size={14}/> {user?.name}</span>
          <button onClick={logout} className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors shadow-lg cursor-pointer">Sign Out</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-12 space-y-10">
        
        {/* --- 🗂️ Navigation Tabs --- */}
        <div className="flex gap-4 border-b border-stone-200 pb-4 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('overview')} className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-stone-400 hover:bg-stone-100'}`}><Database size={16} className="inline mr-2"/> Overview</button>
          <button onClick={() => setActiveTab('shops')} className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'shops' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-stone-400 hover:bg-stone-100'}`}><Store size={16} className="inline mr-2"/> Tenants Management</button>
          <button onClick={() => setActiveTab('users')} className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-stone-400 hover:bg-stone-100'}`}><Users size={16} className="inline mr-2"/> Users Access</button>
        </div>

        {/* --- 📊 TAB 1: OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900 p-10 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
               <Store className="absolute right-[-10px] bottom-[-10px] size-40 opacity-5" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Total Tenants</p>
               <p className="text-6xl font-black mt-2 tracking-tighter">{stats?.totalShops || 0}</p>
            </div>
            <div className="bg-white p-10 rounded-[32px] shadow-sm border border-stone-100">
               <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-6"><Users size={24}/></div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registered Users</p>
               <p className="text-4xl font-black text-slate-900 tracking-tighter mt-1">{stats?.totalUsers || 0}</p>
            </div>
            <div className="bg-white p-10 rounded-[32px] shadow-sm border border-stone-100">
               <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-6"><Calendar size={24}/></div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform Bookings</p>
               <p className="text-4xl font-black text-slate-900 tracking-tighter mt-1">{stats?.totalBookings || 0}</p>
            </div>
          </div>
        )}

        {/* --- 🏢 TAB 2: TENANTS MANAGEMENT --- */}
        {activeTab === 'shops' && (
          <div className="bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-8 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Active Stores</h3>
            </div>
            <div className="divide-y divide-stone-100">
              {shops.map((shop: any) => (
                <div key={shop.id} className="p-6 flex flex-col md:flex-row items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-6">
                     <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-900 text-lg">{shop.name.charAt(0)}</div>
                     <div>
                       <h4 className="text-xl font-black text-slate-900 uppercase leading-none tracking-tight mb-1">{shop.name}</h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL: /{shop.path_name}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-8 mt-4 md:mt-0">
                     <div className="text-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bookings</p>
                       <p className="text-xl font-black text-slate-900 leading-none">{shop.bookingCount}</p>
                     </div>
                     {/* 🗑️ ปุ่มลบร้านค้า */}
                     <button onClick={() => handleDeleteShop(shop.id, shop.name)} className="p-4 bg-white border border-stone-200 rounded-2xl text-stone-300 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all cursor-pointer group-hover:shadow-sm">
                       <Trash2 size={20} />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 👥 TAB 3: USERS ACCESS CONTROL --- */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-8 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Platform Accounts</h3>
              <ShieldAlert size={18} className="text-amber-500" />
            </div>
            <div className="divide-y divide-stone-100">
              {usersList.map((u: any) => (
                <div key={u.id} className="p-6 flex flex-col md:flex-row items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-black">{u.name.charAt(0)}</div>
                     <div>
                       <h4 className="text-base font-black text-slate-900 uppercase leading-none mb-1">{u.name}</h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.email}</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 md:mt-0">
                     {/* 👑 ตัวเลือกเปลี่ยน Role */}
                     <select 
                       value={u.role} 
                       onChange={(e) => handleRoleChange(u.id, e.target.value)}
                       className={`px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border cursor-pointer outline-none transition-colors ${
                         u.role === 'ADMIN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                         u.role === 'OWNER' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                         'bg-stone-50 text-stone-500 border-stone-200'
                       }`}
                     >
                       <option value="CUSTOMER">Customer</option>
                       <option value="STAFF">Staff</option>
                       <option value="OWNER">Owner</option>
                       <option value="ADMIN">Super Admin</option>
                     </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}