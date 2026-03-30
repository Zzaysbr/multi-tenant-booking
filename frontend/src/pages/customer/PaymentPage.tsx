import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import CustomerNavbar from '../../components/layouts/CustomerNavbar';
import { toast } from 'sonner';
import { QrCode, Upload, ArrowLeft, Loader2, Calendar, Clock, CreditCard } from 'lucide-react';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ axios พ่วง /api ให้แล้ว
        const [b, s] = await Promise.all([
          api.get(`/${tenantPath}/bookings/${bookingId}`), 
          api.get(`/${tenantPath}/config`)
        ]);
        setBooking(b.data.booking); setShop(s.data.config);
      } catch { toast.error("Error loading data"); } finally { setLoading(false); }
    };
    fetchData();
  }, [tenantPath, bookingId]);

  const handlePromptPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!slipFile) return toast.error("Upload slip please");
    setSubmitting(true);
    const fd = new FormData(); fd.append('slipFile', slipFile);
    try {
      await api.patch(`/${tenantPath}/bookings/${bookingId}/payment`, fd);
      toast.success("Success!"); navigate(`/${tenantPath}/my-bookings`);
    } catch { toast.error("Upload failed"); } finally { setSubmitting(false); }
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.post(`/${tenantPath}/bookings/${bookingId}/payment/card`);
      toast.success("Card payment success!"); navigate(`/${tenantPath}/my-bookings`);
    } catch { toast.error("Card failed"); } finally { setSubmitting(false); }
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
           <div className="flex justify-between items-start mb-10"><div className="space-y-2"><h2 className="text-3xl font-black uppercase">{booking?.serviceName}</h2></div><p className="text-4xl font-black text-accent">฿{Number(booking?.price).toLocaleString()}</p></div>
           <div className="pt-8 border-t border-white/10 flex justify-between text-[11px] font-black uppercase opacity-80"><span><Calendar size={14} className="inline mr-2"/> {new Date(booking?.startTime).toLocaleDateString('th-TH')}</span><span><Clock size={14} className="inline mr-2"/> {new Date(booking?.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span></div>
        </section>

        <div className="flex bg-stone-100 p-2 rounded-2xl"><button onClick={() => setPayMethod('promptpay')} className={`flex-1 py-4 text-[10px] font-black uppercase rounded-xl ${payMethod === 'promptpay' ? 'bg-white shadow-sm' : 'text-stone-400'}`}>PromptPay</button><button onClick={() => setPayMethod('card')} className={`flex-1 py-4 text-[10px] font-black uppercase rounded-xl ${payMethod === 'card' ? 'bg-white shadow-sm' : 'text-stone-400'}`}>Credit Card</button></div>

        {payMethod === 'promptpay' && (
          <form onSubmit={handlePromptPaySubmit} className="space-y-10">
            <div className="card-cozy p-12! text-center bg-white border border-stone-100"><QrCode size={20} className="mx-auto text-accent mb-2"/><h3 className="text-[11px] font-black uppercase mb-8">Scan to Pay</h3><div className="bg-secondary p-8 rounded-[48px] inline-block border-4 border-white shadow-inner">{shop?.qrCodeUrl ? <img src={getFullImageUrl(shop.qrCodeUrl)!} className="w-64 h-64 object-cover rounded-card" /> : "No QR"}</div></div>
            <label htmlFor="slip" className={`w-full aspect-video rounded-[48px] border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden ${slipPreview ? 'border-accent' : 'bg-white'}`}>{slipPreview ? <img src={slipPreview} className="w-full h-full object-cover" /> : <div className="text-center"><Upload size={24} className="mx-auto mb-2 text-stone-300"/><p className="text-[10px] font-black uppercase text-stone-300">Choose Slip</p></div>}</label>
            <input type="file" id="slip" hidden onChange={e => { const f = e.target.files?.[0]; if (f) { setSlipFile(f); setSlipPreview(URL.createObjectURL(f)); } }} accept="image/*" />
            <button disabled={submitting || !slipFile} className="btn-boutique-primary w-full py-6 text-base cursor-pointer">{submitting ? <Loader2 className="animate-spin mx-auto"/> : "Confirm Transfer"}</button>
          </form>
        )}

        {payMethod === 'card' && (
          <form onSubmit={handleCardSubmit} className="space-y-8 animate-in zoom-in-95 duration-300">
            <div className="card-cozy p-10! border border-stone-100 bg-white space-y-8"><div className="flex items-center gap-3 border-b pb-6 text-accent"><CreditCard size={20} /><h3 className="text-xs font-black uppercase">Card Details</h3></div><div className="space-y-6"><input required type="text" placeholder="Card Number" className="input-warm py-4" /><input required type="text" placeholder="Name" className="input-warm py-4" /><div className="grid grid-cols-2 gap-6"><input required type="text" placeholder="MM/YY" className="input-warm py-4" /><input required type="text" placeholder="CVC" className="input-warm py-4" /></div></div></div>
            <button disabled={submitting} type="submit" className="btn-boutique-primary w-full py-6 bg-slate-800 border-none cursor-pointer">{submitting ? <Loader2 className="animate-spin mx-auto"/> : "Pay with Card (Mock)"}</button>
          </form>
        )}
      </div>
    </div>
  );
}