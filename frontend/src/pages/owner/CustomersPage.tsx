import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { 
  Calendar, Clock, Scissors, User, 
  CheckCircle2, XCircle, ChevronRight, Loader2, AlertCircle 
} from 'lucide-react';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    if (!user?.tenantPath) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/${user.tenantPath}/owner/bookings`);
      setBookings(res.data.bookings || []);
    } catch (err) {
      toast.error("ดึงข้อมูลการจองไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user?.tenantPath]);

  // 🔥 ฟังก์ชันอัปเดตสถานะ (หัวใจสำคัญที่คุณตามหา)
  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/api/${user?.tenantPath}/owner/bookings/${id}/status`, { 
        status: newStatus 
      });
      
      const messages: Record<string, string> = {
        confirmed: "ยืนยันการจองเรียบร้อย ✨",
        completed: "ปิดงาน (Check-out) สำเร็จ ✅",
        canceled: "ยกเลิกการจองแล้ว"
      };
      
      toast.success(messages[newStatus]);
      fetchBookings(); // รีโหลดข้อมูลใหม่หลังอัปเดต
    } catch (error) {
      toast.error("ไม่สามารถเปลี่ยนสถานะได้");
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-accent animate-pulse">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p>กำลังเปิดสมุดนัดหมาย...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-secondary-foreground flex items-center gap-3">
          <Calendar className="text-primary" size={32} />
          จัดการรายการจอง
        </h1>
        <p className="text-accent text-sm md:text-base font-medium mt-1">
          อัปเดตสถานะการเข้าใช้บริการของลูกค้าที่นี่
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-card shadow-sm border border-accent/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-200">
            <thead className="bg-secondary/30 text-accent text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-8 py-5">ลูกค้า / บริการ</th>
                <th className="px-8 py-5">ช่าง</th>
                <th className="px-8 py-5">เวลา</th>
                <th className="px-8 py-5">สถานะ</th>
                <th className="px-8 py-5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent/5">
              {bookings.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-accent italic">ยังไม่มีการจองเข้ามา 🍃</td></tr>
              ) : (
                bookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-secondary/10 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="font-bold text-secondary-foreground text-lg">{b.customerName}</p>
                      <p className="text-xs text-primary font-bold flex items-center gap-1 uppercase tracking-tighter">
                        <Scissors size={12} /> {b.serviceName}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-accent font-bold">
                      <div className="flex items-center gap-2"><User size={16} /> {b.staffName}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-bold text-secondary-foreground flex flex-col">
                        <span className="flex items-center gap-1.5"><Calendar size={14} className="text-accent" /> {new Date(b.startTime).toLocaleDateString('th-TH')}</span>
                        <span className="flex items-center gap-1.5 text-accent font-medium"><Clock size={14} /> {new Date(b.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 
                        b.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
                        b.status === 'completed' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-end gap-2">
                        
                        {/* ✅ ปุ่มยืนยัน (โชว์เฉพาะตอน Pending) */}
                        {b.status === 'pending' && (
                          <button 
                            onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm"
                            title="ยืนยันการจอง"
                          >
                            <CheckCircle2 size={20} />
                          </button>
                        )}

                        {/* ✅ ปุ่มปิดงาน (โชว์เฉพาะตอน Confirmed) */}
                        {b.status === 'confirmed' && (
                          <button 
                            onClick={() => handleUpdateStatus(b.id, 'completed')}
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-sm"
                            title="เช็คเอาท์ / งานเสร็จสิ้น"
                          >
                            <ChevronRight size={20} />
                          </button>
                        )}

                        {/* ✅ ปุ่มยกเลิก (โชว์ถ้ายังไม่เสร็จ) */}
                        {b.status !== 'canceled' && b.status !== 'completed' && (
                          <button 
                            onClick={() => { if(confirm("ยกเลิกการจองนี้?")) handleUpdateStatus(b.id, 'canceled') }}
                            className="p-2 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                          >
                            <XCircle size={20} />
                          </button>
                        )}

                        {/* ถ้าเสร็จแล้วโชว์แค่ไอคอนเฉยๆ */}
                        {b.status === 'completed' && <div className="text-xs text-accent font-bold italic px-4 py-2 uppercase">Archived</div>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Helper Info */}
      <div className="bg-orange-50 p-4 rounded-2xl flex items-start gap-3 border border-orange-100">
        <AlertCircle className="text-orange-500 mt-0.5" size={18} />
        <div className="text-xs text-orange-800 space-y-1">
          <p className="font-bold">คู่มือการจัดการ:</p>
          <p>• เมื่อกดยืนยันแล้ว สถานะจะเปลี่ยนเป็น <span className="font-bold">Confirmed</span></p>
          <p>• เมื่อลูกค้าใช้บริการเสร็จ ให้กดปุ่มลูกศรเพื่อเปลี่ยนเป็น <span className="font-bold">Completed</span> เพื่อปิดงาน</p>
        </div>
      </div>
    </div>
  );
}