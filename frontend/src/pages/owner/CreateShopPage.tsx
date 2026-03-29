// src/pages/owner/CreateShopPage.tsx
import { useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Store, Link2, Loader2, Sparkles, ArrowRight } from 'lucide-react';

export default function CreateShopPage() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', path_name: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ตรวจสอบภาษาอังกฤษและตัวเลขเท่านั้นสำหรับ URL
    const pathRegex = /^[a-z0-9-]+$/;
    if (!pathRegex.test(formData.path_name)) {
      return toast.error("URL ร้านต้องเป็นภาษาอังกฤษตัวเล็ก ตัวเลข หรือขีดกลาง (-) เท่านั้น");
    }

    setLoading(true);
    try {
      const res = await api.post('/api/user/create-shop', formData);
      toast.success("สร้างร้านค้าสำเร็จ! ยินดีต้อนรับครับ ✨");
      
      // อัปเดต Context ทันทีเพื่อให้ระบบรู้ว่ามีร้านแล้ว
      if (user) {
        setUser({ ...user, tenantPath: res.data.tenant.path_name });
      }
      
      // พาส่งไปหน้า Dashboard ของร้าน
      setTimeout(() => {
        window.location.href = '/owner/dashboard'; // ใช้ window.location เพื่อบังคับรีโหลดสเตท
      }, 1500);

    } catch (err: any) {
      toast.error(err.response?.data?.error || "ไม่สามารถสร้างร้านได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans No Italic">
      <div className="max-w-xl w-full bg-white rounded-[40px] p-12 shadow-2xl relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full flex items-start justify-end p-6">
          <Sparkles size={24} className="text-accent" />
        </div>

        <header className="mb-10 space-y-2">
          <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg">
            <Store size={32} />
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tighter uppercase leading-none">Setup Your Boutique</h1>
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">เริ่มต้นสร้างร้านค้าของคุณบนแพลตฟอร์ม</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary px-2">Store Name (ชื่อร้าน)</label>
            <input 
              required type="text" 
              className="input-warm py-5 text-lg" 
              placeholder="เช่น Cozy Barber Shop"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary px-2 flex items-center gap-2">
              <Link2 size={14}/> URL Path (ลิงก์ร้านค้า)
            </label>
            <div className="flex items-center bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden focus-within:border-accent transition-colors shadow-inner">
              <div className="px-5 py-5 bg-stone-100 text-stone-400 font-bold text-xs uppercase tracking-widest border-r border-stone-200">
                cozy.com/
              </div>
              <input 
                required type="text" 
                className="w-full px-5 py-5 bg-transparent outline-none font-mono text-primary placeholder-stone-300" 
                placeholder="cozy-barber"
                value={formData.path_name}
                onChange={e => setFormData({...formData, path_name: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
              />
            </div>
            <p className="text-[9px] font-bold text-muted px-2 uppercase tracking-widest">ใช้ภาษาอังกฤษตัวเล็กและขีดกลางเท่านั้น</p>
          </div>

          <button disabled={loading || !formData.name || !formData.path_name} type="submit" className="btn-boutique-primary w-full py-6 mt-4 shadow-premium cursor-pointer group">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : (
              <div className="flex items-center justify-center gap-3">
                <span>Create My Store</span> <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}