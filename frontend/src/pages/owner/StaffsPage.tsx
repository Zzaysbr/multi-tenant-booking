import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { 
  Users, UserPlus, Trash2, Loader2, 
  UserCheck, ShieldCheck, UserCircle 
} from 'lucide-react';

export default function StaffsPage() {
  const { user } = useAuth();
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');

  const fetchStaffs = () => {
    if (!user?.tenantPath) return;
    api.get(`/api/${user.tenantPath}/owner/staffs`)
      .then(res => setStaffs(res.data.staffs || []))
      .catch(() => toast.error("โหลดข้อมูลพนักงานไม่สำเร็จ"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStaffs(); }, [user]);

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
    if(!confirm("คุณแน่ใจนะว่าจะลบรายชื่อช่างคนนี้? ข้อมูลการจองที่ผูกอยู่จะไม่หายไปแต่จะไม่สามารถเลือกช่างคนนี้ได้อีก")) return;
    try {
      await api.delete(`/api/${user?.tenantPath}/owner/staffs/${id}`);
      toast.success("ลบข้อมูลสำเร็จ");
      fetchStaffs();
    } catch (err) { toast.error("ลบไม่สำเร็จ"); }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-primary animate-pulse italic font-sans">
       <Loader2 className="animate-spin mb-4" size={40} />
       <p className="font-black text-xs uppercase tracking-widest">กำลังดึงรายชื่อพนักงาน...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans pb-20">
      
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-primary flex items-center gap-3 tracking-tighter">
          <Users size={32} /> จัดการพนักงาน/ช่าง
        </h1>
        <p className="text-muted text-sm font-medium italic">เพิ่มหรือลบรายชื่อทีมงานที่จะให้บริการในร้านของคุณ</p>
      </header>
      
      {/* --- ➕ Add Staff Form --- */}
      <div className="card-cozy p-8! border-stone-100">
        <form onSubmit={handleAddStaff} className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 space-y-3 w-full">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent ml-1">
              ชื่อพนักงาน / ชื่อเรียกในร้าน
            </label>
            <div className="relative">
              <input 
                required type="text" value={name} onChange={e => setName(e.target.value)} 
                className="input-warm w-full pl-12" placeholder="เช่น ช่างเอก (Barber Master)" 
              />
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full md:w-auto h-[58px] shadow-primary/20">
            <UserPlus size={18} /> เพิ่มพนักงาน
          </button>
        </form>
      </div>

      {/* --- Staff List --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffs.map((st: any) => (
          <div key={st.id} className="card-cozy p-6 flex flex-col items-center text-center space-y-4 group hover:border-accent/30 transition-all border-stone-50">
            <div className="w-20 h-20 bg-secondary rounded-[28px] flex items-center justify-center text-primary border border-stone-100 shadow-inner group-hover:scale-110 transition-transform duration-500">
               <UserCheck size={32} />
            </div>
            
            <div className="space-y-1">
              <p className="font-black text-primary text-xl tracking-tight">{st.name}</p>
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-accent uppercase tracking-widest">
                 <ShieldCheck size={12} /> Verified Member
              </div>
            </div>

            <button 
              onClick={() => handleDelete(st.id)} 
              className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                <Trash2 size={14} /> Remove Staff
              </div>
            </button>
          </div>
        ))}

        {staffs.length === 0 && (
          <div className="md:col-span-3 py-20 bg-stone-50/50 rounded-[40px] border-2 border-dashed border-stone-100 flex flex-col items-center justify-center text-stone-300 space-y-3">
             <Users size={48} />
             <p className="font-bold italic">ยังไม่มีรายชื่อพนักงานในระบบ</p>
          </div>
        )}
      </div>
    </div>
  );
}