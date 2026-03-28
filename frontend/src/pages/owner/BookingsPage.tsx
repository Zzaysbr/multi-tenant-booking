import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { 
  Calendar, Scissors, RefreshCcw, UserPlus, X, Landmark, Loader2
} from 'lucide-react';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [initData, setInitData] = useState({ services: [], staffs: [] });
  const [walkIn, setWalkIn] = useState({ customerName: '', serviceId: '', staffId: '' });

  // 1. ฟังก์ชันดึงรายการจอง
  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/api/${user?.tenantPath}/owner/bookings`);
      setBookings(res.data.bookings || []);
    } catch (err) {
      toast.error("ไม่สามารถโหลดรายการจองได้");
    } finally { 
      setLoading(false); 
      setIsRefreshing(false); 
    }
  }, [user?.tenantPath]);

  // 2. ฟังก์ชันอัปเดตสถานะ (ยืนยัน/ปิดงาน)
  const handleStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/api/${user?.tenantPath}/owner/bookings/${id}/status`, { status });
      toast.success("อัปเดตสถานะเรียบร้อยครับพี่ ✨");
      fetchBookings(true);
    } catch (err) {
      toast.error("ไม่สามารถเปลี่ยนสถานะได้");
    }
  };

  // ✅ 3. ฟังก์ชันบันทึก Walk-in (ที่ทำหายไปรอบที่แล้ว)
  const submitWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkIn.customerName || !walkIn.serviceId || !walkIn.staffId) {
      return toast.error("กรุณากรอกข้อมูลให้ครบถ้วนก่อนครับ");
    }
    
    try {
      await api.post(`/api/${user?.tenantPath}/owner/walk-in`, walkIn);
      toast.success("เพิ่มคิวหน้าร้านสำเร็จ! 🎉");
      setShowModal(false); // ปิดหน้าต่าง
      setWalkIn({ customerName: '', serviceId: '', staffId: '' }); // ล้างฟอร์ม
      fetchBookings(true); // รีเฟรชข้อมูล
    } catch (err) {
      toast.error("ไม่สามารถเพิ่มคิวได้ ลองเช็กเวลาทำการอีกครั้งนะครับ");
    }
  };

  useEffect(() => {
    fetchBookings();
    api.get(`/api/${user?.tenantPath}/bookings/init`)
       .then(res => setInitData(res.data))
       .catch(() => console.error("Error loading init data"));
  }, [fetchBookings, user?.tenantPath]);

  if (loading && bookings.length === 0) return (
    <div className="h-[60vh] flex flex-col items-center justify-center font-black uppercase tracking-widest text-accent animate-pulse">
      <Loader2 className="animate-spin mb-4" size={40} />
      LOADING BOOKINGS...
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-3 uppercase tracking-tighter">
            <Calendar size={32} /> Bookings
          </h1>
          <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Manage your store schedule and daily queue
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setShowModal(true)} className="flex-1 md:flex-none btn-primary bg-emerald-700 hover:bg-emerald-800 border-none shadow-emerald-900/10 uppercase tracking-widest">
            <UserPlus size={18} /> Walk-in
          </button>
          <button onClick={() => { setIsRefreshing(true); fetchBookings(true); }} className="p-4 bg-white rounded-2xl border border-stone-100 shadow-sm text-primary transition-all active:rotate-180">
            <RefreshCcw size={20} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* --- 🖥️ Desktop Table (Show on md+) --- */}
      <div className="hidden md:block card-cozy overflow-hidden shadow-xl shadow-black/5">
        <table className="w-full text-left border-collapse">
          <thead className="bg-secondary text-[10px] uppercase font-black tracking-[0.2em] text-muted">
            <tr>
              <th className="px-8 py-6">Customer</th>
              <th className="px-8 py-6">Service</th>
              <th className="px-8 py-6">Provider</th>
              <th className="px-8 py-6">Time</th>
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50 font-medium text-sm">
            {bookings.map((b: any) => (
              <tr key={b.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-8 py-6">
                  <p className="font-black text-primary text-base">{b.customerName || b.guestName}</p>
                  <span className="badge-cafe mt-1 text-[8px]">{b.guestName ? 'Walk-in' : 'Online'}</span>
                </td>
                <td className="px-8 py-6 font-bold flex items-center gap-2 mt-2">
                  <Scissors size={14} className="text-accent"/> {b.serviceName}
                </td>
                <td className="px-8 py-6 font-bold">{b.staffName}</td>
                <td className="px-8 py-6">
                   <p className="font-black text-primary">{new Date(b.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
                   <p className="text-[10px] text-muted font-bold tracking-widest">{new Date(b.startTime).toLocaleDateString('th-TH')}</p>
                </td>
                <td className="px-8 py-6"><StatusBadge status={b.status} /></td>
                <td className="px-8 py-6 text-right"><ActionButtons b={b} handleStatus={handleStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && <EmptyState />}
      </div>
      
      {/* --- 📱 Mobile Card Layout (Show on sm) --- */}
      <div className="md:hidden space-y-4">
        {bookings.map((b: any) => (
           <div key={b.id} className="card-cozy p-6 space-y-4 border-stone-100 shadow-sm">
              <div className="flex justify-between items-start">
                 <div>
                    <h4 className="font-black text-primary text-lg leading-none">{b.customerName || b.guestName}</h4>
                    <span className="text-[8px] font-black uppercase text-accent tracking-[0.2em]">{b.guestName ? 'Walk-in' : 'Online'}</span>
                 </div>
                 <StatusBadge status={b.status} />
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase text-muted py-3 border-y border-stone-50">
                 <span className="flex items-center gap-1"><Scissors size={12}/> {b.serviceName}</span>
                 <span>{new Date(b.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                 <span className="text-[10px] font-bold text-muted">Staff: {b.staffName}</span>
                 <ActionButtons b={b} handleStatus={handleStatus} />
              </div>
           </div>
        ))}
        {bookings.length === 0 && <EmptyState />}
      </div>

      {/* --- 🚪 Walk-in Modal --- */}
      {showModal && (
        <div className="fixed inset-0 bg-primary/80 backdrop-blur-md z-100 flex items-center justify-center p-6">
           <form onSubmit={submitWalkIn} className="bg-white w-full max-w-md rounded-[48px] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
              <button onClick={() => setShowModal(false)} type="button" className="absolute top-10 right-10 text-stone-300 hover:rotate-90 transition-transform"><X size={24} /></button>
              <h2 className="text-2xl font-black text-primary mb-8 uppercase tracking-tighter">Add Walk-in</h2>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Customer Name</label>
                    <input required className="input-warm" value={walkIn.customerName} onChange={e => setWalkIn({...walkIn, customerName: e.target.value})} placeholder="e.g. Guest Customer" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Service</label>
                    <select required className="input-warm" value={walkIn.serviceId} onChange={e => setWalkIn({...walkIn, serviceId: e.target.value})}>
                       <option value="">Select Service...</option>
                       {initData.services.map((s: any) => <option key={s.id} value={s.id}>{s.name} (฿{s.price})</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Provider / Staff</label>
                    <select required className="input-warm" value={walkIn.staffId} onChange={e => setWalkIn({...walkIn, staffId: e.target.value})}>
                       <option value="">Select Staff...</option>
                       {initData.staffs.map((st: any) => <option key={st.id} value={st.id}>{st.name}</option>)}
                    </select>
                 </div>
                 <button type="submit" className="btn-primary w-full py-5 text-lg shadow-2xl shadow-primary/20">START BOOKING</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
}

// --- 🛠️ Helper Components ---

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    pending: "bg-orange-50 text-orange-600 border-orange-100",
    confirmed: "bg-emerald-50 text-emerald-600 border-emerald-100",
    completed: "bg-blue-50 text-blue-600 border-blue-100",
    canceled: "bg-rose-50 text-rose-500 border-rose-100"
  };
  return <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>{status}</span>;
}

function ActionButtons({ b, handleStatus }: any) {
  return (
    <div className="flex gap-2">
      {b.slipUrl && (
        <button onClick={() => window.open(b.slipUrl, '_blank')} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
          <Landmark size={18} />
        </button>
      )}
      {b.status === 'pending' && (
        <button onClick={() => handleStatus(b.id, 'confirmed')} className="px-5 py-3 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all hover:scale-105">
          Confirm
        </button>
      )}
      {b.status === 'confirmed' && (
        <button onClick={() => handleStatus(b.id, 'completed')} className="px-5 py-3 bg-primary text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-105">
          Checkout
        </button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-20 text-center flex flex-col items-center justify-center text-stone-300 gap-3">
       <Calendar size={48} />
       <p className="font-black text-xs uppercase tracking-widest">No appointments today</p>
    </div>
  );
}