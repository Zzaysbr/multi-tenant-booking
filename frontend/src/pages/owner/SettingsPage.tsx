import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Store, Save, Loader2, Camera, HelpCircle, Clock, ImageIcon, Settings, MessageSquare, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showLineGuide, setShowLineGuide] = useState(false);
  
  const [config, setConfig] = useState({ 
    name: '', phone: '', address: '', qrCodeUrl: '', logo_url: '', 
    line_bot_id: '', line_channel_token: '', line_user_id: '' 
  });
  const [schedules, setSchedules] = useState<any[]>([]);

  const getFullImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; 
    const backendUrl = API_BASE.replace('/api', '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${backendUrl}${cleanPath}`;
  };

  useEffect(() => {
    if (!user?.tenantPath) return;
    const f = async () => {
      try {
        const [c, h] = await Promise.all([
          api.get(`/config`), 
          api.get(`/owner/business-hours`) 
        ]);
        
        const conf = c.data.config;
        setConfig({ 
          name: conf.name || '', phone: conf.phone || '', address: conf.address || '', 
          qrCodeUrl: conf.qrCodeUrl || '', logo_url: conf.logo_url || '', 
          line_bot_id: conf.line_bot_id || '', line_channel_token: conf.line_channel_token || '', 
          line_user_id: conf.line_user_id || '' 
        });

        const dbH = h.data.businessHours || [];
        setSchedules(Array.from({ length: 7 }, (_, i) => 
          dbH.find((x: any) => x.dayOfWeek === i) || 
          { dayOfWeek: i, openTime: '09:00', closeTime: '20:00', isClosed: false }
        ));
      } catch (err) { toast.error("โหลดข้อมูลล้มเหลว"); } finally { setLoading(false); }
    };
    f();
  }, [user]);

  const hSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await Promise.all([
        api.patch(`/owner/config`, config),
        api.patch(`/owner/business-hours`, { schedules })
      ]);
      toast.success("บันทึกข้อมูลเรียบร้อย ✨");
    } catch (err) { toast.error("บันทึกล้มเหลว"); } finally { setSaving(false); }
  };

  const hUpload = async (file: File, type: 'shop' | 'qr') => {
    const fd = new FormData(); 
    fd.append(type === 'shop' ? 'shopFile' : 'qrFile', file);
    setUploading(type);
    try {
      const res = await api.post(`/owner/config/${type}-upload`, fd);
      if (type === 'shop') setConfig(p => ({ ...p, logo_url: res.data.shopImageUrl }));
      else setConfig(p => ({ ...p, qrCodeUrl: res.data.qrCodeUrl }));
      toast.success("อัปโหลดสำเร็จ!");
    } catch (err) { toast.error("อัปโหลดล้มเหลว"); } finally { setUploading(null); }
  };

  if (loading) return <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse"><Loader2 className="animate-spin mb-4" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24 font-sans">
      <header className="space-y-1"><h1 className="text-4xl font-black text-primary tracking-tighter uppercase flex items-center gap-4"><Settings size={36}/> Settings</h1></header>
      <form onSubmit={hSave} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="card-cozy p-0 overflow-hidden shadow-xl bg-white group relative h-80">
            {config.logo_url ? <img src={getFullImageUrl(config.logo_url)!} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50 text-stone-300"><ImageIcon size={48} className="mb-4 opacity-10"/></div>}
            <input type="file" id="shop" hidden onChange={e => e.target.files?.[0] && hUpload(e.target.files[0], 'shop')} accept="image/*" />
            <label htmlFor="shop" className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer">
              {/* ✅ เรียกใช้งาน uploading ตรงนี้ Vercel จะได้ไม่บ่นครับ */}
              {uploading === 'shop' ? <Loader2 className="animate-spin" size={32}/> : <Camera size={32}/>}
            </label>
          </div>
          <div className="card-cozy p-10! bg-white">
            <h3 className="text-xs font-black text-primary uppercase mb-10 flex gap-3"><Store size={16} className="text-accent"/> Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2"><label className="text-[9px] font-black uppercase text-muted">Store Name</label><input required className="input-warm" value={config.name} onChange={e => setConfig({...config, name: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[9px] font-black uppercase text-muted">Hotline</label><input className="input-warm" value={config.phone} onChange={e => setConfig({...config, phone: e.target.value})} /></div>
              <div className="md:col-span-2 space-y-2"><label className="text-[9px] font-black uppercase text-muted">Location</label><textarea rows={3} className="input-warm" value={config.address} onChange={e => setConfig({...config, address: e.target.value})} /></div>
            </div>
          </div>
          <div className="card-cozy p-10! bg-white">
            <h3 className="text-xs font-black text-primary uppercase mb-10 flex gap-3"><Clock size={16} className="text-accent"/> Schedule</h3>
            <div className="space-y-3">
              {schedules.map((s, i) => (
              <div key={i} className={`flex items-center justify-between p-5 border rounded-3xl ${s.isClosed ? 'opacity-40 bg-stone-50' : 'bg-white'}`}>
                <span className="text-[11px] font-black w-24 text-primary">{DAYS[s.dayOfWeek]}</span>
                <div className="flex gap-4"><input type="time" disabled={s.isClosed} className="input-warm py-2" value={s.openTime} onChange={e => setSchedules(prev => prev.map(x => x.dayOfWeek === i ? {...x, openTime: e.target.value} : x))} /><input type="time" disabled={s.isClosed} className="input-warm py-2" value={s.closeTime} onChange={e => setSchedules(prev => prev.map(x => x.dayOfWeek === i ? {...x, closeTime: e.target.value} : x))} /></div>
                <label className="flex items-center gap-3 text-[9px] font-black text-muted"><input type="checkbox" checked={s.isClosed} className="w-5 h-5" onChange={e => setSchedules(prev => prev.map(x => x.dayOfWeek === i ? {...x, isClosed: e.target.checked} : x))} /> Closed</label>
              </div>
            ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-10">
          <div className="card-cozy p-10! text-center space-y-6 bg-white">
            <div className="relative group mx-auto w-45 aspect-square">
              <div className="w-full h-full bg-secondary rounded-4xl border-4 border-white overflow-hidden">
                {config.qrCodeUrl ? <img src={getFullImageUrl(config.qrCodeUrl)!} className="w-full h-full object-cover" /> : <Camera size={32} className="mx-auto mt-20 opacity-10" />}
              </div>
              <input type="file" id="qr" hidden onChange={e => e.target.files?.[0] && hUpload(e.target.files[0], 'qr')} accept="image/*" />
              <label htmlFor="qr" className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer rounded-4xl text-white">
                {/* ✅ เรียกใช้งาน uploading ตรงนี้ Vercel จะได้ไม่บ่นครับ */}
                {uploading === 'qr' ? <Loader2 className="animate-spin" size={24}/> : <Camera size={24}/>}
              </label>
            </div>
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted">Scan to Pay (Owner QR)</p>
          </div>
          
          {/* --- 🤖 LINE Engine (พับเก็บไว้ก่อนเพื่อความเรียบง่าย แต่ยังใส่กลับมาให้ครับ) --- */}
          <div className="card-cozy p-10! border-stone-100 bg-stone-50/50 space-y-8 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-emerald-800 flex items-center gap-2 uppercase tracking-widest">
                <MessageSquare size={16}/> LINE Engine
              </h3>
              <button type="button" onClick={() => setShowLineGuide(!showLineGuide)} className="text-emerald-600 cursor-pointer">
                {showLineGuide ? <X size={20}/> : <HelpCircle size={20}/>}
              </button>
            </div>
            {showLineGuide && (
              <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 text-[10px] font-black text-emerald-900 leading-relaxed uppercase">
                • Line Dev Console<br/>• Get Access Token<br/>• Send "ID" to bot
              </div>
            )}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-emerald-800/60 px-2">Bot ID</label>
                <input className="input-warm w-full text-xs" value={config.line_bot_id} onChange={e => setConfig({...config, line_bot_id: e.target.value})}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-emerald-800/60 px-2">Owner ID</label>
                <input className="input-warm w-full text-xs font-mono" value={config.line_user_id} onChange={e => setConfig({...config, line_user_id: e.target.value})}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-emerald-800/60 px-2">Token</label>
                <input type="password" className="input-warm w-full text-xs font-mono" value={config.line_channel_token} onChange={e => setConfig({...config, line_channel_token: e.target.value})}/>
              </div>
            </div>
          </div>

          <button disabled={saving} type="submit" className="btn-boutique-primary w-full py-6 cursor-pointer group">
            {saving ? <Loader2 className="animate-spin mx-auto"/> : <div className="flex justify-center gap-3"><Save size={18}/> Commit System Changes</div>}
          </button>
        </div>
      </form>
    </div>
  );
}