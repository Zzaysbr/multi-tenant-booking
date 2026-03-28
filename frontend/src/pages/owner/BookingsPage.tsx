import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { 
  Calendar, Clock, User, Scissors, 
  CheckCircle2, XCircle, ChevronRight, Loader2, Info, 
  RefreshCcw, Filter, Search, Landmark // ✅ เพิ่ม Landmark icon
} from 'lucide-react';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBookings = useCallback(async (silent = false) => {
    if (!user?.tenantPath) return;
    if (!silent) setLoading(true);
    
    try {
      const res = await api.get(`/api/${user.tenantPath}/owner/bookings`);
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("ไม่สามารถโหลดรายการจองได้");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.tenantPath]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/api/${user?.tenantPath}/owner/bookings/${id}/status`, { 
        status: newStatus 
      });
      
      const statusMessages: Record<string, string> = {
        confirmed: "ยืนยันการนัดหมายเรียบร้อย ✨",
        completed: "ปิดงาน (Check-out) สำเร็จ ✅",
        canceled: "ยกเลิกรายการจองแล้ว ❌"
      };
        
      toast.success(statusMessages[newStatus] || "อัปเดตสถานะสำเร็จ");
      fetchBookings(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-accent gap-4 animate-pulse">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="font-medium italic">กำลังเปิดสมุดนัดหมาย...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-foreground flex items-center gap-3">
            <Calendar className="text-primary" size={32} />
            จัดการรายการจอง
          </h1>
          <p className="text-accent text-sm md:text-base font-medium mt-1">
            ดูแลสถานะการเข้าใช้บริการของลูกค้าแบบเรียลไทม์
          </p>
        </div>

        <button 
          onClick={() => { setIsRefreshing(true); fetchBookings(true); }}
          disabled={isRefreshing}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-all bg-white px-4 py-2 rounded-full border border-primary/10 shadow-sm"
        >
          <RefreshCcw size={14} className={isRefreshing ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {/* --- Table Section --- */}
      <div className="bg-white rounded-card shadow-sm border border-accent/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-secondary/30 text-accent text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-8 py-5">ข้อมูลลูกค้า</th>
                <th className="px-8 py-5">บริการ</th>
                <th className="px-8 py-5">ช่าง / พนักงาน</th>
                <th className="px-8 py-5">วัน-เวลา</th>
                <th className="px-8 py-5">สถานะคิว</th>
                <th className="px-8 py-5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent/5">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Calendar size={48} />
                      <p className="italic font-medium">ยังไม่มีรายการจองเข้ามาในขณะนี้ 🍃</p>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-secondary/10 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="font-bold text-secondary-foreground text-lg">{b.customerName}</p>
                      <p className="text-[10px] text-accent font-black uppercase tracking-tighter">Verified Client</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary rounded-lg text-sm font-bold">
                        <Scissors size={14} />
                        {b.serviceName}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-secondary-foreground flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        {b.staffName}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-bold text-secondary-foreground space-y-0.5">
                        <p className="flex items-center gap-1.5"><Calendar size={14} className="text-accent" /> {new Date(b.startTime).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        <p className="flex items-center gap-1.5 text-accent font-medium"><Clock size={14} /> {new Date(b.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block ${
                        b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                        b.status === 'pending' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                        b.status === 'completed' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                        'bg-red-50 text-red-400 border border-red-100'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-end gap-3 transition-all">
                        
                        {/* ✅ ปุ่มดูสลิปโอนเงิน (Test 7-8) */}
                        {b.slipUrl && (
                          <button 
                            onClick={() => window.open(b.slipUrl, '_blank')}
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                            title="เปิดดูหลักฐานการโอนเงิน"
                          >
                            <Landmark size={20} />
                          </button>
                        )}

                        {/* 🟠 ปุ่มยืนยัน (Test 4) */}
                        {b.status === 'pending' && (
                          <button 
                            onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-all shadow-md shadow-emerald-500/20 text-xs font-bold"
                          >
                            <CheckCircle2 size={16} /> ยืนยันคิว
                          </button>
                        )}

                        {/* 🔵 ปุ่มปิดงาน (Test 6) */}
                        {b.status === 'confirmed' && (
                          <button 
                            onClick={() => handleUpdateStatus(b.id, 'completed')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-xl transition-all shadow-md shadow-blue-500/20 text-xs font-bold"
                          >
                            <ChevronRight size={16} /> เช็คเอาท์
                          </button>
                        )}

                        {/* 🔴 ปุ่มยกเลิก */}
                        {b.status !== 'canceled' && b.status !== 'completed' && (
                          <button 
                            onClick={() => {
                              if(confirm("ยืนยันการยกเลิกการนัดหมายนี้?")) handleUpdateStatus(b.id, 'canceled')
                            }}
                            className="p-2 text-accent hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="ยกเลิกการจอง"
                          >
                            <XCircle size={20} />
                          </button>
                        )}

                        {b.status === 'completed' && (
                          <span className="text-[10px] font-black text-accent uppercase py-2 px-4 italic bg-secondary/50 rounded-lg">ปิดงานแล้ว</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Footer Guide --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-secondary/30 p-5 rounded-3xl flex items-start gap-4 border border-primary/5">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-primary">
            <Info size={20} />
          </div>
          <div className="text-xs space-y-1.5">
            <p className="font-bold text-secondary-foreground text-sm tracking-tight">ขั้นตอนการจัดการคิวและชำระเงิน</p>
            <p className="text-accent leading-relaxed">คลิกที่ไอคอน <span className="text-blue-600 font-bold">ธนาคาร</span> เพื่อตรวจสอบสลิป เมื่อเงินเข้าแล้วจึงกดปุ่ม <span className="text-emerald-600 font-bold">ยืนยันคิว</span> เพื่อแจ้งลูกค้า</p>
          </div>
        </div>

        <div className="bg-primary p-5 rounded-3xl flex items-center justify-between text-white shadow-lg shadow-primary/10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Requests</p>
            <p className="text-3xl font-black">{bookings.length}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Filter size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}