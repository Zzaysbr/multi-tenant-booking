import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Camera, Loader2, ArrowLeft, Landmark, UploadCloud, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentPage() {
  const { tenantPath, bookingId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [shopConfig, setShopConfig] = useState<any>(null);

  useEffect(() => {
    // 🔍 เรียกไปที่ API สาธารณะของร้าน (ไม่ใช่ /owner/config)
    api.get(`/api/${tenantPath}/config`)
      .then(res => setShopConfig(res.data.config))
      .catch(() => toast.error("ไม่สามารถโหลดข้อมูลผู้รับเงินได้"))
      .finally(() => setLoading(false));
  }, [tenantPath]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("กรุณาอัปโหลดรูปสลิปก่อนค่ะ");
    
    setSubmitting(true);
    const formData = new FormData();
    formData.append('bookingId', bookingId!);
    formData.append('method', 'PromptPay');
    formData.append('slipFile', file); 

    try {
      await api.post(`/api/${tenantPath}/payments/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("ส่งหลักฐานสำเร็จ! กรุณารอทางร้านตรวจสอบนะคะ ✨");
      navigate(`/${tenantPath}/my-bookings`);
    } catch (e) {
      toast.error("อัปโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center italic text-accent animate-pulse">
      กำลังเตรียมข้อมูลการชำระเงิน...
    </div>
  );

  return (
    <div className="min-h-screen bg-bg p-6 font-sans">
      <div className="max-w-md mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
        
        <header className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-secondary/20 transition-all">
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 className="text-xl font-black text-secondary-foreground">แจ้งชำระเงิน</h1>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest">To: {shopConfig?.name}</p>
          </div>
        </header>

        {/* --- QR Code Section --- */}
        <div className="bg-white p-8 rounded-[40px] text-center border-2 border-primary/5 shadow-xl shadow-primary/5 space-y-4">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
            <Landmark size={32}/>
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Scan QR Code</p>
            <p className="text-sm font-bold text-secondary-foreground">{shopConfig?.name}</p>
          </div>

          {/* ✅ เปลี่ยน rounded-[32px] เป็น rounded-4xl ตามคำแนะนำ Tailwind */}
          <div className="w-64 h-64 bg-secondary mx-auto rounded-4xl border-8 border-white shadow-inner flex items-center justify-center overflow-hidden">
            {shopConfig?.qrCodeUrl ? (
              <img src={shopConfig.qrCodeUrl} alt="Shop QR" className="w-full h-full object-cover" />
            ) : (
              <div className="p-8 text-center space-y-2 opacity-40">
                <Info size={24} className="mx-auto" />
                <p className="text-[10px] font-bold tracking-tighter">
                  ร้านค้ายังไม่ได้ระบุ QR Code <br/> กรุณาติดต่อทางร้านโดยตรง
                </p>
              </div>
            )}
          </div>

          {shopConfig?.phone && (
            <div className="bg-secondary/30 py-2 px-4 rounded-full inline-block text-[10px] font-bold text-accent">
              เบอร์โทร: {shopConfig.phone}
            </div>
          )}
        </div>

        {/* --- File Upload --- */}
        <div className="space-y-4">
          <label className="text-xs font-black uppercase text-accent ml-2 tracking-widest">อัปโหลดสลิปโอนเงิน</label>
          <input type="file" id="slip-input" hidden onChange={handleFileChange} accept="image/*" />
          <label htmlFor="slip-input" className={`h-64 border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${preview ? 'border-emerald-500 bg-emerald-50' : 'border-accent/20 bg-white hover:border-primary/40'}`}>
            {preview ? (
              <img src={preview} alt="Slip Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center space-y-2 opacity-40">
                <Camera size={40} className="mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-tighter">คลิกเพื่อเลือกรูปภาพสลิป</p>
              </div>
            )}
          </label>
        </div>

        <button 
          disabled={submitting} 
          onClick={handleSubmit} 
          className="btn-primary w-full py-5 text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
        >
          {submitting ? <Loader2 className="animate-spin" /> : (
            <><UploadCloud size={20} /> ยืนยันและส่งหลักฐาน</>
          )}
        </button>
      </div>
    </div>
  );
}