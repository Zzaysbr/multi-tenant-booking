// src/pages/owner/ApprovalsPage.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Check, X, Eye, Clock, User, Landmark, Loader2 } from 'lucide-react';
import { getFullImageUrl } from '../../utils/image';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  const fetchApprovals = async () => {
    if (!user?.tenantPath) return;
    try {
      const res = await api.get(`/api/${user.tenantPath}/owner/approvals`);
      setApprovals(res.data.approvals || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchApprovals(); }, [user?.tenantPath]);

  const handleApprove = async (id: number) => {
    try {
      await api.patch(`/api/${user?.tenantPath}/owner/approve/${id}`);
      toast.success("ยืนยันคิวเรียบร้อย!", { description: "ส่งการแจ้งเตือนเรียบร้อยแล้วครับ" });
      fetchApprovals();
    } catch { toast.error("เกิดข้อผิดพลาดในการอนุมัติ"); }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse">
       <Loader2 className="animate-spin text-primary mb-4" />
       <p className="font-black text-[10px] uppercase tracking-widest text-accent">Checking Pending Requests...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 font-sans No Italic pb-20">
      
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">Approvals Hub</h1>
        <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em]">Review payments and secure time slots</p>
      </header>

      <div className="grid gap-6">
        {approvals.map((item) => (
          <div key={item.bookingId} className="card-cozy p-0 overflow-hidden border-stone-100 flex flex-col lg:flex-row hover:border-accent/30 transition-all shadow-xl shadow-black/5">
            
            {/* 📝 Booking Details */}
            <div className="flex-1 p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center text-primary border border-stone-50"><User size={24}/></div>
                  <div>
                    <h3 className="text-xl font-black text-primary uppercase tracking-tight leading-none mb-1">{item.customerName}</h3>
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Ticket #{item.bookingId}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-2xl font-black text-primary leading-none mb-1">฿{item.price}</p>
                   <p className="text-[9px] font-black text-accent uppercase tracking-widest">{item.serviceName}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="badge-cafe bg-stone-50 text-primary border-stone-100">
                   <Clock size={14}/> {new Date(item.startTime).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })}
                </div>
                <div className="badge-cafe bg-emerald-50 text-emerald-700 border-emerald-100">
                   <Landmark size={14}/> PromptPay Transfer
                </div>
              </div>
            </div>

            {/* 📸 Slip Action */}
            <div className="w-full lg:w-80 bg-stone-50/50 p-8 flex flex-col justify-center items-center border-t lg:border-t-0 lg:border-l border-stone-100">
              {item.slipUrl ? (
                <div className="relative group cursor-pointer w-32 h-44" onClick={() => setSelectedSlip(item.slipUrl)}>
                  <img src={getFullImageUrl(item.slipUrl)} alt="slip" className="w-full h-full object-cover rounded-2xl shadow-lg group-hover:brightness-50 transition-all border-4 border-white" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="text-white" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 opacity-30">
                  <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-2"><X size={20}/></div>
                  <p className="text-[9px] font-black uppercase">No Slip Attached</p>
                </div>
              )}

              <div className="flex gap-3 mt-8 w-full">
                <button onClick={() => handleApprove(item.bookingId)} className="btn-boutique-primary flex-1 py-4 text-[11px] cursor-pointer">
                  <Check size={16} /> Approve
                </button>
                <button className="p-4 bg-white border border-stone-200 rounded-2xl text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {approvals.length === 0 && (
          <div className="py-24 text-center card-cozy border-dashed border-2 border-stone-100 bg-stone-50/30">
            <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.4em]">Everything is up to date 🍃</p>
          </div>
        )}
      </div>

      {/* 🖼️ Modal Slip Viewer */}
      {selectedSlip && (
        <div className="fixed inset-0 z-100 bg-primary/90 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in zoom-in duration-300 cursor-pointer" onClick={() => setSelectedSlip(null)}>
          <img src={getFullImageUrl(selectedSlip)} className="max-h-full max-w-lg rounded-4xl shadow-2xl border-8 border-white" />
        </div>
      )}
    </div>
  );
}