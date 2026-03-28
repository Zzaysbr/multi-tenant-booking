import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Calendar, Clock, ArrowLeft, CreditCard, CheckCircle2, Landmark } from 'lucide-react';

export default function MyBookingsPage() {
  const { tenantPath } = useParams();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBookings = () => {
    api.get(`/api/${tenantPath}/bookings/my-bookings`)
      .then(res => setBookings(res.data.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMyBookings(); }, [tenantPath]);

  return (
    <div className="min-h-screen bg-bg p-6 font-sans">
      <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-500">
        <header className="flex items-center gap-4">
          <button onClick={() => navigate(`/${tenantPath}`)} className="p-2 bg-white rounded-full shadow-sm">
            <ArrowLeft size={20}/>
          </button>
          <h1 className="text-2xl font-black text-secondary-foreground">การจองของฉัน</h1>
        </header>

        {loading ? (
          <div className="text-center py-20 italic text-accent">กำลังโหลดข้อมูล...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-accent/20">
            <p className="text-accent font-medium">ยังไม่มีรายการจองค่ะ</p>
          </div>
        ) : (
          bookings.map((b: any) => (
            <div key={b.id} className="card-cozy p-6! space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-black text-lg text-secondary-foreground">{b.serviceName}</h3>
                  <p className="text-[10px] text-accent font-bold uppercase tracking-widest">{b.staffName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 
                  b.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                }`}>
                  {b.status}
                </span>
              </div>
              
              <div className="flex gap-4 pt-4 border-t border-accent/5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-secondary-foreground">
                  <Calendar size={14} className="text-primary"/> 
                  {new Date(b.startTime).toLocaleDateString('th-TH')}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-secondary-foreground">
                  <Clock size={14} className="text-primary"/> 
                  {new Date(b.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                </div>
              </div>

              {/* ✅ ปุ่มแจ้งโอนเงิน */}
              <div className="pt-2">
                {b.status === 'pending' ? (
                  <button 
                    onClick={() => navigate(`/${tenantPath}/pay/${b.id}`)}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                  >
                    <CreditCard size={16} /> แจ้งโอนเงิน (฿{b.price})
                  </button>
                ) : (
                  <div className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-[10px] flex items-center justify-center gap-2 border border-emerald-100">
                    <CheckCircle2 size={14} /> ชำระเงิน/ยืนยันเรียบร้อยแล้ว
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}