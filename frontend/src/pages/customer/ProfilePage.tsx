// src/pages/customer/ProfilePage.tsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from '../../components/layouts/CustomerNavbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { 
  User, Camera, Save, ArrowLeft, Lock, 
  ShieldCheck, Mail, Loader2, Trash2 
} from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    avatar_url: user?.avatar_url || null
  });

  // --- 📸 Logic: Handle Avatar Upload ---
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const res = await api.post('/api/user/upload-avatar', formData);
      const newAvatarUrl = res.data.avatarUrl;
      
      setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      
      // ✅ เช็คความปลอดภัยก่อน setUser เพื่อแก้ TypeScript Error 2345
      if (user) {
        setUser({ ...user, avatar_url: newAvatarUrl });
      }
      
      toast.success("อัปโหลดรูปโปรไฟล์เรียบร้อย");
    } catch (err) {
      toast.error("อัปโหลดไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setUploading(false);
    }
  };

  // --- 💾 Logic: Handle Profile Update ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/api/user/profile', { name: profile.name, phone: profile.phone });
      
      // ✅ เช็คความปลอดภัยก่อน setUser เพื่อแก้ TypeScript Error 2345
      if (user) {
        setUser({ ...user, name: profile.name, phone: profile.phone });
      }
      
      toast.success("บันทึกข้อมูลเรียบร้อยแล้ว");
    } catch (err) {
      toast.error("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = () => {
    toast.promise(api.post('/api/auth/forgot-password', { email: user?.email }), {
      loading: 'กำลังส่งลิงก์กู้คืน...',
      success: 'ส่งลิงก์ไปที่อีเมลของคุณแล้วครับ',
      error: 'เกิดข้อผิดพลาดในการส่งเมล'
    });
  };

  return (
    <div className="min-h-screen bg-bg font-sans pb-32 No Italic selection:bg-accent/20">
      <CustomerNavbar />
      
      <div className="max-w-6xl mx-auto px-6 pt-40">
        <header className="mb-16 flex items-center justify-between">
          <div className="space-y-4">
             <button onClick={() => navigate(-1)} className="text-[10px] font-black uppercase tracking-[0.3em] text-muted hover:text-primary transition-colors flex items-center gap-2 cursor-pointer">
                <ArrowLeft size={14} /> Go Back
             </button>
             <h1 className="text-5xl font-black text-primary tracking-tighter uppercase leading-none">Account Hub</h1>
             <p className="text-sm font-black text-muted uppercase tracking-widest opacity-60">Personal information & Identity security</p>
          </div>
          <div className="hidden lg:block">
             <div className="bg-white px-8 py-5 rounded-card shadow-premium border border-stone-50 text-center">
                <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-1">Account Standing</p>
                <p className="text-xl font-black text-primary uppercase">Active Member</p>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4 space-y-8 animate-in fade-in duration-700">
            <div className="card-cozy p-12 text-center space-y-8 shadow-premium border-none relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-[0.02] transition-opacity" />
              <div className="relative inline-block">
                <div className="w-48 h-48 bg-secondary rounded-[64px] flex items-center justify-center text-primary text-6xl font-black border-8 border-white shadow-inner overflow-hidden">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    profile.name.charAt(0).toUpperCase()
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-primary/40 flex items-center justify-center backdrop-blur-sm">
                       <Loader2 className="animate-spin text-white" size={32} />
                    </div>
                  )}
                </div>
                {/* ✅ ปรับเป็น rounded-3xl ตาม Tailwind v4 */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 p-5 bg-primary text-white rounded-3xl shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer border-4 border-white"
                >
                  <Camera size={20}/>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} hidden accept="image/*" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-primary uppercase tracking-tight leading-none">{profile.name}</h2>
                <p className="text-[10px] font-black text-accent uppercase tracking-[0.4em]">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-12 animate-in slide-in-from-right-8 duration-700">
            <form onSubmit={handleUpdate} className="card-cozy p-12 space-y-12 shadow-premium border-none">
              <section className="space-y-10">
                <div className="flex items-center gap-4 border-b border-stone-100 pb-6">
                   <div className="p-3 bg-secondary rounded-xl text-primary"><User size={20}/></div>
                   <h3 className="text-xs font-black text-primary uppercase tracking-[0.4em]">Personal Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Legal Identity Name</label>
                    <input type="text" className="input-warm py-5" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Full Name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Primary Contact Phone</label>
                    <input type="text" className="input-warm py-5" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="08x-xxx-xxxx" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Registered Email Address</label>
                  <div className="relative">
                     <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                     <input type="email" className="input-warm pl-16 py-5 opacity-40 cursor-not-allowed" value={user?.email || ""} disabled />
                  </div>
                </div>
              </section>
              <button type="submit" disabled={loading} className="btn-boutique-primary w-full md:w-auto px-16 py-6 shadow-premium cursor-pointer">
                {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Apply Personal Changes</>}
              </button>
            </form>

            <div className="card-cozy p-12 border-none bg-stone-50 flex flex-col md:flex-row items-center justify-between gap-10">
               <div className="space-y-3 text-center md:text-left flex-1">
                  <div className="flex items-center justify-center md:justify-start gap-3 text-accent mb-2">
                     <Lock size={20}/>
                     <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Identity Security</h3>
                  </div>
                  <p className="font-black text-primary text-xl uppercase tracking-tighter">Credential Recovery</p>
                  <p className="text-[11px] font-bold text-muted uppercase tracking-widest leading-relaxed">ต้องการเปลี่ยนรหัสผ่านใหม่? เราจะส่งลิงก์ยืนยันตัวตนไปยังอีเมลที่ผูกไว้กับบัญชีนี้ทันที</p>
               </div>
               <button onClick={handleResetRequest} className="btn-boutique-secondary px-12 py-5 border-stone-200 text-[10px] shadow-sm hover:shadow-lg cursor-pointer bg-white whitespace-nowrap">Request Reset Link</button>
            </div>

            <div className="pt-10 flex justify-center border-t border-stone-100">
               <button className="flex items-center gap-2 text-[10px] font-black text-rose-300 hover:text-rose-500 uppercase tracking-widest transition-colors cursor-pointer group">
                  <Trash2 size={14} className="group-hover:rotate-12 transition-transform" /> Permanently Delete Account
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}