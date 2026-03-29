// src/pages/customer/BookingPage.tsx
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import CustomerNavbar from '../../components/layouts/CustomerNavbar';
import { toast } from 'sonner';
import { Calendar, Clock, User, ChevronRight, Loader2, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function BookingPage() {
  const { tenantPath } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [businessHours, setBusinessHours] = useState<any[]>([]);
  const [busySlots, setBusySlots] = useState<any[]>([]);
  const [shopName, setShopName] = useState("");

  const [selService, setSelService] = useState<any>(null);
  const [selStaff, setSelStaff] = useState<any>(null);
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0]);
  const [selTime, setSelTime] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const [i, c] = await Promise.all([api.get(`/api/${tenantPath}/bookings/init`), api.get(`/api/${tenantPath}/config`)]);
        setServices(i.data.services || []); setStaffs(i.data.staffs || []); setBusinessHours(i.data.businessHours || []); setShopName(c.data.config.name);
      } finally { setLoading(false); }
    };
    init();
  }, [tenantPath]);

  useEffect(() => {
    if (selStaff && selDate) {
      api.get(`/api/${tenantPath}/bookings/busy-slots`, { params: { staffId: selStaff.id, date: selDate } }).then(res => setBusySlots(res.data.busy || []));
    }
  }, [selStaff, selDate, tenantPath]);

  const slots = useMemo(() => {
    const day = new Date(selDate).getDay();
    const h = businessHours.find(bh => bh.dayOfWeek === day);
    if (!h || h.isClosed) return [];
    const res = [];
    let cur = new Date(`${selDate}T${h.openTime}`);
    const end = new Date(`${selDate}T${h.closeTime}`);
    while (cur < end) {
      const t = cur.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const busy = busySlots.some(b => {
        const st = new Date(b.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const en = new Date(b.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        return t >= st && t < en;
      });
      if (!busy) res.push(t);
      cur.setMinutes(cur.getMinutes() + 30);
    }
    return res;
  }, [selDate, businessHours, busySlots]);

  const confirm = async () => {
    setSubmitting(true);
    try {
      const st = `${selDate}T${selTime}:00`;
      const en = new Date(new Date(st).getTime() + (selService.durationMinutes || 60) * 60000).toISOString();
      const res = await api.post(`/api/${tenantPath}/bookings`, { serviceId: selService.id, staffId: selStaff.id, startTime: st, endTime: en });
      toast.success("Success!"); navigate(`/${tenantPath}/pay/${res.data.booking.id}`);
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse">PREPARING BOOKING...</div>;

  return (
    <div className="min-h-screen bg-bg font-sans pb-44 No Italic">
      <CustomerNavbar />
      <header className="max-w-5xl mx-auto pt-32 px-6 flex items-center justify-between">
         <button onClick={() => navigate(-1)} className="p-4 bg-white rounded-2xl border border-stone-100 hover:bg-stone-50 transition-all"><ArrowLeft size={20}/></button>
         <div className="text-center"><p className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mb-1">Reservation Portal</p><h1 className="text-3xl font-black text-primary uppercase tracking-tighter">{shopName}</h1></div>
         <div className="w-14" />
      </header>

      <div className="max-w-5xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-12">
          <section className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent flex items-center gap-2">01. Service Catalog</h2>
            <div className="grid gap-3">{services.map(s => (
              <button key={s.id} onClick={() => setSelService(s)} className={`p-8 rounded-card border-2 text-left transition-all flex justify-between items-center ${selService?.id === s.id ? 'bg-primary text-white border-primary shadow-premium scale-[1.02]' : 'bg-white border-stone-50'}`}>
                <div className="space-y-1"><p className="font-black text-lg uppercase leading-none">{s.name}</p><p className="text-[10px] opacity-60 uppercase">{s.durationMinutes} Mins Session</p></div>
                <p className="font-black text-2xl tracking-tighter">฿{s.price}</p>
              </button>
            ))}</div>
          </section>

          <section className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent flex items-center gap-2">02. Select Professional</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">{staffs.map(st => (
              <button key={st.id} onClick={() => { setSelStaff(st); setSelTime(''); }} className={`shrink-0 flex flex-col items-center gap-4 px-10 py-10 rounded-card border-2 transition-all ${selStaff?.id === st.id ? 'bg-secondary border-accent shadow-sm' : 'bg-white border-stone-50'}`}>
                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-xl ${selStaff?.id === st.id ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-stone-50 text-stone-300'}`}>{st.name.charAt(0)}</div>
                <span className="text-[11px] font-black uppercase tracking-widest">{st.name}</span>
              </button>
            ))}</div>
          </section>
        </div>

        <div className="lg:col-span-5">
          <section className="space-y-6 sticky top-32">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent flex items-center gap-2">03. Time Schedule</h2>
            <div className="bg-white p-10 rounded-card border border-stone-100 shadow-sm space-y-10">
              <div className="space-y-3"><label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Select Date</label><input type="date" min={new Date().toISOString().split('T')[0]} className="input-warm py-5" value={selDate} onChange={e => setSelDate(e.target.value)} /></div>
              <div className="space-y-4"><label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Available Times</label>
                {selStaff ? <div className="grid grid-cols-3 gap-2">{slots.map(t => (
                  <button key={t} onClick={() => setSelTime(t)} className={`py-3.5 rounded-xl text-[11px] font-black transition-all border-2 ${selTime === t ? 'bg-accent border-accent text-white shadow-lg' : 'bg-stone-50 border-transparent text-primary'}`}>{t}</button>
                ))}</div> : <div className="py-12 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200"><p className="text-[10px] font-black text-stone-300 uppercase">Select provider first</p></div>}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 z-50">
        <div className="max-w-5xl mx-auto bg-primary rounded-[36px] p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 backdrop-blur-xl">
           <div className="flex items-center gap-6"><div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-accent"><Sparkles size={24}/></div><div><p className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-1">Total Amount</p><p className="text-3xl font-black text-white tracking-tighter">฿{selService?.price || '0'}</p></div></div>
           <button disabled={!selTime || submitting} onClick={confirm} className="w-full md:w-auto px-16 py-6 bg-accent text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-white hover:text-primary transition-all disabled:opacity-20">{submitting ? <Loader2 className="animate-spin" /> : "Confirm Reservation"}</button>
        </div>
      </div>
    </div>
  );
}