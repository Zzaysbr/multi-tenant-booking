// frontend/src/pages/owner/ServicesPage.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Scissors, Trash2, Sparkles} from 'lucide-react';

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ name: '', price: '', durationMinutes: '60' });

  const fetchServices = async () => {
    if (!user?.tenantPath) return;
    try {
      const res = await api.get('/owner/services'); // axios.ts จะเติม tenantPath ให้เอง
      setServices(res.data.services || []);
    } catch (err) {
      toast.error("โหลดข้อมูลบริการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, [user]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ✅ FIX: แปลงเป็น Number ก่อนส่ง ป้องกัน Error 400 (Validation Failed)
      const payload = {
        name: newService.name,
        price: Number(newService.price),
        durationMinutes: Number(newService.durationMinutes)
      };
      await api.post('/owner/services', payload);
      toast.success("เพิ่มบริการใหม่เรียบร้อย! ✨");
      setNewService({ name: '', price: '', durationMinutes: '60' });
      fetchServices();
    } catch (err) { 
      toast.error("ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบราคาและเวลา"); 
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("ลบบริการนี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/owner/services/${id}`);
      toast.success("ลบสำเร็จ");
      fetchServices();
    } catch (err) { toast.error("ลบไม่สำเร็จ"); }
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center animate-pulse font-black text-accent uppercase">Loading Menu...</div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20 font-sans">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-primary tracking-tighter uppercase flex items-center gap-4">
          <Scissors size={36} /> Service Menu
        </h1>
      </header>
      
      <div className="card-cozy p-10! border-stone-100 shadow-xl bg-white">
        <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-5 space-y-2">
            <label className="text-[10px] font-black uppercase text-muted px-2">Service Name</label>
            <input required type="text" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="input-warm w-full py-4" placeholder="ชื่อบริการ" />
          </div>
          <div className="md:col-span-3 space-y-2">
            <label className="text-[10px] font-black uppercase text-muted px-2">Price (THB)</label>
            <input required type="number" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} className="input-warm w-full py-4" placeholder="ราคา" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-muted px-2">Time (Min)</label>
            <input required type="number" value={newService.durationMinutes} onChange={e => setNewService({...newService, durationMinutes: e.target.value})} className="input-warm w-full py-4" placeholder="60" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="btn-boutique-primary w-full py-5 text-[11px] cursor-pointer">Confirm</button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((s: any) => (
          <div key={s.id} className="card-cozy p-8 flex justify-between items-center bg-white border-stone-50 hover:border-accent/30 transition-all">
            <div className="flex gap-6 items-center">
               <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-accent"><Sparkles size={24} /></div>
               <div className="space-y-1">
                  <h4 className="text-lg font-black text-primary uppercase">{s.name}</h4>
                  <p className="text-xs font-bold text-muted uppercase">{s.durationMinutes} MIN • ฿{Number(s.price).toLocaleString()}</p>
               </div>
            </div>
            <button onClick={() => handleDelete(s.id)} className="p-3 text-stone-200 hover:text-rose-500 transition-colors cursor-pointer"><Trash2 size={20} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}