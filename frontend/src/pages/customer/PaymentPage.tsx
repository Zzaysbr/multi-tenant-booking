import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Camera, Check, Loader2, ArrowLeft, Landmark, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentPage() {
  const { tenantPath, bookingId } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

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
    formData.append('slipFile', file); // ✅ ส่ง File Object

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

  return (
    <div className="min-h-screen bg-bg p-6 font-sans">
      <div className="max-w-md mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
        <header className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full"><ArrowLeft size={20}/></button>
          <h1 className="text-xl font-black text-secondary-foreground">แจ้งชำระเงิน</h1>
        </header>

        {/* --- QR Code Display --- */}
        <div className="bg-white p-8 rounded-[40px] text-center border-2 border-primary/5 shadow-xl shadow-primary/5">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Landmark size={32}/>
          </div>
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-4">Scan QR Code</p>
          <div className="w-56 h-56 bg-secondary mx-auto rounded-3xl border-8 border-white shadow-inner flex items-center justify-center overflow-hidden">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Payment-For-${bookingId}`} alt="QR" />
          </div>
        </div>

        {/* --- File Upload --- */}
        <div className="space-y-4">
          <label className="text-xs font-black uppercase text-accent ml-2">อัปโหลดสลิปโอนเงิน</label>
          <input type="file" id="slip-input" hidden onChange={handleFileChange} accept="image/*" />
          <label htmlFor="slip-input" className={`h-64 border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${preview ? 'border-emerald-500 bg-emerald-50' : 'border-accent/20 bg-white hover:border-primary/40'}`}>
            {preview ? (
              <img src={preview} alt="Slip Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center space-y-2 opacity-40">
                <Camera size={40} className="mx-auto" />
                <p className="text-[10px] font-black uppercase">คลิกเพื่อเลือกรูปภาพสลิป</p>
              </div>
            )}
          </label>
        </div>

        <button 
          disabled={submitting} 
          onClick={handleSubmit} 
          className="btn-primary w-full py-5 text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="animate-spin" /> : <><UploadCloud size={20} /> ยืนยันแจ้งโอนเงิน</>}
        </button>
      </div>
    </div>
  );
}