// src/pages/customer/MyBookingsPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import CustomerNavbar from '../../components/layouts/CustomerNavbar';
import { toast } from 'sonner';
import { Calendar, Clock, Loader2, BookOpen, ShoppingBag, CheckCircle2, Timer, XCircle, CreditCard, Trash2, ArrowLeft } from 'lucide-react';

export default function MyBookingsPage() {
  const { tenantPath } = useParams();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const res = await api.get(`/api/${tenantPath}/bookings/my-bookings`);
      setBookings(res.data.bookings || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [tenantPath]);

  const handleCancel = async (id: number) => {
    if (!window.confirm("ยืนยันการยกเลิกการนัดหมายนี้?")) return;
    try {
      await api.patch(`/api/${tenantPath}/bookings/${id}/cancel`);
      toast.success("Cancelled successfully"); fetch();
    } catch (e: any) { toast.error(e.response?.data?.error || "Error"); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse">LOADING RECORDS...</div>;

  return (
    <div className="min-h-screen bg-bg font-sans pb-32 No Italic">
      <CustomerNavbar />
      <div className="max-w-5xl mx-auto px-6 pt-32 space-y-12">
        <header className="space-y-6">
          <button onClick={() => navigate(`/${tenantPath}`)} className="text-[10px] font-black uppercase tracking-[0.3em] text-muted hover:text-primary transition-colors flex items-center gap-2"><ArrowLeft size={14} /> Back to Boutique</button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8"><div className="space-y-2"><div className="flex items-center gap-3"><div className="p-2.5 bg-accent/10 rounded-xl text-accent"><BookOpen size={20}/></div><span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent">Account Records</span></div><h1 className="text-5xl font-black text-primary tracking-tighter uppercase leading-none">History</h1></div><div className="bg-white px-10 py-5 rounded-card border border-stone-100 shadow-sm text-center"><p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Total Sessions</p><p className="text-3xl font-black text-primary tracking-tighter">{bookings.length}</p></div></div>
        </header>

        <div className="grid gap-8">{bookings.length > 0 ? bookings.map((b: any) => (
          <div key={b.id} className="card-cozy group relative overflow-hidden flex flex-col md:flex-row items-stretch p-0!">
            <div className={`hidden md:block w-2 absolute left-0 top-0 bottom-0 ${getStatusColor(b.status)} opacity-60`} />
            <div className="flex-1 p-10 space-y-10">
              <div className="flex justify-between items-center"><StatusBadge status={b.status} /><span className="text-[9px] font-black text-stone-300 uppercase tracking-widest leading-none">ID: #{b.id}</span></div>
              <div className="space-y-3"><h3 className="text-3xl font-black text-primary uppercase leading-none tracking-tight">{b.serviceName}</h3><p className="text-[11px] font-black text-muted uppercase tracking-[0.2em]">{b.staffName || 'Service Provider'}</p></div>
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-stone-50">
                <div className="space-y-1"><p className="text-[9px] font-black text-accent uppercase tracking-widest">Date</p><p className="text-sm font-black text-primary flex items-center gap-2"><Calendar size={16} className="text-stone-300" /> {new Date(b.startTime).toLocaleDateString('th-TH')}</p></div>
                <div className="space-y-1"><p className="text-[9px] font-black text-accent uppercase tracking-widest">Time Slot</p><p className="text-sm font-black text-primary flex items-center gap-2"><Clock size={16} className="text-stone-300" /> {new Date(b.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p></div>
              </div>
            </div>
            <div className="bg-stone-50/50 md:w-72 p-10 flex flex-col justify-between items-center md:items-end border-t md:border-t-0 md:border-l border-stone-100">
               <div className="text-center md:text-right"><p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Total Fee</p><p className="text-4xl font-black text-primary tracking-tighter">฿{b.price}</p></div>
               <div className="w-full space-y-3">
                 {b.status === 'pending' && <button onClick={() => navigate(`/${tenantPath}/pay/${b.id}`)} className="w-full btn-boutique-primary py-4 text-[10px]"><CreditCard size={16} /> Pay Now</button>}
                 {(b.status === 'pending' || b.status === 'confirmed') && <button onClick={() => handleCancel(b.id)} className="w-full py-4 bg-transparent text-muted/60 hover:text-rose-500 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] border border-transparent hover:border-rose-100 transition-all"><XCircle size={16} /> Cancel</button>}
                 {b.status === 'completed' && <div className="py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[9px] uppercase tracking-widest text-center">Service Completed</div>}
               </div>
            </div>
          </div>
        )) : <div className="py-32 text-center bg-stone-50 rounded-[48px] border-2 border-dashed border-stone-100"><ShoppingBag className="mx-auto text-stone-200 mb-4" size={64} /><p className="font-black text-stone-300 uppercase tracking-widest">No history available</p></div>}</div>
      </div>
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