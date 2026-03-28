// src/pages/customer/MyBookingsPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'sonner';
import { 
  Calendar, Clock, Scissors, Loader2, 
  BookOpen, ShoppingBag, CheckCircle2, Timer, XCircle 
} from 'lucide-react';

export default function MyBookingsPage() {
  const { tenantPath } = useParams();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        // ✅ แก้ไข Path: เติม /api กลับเข้าไปให้ถูก
        const res = await api.get(`/api/${tenantPath}/bookings/my-bookings`);
        setBookings(res.data.bookings || []);
      } catch (err) {
        console.error("Fetch bookings error:", err);
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };
    fetchMyBookings();
  }, [tenantPath]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center font-black text-accent animate-pulse font-sans">
      ACCESSING RECORDS...
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 space-y-12 pb-20 font-sans No Italic">
      <header className="space-y-3 mt-10">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-accent/10 rounded-xl text-accent"><BookOpen size={20}/></div>
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Personal Journal</span>
        </div>
        <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">ประวัติการนัดหมาย</h1>
      </header>

      <div className="space-y-6">
        {bookings.length > 0 ? (
          bookings.map((b: any) => (
            <div key={b.id} className="card-cozy p-8! group relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                <div className="space-y-6 flex-1">
                  <StatusBadge status={b.status} />
                  <h3 className="text-2xl font-black text-primary tracking-tight leading-none uppercase">{b.serviceName}</h3>
                  <div className="flex gap-4 text-sm font-black text-primary uppercase border-t border-stone-50 pt-4 mt-4">
                     <p className="flex items-center gap-2"><Calendar size={14}/> {new Date(b.startTime).toLocaleDateString('th-TH')}</p>
                     <p className="flex items-center gap-2"><Clock size={14}/> {new Date(b.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-between items-end min-w-[150px]">
                   <p className="text-3xl font-black text-primary tracking-tighter mb-4">฿{b.price}</p>
                   {b.status === 'pending' && (
                     <button 
                       onClick={() => navigate(`/${tenantPath}/pay/${b.id}`)} 
                       className="btn-primary w-full py-3 text-[10px]"
                     >
                       PAY NOW
                     </button>
                   )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 bg-stone-50 rounded-card border-2 border-dashed border-stone-100 flex flex-col items-center justify-center text-stone-300 gap-4">
             <ShoppingBag size={64} className="opacity-20" />
             <p className="font-black text-xs uppercase tracking-widest">ยังไม่มีรายการนัดหมาย</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: any = {
    pending: { label: 'รอชำระเงิน', icon: <Timer size={12}/>, color: 'bg-orange-50 text-orange-600 border-orange-100' },
    confirmed: { label: 'ยืนยันแล้ว', icon: <CheckCircle2 size={12}/>, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    completed: { label: 'เสร็จสิ้น', icon: <CheckCircle2 size={12}/>, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    canceled: { label: 'ยกเลิกแล้ว', icon: <XCircle size={12}/>, color: 'bg-rose-50 text-rose-500 border-rose-100' }
  };
  const { label, icon, color } = config[status] || config.pending;
  return (
    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 inline-flex ${color}`}>
      {icon} {label}
    </div>
  );
}