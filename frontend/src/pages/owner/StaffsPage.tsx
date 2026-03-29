// src/pages/owner/StaffsPage.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { 
  Users, UserPlus, Trash2, Loader2, 
  UserCheck, ShieldCheck, UserCircle, Star
} from 'lucide-react';

export default function StaffsPage() {
  const { user } = useAuth();
  const [staffs, setStaffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');

  const fetchStaffs = async () => {
    if (!user?.tenantPath) return;
    try {
      const res = await api.get(`/api/${user.tenantPath}/owner/staffs`);
      setStaffs(res.data.staffs || []);
    } catch (err) {
      toast.error("โหลดข้อมูลพนักงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaffs(); }, [user?.tenantPath]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      await api.post(`/api/${user?.tenantPath}/owner/staffs`, { name });
      toast.success("เพิ่มรายชื่อช่างเรียบร้อยแล้วครับ ✨");
      setName('');
      fetchStaffs();
    } catch (err) { toast.error("เพิ่มช่างไม่สำเร็จ"); }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("คุณแน่ใจนะว่าจะลบพนักงานคนนี้?")) return;
    try {
      await api.delete(`/api/${user?.tenantPath}/owner/staffs/${id}`);
      toast.success("ลบข้อมูลสำเร็จ");
      fetchStaffs();
    } catch (err) { toast.error("ลบไม่สำเร็จ"); }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse">
       <Loader2 className="animate-spin text-primary mb-4" size={40} />
       <p className="font-black text-[10px] uppercase tracking-widest text-accent">Accessing Talent Records...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans No Italic pb-20">
      
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none flex items-center gap-4">
          <Users size={36} /> Talent Hub
        </h1>
        <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em]">Manage your premium service team</p>
      </header>
      
      {/* --- ➕ Add Staff Form --- */}
      <div className="card-cozy p-10! border-stone-100 bg-white shadow-xl shadow-black/5">
        <form onSubmit={handleAddStaff} className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-[10px] font-black uppercase text-muted px-2 tracking-widest">Staff Name / Nickname</label>
            <div className="relative">
              <input 
                required type="text" value={name} onChange={e => setName(e.target.value)} 
                className="input-warm w-full pl-14 py-5" placeholder="เช่น Master Barber A" 
              />
              <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
            </div>
          </div>
          <button type="submit" className="btn-boutique-primary w-full md:w-auto h-15.5 px-12 text-[11px] shadow-premium cursor-pointer">
            <UserPlus size={18} /> Add Talent
          </button>
        </form>
      </div>

      {/* --- Staff List Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {staffs.map((st: any) => (
          <div key={st.id} className="card-cozy p-8 flex flex-col items-center text-center space-y-6 group hover:border-accent/30 transition-all border-stone-50 bg-white hover:-translate-y-1 duration-500 shadow-lg shadow-black/5 relative overflow-hidden">
            
            {/* Background Accent Decor */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 rounded-bl-4xl pointer-events-none flex items-center justify-center text-accent/20">
               <Star size={32} />
            </div>

            <div className="w-24 h-24 bg-secondary rounded-4xl flex items-center justify-center text-primary border border-stone-100 shadow-inner group-hover:scale-105 transition-transform duration-500">
               <UserCheck size={40} />
            </div>
            
            <div className="space-y-2">
              <p className="font-black text-primary text-2xl tracking-tight uppercase leading-none">{st.name}</p>
              <div className="flex items-center justify-center gap-2 text-[8px] font-black text-accent uppercase tracking-[0.3em]">
                 <ShieldCheck size={12} className="text-accent" /> Identity Verified
              </div>
            </div>

            <button 
              onClick={() => handleDelete(st.id)} 
              className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all cursor-pointer group/btn"
            >
              <div className="flex items-center justify-center gap-2">
                <Trash2 size={14} className="group-hover/btn:rotate-12 transition-transform" /> Remove from Team
              </div>
            </button>
          </div>
        ))}

        {staffs.length === 0 && (
          <div className="md:col-span-3 py-24 bg-stone-50/30 rounded-4xl border-2 border-dashed border-stone-100 flex flex-col items-center justify-center text-stone-300 space-y-3">
             <Users size={48} className="opacity-20" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Talent Profiles Found</p>
          </div>
        )}
      </div>
    </div>
  );
}