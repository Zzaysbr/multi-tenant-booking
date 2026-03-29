// src/pages/auth/AuthPage.tsx
import { useState, useMemo } from 'react'; // ✅ เพิ่ม useMemo
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Loader2, Mail, Lock, LayoutGrid,
  Eye, EyeOff, Zap, LogIn, UserPlus, Check, X // ✅ เพิ่ม Check, X
} from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from || null;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'CUSTOMER' | 'OWNER'>('CUSTOMER');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', shopName: '', tenantPath: '' });

  // ✅ [NEW] Password Validation Logic
  const passwordStatus = useMemo(() => {
    const hasMinLength = formData.password.length >= 8;
    const hasNumber = /\d/.test(formData.password);
    return {
      hasMinLength,
      hasNumber,
      isValid: hasMinLength && hasNumber
    };
  }, [formData.password]);

  const handleGoogleLogin = () => {
    const callbackPath = from ? encodeURIComponent(from) : '';
    const rawApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    const backendRoot = rawApiUrl.replace('/api', '');
    window.location.href = `${backendRoot}/auth/google?redirect=${callbackPath}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ กันเหนียว: ถ้าสมัครสมาชิกแล้วรหัสไม่ผ่านเกณฑ์ ไม่ต้องยิง API
    if (mode === 'register' && !passwordStatus.isValid) {
      toast.error("กรุณาตั้งรหัสผ่านให้ตรงตามเงื่อนไขความปลอดภัย");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : (role === 'OWNER' ? '/auth/create-shop' : '/auth/register');
      const payload = mode === 'login' 
        ? { email: formData.email, password: formData.password }
        : (role === 'OWNER' 
            ? { ownerName: formData.name, email: formData.email, password: formData.password, shopName: formData.shopName, tenantPath: formData.tenantPath.toLowerCase() }
            : { name: formData.name, email: formData.email, password: formData.password }
          );

      const res = await api.post(endpoint, payload);
      login(res.data.token, res.data.user);
      toast.success("ยินดีต้อนรับเข้าสู่ระบบ");
      navigate(from || (res.data.user.role === 'OWNER' ? '/owner/dashboard' : '/'), { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "ข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-bg flex font-sans No Italic selection:bg-accent/20">
      
      {/* --- Left Column: Guide (Hidden on Mobile) --- */}
      <section className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-20">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-125 h-125 bg-accent rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 space-y-12">
          <Link to="/" className="flex items-center gap-4 group cursor-pointer">
            <div className="w-12 h-12 bg-accent rounded-[18px] flex items-center justify-center text-primary shadow-2xl transition-transform group-hover:rotate-12">
              <LayoutGrid size={24} />
            </div>
            <span className="text-2xl font-black text-white uppercase tracking-tighter">Cozy Bookings</span>
          </Link>
          <div className="space-y-6 max-w-lg">
            <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-[0.9]">
              Elevate<br /><span className="text-accent">Service</span><br />Scheduling
            </h2>
            <p className="text-white/80 text-lg font-medium leading-relaxed uppercase tracking-tight">
              ศูนย์รวมการจัดการคิวระดับพรีเมียม เพื่อประสบการณ์ที่ราบรื่นที่สุดของธุรกิจคุณ
            </p>
          </div>
          <div className="grid gap-8 pt-10">
            <div className="flex items-start gap-5">
               <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-accent shrink-0"><Zap size={20}/></div>
               <div className="space-y-1">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">Instant Sync</h4>
                  <p className="text-xs font-bold text-white/50 uppercase tracking-tight">อัปเดตสถานะคิวเรียลไทม์ แม่นยำทุกเสี้ยววินาที</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Right Column: Form --- */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-20 relative">
        <div className="max-w-110 w-full space-y-10 animate-in fade-in slide-in-from-right-8 duration-1000">
          
          <header className="space-y-2 text-center lg:text-left">
            <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">
              {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </h1>
            <p className="text-sm font-bold text-primary/40 uppercase tracking-widest">
              {mode === 'login' ? 'กรุณาระบุข้อมูลเพื่อเข้าใช้งาน' : 'เข้าร่วมเครือข่ายพาร์ทเนอร์ของเราวันนี้'}
            </p>
          </header>

          {/* Social Login */}
          <button 
            type="button"
            onClick={handleGoogleLogin} 
            className="w-full flex items-center justify-center gap-4 py-5 px-6 border border-stone-200 rounded-2xl hover:bg-white hover:border-accent/30 transition-all font-black text-[11px] uppercase tracking-[0.2em] shadow-sm cursor-pointer"
          >
             <div className="w-5 h-5 flex items-center justify-center bg-white rounded-md border border-stone-50">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-3" alt="G" />
             </div>
             Continue with Google
          </button>

          <div className="flex items-center gap-4 text-[9px] font-black text-stone-200 uppercase tracking-[0.3em]">
             <div className="h-px flex-1 bg-stone-100" /> 
             หรือระบุข้อมูลบัญชี 
             <div className="h-px flex-1 bg-stone-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <div className="p-1.5 bg-stone-100/50 rounded-[22px] flex border border-stone-100 mb-6">
                 <button type="button" onClick={() => setRole('CUSTOMER')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[16px] transition-all cursor-pointer ${role === 'CUSTOMER' ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}>ลูกค้าทั่วไป</button>
                 <button type="button" onClick={() => setRole('OWNER')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[16px] transition-all cursor-pointer ${role === 'OWNER' ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}>เจ้าของธุรกิจ</button>
              </div>
            )}

            <div className="space-y-5">
              {mode === 'register' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-2">ชื่อที่แสดงในระบบ</label>
                  <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                    <input required type="text" className="input-warm pl-16" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="สมชาย ใจดี" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-2">อีเมลบัญชี</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                  <input required type="email" className="input-warm pl-16" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/60">รหัสผ่าน</label>
                  {mode === 'login' && (
                    <Link to="/forgot-password" className="text-[10px] font-black text-accent uppercase tracking-widest hover:text-primary transition-colors cursor-pointer">
                       ลืมรหัสผ่าน?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                  <input required type={showPassword ? "text" : "password"} className="input-warm pl-16 pr-14" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-300 hover:text-accent cursor-pointer transition-colors">
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>

                {/* ✅ [NEW] Password Strength Indicators (เฉพาะตอน Register) */}
                {mode === 'register' && (
                  <div className="px-2 pt-2 space-y-2">
                    <div className="flex items-center gap-2 transition-colors duration-300">
                      {passwordStatus.hasMinLength ? <Check size={12} className="text-green-500" /> : <X size={12} className="text-stone-300" />}
                      <span className={`text-[9px] font-black uppercase tracking-widest ${passwordStatus.hasMinLength ? 'text-primary' : 'text-stone-300'}`}>อย่างน้อย 8 ตัวอักษร</span>
                    </div>
                    <div className="flex items-center gap-2 transition-colors duration-300">
                      {passwordStatus.hasNumber ? <Check size={12} className="text-green-500" /> : <X size={12} className="text-stone-300" />}
                      <span className={`text-[9px] font-black uppercase tracking-widest ${passwordStatus.hasNumber ? 'text-primary' : 'text-stone-300'}`}>ต้องมีตัวเลขประกอบ</span>
                    </div>
                  </div>
                )}
              </div>

              {mode === 'register' && role === 'OWNER' && (
                <div className="space-y-5 p-6 bg-stone-50 rounded-4xl border border-stone-100 animate-in zoom-in">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-accent">ชื่อธุรกิจของคุณ</label>
                      <input required type="text" className="input-warm" value={formData.shopName} onChange={e => setFormData({...formData, shopName: e.target.value})} placeholder="เช่น Skyline Studio" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-accent">URL ของร้านค้า</label>
                      <div className="flex items-center">
                        <span className="bg-white px-4 py-4 border border-r-0 border-stone-200 rounded-l-[16px] text-stone-300 text-xs font-black">/</span>
                        <input required type="text" className="input-warm rounded-l-none" value={formData.tenantPath} onChange={e => setFormData({...formData, tenantPath: e.target.value.replace(/[^a-zA-Z0-9-]/g, '')})} placeholder="skyline" />
                      </div>
                   </div>
                </div>
              )}
            </div>

            <button 
              disabled={loading || (mode === 'register' && !passwordStatus.isValid)} 
              type="submit" 
              className={`btn-boutique-primary w-full py-6 text-sm shadow-premium cursor-pointer transition-opacity ${(mode === 'register' && !passwordStatus.isValid) ? 'opacity-50 grayscale cursor-not-allowed' : 'opacity-100'}`}
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <div className="flex items-center justify-center gap-3">
                  {mode === 'login' ? <LogIn size={18}/> : <UserPlus size={18}/>}
                  <span>{mode === 'login' ? 'เข้าสู่ระบบตอนนี้' : 'สร้างบัญชีผู้ใช้'}</span>
                </div>
              )}
            </button>
          </form>

          <footer className="text-center pt-6">
             <p className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">
                {mode === 'login' ? 'ยังไม่มีบัญชีผู้ใช้?' : 'เป็นสมาชิกอยู่แล้ว?'} {' '}
                <button 
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-primary font-black hover:text-accent transition-colors underline decoration-accent/30 underline-offset-4 cursor-pointer"
                >
                   {mode === 'login' ? 'สมัครสมาชิกที่นี่' : 'เข้าสู่ระบบ'}
                </button>
             </p>
          </footer>
        </div>
      </section>
    </div>
  );
}

// function GuideItem({ icon, title, desc }: any) {
//   return (
//     <div className="flex items-start gap-5">
//       <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-accent shrink-0">{icon}</div>
//       <div className="space-y-1">
//         <h4 className="text-sm font-black text-white uppercase tracking-wider">{title}</h4>
//         <p className="text-xs font-bold text-white/60 leading-relaxed uppercase tracking-tight">{desc}</p>
//       </div>
//     </div>
//   );
// }