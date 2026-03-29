// src/pages/customer/HomePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import CustomerNavbar from '../../components/layouts/CustomerNavbar';
import { Search, Sparkles, MapPin, ArrowRight, Store } from 'lucide-react';

export default function HomePage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/shops').then(res => setShops(res.data.shops)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = shops.filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-bg font-sans text-secondary-foreground pb-32 No Italic">
      <CustomerNavbar />
      <section className="pt-44 pb-24 px-6 text-center space-y-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-accent/5 rounded-full border border-accent/10 text-accent animate-in fade-in slide-in-from-top-4 duration-700">
           <Sparkles size={16} />
           <span className="text-[10px] font-black uppercase tracking-[0.5em]">Curated Partner Network</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-primary tracking-tighter uppercase leading-[0.8] animate-in fade-in slide-in-from-bottom-6 duration-1000">
          Discover<br /><span className="text-accent">Excellence</span>
        </h1>
        <p className="text-muted text-lg font-bold max-w-xl mx-auto leading-relaxed opacity-80 uppercase tracking-tight">เลือกจองบริการจากพาร์ทเนอร์ชั้นนำทั่วประเทศ ที่เราคัดสรรมาเพื่อคุณโดยเฉพาะ</p>
        <div className="max-w-xl mx-auto pt-6"><div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
          <input type="text" placeholder="Search brands or services..." className="input-warm pl-16 py-7 shadow-2xl shadow-primary/5" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div></div>
      </section>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {loading ? [1,2,3].map(i => <div key={i} className="h-[500px] rounded-[48px] skeleton"/>) : filtered.map((shop: any) => (
          <div key={shop.id} onClick={() => navigate(`/${shop.path_name}`)} className="group relative aspect-[4/5] rounded-[48px] overflow-hidden cursor-pointer shadow-premium border-none">
            <img src={shop.logo_url || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000"} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt={shop.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/20 to-transparent" />
            <div className="absolute bottom-10 left-10 right-10 space-y-4">
              <div className="badge-cafe bg-accent text-white border-none shadow-lg">Verified Partner</div>
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{shop.name}</h3>
              <div className="flex items-center justify-between pt-4 border-t border-white/10 text-white/60">
                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><MapPin size={14}/> Explore Services</span>
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all"><ArrowRight size={18}/></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}