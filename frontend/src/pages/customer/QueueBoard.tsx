import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import { Users, PlayCircle, Clock, Loader2, Calendar } from 'lucide-react';

export default function QueueBoard() {
  const { tenantPath } = useParams();
  const [queues, setQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const res = await api.get(`/api/${tenantPath}/queue-board`);
      setQueues(res.data.queue || []);
    } catch (err) {
      console.error("Queue fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [tenantPath]);

  const current = queues.filter(q => q.status === 'confirmed').slice(0, 1);
  const upNext = queues.filter(q => q.status === 'confirmed').slice(1, 5);
  const waitingForPayment = queues.filter(q => q.status === 'pending');

  if (loading) return (
    <div className="h-screen bg-[#FDFCFB] flex flex-col items-center justify-center text-accent animate-pulse">
      <Loader2 className="animate-spin mb-4" size={48} />
      <p className="font-bold tracking-widest uppercase text-xs">Loading Live Queue...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] p-8 md:p-16 font-sans text-secondary-foreground overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* --- 🟢 ฝั่งซ้าย: Now Serving (คิวที่กำลังให้บริการ) --- */}
        <div className="space-y-12">
          <header className="space-y-2">
            <h1 className="text-6xl font-black tracking-tighter text-primary leading-none">
              COZY<br/>SERVING
            </h1>
            <p className="text-accent font-medium text-lg italic">ขณะนี้ร้านกำลังให้บริการลูกค้าลำดับนี้ครับ</p>
          </header>

          {current.length > 0 ? (
            current.map(q => (
              <div key={q.id} className="bg-white rounded-[60px] p-16 shadow-2xl shadow-primary/10 border border-primary/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
                
                <p className="text-[12px] font-black uppercase tracking-[0.4em] text-primary/60 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  In Progress
                </p>
                
                <h2 className="text-8xl font-black text-secondary-foreground break-words">
                  {q.customerName.split(' ')[0]} {/* แสดงเฉพาะชื่อเล่น/ชื่อแรก */}
                </h2>
                
                <div className="mt-12 flex items-center gap-4 text-primary bg-primary/5 w-fit px-8 py-4 rounded-3xl border border-primary/10">
                  <PlayCircle size={32} />
                  <span className="text-2xl font-black">{q.serviceName}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-stone-100 rounded-[60px] p-32 text-center flex flex-col items-center justify-center gap-4">
              <Calendar className="text-stone-300" size={64} />
              <p className="italic text-stone-400 font-bold text-xl">ไม่มีคิวที่กำลังรับบริการในขณะนี้</p>
            </div>
          )}
        </div>

        {/* --- 🟡 ฝั่งขวา: Next Up (คิวถัดไปที่ยืนยันแล้ว) --- */}
        <div className="space-y-10">
          <div className="flex items-center justify-between border-b-4 border-stone-200 pb-6">
            <h3 className="text-2xl font-black text-accent flex items-center gap-4">
              <Users size={32} /> NEXT IN LINE
            </h3>
            <span className="bg-primary text-white px-4 py-1 rounded-full text-xs font-black">{upNext.length} QUEUES</span>
          </div>
          
          <div className="space-y-6">
            {upNext.map((q, idx) => (
              <div key={q.id} className="bg-white/40 backdrop-blur-sm rounded-[32px] p-8 border border-white flex justify-between items-center transition-all hover:bg-white hover:shadow-xl hover:shadow-primary/5">
                <div className="flex items-center gap-8">
                  <span className="text-4xl font-black text-primary/20">0{idx + 1}</span>
                  <div>
                    <p className="font-black text-2xl text-secondary-foreground">{q.customerName.split(' ')[0]}***</p>
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mt-1">{q.serviceName}</p>
                  </div>
                </div>
                <div className="bg-stone-100 px-6 py-3 rounded-2xl">
                  <p className="text-lg font-black flex items-center gap-2 text-secondary-foreground">
                    <Clock size={20} className="text-primary" />
                    {new Date(q.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {upNext.length === 0 && (
              <div className="text-center py-20">
                <p className="italic text-stone-400 font-medium">ไม่มีรายการนัดหมายถัดไป</p>
              </div>
            )}
          </div>

          {/* 🔘 รายการจองที่รอการชำระเงิน (Pending) */}
          {waitingForPayment.length > 0 && (
            <div className="pt-10 border-t-2 border-dashed border-stone-200">
              <h4 className="text-[10px] font-black text-accent tracking-[0.3em] uppercase mb-6 opacity-60">
                Waiting for Confirmation ({waitingForPayment.length})
              </h4>
              <div className="flex flex-wrap gap-3">
                {waitingForPayment.map(p => (
                  <span key={p.id} className="px-5 py-2 bg-stone-100 rounded-full text-[11px] font-bold text-stone-500 border border-stone-200">
                    {p.customerName.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}