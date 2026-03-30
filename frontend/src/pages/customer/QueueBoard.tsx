import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import { Users, PlayCircle, Sparkles, Coffee, ArrowRightCircle } from 'lucide-react';

export default function QueueBoard() {
  const { tenantPath } = useParams();
  const [loading, setLoading] = useState(true);
  const [queues, setQueues] = useState<any>({ serving: [], waiting: [] });

  const fetchQueue = async () => {
    try {
      // ✅ ลบ /api ออก
      const res = await api.get(`/${tenantPath}/bookings/queue`);
      setQueues({ serving: res.data.serving || [], waiting: res.data.waiting || [] });
    } catch (err) {
      console.error("Queue Load Error:", err);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); 
    return () => clearInterval(interval);
  }, [tenantPath]);

  if (loading) return <div className="h-screen bg-primary flex items-center justify-center text-white animate-pulse font-black uppercase text-xs tracking-widest">Syncing Live Queue...</div>;

  return (
    <div className="min-h-screen bg-bg font-sans text-secondary-foreground pb-20 No Italic">
      <header className="bg-primary text-white py-12 px-8 shadow-2xl relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2"><Sparkles size={18} className="text-accent" /><span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Live Status</span></div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">{tenantPath} Queue Board</h1>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/10 text-center"><p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 text-accent">Current Time</p><p className="text-2xl font-black">{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p></div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 -mt-10">
        <div className="lg:col-span-7 space-y-6">
          <div className="card-cozy p-10! bg-white border-emerald-100 border-2 shadow-2xl h-full">
            <div className="flex items-center gap-3 mb-10"><div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center animate-pulse"><PlayCircle size={20}/></div><h2 className="text-2xl font-black text-primary tracking-tighter uppercase">Now Serving</h2></div>
            <div className="space-y-6">
              {queues.serving.length > 0 ? queues.serving.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between p-8 bg-emerald-50/50 rounded-card border border-emerald-100"><div className="space-y-1"><p className="text-5xl font-black text-emerald-700 tracking-tighter mb-2">#{q.id}</p><p className="text-sm font-black text-primary uppercase">{q.customerName || q.guestName}</p></div><div className="text-right"><p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Provider</p><p className="text-xl font-black text-primary uppercase">{q.staffName}</p></div></div>
              )) : <div className="py-20 text-center text-stone-300"><Coffee size={48} className="mx-auto opacity-20" /><p className="font-black text-xs uppercase">No active sessions</p></div>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="card-cozy p-10! border-stone-100 h-full bg-white">
            <div className="flex items-center gap-3 mb-10"><div className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center"><ArrowRightCircle size={20}/></div><h2 className="text-2xl font-black text-primary tracking-tighter uppercase">Up Next</h2></div>
            <div className="space-y-4">
              {queues.waiting.length > 0 ? queues.waiting.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between p-6 bg-stone-50 rounded-[28px] border border-stone-100 transition-all duration-500 hover:bg-white hover:shadow-xl"><div className="flex items-center gap-6"><p className="text-2xl font-black text-primary">#{q.id}</p><div className="w-px h-8 bg-stone-200" /><div><p className="text-sm font-black text-primary uppercase">{q.customerName || q.guestName}</p><p className="text-[9px] font-black text-muted uppercase mt-1">{q.serviceName}</p></div></div><div className="text-right"><p className="text-xs font-black text-primary">{new Date(q.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p></div></div>
              )) : <div className="py-20 text-center text-stone-200 uppercase font-black text-[10px]">Waiting list is empty</div>}
            </div>
            <div className="mt-10 pt-8 border-t flex items-center justify-between"><div className="flex items-center gap-3"><Users className="text-accent" size={20} /><span className="text-xs font-black text-primary uppercase">Total Waiting</span></div><span className="text-3xl font-black text-primary tracking-tighter">{queues.waiting.length}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}