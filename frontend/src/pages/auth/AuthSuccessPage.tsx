// src/pages/auth/AuthSuccessPage.tsx
import { useEffect, useRef } from 'react'; // ✅ เพิ่ม useRef
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const isProcessed = useRef(false); // ✅ สลักนิรภัยกันวนลูป

  useEffect(() => {
    // 🚩 ถ้าประมวลผลไปแล้ว ให้หยุดการทำงาน (ป้องกัน Infinite Loop และ Double Call)
    if (isProcessed.current) return;

    const token = searchParams.get('token');
    const userDataRaw = searchParams.get('user');
    const redirectParam = searchParams.get('redirect');

    if (token && userDataRaw) {
      try {
        isProcessed.current = true; // ✅ มาร์คว่าเริ่มทำงานแล้ว
        
        const userData = JSON.parse(decodeURIComponent(userDataRaw));
        login(token, userData);
        
        toast.success(`ยินดีต้อนรับคุณ ${userData.name}`);

        // ✅ คำนวณหาหน้าที่จะไป
        const targetPath = (redirectParam && redirectParam !== 'null' && redirectParam !== '') 
          ? decodeURIComponent(redirectParam) 
          : (userData.role === 'OWNER' ? '/owner/dashboard' : '/');
        
        setTimeout(() => {
          navigate(targetPath, { replace: true });
        }, 1500);

      } catch (err) {
        console.error("Auth Success Error:", err);
        toast.error("การประมวลผลข้อมูลล้มเหลว");
        navigate('/login', { replace: true });
      }
    } else {
      // ถ้าไม่มีข้อมูลสำคัญ ให้ดีดกลับหน้า Login
      navigate('/login', { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 font-sans No Italic">
      <div className="max-w-sm w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
        
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-white rounded-4xl flex items-center justify-center text-accent shadow-premium border border-stone-50 relative z-10">
            <ShieldCheck size={48} strokeWidth={1.5} />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-accent animate-bounce shadow-lg">
            <Sparkles size={16} />
          </div>
          <div className="absolute inset-0 w-24 h-24 border-4 border-accent/20 rounded-4xl animate-ping opacity-20" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Verifying Identity</h1>
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] leading-relaxed">
            กำลังตรวจสอบความปลอดภัยและสร้างเซสชันพาร์ทเนอร์
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-accent" size={24} />
          <div className="h-1 w-32 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-progress-loading" style={{ width: '60%' }} />
          </div>
        </div>

      </div>
    </div>
  );
}