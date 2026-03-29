import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, Calendar, Clock, User, Scissors, Search, Image as ImageIcon } from 'lucide-react';
import { getFullImageUrl } from '../../utils/image'; // ✅ Import Helper

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/api/owner/bookings');
      setBookings(res.data.bookings || []);
    } catch (err) {
      toast.error("โหลดข้อมูลการจองไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleUpdateStatus = async (id: number, status: 'confirmed' | 'canceled') => {
    setProcessingId(id);
    try {
      await api.patch(`/api/owner/bookings/${id}/status`, { status });
      toast.success(status === 'confirmed' ? "ยืนยันคิวเรียบร้อย!" : "ยกเลิกคิวแล้ว");
      fetchBookings();
      setSelectedSlip(null);
    } catch (err) {
      toast.error("ไม่สามารถอัปเดตสถานะได้");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center animate-pulse font-black text-accent uppercase tracking-widest">Loading Manager View...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans No Italic pb-20">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Management Hub</span>
          <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">รายการนัดหมายทั้งหมด</h1>
        </div>
        <div className="relative w-full md:w-72">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
           <input type="text" placeholder="ค้นหาชื่อลูกค้า..." className="input-warm pl-12 py-3 text-sm" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {bookings.map((b) => (
          <div key={b.id} className="card-cozy flex flex-col lg:flex-row justify-between gap-8 border-stone-100 hover:border-accent/20">
            <div className="flex-1 flex gap-6">
               <div className="w-16 h-16 bg-secondary rounded-[24px] flex items-center justify-center text-primary shrink-0"><User size={24} /></div>
               <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-primary tracking-tight uppercase leading-none mb-1">{b.guestName || "General Customer"}</h3>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">ID: #{b.id} • {b.serviceName}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs font-black text-primary/60 uppercase tracking-tight">
                    <span className="flex items-center gap-2"><Calendar size={14}/> {new Date(b.startTime).toLocaleDateString('th-TH')}</span>
                    <span className="flex items-center gap-2"><Clock size={14}/> {new Date(b.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                    <span className="flex items-center gap-2 text-accent"><Scissors size={14}/> {b.staffName}</span>
                  </div>
               </div>
            </div>

            <div className="flex flex-row lg:flex-col justify-between items-end gap-4 min-w-[200px] border-t lg:border-t-0 lg:border-l border-stone-50 pt-6 lg:pt-0 lg:pl-8">
               <StatusBadge status={b.status} />
               <div className="flex gap-3">
                 {b.slipUrl ? (
                   <button onClick={() => setSelectedSlip(b.slipUrl)} className="p-3 bg-accent text-white rounded-2xl shadow-lg shadow-accent/20 hover:scale-105 transition-all"><ImageIcon size={20} /></button>
                 ) : (
                   <div className="p-3 bg-stone-50 text-stone-200 rounded-2xl border border-stone-100 cursor-not-allowed"><ImageIcon size={20} /></div>
                 )}
                 {b.status === 'pending' && <button disabled={processingId === b.id} onClick={() => handleUpdateStatus(b.id, 'confirmed')} className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all disabled:opacity-50">{processingId === b.id ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle2 size={20} />}</button>}
                 {(b.status === 'pending' || b.status === 'confirmed') && <button disabled={processingId === b.id} onClick={() => handleUpdateStatus(b.id, 'canceled')} className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20 hover:scale-105 transition-all disabled:opacity-50"><XCircle size={20} /></button>}
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Modal แสดงรูปสลิป ใช้ getFullImageUrl */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-primary/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
           <div className="relative max-w-lg w-full bg-white rounded-card overflow-hidden shadow-2xl">
              <header className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h3 className="font-black text-primary uppercase tracking-widest text-sm">ตรวจสอบหลักฐานการโอน</h3>
                <button onClick={() => setSelectedSlip(null)} className="text-stone-400 hover:text-primary transition-colors cursor-pointer"><XCircle /></button>
              </header>
              <div className="p-8">
                <img src={getFullImageUrl(selectedSlip)!} alt="Payment Slip" className="w-full rounded-2xl shadow-inner border border-stone-100" />
              </div>
              <footer className="p-6 bg-stone-50 flex gap-4">
                 <button onClick={() => { const booking = bookings.find(b => b.slipUrl === selectedSlip); if(booking) handleUpdateStatus(booking.id, 'confirmed'); }} className="btn-primary flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 cursor-pointer">ยืนยันว่ายอดเงินถูกต้อง</button>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: any = {
    pending: { label: 'รอตรวจสอบสลิป', color: 'bg-orange-50 text-orange-600 border-orange-100' },
    confirmed: { label: 'ยืนยันแล้ว', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    completed: { label: 'เสร็จสิ้น', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    canceled: { label: 'ยกเลิกแล้ว', color: 'bg-rose-50 text-rose-500 border-rose-100' }
  };
  const { label, color } = config[status] || config.pending;
  return <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${color}`}>{label}</div>;
}