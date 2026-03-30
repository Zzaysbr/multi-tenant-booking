import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import CustomerNavbar from '../../components/layouts/CustomerNavbar';
import { toast } from 'sonner';
import { Calendar, Clock, Loader2, XCircle, CreditCard, RefreshCw } from 'lucide-react';

export default function MyBookingsPage() {
  const { tenantPath } = useParams();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [rescheduleData, setRescheduleData] = useState<any>(null); 
  const [businessHours, setBusinessHours] = useState<any[]>([]);
  const [busySlots, setBusySlots] = useState<any[]>([]);
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0]);
  const [selTime, setSelTime] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const fetchBookings = async () => {
    try {
      // ✅ เรียก Path สั้นลง (axios พ่วง /api ให้แล้ว)
      const endpoint = tenantPath ? `/${tenantPath}/bookings/my-bookings` : `/user/my-bookings`;
      const res = await api.get(endpoint);
      setBookings(res.data.bookings || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [tenantPath]);

  const handleCancel = async (id: number, bTenantPath?: string) => {
    if (!window.confirm("ยกเลิกการจอง?")) return;
    try {
      const targetTenant = tenantPath || bTenantPath;
      await api.patch(`/${targetTenant}/bookings/${id}/cancel`);
      toast.success("ยกเลิกเรียบร้อย"); fetchBookings();
    } catch { toast.error("ยกเลิกไม่สำเร็จ"); }
  };

  const openReschedule = async (booking: any) => {
    setRescheduleData(booking); setSelDate(new Date().toISOString().split('T')[0]); setSelTime('');
    try {
      const targetTenant = tenantPath || booking.tenantPath;
      const res = await api.get(`/${targetTenant}/bookings/init`);
      setBusinessHours(res.data.businessHours || []);
    } catch { toast.error("โหลดข้อมูลล้มเหลว"); }
  };

  useEffect(() => {
    if (rescheduleData && selDate) {
      const targetTenant = tenantPath || rescheduleData.tenantPath;
      api.get(`/${targetTenant}/bookings/busy-slots`, { params: { staffId: rescheduleData.staffId, date: selDate } }).then(res => setBusySlots(res.data.busy || []));
    }
  }, [selDate, rescheduleData, tenantPath]);

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
      if (!busySlots.some(b => t >= new Date(b.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) && t < new Date(b.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))) res.push(t);
      cur.setMinutes(cur.getMinutes() + 30);
    }
    return res;
  }, [selDate, businessHours, busySlots, rescheduleData]);

  const confirmReschedule = async () => {
    setIsRescheduling(true);
    try {
      const targetTenant = tenantPath || rescheduleData.tenantPath;
      const st = `${selDate}T${selTime}:00`;
      const en = new Date(new Date(st).getTime() + (rescheduleData.durationMinutes || 60) * 60000).toISOString();
      await api.patch(`/${targetTenant}/bookings/${rescheduleData.id}/reschedule`, { newStartTime: st, newEndTime: en });
      toast.success("สำเร็จ!"); setRescheduleData(null); fetchBookings();
    } catch { toast.error("ล้มเหลว"); } finally { setIsRescheduling(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse">Loading Records...</div>;

  return (
    <div className="min-h-screen bg-bg font-sans pb-32 No Italic">
      <CustomerNavbar />
      <div className="max-w-5xl mx-auto px-6 pt-32 space-y-12">
        <header className="flex justify-between items-end"><h1 className="text-5xl font-black text-primary uppercase">History</h1></header>
        <div className="grid gap-8">
          {bookings.map((b: any) => (
            <div key={b.id} className="card-cozy flex flex-col md:flex-row p-0! overflow-hidden bg-white border border-stone-100">
              <div className="flex-1 p-10 space-y-6">
                <StatusBadge status={b.status} />
                <h3 className="text-3xl font-black text-primary uppercase">{b.serviceName}</h3>
                <div className="grid grid-cols-2 gap-8 border-t pt-6"><p className="text-sm font-black flex items-center gap-2"><Calendar size={16}/> {new Date(b.startTime).toLocaleDateString('th-TH')}</p><p className="text-sm font-black flex items-center gap-2"><Clock size={16}/> {new Date(b.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p></div>
              </div>
              <div className="bg-stone-50 md:w-72 p-10 flex flex-col justify-between items-end border-t md:border-l">
                 <p className="text-4xl font-black text-primary">฿{Number(b.price).toLocaleString()}</p>
                 <div className="w-full space-y-2">
                   {b.status === 'pending' && <button onClick={() => navigate(`/${tenantPath || b.tenantPath}/pay/${b.id}`)} className="w-full btn-boutique-primary py-4 text-xs cursor-pointer shadow-premium"><CreditCard size={16} /> Pay Now</button>}
                   {(b.status === 'pending' || b.status === 'confirmed') && <><button onClick={() => openReschedule(b)} className="w-full py-4 bg-white border rounded-2xl font-black text-[10px] uppercase cursor-pointer hover:bg-stone-100 shadow-sm"><RefreshCw size={14} className="inline mr-2" /> Reschedule</button><button onClick={() => handleCancel(b.id, b.tenantPath)} className="w-full py-4 text-rose-500 font-black text-[10px] uppercase cursor-pointer"><XCircle size={14} className="inline mr-2" /> Cancel</button></>}
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {rescheduleData && <div className="fixed inset-0 z-100 bg-primary/90 backdrop-blur-xl flex items-center justify-center p-6"><div className="bg-white rounded-card w-full max-w-xl p-10 space-y-10 animate-in zoom-in"><header className="flex justify-between items-center"><h3 className="font-black text-2xl uppercase">Reschedule</h3><button onClick={() => setRescheduleData(null)}><XCircle /></button></header><input type="date" min={new Date().toISOString().split('T')[0]} className="input-warm" value={selDate} onChange={e => {setSelDate(e.target.value); setSelTime('');}} /><div className="grid grid-cols-3 gap-2">{slots.map(t => (<button key={t} onClick={() => setSelTime(t)} className={`py-3 rounded-xl font-black text-xs ${selTime === t ? 'bg-accent text-white' : 'bg-stone-100 text-primary'}`}>{t}</button>))}</div><button disabled={!selTime || isRescheduling} onClick={confirmReschedule} className="btn-boutique-primary w-full py-5">{isRescheduling ? <Loader2 className="animate-spin mx-auto"/> : "Confirm New Slot"}</button></div></div>}
    </div>
  );
}

function StatusBadge({ status }: any) {
  const c: any = { pending: { label: 'รอชำระเงิน', color: 'bg-orange-50 text-orange-600' }, confirmed: { label: 'ืนยืนแล้ว', color: 'bg-emerald-50 text-emerald-600' }, completed: { label: 'เสร็จสิ้น', color: 'bg-blue-50 text-blue-600' }, canceled: { label: 'ยกเลิกแล้ว', color: 'bg-rose-50 text-rose-500' } };
  const s = c[status] || c.pending;
  return <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit ${s.color}`}>{s.label}</div>;
}