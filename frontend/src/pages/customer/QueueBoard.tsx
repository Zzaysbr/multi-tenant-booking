// src/pages/customer/QueueBoard.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Users, PlayCircle, CheckCircle2, 
  Loader2, Sparkles, Coffee, ArrowRightCircle
} from 'lucide-react';

export default function QueueBoard() {
  const { tenantPath } = useParams();
  const [loading, setLoading] = useState(true);
  const [queues, setQueues] = useState<any>({ serving: [], waiting: [] });

  // ✅ ดึงข้อมูลคิว (แนะนำให้ตั้ง Interval เพื่อให้มัน Auto-refresh เหมือนจอทีวี)
  const fetchQueue = async () => {
    try {
      // ✅ เติม /api กลับเข้าไปให้ถูกตาม baseURL
      const res = await api.get(`/api/${tenantPath}/bookings/queue`);
      setQueues({
        serving: res.data.serving || [], // คิวที่สถานะ 'confirmed' (กำลังให้บริการ)
        waiting: res.data.waiting || []  // คิวที่สถานะ 'pending' (รอรับบริการ)
      });
    } catch (err) {
      console.error("Queue Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // ✅ ตั้งเวลา Auto-refresh ทุกๆ 30 วินาที
    const interval = setInterval(fetchQueue, 30000); 
    return () => clearInterval(interval);
  }, [tenantPath]);

  if (loading) return (
    <div className="h-screen bg-primary flex flex-col items-center justify-center text-white font-sans animate-pulse">
      <Loader2 className="animate-spin mb-4" size={48} />
      <p className="font-black text-xs uppercase tracking-[0.5em]">Syncing Live Queue...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg font-sans text-secondary-foreground pb-20 No Italic">
      
      {/* --- ☕️ Header Section --- */}
      <header className="bg-primary text-white py-12 px-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Coffee size={120} /></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Sparkles size={18} className="text-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Live Status</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">{tenantPath} Queue Board</h1>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/10 text-center">
             <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 text-accent">Current Time</p>
             <p className="text-2xl font-black">{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 -mt-10">
        
        {/* --- 🟢 NOW SERVING (คิวที่กำลังให้บริการ) --- */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card-cozy p-10! bg-white border-emerald-100 border-2 shadow-2xl shadow-emerald-900/5 h-full">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center animate-pulse"><PlayCircle size={20}/></div>
              <h2 className="text-2xl font-black text-primary tracking-tighter uppercase leading-none">Now Serving</h2>
            </div>

            <div className="space-y-6">
              {queues.serving.length > 0 ? queues.serving.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between p-8 bg-emerald-50/50 rounded-card border border-emerald-100 group">
                   <div className="space-y-1">
                      {/* ✅ ID คิวตัวใหญ่ชัดเจน */}
                      <p className="text-5xl font-black text-emerald-700 tracking-tighter mb-2 leading-none">#{q.id}</p>
                      <p className="text-sm font-black text-primary uppercase leading-none">{q.customerName}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Provider</p>
                      <p className="text-xl font-black text-primary uppercase leading-none">{q.staffName}</p>
                   </div>
                </div>
              )) : (
                <div className="py-20 text-center text-stone-300 space-y-4">
                  <Coffee size={48} className="mx-auto opacity-20" />
                  <p className="font-black text-xs uppercase tracking-widest leading-none">No active sessions at the moment</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- 🟡 UP NEXT (คิวที่กำลังรอ) --- */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card-cozy p-10! border-stone-100 h-full">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center"><ArrowRightCircle size={20}/></div>
              <h2 className="text-2xl font-black text-primary tracking-tighter uppercase leading-none">Up Next</h2>
            </div>

            <div className="space-y-4">
              {queues.waiting.length > 0 ? queues.waiting.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between p-6 bg-stone-50 rounded-[28px] border border-stone-100 group hover:bg-white hover:shadow-xl transition-all duration-500">
                   <div className="flex items-center gap-6">
                      <p className="text-2xl font-black text-primary leading-none">#{q.id}</p>
                      <div className="w-px h-8 bg-stone-200" />
                      <div>
                        <p className="text-sm font-black text-primary uppercase leading-none">{q.customerName}</p>
                        <p className="text-[9px] font-black text-muted uppercase tracking-widest mt-1">{q.serviceName}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-primary leading-none">{new Date(q.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
                   </div>
                </div>
              )) : (
                <div className="py-20 text-center text-stone-200 uppercase font-black text-[10px] tracking-widest">
                  Waiting list is empty
                </div>
              )}
            </div>

            {/* Total Waiting Summary */}
            <div className="mt-10 pt-8 border-t border-stone-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Users className="text-accent" size={20} />
                  <span className="text-xs font-black text-primary uppercase tracking-widest">Total Waiting</span>
               </div>
               <span className="text-3xl font-black text-primary tracking-tighter leading-none">{queues.waiting.length}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Tip */}
      <footer className="max-w-7xl mx-auto px-6 mt-12 text-center pb-10">
         <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-stone-100 shadow-sm text-muted">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-widest">Please be ready 5 minutes before your slot</p>
         </div>
      </footer>
    </div>
  );
}