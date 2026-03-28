// src/pages/customer/ShopPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  MapPin, Phone, Clock, ArrowRight, 
  Scissors, Sparkles, Star, ChevronRight, 
  Info, Loader2 
} from 'lucide-react';

export default function ShopPage() {
  const { tenantPath } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        // ✅ เติม /api ให้ครบตามโครงสร้าง Backend
        const [configRes, initRes] = await Promise.all([
          api.get(`/api/${tenantPath}/config`),
          api.get(`/api/${tenantPath}/bookings/init`)
        ]);
        setShop(configRes.data.config);
        setServices(initRes.data.services || []);
      } catch (err) {
        console.error("Shop load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShopData();
  }, [tenantPath]);

  if (loading) return (
    <div className="h-[70vh] flex flex-col items-center justify-center animate-pulse space-y-4 font-sans">
      <Loader2 className="animate-spin text-accent" size={40} />
      <p className="font-black text-[10px] uppercase tracking-[0.4em] text-accent">Welcome to {tenantPath}...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-24 font-sans text-secondary-foreground">
      
      {/* --- 🖼️ Hero Section --- */}
      <section className="relative h-[55vh] rounded-card overflow-hidden shadow-2xl shadow-black/10 group bg-stone-100">
        <img 
          src={shop?.logo_url || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000"} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
          alt={shop?.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <div className="flex items-center gap-3 mb-4">
             <span className="badge-cafe bg-accent text-white border-none shadow-lg">Verified Boutique</span>
             <div className="flex gap-1 text-yellow-400">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor"/>)}
             </div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-4 uppercase leading-[0.9]">{shop?.name || tenantPath}</h1>
          <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
            <span className="flex items-center gap-2"><MapPin size={16} className="text-accent" /> {shop?.address || 'No Address Provided'}</span>
            <span className="flex items-center gap-2"><Phone size={16} className="text-accent" /> {shop?.phone || 'Contact us'}</span>
          </div>
        </div>
      </section>

      {/* --- 🛒 Service Menu --- */}
      <section className="space-y-10">
        <div className="flex justify-between items-end px-4">
           <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent flex items-center gap-2">
                <Sparkles size={14} /> Exceptional Services
              </span>
              <h2 className="text-3xl font-black text-primary tracking-tighter uppercase leading-none">รายการบริการที่แนะนำ</h2>
           </div>
           <button 
             onClick={() => navigate(`/${tenantPath}/book`)}
             className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary hover:text-accent transition-colors group"
           >
             Book Now <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((s: any) => (
            <div 
              key={s.id} 
              className="card-cozy flex justify-between items-center group cursor-pointer"
              onClick={() => navigate(`/${tenantPath}/book`)}
            >
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-secondary rounded-[24px] flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                    <Scissors size={24} />
                 </div>
                 <div className="space-y-1">
                    <h4 className="text-xl font-black text-primary tracking-tight leading-none mb-1 group-hover:text-accent transition-colors uppercase">{s.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest">
                       <Clock size={12} className="text-stone-300" /> {s.durationMinutes} Minutes
                    </div>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-2xl font-black text-primary tracking-tighter">฿{s.price}</p>
                 <div className="mt-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                    <ArrowRight size={20} className="text-accent ml-auto" />
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- 🚀 Footer CTA --- */}
      <section className="pb-10 pt-6">
        <div className="bg-primary rounded-card p-14 text-white flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl shadow-primary/20 relative overflow-hidden">
           <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
           <div className="space-y-4 text-center md:text-left relative z-10">
              <h2 className="text-4xl font-black tracking-tighter uppercase leading-[0.95]">ยกระดับความสุขของคุณวันนี้</h2>
              <p className="text-white/60 text-sm font-bold tracking-wide max-w-sm">เลือกบริการที่ต้องการและยืนยันนัดหมายได้ทันที ตลอด 24 ชั่วโมง</p>
           </div>
           <button 
             onClick={() => navigate(`/${tenantPath}/book`)}
             className="bg-white text-primary px-12 py-6 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] hover:bg-accent hover:text-white transition-all shadow-xl active:scale-95 relative z-10"
           >
             เริ่มนัดหมายตอนนี้
           </button>
        </div>
      </section>
    </div>
  );
}