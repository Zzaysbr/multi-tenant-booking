// src/pages/customer/PaymentPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'sonner';
import { 
  QrCode, Upload, ShieldCheck, ChevronLeft, 
  Loader2, Camera, Calendar, Clock, Scissors, Info 
} from 'lucide-react';

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
    const fetchPaymentData = async () => {
      try {
        // ✅ แก้ไข Path: เติม /api กลับเข้าไปให้ครบ
        const [bookingRes, shopRes] = await Promise.all([
          api.get(`/api/${tenantPath}/bookings/${bookingId}`),
          api.get(`/api/${tenantPath}/config`)
        ]);
        setBooking(bookingRes.data.booking);
        setShop(shopRes.data.config);
      } catch (err) {
        console.error("Load error:", err);
        navigate(`/${tenantPath}`);
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentData();
  }, [tenantPath, bookingId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipFile) return toast.error("กรุณาแนบภาพสลิปครับ");
    setSubmitting(true);
    const formData = new FormData();
    formData.append('slipFile', slipFile);
    try {
      // ✅ แก้ไข Path: เติม /api กลับเข้าไป
      await api.patch(`/api/${tenantPath}/bookings/${bookingId}/payment`, formData);
      toast.success("ส่งหลักฐานเรียบร้อย!");
      navigate(`/${tenantPath}/my-bookings`);
    } catch (err) {
      toast.error("ส่งไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center font-black text-accent animate-pulse font-sans">
      LOADING PAYMENT...
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-6 space-y-10 pb-20 font-sans No Italic">
       <header className="flex items-center gap-4 mt-6">
         <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl border border-stone-100 shadow-sm hover:bg-stone-50 transition-all">
           <ChevronLeft size={20}/>
         </button>
         <h1 className="text-xl font-black text-primary uppercase tracking-tighter">Secure Checkout</h1>
       </header>

       {/* Booking Details Card */}
       <div className="card-cozy p-10! bg-primary text-white border-none shadow-xl">
          <p className="text-[10px] font-black uppercase opacity-40 mb-6 tracking-[0.3em]">Summary</p>
          <div className="flex justify-between items-start mb-6">
             <div>
                <h2 className="text-2xl font-black uppercase leading-none mb-2">{booking?.serviceName}</h2>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest flex items-center gap-2"><Scissors size={12}/> {booking?.staffName}</p>
             </div>
             <p className="text-4xl font-black text-accent tracking-tighter">฿{booking?.price}</p>
          </div>
          <div className="pt-6 border-t border-white/10 flex justify-between text-[10px] font-black uppercase tracking-widest opacity-80">
             <span className="flex items-center gap-2"><Calendar size={14}/> {new Date(booking?.startTime).toLocaleDateString('th-TH')}</span>
             <span className="flex items-center gap-2"><Clock size={14}/> {new Date(booking?.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
          </div>
       </div>

       {/* QR Code Section */}
       <div className="card-cozy p-10! text-center space-y-8 border-stone-50">
         <h3 className="font-black text-primary uppercase tracking-widest text-xs flex items-center justify-center gap-2"><QrCode size={18}/> Scan to Pay</h3>
         <div className="bg-secondary p-6 rounded-card inline-block border-4 border-white shadow-inner relative">
           {shop?.qrCodeUrl ? (
             <img src={shop.qrCodeUrl} className="w-56 h-56 object-cover rounded-2xl mx-auto" alt="QR" />
           ) : (
             <div className="w-56 h-56 flex flex-col items-center justify-center text-stone-300 gap-2">
                <QrCode size={40} className="opacity-20" />
                <p className="text-[10px] font-black uppercase">No QR Code Available</p>
             </div>
           )}
         </div>
       </div>

       {/* Upload Form */}
       <form onSubmit={handleSubmit} className="space-y-8">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent px-2 flex items-center gap-2">
             <Camera size={14}/> Upload Pay Slip
          </label>
          <div className="relative group">
            <input 
              type="file" id="slip-upload" hidden 
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) { setSlipFile(file); setSlipPreview(URL.createObjectURL(file)); }
              }} 
              accept="image/*" 
            />
            <label 
              htmlFor="slip-upload" 
              className={`w-full aspect-video rounded-card border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${
                slipPreview ? 'border-accent shadow-lg shadow-accent/5' : 'border-stone-200 bg-white hover:border-accent'
              }`}
            >
              {slipPreview ? (
                <img src={slipPreview} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-2 opacity-40">
                  <Upload className="mx-auto" size={24} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Tap to upload slip</p>
                </div>
              )}
            </label>
          </div>
          <button 
            disabled={submitting || !slipFile} 
            type="submit" 
            className="btn-primary w-full py-6 text-lg shadow-2xl shadow-primary/30 disabled:opacity-30"
          >
            {submitting ? <Loader2 className="animate-spin"/> : <span className="flex items-center justify-center gap-2"><ShieldCheck size={22}/> ส่งสลิปยืนยันคิว</span>}
          </button>
       </form>
    </div>
  );
}