import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { 
  Calendar, Clock, Scissors, CheckCircle2, XCircle, 
  ChevronRight, Loader2, RefreshCcw, Landmark, UserPlus, X 
} from 'lucide-react';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [initData, setInitData] = useState({ services: [], staffs: [] });
  const [walkIn, setWalkIn] = useState({ customerName: '', serviceId: '', staffId: '' });

  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/api/${user?.tenantPath}/owner/bookings`);
      setBookings(res.data.bookings || []);
    } finally { setLoading(false); setIsRefreshing(false); }
  }, [user?.tenantPath]);

  useEffect(() => {
    fetchBookings();
    api.get(`/api/${user?.tenantPath}/bookings/init`).then(res => setInitData(res.data));
  }, [fetchBookings]);

  const handleStatus = async (id: number, status: string) => {
    await api.patch(`/api/${user?.tenantPath}/owner/bookings/${id}/status`, { status });
    toast.success("อัปเดตเรียบร้อยครับพี่ ✨");
    fetchBookings(true);
  };

  const submitWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post(`/api/${user?.tenantPath}/owner/walk-in`, walkIn);
    toast.success("เพิ่มคิวหน้าร้านสำเร็จ! 🎉");
    setShowModal(false);
    setWalkIn({ customerName: '', serviceId: '', staffId: '' });
    fetchBookings(true);
  };

  if (loading && bookings.length === 0) return <div className="p-20 text-center animate-pulse italic text-accent">เปิดสมุดนัดหมายอยู่ครับพี่...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary-foreground flex items-center gap-3">
            <Calendar className="text-primary" /> จัดการรายการนัดหมาย
          </h1>
          <p className="text-accent text-sm font-medium">รวมทั้งออนไลน์และ Walk-in ไว้ที่เดียวครับ</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg shadow-emerald-100 hover:scale-105 transition-transform">
            <UserPlus size={16} /> ADD WALK-IN
          </button>
          <button onClick={() => { setIsRefreshing(true); fetchBookings(true); }} className="p-3 bg-white rounded-2xl border border-stone-100 shadow-sm text-primary">
            <RefreshCcw size={20} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-stone-50 text-[10px] uppercase font-black tracking-widest text-accent">
              <tr>
                <th className="px-8 py-5">ชื่อลูกค้า</th>
                <th className="px-8 py-5">บริการ</th>
                <th className="px-8 py-5">พนักงาน</th>
                <th className="px-8 py-5">วัน-เวลา</th>
                <th className="px-8 py-5">สถานะ</th>
                <th className="px-8 py-5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {bookings.map((b: any) => (
                <tr key={b.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-bold text-lg text-secondary-foreground">{b.customerName || b.guestName}</p>
                    <span className="text-[9px] font-black uppercase text-accent tracking-tighter">
                      {b.guestName ? '🚶 Walk-in Customer' : '📱 Online Booking'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-primary/5 text-primary rounded-lg text-xs font-bold flex items-center gap-1.5 w-fit">
                      <Scissors size={12} /> {b.serviceName}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-secondary-foreground">{b.staffName}</td>
                  <td className="px-8 py-6 text-xs font-bold text-accent">
                    <p>{new Date(b.startTime).toLocaleDateString('th-TH')}</p>
                    <p className="text-secondary-foreground">{new Date(b.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      b.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-rose-50 text-rose-500 border-rose-100'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      {b.slipUrl && (
                        <button onClick={() => window.open(b.slipUrl, '_blank')} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                          <Landmark size={18} />
                        </button>
                      )}
                      {b.status === 'pending' && (
                        <button onClick={() => handleStatus(b.id, 'confirmed')} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-100 hover:scale-105 transition-all">
                          ยืนยัน
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <button onClick={() => handleStatus(b.id, 'completed')} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-black shadow-md shadow-blue-100 hover:scale-105 transition-all">
                          ปิดงาน
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Walk-in Modal --- */}
      {showModal && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={submitWalkIn} className="bg-white w-full max-w-md rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95 duration-300 relative border border-stone-100">
            <button onClick={() => setShowModal(false)} type="button" className="absolute top-8 right-8 text-stone-300 hover:text-stone-600 transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-secondary-foreground mb-8">เพิ่มลูกค้า Walk-in</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-accent ml-1">ชื่อลูกค้า</label>
                <input required className="input-warm w-full" value={walkIn.customerName} onChange={e => setWalkIn({...walkIn, customerName: e.target.value})} placeholder="ชื่อที่ลูกค้าเรียก" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-accent ml-1">บริการ</label>
                <select required className="input-warm w-full" value={walkIn.serviceId} onChange={e => setWalkIn({...walkIn, serviceId: e.target.value})}>
                  <option value="">เลือกบริการ...</option>
                  {initData.services.map((s: any) => <option key={s.id} value={s.id}>{s.name} (฿{s.price})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-accent ml-1">พนักงาน</label>
                <select required className="input-warm w-full" value={walkIn.staffId} onChange={e => setWalkIn({...walkIn, staffId: e.target.value})}>
                  <option value="">เลือกช่าง...</option>
                  {initData.staffs.map((st: any) => <option key={st.id} value={st.id}>{st.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary w-full py-5 text-lg shadow-xl shadow-primary/20">เพิ่มคิวและเริ่มงานทันที</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}