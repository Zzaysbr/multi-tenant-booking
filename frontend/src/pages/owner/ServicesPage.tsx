import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Scissors, Trash2, Loader2, Sparkles} from 'lucide-react';

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ name: '', price: '', durationMinutes: '60' });

  const fetchServices = async () => {
    if (!user?.tenantPath) return;
    try {
      // ✅ axios.ts จะเติม /:tenantPath ให้เอง
      const res = await api.get('/owner/services');
      setServices(res.data.services || []);
    } catch (err) {
      toast.error("โหลดข้อมูลบริการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, [user?.tenantPath]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ✅ แปลงเป็น Number ก่อนส่ง ป้องกัน Error 400 (Validation Failed)
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
    if(!confirm("ต้องการลบบริการนี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/owner/services/${id}`);
      toast.success("ลบสำเร็จ");
      fetchServices();
    } catch (err) { toast.error("ลบไม่สำเร็จ"); }
  };

  if (loading) return <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse"><Loader2 className="animate-spin text-primary mb-4" size={40} /></div>;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans pb-20">
      <header className="space-y-2"><h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none flex items-center gap-4"><Scissors size={36} /> Service Menu</h1></header>
      
      <div className="card-cozy p-10! border-stone-100 shadow-xl bg-white">
        <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-5 space-y-2"><label className="text-[10px] font-black uppercase text-muted px-2">Service Name</label><input required type="text" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="input-warm w-full py-4" placeholder="ชื่อบริการ" /></div>
          <div className="md:col-span-3 space-y-2"><label className="text-[10px] font-black uppercase text-muted px-2">Price (THB)</label><input required type="number" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} className="input-warm w-full py-4" /></div>
          <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black uppercase text-muted px-2">Time (Min)</label><input required type="number" value={newService.durationMinutes} onChange={e => setNewService({...newService, durationMinutes: e.target.value})} className="input-warm w-full py-4" /></div>
          <div className="md:col-span-2"><button type="submit" className="btn-boutique-primary w-full py-5 text-[11px] cursor-pointer">Confirm</button></div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((s: any) => (
          <div key={s.id} className="card-cozy p-8 flex justify-between items-center bg-white border-stone-50 hover:border-accent/30 transition-all shadow-lg">
            <div className="flex gap-6 items-center">
               <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center text-accent"><Sparkles size={28} /></div>
               <div className="space-y-2">
                  <h4 className="text-xl font-black text-primary uppercase leading-none">{s.name}</h4>
                  <p className="text-xs font-bold text-muted uppercase">{s.durationMinutes} MIN • ฿{Number(s.price).toLocaleString()}</p>
               </div>
            </div>
            <button onClick={() => handleDelete(s.id)} className="p-4 text-stone-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all cursor-pointer"><Trash2 size={20} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}