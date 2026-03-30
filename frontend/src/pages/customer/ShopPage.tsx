import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import CustomerNavbar from '../../components/layouts/CustomerNavbar';
import { MapPin, Phone, Clock, ArrowRight, Sparkles, Package} from 'lucide-react';
import { getFullImageUrl } from '../../utils/image';

export default function ShopPage() {
  const { tenantPath } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        // ✅ ลบ /api ออก เพราะใน axios มี baseURL /api ให้อยู่แล้ว
        const [c, i] = await Promise.all([
          api.get(`/${tenantPath}/config`), 
          api.get(`/${tenantPath}/bookings/init`)
        ]);
        setShop(c.data.config); 
        setServices(i.data.services || []);
      } catch (err) {
        console.error("Shop Load Error:", err);
      } finally { setLoading(false); }
    };
    fetchShopData();
  }, [tenantPath]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-accent animate-pulse uppercase">Entering Boutique...</div>;

  return (
    <div className="min-h-screen bg-bg font-sans text-secondary-foreground pb-32 No Italic">
      <CustomerNavbar />
      <section className="pt-28 max-w-6xl mx-auto px-6 space-y-16">
        <div className="relative h-[60vh] rounded-card overflow-hidden shadow-premium group border border-stone-50 bg-white">
          <img src={getFullImageUrl(shop?.logo_url) || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]" alt="shop" />
          <div className="absolute inset-0 bg-linear-to-t from-primary/95 via-primary/20 to-transparent" />
          <div className="absolute bottom-12 left-12 right-12 text-white space-y-6">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8]">{shop?.name || tenantPath}</h1>
            <div className="flex flex-wrap gap-8 text-[11px] font-black uppercase tracking-[0.2em] opacity-80">
              <span className="flex items-center gap-2"><MapPin size={18} className="text-accent" /> {shop?.address || 'Location Verified'}</span>
              <span className="flex items-center gap-2"><Phone size={18} className="text-accent" /> {shop?.phone || 'Contact Info'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="flex justify-between items-end gap-6 px-4">
            <div className="space-y-3">
               <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent flex items-center gap-2"><Sparkles size={16} /> Exceptional Offerings</span>
               <h2 className="text-4xl font-black text-primary tracking-tighter uppercase">Our Services</h2>
            </div>
            <button onClick={() => navigate(`/${tenantPath}/book`)} className="btn-boutique-primary shadow-premium cursor-pointer">Book Now <ArrowRight size={16}/></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((s: any) => (
              <div key={s.id} onClick={() => navigate(`/${tenantPath}/book`)} className="card-cozy group cursor-pointer flex flex-col justify-between p-10! bg-white hover:border-accent/20 transition-all border-stone-50">
                <div className="flex justify-between items-start mb-10">
                  <div className="w-16 h-16 bg-secondary rounded-[28px] flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500"><Package size={28} /></div>
                  <div className="text-right"><p className="text-3xl font-black text-primary tracking-tighter">฿{Number(s.price).toLocaleString()}</p></div>
                </div>
                <div className="space-y-4 pt-6 border-t border-stone-50">
                  <h4 className="text-2xl font-black text-primary uppercase group-hover:text-accent transition-colors">{s.name}</h4>
                  <div className="flex items-center gap-4 text-[10px] font-black text-muted uppercase tracking-widest"><Clock size={14} className="text-accent/50" /> {s.durationMinutes} Minutes Session</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}