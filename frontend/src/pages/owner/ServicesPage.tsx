import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Scissors, Clock, Coins, PlusCircle, Trash2, Loader2, Sparkles, Timer } from 'lucide-react';

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ name: '', price: '', durationMinutes: '60' });

  const fetchServices = async () => {
    if (!user?.tenantPath) return;
    try {
      const res = await api.get(`/${user.tenantPath}/owner/services`);
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
      const payload = {
        name: newService.name,
        price: Number(newService.price),
        durationMinutes: Number(newService.durationMinutes)
      };
      await api.post(`/${user?.tenantPath}/owner/services`, payload);
      toast.success("เพิ่มบริการใหม่เรียบร้อย! ✨");
      setNewService({ name: '', price: '', durationMinutes: '60' });
      fetchServices();
    } catch (err) { toast.error("เพิ่มบริการไม่สำเร็จ"); }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("ต้องการลบบริการนี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/${user?.tenantPath}/owner/services/${id}`);
      toast.success("ลบสำเร็จ");
      fetchServices();
    } catch (err) { toast.error("ลบไม่สำเร็จ"); }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse">
       <Loader2 className="animate-spin text-primary mb-4" size={40} />
       <p className="font-black text-[10px] uppercase tracking-widest text-accent">Preparing Service Menu...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans No Italic pb-20">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-primary tracking-tighter uppercase flex items-center gap-4">
          <Scissors size={36} /> Service Menu
        </h1>
        <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em]">Define your expertise and booking durations</p>
      </header>
      
      <div className="card-cozy p-10! border-stone-100 shadow-xl shadow-black/5 bg-white">
        <div className="flex items-center gap-3 mb-8 border-b border-stone-50 pb-5">
           <PlusCircle size={18} className="text-accent" />
           <h3 className="text-xs font-black text-primary uppercase tracking-widest">Add New Collection</h3>
        </div>
        <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-5 space-y-2">
            <label className="text-[10px] font-black uppercase text-muted px-2">Service Name</label>
            <input required type="text" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="input-warm w-full py-4" placeholder="เช่น Deep Tissue Massage" />
          </div>
          <div className="md:col-span-3 space-y-2">
            <label className="text-[10px] font-black uppercase text-muted px-2">Price (THB)</label>
            <div className="relative">
               <Coins size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" />
               <input required type="number" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} className="input-warm w-full pl-14 py-4" placeholder="1500" />
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-muted px-2">Time (Min)</label>
            <div className="relative">
               <Timer size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" />
               <input required type="number" value={newService.durationMinutes} onChange={e => setNewService({...newService, durationMinutes: e.target.value})} className="input-warm w-full pl-14 py-4" placeholder="60" />
            </div>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="btn-boutique-primary w-full py-5 text-[11px] cursor-pointer">Confirm</button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((s: any) => (
          <div key={s.id} className="card-cozy p-8 flex justify-between items-center bg-white hover:-translate-y-1 transition-all shadow-lg">
            <div className="flex gap-6 items-center">
               <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center text-accent"><Sparkles size={28} /></div>
               <div className="space-y-2">
                  <h4 className="text-xl font-black text-primary uppercase leading-none">{s.name}</h4>
                  <div className="flex items-center gap-4">
                     <span className="badge-cafe bg-stone-50 text-stone-400 border-stone-100 flex items-center gap-2"><Clock size={12} /> {s.durationMinutes} MIN</span>
                     <span className="text-sm font-black text-primary">฿{Number(s.price).toLocaleString()}</span>
                  </div>
               </div>
            </div>
            <button onClick={() => handleDelete(s.id)} className="p-4 text-stone-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all cursor-pointer"><Trash2 size={20} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}