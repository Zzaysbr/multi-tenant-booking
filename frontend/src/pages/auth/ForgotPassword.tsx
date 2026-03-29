// src/pages/auth/ForgotPassword.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Mail, ArrowLeft, ShieldCheck, Loader2, Sparkles } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ✅ ยิงไปที่ API สำหรับขอ Reset Password
      await api.post('/auth/forgot-password', { email });
      setIsSent(true);
      toast.success("ส่งลิงก์กู้คืนเรียบร้อยแล้ว");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg font-sans flex items-center justify-center px-6 py-20 No Italic">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-700">
        
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex w-16 h-16 bg-primary rounded-[24px] items-center justify-center text-accent shadow-premium mb-2">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Security Center</h1>
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.4em]">Recovery Flow</p>
        </div>

        <div className="card-cozy p-10 md:p-12 shadow-premium border-none relative overflow-hidden">
          {/* Subtle Decorative Background */}
          <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
             <Sparkles size={80} />
          </div>

          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="space-y-2">
                <h2 className="text-xl font-black text-primary uppercase leading-none">Forgot Password?</h2>
                <p className="text-xs font-bold text-muted leading-relaxed">
                  ไม่ต้องกังวลครับ ระบุอีเมลที่ใช้สมัครสมาชิก แล้วเราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้ทันที
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Account Email</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                    <input 
                      type="email" 
                      required
                      placeholder="name@example.com"
                      className="input-warm pl-16"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button 
                disabled={loading}
                type="submit" 
                className="btn-boutique-primary w-full py-6 text-xs"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Send Recovery Link"}
              </button>

              <button 
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-muted hover:text-primary uppercase tracking-widest transition-colors"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </form>
          ) : (
            <div className="text-center space-y-8 py-6 relative z-10 animate-in fade-in slide-in-from-bottom-4">
               <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Mail size={32} />
               </div>
               <div className="space-y-3">
                  <h2 className="text-xl font-black text-primary uppercase">Check Your Email</h2>
                  <p className="text-xs font-bold text-muted leading-relaxed">
                     เราได้ส่งขั้นตอนการเปลี่ยนรหัสผ่านไปที่ <br/>
                     <span className="text-primary font-black underline decoration-accent/30">{email}</span> แล้วครับ
                  </p>
               </div>
               <div className="pt-4">
                  <button 
                    onClick={() => navigate('/login')}
                    className="btn-boutique-primary w-full"
                  >
                    Return to Login
                  </button>
               </div>
               <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  Didn't receive? Check your spam folder
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}