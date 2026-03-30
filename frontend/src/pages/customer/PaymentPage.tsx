import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import CustomerNavbar from '../../components/layouts/CustomerNavbar';
import { toast } from 'sonner';
import { QrCode, Upload, ArrowLeft, Loader2, Camera, Calendar, Clock, CreditCard } from 'lucide-react';
import { getFullImageUrl } from '../../utils/image';

export default function PaymentPage() {
  const { tenantPath, bookingId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [payMethod, setPayMethod] = useState<'promptpay' | 'card'>('promptpay');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [cardData, setCardData] = useState({ number: '', name: '', exp: '', cvc: '' });

  useEffect(() => {
    const f = async () => {
      try {
        const [b, s] = await Promise.all([
          api.get(`/${tenantPath}/bookings/${bookingId}`), 
          api.get(`/${tenantPath}/config`)
        ]);
        setBooking(b.data.booking); 
        setShop(s.data.config);
      } finally { setLoading(false); }
    };
    f();
  }, [tenantPath, bookingId]);

  const handlePromptPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipFile) return toast.error("กรุณาอัปโหลดสลิปการโอนเงิน");
    setSubmitting(true);
    const fd = new FormData(); 
    fd.append('slipFile', slipFile);
    try {
      await api.patch(`/${tenantPath}/bookings/${bookingId}/payment`, fd);
      toast.success("อัปโหลดสลิปเรียบร้อย รอร้านตรวจสอบครับ"); 
      navigate(`/${tenantPath}/my-bookings`);
    } catch { toast.error("เกิดข้อผิดพลาดในการอัปโหลด"); } finally { setSubmitting(false); }
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardData.number || !cardData.name || !cardData.exp || !cardData.cvc) {
      return toast.error("กรุณากรอกข้อมูลบัตรให้ครบถ้วน");
    }
    setSubmitting(true);
    try {
      await api.post(`/${tenantPath}/bookings/${bookingId}/payment/card`);
      toast.success("ชำระเงินผ่านบัตรสำเร็จ! คิวได้รับการยืนยันแล้ว", { duration: 4000 }); 
      navigate(`/${tenantPath}/my-bookings`);
    } catch { toast.error("การตัดบัตรล้มเหลว"); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse">SECURING CHECKOUT...</div>;

  return (
    <div className="min-h-screen bg-bg font-sans pb-32 No Italic">
      <CustomerNavbar />
      <header className="max-w-2xl mx-auto pt-32 px-6 flex items-center justify-between">
         <button onClick={() => navigate(-1)} className="p-4 bg-white rounded-2xl border hover:bg-stone-50 cursor-pointer"><ArrowLeft size={18}/></button>
         <h1 className="text-xl font-black text-primary uppercase">Secure Checkout</h1>
         <div className="w-12" />
      </header>

      <div className="max-w-2xl mx-auto px-6 mt-12 space-y-10">
        <section className="card-cozy p-12! bg-primary text-white border-none shadow-premium">
           <p className="text-[10px] font-black uppercase text-accent-soft mb-8">Service Summary</p>
           <div className="flex justify-between items-start mb-10"><div className="space-y-2"><h2 className="text-3xl font-black uppercase tracking-tight">{booking?.serviceName}</h2><p className="text-[11px] font-black opacity-40 uppercase tracking-widest">{booking?.staffName || 'Provider Assigned'}</p></div><p className="text-4xl font-black text-accent">฿{booking?.price}</p></div>
           <div className="pt-8 border-t border-white/10 flex justify-between text-[11px] font-black uppercase tracking-widest opacity-80"><span className="flex items-center gap-2"><Calendar size={14}/> {new Date(booking?.startTime).toLocaleDateString('th-TH')}</span><span className="flex items-center gap-2"><Clock size={14}/> {new Date(booking?.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span></div>
        </section>

        <div className="flex bg-stone-100 p-2 rounded-2xl">
          <button onClick={() => setPayMethod('promptpay')} className={`flex-1 py-4 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer ${payMethod === 'promptpay' ? 'bg-white text-primary shadow-sm' : 'text-stone-400'}`}>PromptPay</button>
          <button onClick={() => setPayMethod('card')} className={`flex-1 py-4 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer ${payMethod === 'card' ? 'bg-white text-primary shadow-sm' : 'text-stone-400'}`}>Credit Card</button>
        </div>

        {payMethod === 'promptpay' && (
          <div className="animate-in fade-in zoom-in-95 duration-300 space-y-10">
            <section className="card-cozy p-12! text-center space-y-10 border-stone-100 bg-white">
               <div className="space-y-2"><div className="flex items-center justify-center gap-2 text-accent"><QrCode size={20}/><h3 className="text-[11px] font-black uppercase">PromptPay QR</h3></div><p className="text-xs font-bold text-muted uppercase">สแกนชำระเงินผ่านแอปพลิเคชันธนาคาร</p></div>
               <div className="bg-secondary p-8 rounded-[48px] inline-block border-4 border-white shadow-inner">
                 {shop?.qrCodeUrl ? <img src={getFullImageUrl(shop.qrCodeUrl)!} className="w-64 h-64 object-cover rounded-card shadow-sm" /> : <div className="w-64 h-64 flex items-center justify-center text-stone-200 font-black text-xs uppercase">No QR Code</div>}
               </div>
            </section>
            <form onSubmit={handlePromptPaySubmit} className="space-y-8 pt-4">
               <div className="space-y-4">
                 <label className="text-[10px] font-black text-accent uppercase tracking-[0.2em] px-2 flex items-center gap-2"><Camera size={16}/> Upload Slip</label>
                 <div className="relative group">
                   <input type="file" id="slip" hidden onChange={e => { const f = e.target.files?.[0]; if (f) { setSlipFile(f); setSlipPreview(URL.createObjectURL(f)); } }} accept="image/*" />
                   <label htmlFor="slip" className={`w-full aspect-video rounded-[48px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${slipPreview ? 'border-accent shadow-premium' : 'border-stone-200 bg-white hover:border-accent'}`}>
                     {slipPreview ? <img src={slipPreview} className="w-full h-full object-cover" /> : <div className="text-center space-y-3"><div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto text-accent"><Upload size={24}/></div><p className="text-[10px] font-black text-stone-300 uppercase">Tap to choose slip</p></div>}
                   </label>
                 </div>
               </div>
               <button disabled={submitting || !slipFile} className="btn-boutique-primary w-full py-6 text-base cursor-pointer">{submitting ? <Loader2 className="animate-spin mx-auto"/> : "Confirm Transfer"}</button>
            </form>
          </div>
        )}

        {payMethod === 'card' && (
          <form onSubmit={handleCardSubmit} className="animate-in fade-in zoom-in-95 duration-300 space-y-8">
            <div className="card-cozy p-10! border-stone-100 bg-white space-y-8">
              <div className="flex items-center gap-3 border-b border-stone-50 pb-6 text-accent">
                <CreditCard size={20} /> <h3 className="text-xs font-black uppercase tracking-[0.3em]">Payment Details (Mock)</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted px-2">Card Number</label><input required type="text" maxLength={16} placeholder="4242 4242 4242 4242" className="input-warm py-4 font-mono text-sm tracking-widest" value={cardData.number} onChange={e => setCardData({...cardData, number: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted px-2">Cardholder Name</label><input required type="text" placeholder="JOHN DOE" className="input-warm py-4 uppercase tracking-widest" value={cardData.name} onChange={e => setCardData({...cardData, name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted px-2">Expiry</label><input required type="text" maxLength={5} placeholder="MM/YY" className="input-warm py-4 font-mono text-center" value={cardData.exp} onChange={e => setCardData({...cardData, exp: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted px-2">CVC</label><input required type="text" maxLength={3} placeholder="123" className="input-warm py-4 font-mono text-center" value={cardData.cvc} onChange={e => setCardData({...cardData, cvc: e.target.value})} /></div>
                </div>
              </div>
            </div>
            <button disabled={submitting} type="submit" className="btn-boutique-primary w-full py-6 text-base bg-slate-800 hover:bg-slate-900 border-none cursor-pointer">
              {submitting ? <Loader2 className="animate-spin mx-auto"/> : "Pay with Card (Mock)"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}