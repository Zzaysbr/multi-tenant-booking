import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Check, X, Eye, Clock, User, Landmark} from 'lucide-react';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/api/:tenant/owner/approvals');
      setApprovals(res.data.approvals);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchApprovals(); }, []);

  const handleApprove = async (id: number) => {
    try {
      await api.patch(`/api/:tenantPath/owner/approve/${id}`);
      toast.success("อนุมัติการจองเรียบร้อยแล้ว ✨", { description: "ระบบกำลังส่ง LINE แจ้งเตือนลูกค้า" });
      fetchApprovals();
    } catch { toast.error("เกิดข้อผิดพลาดในการอนุมัติ"); }
  };

  if (loading) return <div className="p-20 text-center animate-pulse italic text-primary">กำลังตรวจสอบคิวที่รออนุมัติ... 🍵</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h1 className="text-3xl font-bold text-secondary-foreground">ตรวจสอบนัดหมาย</h1>
        <p className="text-accent font-medium mt-1">ยืนยันการโอนเงินและล็อกคิวให้ลูกค้าของคุณ</p>
      </div>

      <div className="grid gap-6">
        {approvals.map((item) => (
          <div key={item.bookingId} className="bg-white rounded-card border border-accent/5 shadow-sm overflow-hidden flex flex-col md:flex-row">
            {/* ฝั่งข้อมูลการจอง */}
            <div className="flex-1 p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-primary"><User /></div>
                  <div>
                    <h3 className="font-bold text-lg">{item.customerName}</h3>
                    <p className="text-xs text-accent uppercase font-black tracking-widest">Booking #{item.bookingId}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-2xl font-black text-primary">฿{item.price}</p>
                   <p className="text-[10px] text-accent font-bold uppercase">{item.serviceName}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm font-medium text-secondary-foreground">
                <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg"><Clock size={16}/> {new Date(item.startTime).toLocaleString('th-TH')}</div>
                <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg"><Landmark size={16}/> PromptPay</div>
              </div>
            </div>

            {/* ฝั่งตรวจสอบสลิป */}
            <div className="w-full md:w-72 bg-secondary/20 p-6 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-accent/5">
              {item.slipUrl ? (
                <div className="relative group cursor-pointer" onClick={() => setSelectedSlip(item.slipUrl)}>
                  <img src={item.slipUrl} alt="slip" className="w-32 h-44 object-cover rounded-xl shadow-md group-hover:brightness-50 transition-all" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="text-white" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-2"><X size={20}/></div>
                  <p className="text-[10px] font-bold text-red-400 uppercase">ยังไม่แนบสลิป</p>
                </div>
              )}

              <div className="flex gap-2 mt-6 w-full">
                <button onClick={() => handleApprove(item.bookingId)} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center justify-center gap-2">
                  <Check size={18} /> อนุมัติ
                </button>
                <button className="p-3 bg-white text-accent rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors border border-accent/10">
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {approvals.length === 0 && (
          <div className="py-20 text-center bg-white rounded-card border-2 border-dashed border-accent/10">
            <p className="text-accent italic font-medium">ไม่มีรายการรออนุมัติในขณะนี้ 🍃</p>
          </div>
        )}
      </div>

      {/* Modal ดูรูปสลิปแบบเต็มตัว */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 bg-secondary-foreground/80 backdrop-blur-md flex items-center justify-center p-10" onClick={() => setSelectedSlip(null)}>
          <img src={selectedSlip} className="max-h-full max-w-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" />
        </div>
      )}
    </div>
  );
}