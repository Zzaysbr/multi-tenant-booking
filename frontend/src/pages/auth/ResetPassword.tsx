// src/pages/auth/ResetPassword.tsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Lock, KeyRound, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // ✅ ดึง Token จาก URL

  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.password !== passwords.confirmPassword) {
      return toast.error("รหัสผ่านไม่ตรงกันครับ");
    }
    if (passwords.password.length < 6) {
      return toast.error("รหัสผ่านควรมีความยาวอย่างน้อย 6 ตัวอักษร");
    }

    setLoading(true);
    try {
      // ✅ ส่ง Token และ Password ใหม่ไปที่ Backend
      await api.post('/auth/reset-password', { 
        token, 
        newPassword: passwords.password 
      });
      setIsSuccess(true);
      toast.success("เปลี่ยนรหัสผ่านเรียบร้อย");
      setTimeout(() => navigate('/login'), 3000); // Redirect หลังจาก 3 วิ
    } catch (err: any) {
      toast.error(err.response?.data?.error || "ลิงก์หมดอายุหรือผิดพลาด กรุณาขอใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg font-sans flex items-center justify-center px-6 py-20 No Italic">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-700">
        
        <div className="text-center space-y-4">
          <div className="inline-flex w-16 h-16 bg-primary rounded-3xl items-center justify-center text-accent shadow-premium mb-2">
            <KeyRound size={32} />
          </div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">New Credentials</h1>
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.4em]">Account Security</p>
        </div>

        <div className="card-cozy p-10 md:p-12 shadow-premium border-none">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-xl font-black text-primary uppercase leading-none">Reset Password</h2>
                <p className="text-xs font-bold text-muted leading-relaxed">
                  สร้างรหัสผ่านใหม่ที่ปลอดภัยและจดจำได้ง่ายสำหรับบัญชีของคุณ
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="input-warm pl-16"
                      value={passwords.password}
                      onChange={(e) => setPasswords({...passwords, password: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Confirm Password</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="input-warm pl-16"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <button 
                disabled={loading || !token}
                type="submit" 
                className="btn-boutique-primary w-full py-6 text-xs"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Update Password"}
              </button>

              {!token && (
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                  <p className="text-[10px] font-bold text-rose-500 text-center uppercase">
                    Invalid or missing token. Please request a new link.
                  </p>
                </div>
              )}
            </form>
          ) : (
            <div className="text-center space-y-8 py-6 animate-in zoom-in duration-500">
               <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={32} />
               </div>
               <div className="space-y-3">
                  <h2 className="text-xl font-black text-primary uppercase">All Set!</h2>
                  <p className="text-xs font-bold text-muted leading-relaxed">
                     รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว <br/>
                     เรากำลังพาคุณกลับไปหน้าล็อกอินในอึดใจเดียว...
                  </p>
               </div>
               <div className="flex justify-center">
                  <Loader2 className="animate-spin text-accent" size={24} />
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}