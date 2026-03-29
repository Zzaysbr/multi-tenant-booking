// src/pages/customer/MyBookingsPage.tsx
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import CustomerNavbar from '../../components/layouts/CustomerNavbar';
import { toast } from 'sonner';
import { Calendar, Clock, Loader2, BookOpen, ShoppingBag, CheckCircle2, Timer, XCircle, CreditCard, Store, ArrowLeft, RefreshCw } from 'lucide-react';

export default function MyBookingsPage() {
  const { tenantPath } = useParams();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 🔄 State สำหรับระบบเลื่อนคิว ---
  const [rescheduleData, setRescheduleData] = useState<any>(null); // เก็บข้อมูลคิวที่กำลังจะเลื่อน
  const [businessHours, setBusinessHours] = useState<any[]>([]);
  const [busySlots, setBusySlots] = useState<any[]>([]);
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0]);
  const [selTime, setSelTime] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const fetchBookings = async () => {
    try {
      const endpoint = tenantPath ? `/api/${tenantPath}/bookings/my-bookings` : `/api/user/my-bookings`;
      const res = await api.get(endpoint);
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error("Failed to fetch bookings");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchBookings(); }, [tenantPath]);

  const handleCancel = async (id: number, bTenantPath?: string) => {
    if (!window.confirm("ยืนยันการยกเลิกการนัดหมายนี้?")) return;
    try {
      const targetTenant = tenantPath || bTenantPath;
      await api.patch(`/api/${targetTenant}/bookings/${id}/cancel`);
      toast.success("ยกเลิกการจองเรียบร้อย"); 
      fetchBookings();
    } catch (e: any) { 
      toast.error("ยกเลิกไม่สำเร็จ"); 
    }
  };

  // --- 🔄 Logic: เปิด Modal เลื่อนคิว ---
  const openReschedule = async (booking: any) => {
    setRescheduleData(booking);
    setSelDate(new Date().toISOString().split('T')[0]);
    setSelTime('');
    
    // ดึงเวลาเปิดปิดร้านเพื่อมาคำนวณ Slot
    try {
      const targetTenant = tenantPath || booking.tenantPath;
      const res = await api.get(`/api/${targetTenant}/bookings/init`);
      setBusinessHours(res.data.businessHours || []);
    } catch (err) {
      toast.error("โหลดข้อมูลตารางเวลาไม่สำเร็จ");
    }
  };

  // --- 🔄 Logic: ดึงคิวว่างเมื่อเปลี่ยนวัน ---
  useEffect(() => {
    if (rescheduleData && selDate) {
      const targetTenant = tenantPath || rescheduleData.tenantPath;
      api.get(`/api/${targetTenant}/bookings/busy-slots`, { 
        params: { staffId: rescheduleData.staffId, date: selDate } 
      }).then(res => setBusySlots(res.data.busy || []));
    }
  }, [selDate, rescheduleData, tenantPath]);

  // --- 🔄 Logic: คำนวณ Slot ว่าง (เหมือนหน้าจอง) ---
  const slots = useMemo(() => {
    if (!rescheduleData) return [];
    const day = new Date(selDate).getDay();
    const h = businessHours.find(bh => bh.dayOfWeek === day);
    if (!h || h.isClosed) return [];
    
    const res = [];
    let cur = new Date(`${selDate}T${h.openTime}`);
    const end = new Date(`${selDate}T${h.closeTime}`);
    
    while (cur < end) {
      const t = cur.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const isBusy = busySlots.some(b => {
        const st = new Date(b.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const en = new Date(b.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        return t >= st && t < en;
      });
      if (!isBusy) res.push(t);
      cur.setMinutes(cur.getMinutes() + 30);
    }
    return res;
  }, [selDate, businessHours, busySlots, rescheduleData]);

  // --- 🔄 Logic: ยืนยันการเลื่อนคิว ---
  const confirmReschedule = async () => {
    setIsRescheduling(true);
    try {
      const targetTenant = tenantPath || rescheduleData.tenantPath;
      const st = `${selDate}T${selTime}:00`;
      // คำนวณเวลาสิ้นสุดจาก durationMinutes ของบริการนั้นๆ
      const en = new Date(new Date(st).getTime() + (rescheduleData.durationMinutes || 60) * 60000).toISOString();
      
      await api.patch(`/api/${targetTenant}/bookings/${rescheduleData.id}/reschedule`, { 
        newStartTime: st, 
        newEndTime: en 
      });
      
      toast.success("เลื่อนคิวสำเร็จ!");
      setRescheduleData(null);
      fetchBookings(); // โหลดข้อมูลใหม่
    } catch (err: any) {
      toast.error(err.response?.data?.error || "ไม่สามารถเลื่อนคิวได้");
    } finally {
      setIsRescheduling(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse uppercase tracking-widest text-[10px] text-accent">Loading Records...</div>;

  return (
    <div className="min-h-screen bg-bg font-sans pb-32 No Italic relative">
      <CustomerNavbar />
      <div className="max-w-5xl mx-auto px-6 pt-32 space-y-12">
        <header className="space-y-6">
          {tenantPath && (
            <button onClick={() => navigate(`/${tenantPath}`)} className="text-[10px] font-black uppercase tracking-[0.3em] text-muted hover:text-primary transition-colors flex items-center gap-2 cursor-pointer">
              <ArrowLeft size={14} /> Back to Boutique
            </button>
          )}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-accent/10 rounded-xl text-accent"><BookOpen size={20}/></div>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent">Account Records</span>
              </div>
              <h1 className="text-5xl font-black text-primary tracking-tighter uppercase leading-none">History</h1>
            </div>
            <div className="bg-white px-10 py-5 rounded-card border border-stone-100 shadow-sm text-center">
              <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Total Sessions</p>
              <p className="text-3xl font-black text-primary tracking-tighter">{bookings.length}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-8">
          {bookings.length > 0 ? bookings.map((b: any) => (
            <div key={b.id} className="card-cozy group relative overflow-hidden flex flex-col md:flex-row items-stretch p-0!">
              <div className={`hidden md:block w-2 absolute left-0 top-0 bottom-0 ${getStatusColor(b.status)} opacity-60`} />
              <div className="flex-1 p-10 space-y-10">
                <div className="flex justify-between items-center">
                  <StatusBadge status={b.status} />
                  <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest leading-none">ID: #{b.id}</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-primary uppercase leading-none tracking-tight">{b.serviceName}</h3>
                  <div className="flex items-center gap-4">
                    <p className="text-[11px] font-black text-muted uppercase tracking-[0.2em]">{b.staffName || 'Service Provider'}</p>
                    {!tenantPath && b.shopName && (
                      <span className="flex items-center gap-1 text-[9px] font-black bg-stone-100 text-stone-500 px-3 py-1 rounded-full uppercase tracking-widest">
                        <Store size={10} /> {b.shopName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-stone-50">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-accent uppercase tracking-widest">Date</p>
                    <p className="text-sm font-black text-primary flex items-center gap-2"><Calendar size={16} className="text-stone-300" /> {new Date(b.startTime).toLocaleDateString('th-TH')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-accent uppercase tracking-widest">Time Slot</p>
                    <p className="text-sm font-black text-primary flex items-center gap-2"><Clock size={16} className="text-stone-300" /> {new Date(b.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
                  </div>
                </div>
              </div>
              <div className="bg-stone-50/50 md:w-72 p-10 flex flex-col justify-between items-center md:items-end border-t md:border-t-0 md:border-l border-stone-100">
                 <div className="text-center md:text-right">
                   <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Total Fee</p>
                   <p className="text-4xl font-black text-primary tracking-tighter">฿{b.price}</p>
                 </div>
                 <div className="w-full space-y-3">
                   {b.status === 'pending' && (
                     <button onClick={() => navigate(`/${tenantPath || b.tenantPath}/pay/${b.id}`)} className="w-full btn-boutique-primary py-4 text-[10px] cursor-pointer shadow-premium">
                       <CreditCard size={16} /> Pay Now
                     </button>
                   )}
                   
                   {/* ✅ ปุ่มเลื่อนคิว (แสดงเฉพาะตอน pending หรือ confirmed) */}
                   {(b.status === 'pending' || b.status === 'confirmed') && (
                     <>
                       <button onClick={() => openReschedule(b)} className="w-full py-4 bg-white text-primary border border-stone-200 hover:border-accent hover:text-accent rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2">
                         <RefreshCw size={14} /> Reschedule
                       </button>
                       <button onClick={() => handleCancel(b.id, b.tenantPath)} className="w-full py-4 bg-transparent text-muted/60 hover:text-rose-500 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all cursor-pointer">
                         <XCircle size={16} className="inline mr-1" /> Cancel
                       </button>
                     </>
                   )}

                   {b.status === 'completed' && <div className="py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[9px] uppercase tracking-widest text-center border border-emerald-100">Service Completed</div>}
                 </div>
              </div>
            </div>
          )) : (
            <div className="py-32 text-center bg-stone-50 rounded-[48px] border-2 border-dashed border-stone-100">
              <ShoppingBag className="mx-auto text-stone-200 mb-4" size={64} />
              <p className="font-black text-stone-300 uppercase tracking-widest">No history available</p>
            </div>
          )}
        </div>
      </div>

      {/* --- 🔄 Modal เลื่อนคิว (Reschedule Modal) --- */}
      {rescheduleData && (
        <div className="fixed inset-0 z-[100] bg-primary/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-card w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <header className="p-8 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
              <div>
                <h3 className="font-black text-primary text-xl uppercase tracking-tight">Reschedule Booking</h3>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">Ticket #{rescheduleData.id} • {rescheduleData.serviceName}</p>
              </div>
              <button onClick={() => setRescheduleData(null)} className="text-stone-300 hover:text-rose-500 transition-colors cursor-pointer"><XCircle size={24}/></button>
            </header>
            
            <div className="p-8 overflow-y-auto space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Select New Date</label>
                <input type="date" min={new Date().toISOString().split('T')[0]} className="input-warm py-4" value={selDate} onChange={e => {setSelDate(e.target.value); setSelTime('');}} />
              </div>
              
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Available Time Slots</label>
                {slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {slots.map(t => (
                      <button key={t} onClick={() => setSelTime(t)} className={`py-4 rounded-2xl text-[11px] font-black transition-all border-2 cursor-pointer ${selTime === t ? 'bg-accent border-accent text-white shadow-lg' : 'bg-stone-50 border-transparent text-primary hover:border-stone-200'}`}>{t}</button>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">No slots available for this date</p>
                  </div>
                )}
              </div>
            </div>

            <footer className="p-6 bg-stone-50 border-t border-stone-100 flex gap-4">
              <button onClick={() => setRescheduleData(null)} className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-stone-400 hover:bg-stone-200 transition-colors cursor-pointer">Cancel</button>
              <button disabled={!selTime || isRescheduling} onClick={confirmReschedule} className="flex-1 btn-boutique-primary py-4 text-[11px] shadow-premium cursor-pointer disabled:opacity-50">
                {isRescheduling ? <Loader2 className="animate-spin mx-auto"/> : "Confirm New Slot"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: any) {
  const c: any = {
    pending: { label: 'รอชำระเงิน', icon: <Timer size={12}/>, color: 'bg-orange-50 text-orange-600 border-orange-100' },
    confirmed: { label: 'ยืนยันแล้ว', icon: <CheckCircle2 size={12}/>, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    completed: { label: 'เสร็จสิ้น', icon: <CheckCircle2 size={12}/>, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    canceled: { label: 'ยกเลิกแล้ว', icon: <XCircle size={12}/>, color: 'bg-rose-50 text-rose-500 border-rose-100' }
  };
  const { label, icon, color } = c[status] || c.pending;
  return <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 inline-flex ${color}`}>{icon} {label}</div>;
}

function getStatusColor(s: string) {
  const c: any = { pending: 'bg-orange-400', confirmed: 'bg-emerald-400', completed: 'bg-blue-400', canceled: 'bg-rose-400' };
  return c[s] || 'bg-stone-400';
}