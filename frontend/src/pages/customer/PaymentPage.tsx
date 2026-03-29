// src/pages/customer/PaymentPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import CustomerNavbar from '../../components/layouts/CustomerNavbar';
import { toast } from 'sonner';
import { QrCode, Upload, ShieldCheck, ArrowLeft, Loader2, Camera, Calendar, Clock, Info } from 'lucide-react';

export default function PaymentPage() {
  const { tenantPath, bookingId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);

  useEffect(() => {
    const f = async () => {
      try {
        const [b, s] = await Promise.all([api.get(`/api/${tenantPath}/bookings/${bookingId}`), api.get(`/api/${tenantPath}/config`)]);
        setBooking(b.data.booking); setShop(s.data.config);
      } finally { setLoading(false); }
    };
    f();
  }, [tenantPath, bookingId]);

  const hSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipFile) return toast.error("Please upload pay slip");
    setSubmitting(true);
    const fd = new FormData(); fd.append('slipFile', slipFile);
    try {
      await api.patch(`/api/${tenantPath}/bookings/${bookingId}/payment`, fd);
      toast.success("Slip uploaded!"); navigate(`/${tenantPath}/my-bookings`);
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse">SECURING CHECKOUT...</div>;

  return (
    <div className="min-h-screen bg-bg font-sans pb-32 No Italic">
      <CustomerNavbar />
      <header className="max-w-2xl mx-auto pt-32 px-6 flex items-center justify-between">
         <button onClick={() => navigate(-1)} className="p-4 bg-white rounded-2xl border border-stone-100"><ArrowLeft size={18}/></button>
         <h1 className="text-xl font-black text-primary uppercase tracking-tighter">Secure Checkout</h1>
         <div className="w-12" />
      </header>

      <div className="max-w-2xl mx-auto px-6 mt-12 space-y-10">
        <section className="card-cozy p-12! bg-primary text-white border-none shadow-premium">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-soft mb-8">Service Summary</p>
           <div className="flex justify-between items-start mb-10"><div className="space-y-2"><h2 className="text-3xl font-black uppercase leading-none tracking-tight">{booking?.serviceName}</h2><p className="text-[11px] font-black opacity-40 uppercase tracking-widest">{booking?.staffName || 'Provider Assigned'}</p></div><p className="text-4xl font-black text-accent tracking-tighter">฿{booking?.price}</p></div>
           <div className="pt-8 border-t border-white/10 flex justify-between text-[11px] font-black uppercase tracking-widest opacity-80"><span className="flex items-center gap-2"><Calendar size={14}/> {new Date(booking?.startTime).toLocaleDateString('th-TH')}</span><span className="flex items-center gap-2"><Clock size={14}/> {new Date(booking?.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span></div>
        </section>

        <section className="card-cozy p-12! text-center space-y-10">
           <div className="space-y-2"><div className="flex items-center justify-center gap-2 text-accent"><QrCode size={20}/><h3 className="text-[11px] font-black uppercase tracking-[0.4em]">PromptPay QR</h3></div><p className="text-xs font-bold text-muted uppercase">สแกนชำระเงินผ่านแอปพลิเคชันธนาคาร</p></div>
           <div className="bg-secondary p-8 rounded-[48px] inline-block border-4 border-white shadow-inner">{shop?.qrCodeUrl ? <img src={shop.qrCodeUrl} className="w-64 h-64 object-cover rounded-[36px] shadow-sm" /> : <div className="w-64 h-64 flex items-center justify-center text-stone-200">No QR Code</div>}</div>
           <div className="bg-stone-50 p-6 rounded-[32px] border border-stone-100 flex items-start gap-4 text-left"><Info className="text-accent shrink-0" size={18}/><p className="text-[11px] font-bold text-muted uppercase leading-relaxed tracking-tight">ตรวจสอบยอดเงินให้ถูกต้องและแนบหลักฐานด้านล่างเพื่อยืนยันคิวอัตโนมัติ</p></div>
        </section>

        <form onSubmit={hSubmit} className="space-y-8 pt-4">
           <div className="space-y-4"><label className="text-[10px] font-black text-accent uppercase tracking-[0.2em] px-2 flex items-center gap-2"><Camera size={16}/> Upload Slip</label>
           <div className="relative group"><input type="file" id="slip" hidden onChange={e => { const f = e.target.files?.[0]; if (f) { setSlipFile(f); setSlipPreview(URL.createObjectURL(f)); } }} accept="image/*" />
           <label htmlFor="slip" className={`w-full aspect-video rounded-[48px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${slipPreview ? 'border-accent shadow-premium' : 'border-stone-200 bg-white hover:border-accent'}`}>{slipPreview ? <img src={slipPreview} className="w-full h-full object-cover animate-in fade-in" /> : <div className="text-center space-y-3"><div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto text-accent"><Upload size={24}/></div><p className="text-[10px] font-black text-stone-300 uppercase">Tap to choose image</p></div>}</label></div></div>
           <button disabled={submitting || !slipFile} className="btn-boutique-primary w-full py-6 text-base shadow-premium">{submitting ? <Loader2 className="animate-spin"/> : "Confirm & Send Slip"}</button>
        </form>
      </div>
    </div>
  );
}