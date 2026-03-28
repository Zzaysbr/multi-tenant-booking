// src/pages/customer/HomePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Store, ArrowRight, Loader2, Search, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ ตัด /api ออก เพราะใน axios instance น่าจะมี baseURL อยู่แล้ว
    api.get('/auth/shops')
      .then(res => setShops(res.data.shops))
      .catch(() => console.error("Error loading shops"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-bg">
      <Loader2 className="animate-spin text-accent" size={40} />
      <p className="mt-4 font-black text-[10px] uppercase tracking-widest text-primary opacity-40">Loading Brands...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg font-sans text-secondary-foreground pb-24 No Italic">
      <section className="pt-28 pb-20 px-6 text-center space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-3 text-accent">
           <Sparkles size={18} />
           <span className="text-[10px] font-black uppercase tracking-[0.5em]">The Selection</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-primary tracking-tighter uppercase leading-[0.9]">
          เลือกแบรนด์ที่คุณ<br className="hidden md:block" />ไว้วางใจ
        </h1>
        <p className="text-secondary-foreground text-base font-bold max-w-lg mx-auto leading-relaxed opacity-70">
          จองบริการจากพาร์ทเนอร์ชั้นนำที่ผ่านการคัดสรรมาเพื่อคุณโดยเฉพาะ
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {shops.map((shop: any) => (
          <div 
            key={shop.id} 
            onClick={() => navigate(`/${shop.path_name}`)}
            className="group card-cozy p-0 overflow-hidden cursor-pointer border-none shadow-xl shadow-black/[0.02]"
          >
            <div className="relative h-72 bg-stone-100 overflow-hidden">
               <img 
                 src={shop.logo_url || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000"} 
                 className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                 alt={shop.name}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-40" />
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-primary tracking-tight uppercase leading-none group-hover:text-accent transition-colors">
                  {shop.name}
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-black text-accent uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Ready to Book
                </div>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-stone-50">
                 <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Discover Services</span>
                 <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <ArrowRight size={20} />
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}