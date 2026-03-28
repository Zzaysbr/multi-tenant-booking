import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // 👈 เพิ่ม useLocation
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Store, User, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation(); // 👈 ดึง state ที่ส่งมาจากหน้าอื่น
  const { login } = useAuth();
  
  // ดักฟังว่าเราถูกเตะมาจากหน้าไหน (เช่น มาจาก /larn-1)
  const from = location.state?.from || null;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'CUSTOMER' | 'OWNER'>('CUSTOMER');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', shopName: '', tenantPath: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      // 1. เก็บข้อมูลลง Context และ LocalStorage
      login(res.data.token, res.data.user);
      toast.success(mode === 'login' ? "เข้าสู่ระบบสำเร็จ!" : "ลงทะเบียนสำเร็จ!");

      // 2. 🚀 [หัวใจหลัก] Logic การส่งตัวผู้ใช้ไปหน้าต่างๆ
      
      // กฎข้อที่ 1: ถ้ามีหน้าเดิมที่ค้างไว้ (เช่น ลูกค้าจองคิวค้างไว้) ให้กลับไปหน้านั้นก่อน
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      // กฎข้อที่ 2: ถ้าไม่มีหน้าค้างไว้ ให้แยกตาม Role
      if (res.data.user.role === 'OWNER') {
        // เจ้าของร้านไปหลังบ้าน
        navigate('/owner/dashboard', { replace: true });
      } else {
        // ลูกค้าทั่วไปไปหน้าแรกเพื่อเลือกร้าน
        navigate('/', { replace: true });
      }

    } catch (err: any) {
      toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {/* --- สวิตช์สลับ Login / Register --- */}
        <div className="flex bg-secondary/30 p-1 rounded-full relative">
          <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-all duration-300 ${mode === 'register' ? 'left-[calc(50%+2px)]' : 'left-1'}`} />
          <button onClick={() => setMode('login')} className={`flex-1 py-3 text-sm font-bold z-10 transition-colors ${mode === 'login' ? 'text-primary' : 'text-accent'}`}>เข้าสู่ระบบ</button>
          <button onClick={() => setMode('register')} className={`flex-1 py-3 text-sm font-bold z-10 transition-colors ${mode === 'register' ? 'text-primary' : 'text-accent'}`}>สมัครสมาชิก</button>
        </div>

        <div className="bg-white p-8 rounded-card shadow-sm border border-accent/10 animate-in fade-in zoom-in duration-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* --- เลือกประเภทบัญชี (โชว์เฉพาะตอน Register) --- */}
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3 mb-6 animate-in slide-in-from-top-2">
                <button type="button" onClick={() => setRole('CUSTOMER')} className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${role === 'CUSTOMER' ? 'border-primary bg-primary/5 text-primary' : 'border-accent/20 text-accent hover:border-primary/50'}`}>
                  <User size={24} />
                  <span className="text-sm font-bold">ลูกค้าทั่วไป</span>
                </button>
                <button type="button" onClick={() => setRole('OWNER')} className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${role === 'OWNER' ? 'border-primary bg-primary/5 text-primary' : 'border-accent/20 text-accent hover:border-primary/50'}`}>
                  <Store size={24} />
                  <span className="text-sm font-bold">เปิดร้านค้าใหม่</span>
                </button>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-secondary-foreground">ชื่อ - นามสกุล</label>
                <input required type="text" className="input-warm w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="สมชาย ใจดี" />
              </div>
            )}

            {/* --- ฟอร์มพิเศษสำหรับเจ้าของร้าน --- */}
            {mode === 'register' && role === 'OWNER' && (
              <div className="space-y-4 p-4 bg-orange-50/50 rounded-xl border border-orange-100 animate-in zoom-in">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary-foreground">ชื่อร้านค้า</label>
                  <input required type="text" className="input-warm w-full" value={formData.shopName} onChange={e => setFormData({...formData, shopName: e.target.value})} placeholder="เช่น ลอเฟี้ยว บาร์เบอร์" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary-foreground">URL ลิงก์ร้านค้า</label>
                  <div className="flex items-center">
                    <span className="bg-secondary/50 px-3 py-3 border border-r-0 border-accent/20 rounded-l-xl text-accent text-sm">/</span>
                    <input required type="text" className="input-warm w-full rounded-l-none" value={formData.tenantPath} onChange={e => setFormData({...formData, tenantPath: e.target.value.replace(/[^a-zA-Z0-9-]/g, '')})} placeholder="larn-1" />
                  </div>
                </div>
              </div>
            )}

            {/* --- ข้อมูลพื้นฐาน --- */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-secondary-foreground">อีเมล</label>
              <input required type="email" className="input-warm w-full" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-secondary-foreground">รหัสผ่าน</label>
              <input required type="password" className="input-warm w-full" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
            </div>

            <button disabled={loading} type="submit" className="btn-primary w-full py-4 mt-6 text-lg shadow-xl shadow-primary/20">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                <div className="flex justify-center items-center gap-2">
                  {mode === 'login' ? <><LogIn size={20}/> เข้าสู่ระบบ</> : <><UserPlus size={20}/> ดำเนินการต่อ</>}
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}