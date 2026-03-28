import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { 
  Scissors, Clock, Coins, PlusCircle, 
  Trash2, Loader2, Sparkles, Timer
} from 'lucide-react';

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ name: '', price: '', durationMinutes: '60' });

  const fetchServices = () => {
    if (!user?.tenantPath) return;
    api.get(`/api/${user.tenantPath}/owner/services`)
      .then(res => setServices(res.data.services || []))
      .catch(() => toast.error("โหลดข้อมูลบริการไม่สำเร็จ"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchServices(); }, [user]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/api/${user?.tenantPath}/owner/services`, newService);
      toast.success("เพิ่มบริการใหม่เรียบร้อย! ✨");
      setNewService({ name: '', price: '', durationMinutes: '60' });
      fetchServices();
    } catch (err) { toast.error("เพิ่มบริการไม่สำเร็จ"); }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("ต้องการลบบริการนี้ใช่หรือไม่? ลูกค้าจะไม่สามารถเลือกบริการนี้ได้อีก")) return;
    try {
      await api.delete(`/api/${user?.tenantPath}/owner/services/${id}`);
      toast.success("ลบสำเร็จ");
      fetchServices();
    } catch (err) { toast.error("ลบไม่สำเร็จ"); }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-primary animate-pulse italic font-sans">
       <Loader2 className="animate-spin mb-4" size={40} />
       <p className="font-black text-xs uppercase tracking-widest">กำลังเตรียมเมนูบริการ...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans pb-20">
      
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-primary flex items-center gap-3 tracking-tighter">
          <Scissors size={32} /> จัดการบริการ
        </h1>
        <p className="text-muted text-sm font-medium italic">กำหนดประเภทงานบริการ ราคา และเวลาที่ใช้สำหรับลูกค้าของคุณ</p>
      </header>
      
      {/* --- ➕ Add Service Form --- */}
      <div className="card-cozy p-8! border-stone-100">
        <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent ml-1">ชื่อบริการ</label>
            <input required type="text" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="input-warm w-full" placeholder="เช่น ตัดผม + สระไดร์" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent ml-1 flex items-center gap-2">
              <Coins size={12} /> ราคา (บาท)
            </label>
            <input required type="number" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} className="input-warm w-full" placeholder="500" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent ml-1 flex items-center gap-2">
              <Timer size={12} /> เวลา (นาที)
            </label>
            <input required type="number" value={newService.durationMinutes} onChange={e => setNewService({...newService, durationMinutes: e.target.value})} className="input-warm w-full" placeholder="60" />
          </div>
          <div className="md:col-span-4 mt-2">
            <button type="submit" className="btn-primary w-full py-5 shadow-primary/20">
              <PlusCircle size={18} /> ยืนยันการเพิ่มบริการ
            </button>
          </div>
        </form>
      </div>

      {/* --- ✂️ Service List --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((s: any) => (
          <div key={s.id} className="card-cozy p-8 flex justify-between items-center group border-stone-50 hover:border-accent/30 transition-all">
            <div className="flex gap-6 items-center">
               <div className="w-16 h-16 bg-primary/5 rounded-[24px] flex items-center justify-center text-accent shadow-inner">
                  <Sparkles size={28} />
               </div>
               <div className="space-y-2">
                  <h4 className="text-xl font-black text-primary tracking-tight">{s.name}</h4>
                  <div className="flex items-center gap-3">
                     <span className="badge-cafe bg-accent/5">
                        <Clock size={10} className="inline mr-1" /> {s.durationMinutes} นาที
                     </span>
                     <span className="text-sm font-black text-secondary-foreground">฿{s.price}</span>
                  </div>
               </div>
            </div>
            
            <button 
              onClick={() => handleDelete(s.id)} 
              className="p-4 text-stone-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
              title="ลบบริการ"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}

        {services.length === 0 && (
          <div className="md:col-span-2 py-20 bg-stone-50/50 rounded-[40px] border-2 border-dashed border-stone-100 flex flex-col items-center justify-center text-stone-300 space-y-3">
             <Scissors size={48} />
             <p className="font-bold italic">ยังไม่ได้เพิ่มรายการบริการ</p>
          </div>
        )}
      </div>
    </div>
  );
}