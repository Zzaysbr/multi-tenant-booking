import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerAuthPage() {
  const { tenantPath } = useParams(); // 👈 ดึงชื่อร้านจาก URL (เช่น larn-1)
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true); // สลับโหมด Login / Register
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // 🟢 โหมด: เข้าสู่ระบบ (ลูกค้าหรือเจ้าของร้านก็ล็อกอินทางนี้ได้ถ้าระบบ Auth กลาง)
        const res = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        login(res.data.token, res.data.user);
        toast.success("เข้าสู่ระบบสำเร็จ!");
        
        // ล็อกอินเสร็จ เด้งกลับไปหน้าจองคิวของร้านนั้น
        navigate(`/${tenantPath}`); 
        
      } else {
        // 🔵 โหมด: สมัครสมาชิกลูกค้าใหม่
        const res = await api.post('/auth/register-customer', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          tenantPath: tenantPath // 👈 แอบส่งชื่อร้านไปให้ Backend รู้ด้วย!
        });
        login(res.data.token, res.data.user);
        toast.success("สมัครสมาชิกและเข้าสู่ระบบสำเร็จ!");
        navigate(`/${tenantPath}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        
        <div className="text-center">
          <h1 className="text-3xl font-black text-secondary-foreground capitalize">{tenantPath}</h1>
          <p className="text-accent mt-2 font-medium">
            {isLogin ? "เข้าสู่ระบบเพื่อจองคิว" : "สมัครสมาชิกเพื่อรับสิทธิพิเศษ"}
          </p>
        </div>

        <div className="card-cozy p-8!">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* ถ้าเป็นหน้าสมัครสมาชิก ถึงจะโชว์ช่องกรอกชื่อ */}
            {!isLogin && (
              <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                <label className="text-sm font-bold text-secondary-foreground">ชื่อ - นามสกุล</label>
                <input required type="text" className="input-warm w-full" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="เช่น สมชาย ใจดี" 
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-secondary-foreground">อีเมล</label>
              <input required type="email" className="input-warm w-full" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="email@example.com" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-secondary-foreground">รหัสผ่าน</label>
              <input required type="password" className="input-warm w-full" 
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••" 
              />
            </div>

            <button disabled={loading} type="submit" className="btn-primary w-full py-3 mt-6">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                <div className="flex justify-center items-center gap-2">
                  {isLogin ? <><LogIn size={18}/> เข้าสู่ระบบ</> : <><UserPlus size={18}/> สมัครสมาชิก</>}
                </div>
              )}
            </button>
          </form>

          {/* ปุ่มสลับโหมด */}
          <div className="mt-6 text-center text-sm font-medium text-accent">
            {isLogin ? "ยังไม่มีบัญชีใช่ไหม? " : "มีบัญชีอยู่แล้วใช่ไหม? "}
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setFormData({ name: '', email: '', password: '' }); }} 
              className="text-primary hover:underline font-bold"
            >
              {isLogin ? "สมัครสมาชิกที่นี่" : "เข้าสู่ระบบเลย"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}