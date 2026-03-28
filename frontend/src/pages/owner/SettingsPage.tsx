import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { 
  Store, Phone, MapPin, QrCode, Save, Loader2, 
  Camera, BellRing, HelpCircle, X, Clock, Globe, 
  Image as LucideImage, ImageIcon, Info, Settings
} from 'lucide-react';

const DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLineGuide, setShowLineGuide] = useState(false);
  
  const [config, setConfig] = useState({ 
    name: '', phone: '', address: '', qrCodeUrl: '', logo_url: '',
    lineBotId: '', lineChannelToken: '', lineUserId: '' 
  });
  
  const [schedules, setSchedules] = useState<any[]>(
    Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, openTime: '09:00', closeTime: '20:00', isClosed: false }))
  );
  
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, hoursRes] = await Promise.all([
          api.get(`/api/${user?.tenantPath}/config`),
          api.get(`/api/${user?.tenantPath}/business-hours`)
        ]);
        
        const c = configRes.data.config;
        setConfig({
          name: c.name || '',
          phone: c.phone || '',
          address: c.address || '',
          qrCodeUrl: c.qrCodeUrl || '',
          logo_url: c.logo_url || '',
          lineBotId: c.line_bot_id || '', 
          lineChannelToken: c.line_channel_token || '',
          lineUserId: c.line_user_id || ''
        });
        setQrPreview(c.qrCodeUrl);

        if (hoursRes.data.businessHours?.length > 0) {
          setSchedules(hoursRes.data.businessHours);
        }
      } catch (err) {
        toast.error("ไม่สามารถโหลดข้อมูลการตั้งค่าได้");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.tenantPath]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all([
        api.patch(`/api/${user?.tenantPath}/owner/config`, {
          ...config,
          line_bot_id: config.lineBotId,
          lineChannelToken: config.lineChannelToken,
          lineUserId: config.lineUserId
        }),
        api.patch(`/api/${user?.tenantPath}/business-hours`, { schedules })
      ]);
      toast.success("บันทึกการตั้งค่าแบรนด์ของคุณเรียบร้อยแล้ว ✨");
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleShopUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('shopFile', e.target.files[0]);
      try {
        const res = await api.post(`/api/${user?.tenantPath}/owner/config/shop-upload`, formData);
        setConfig(prev => ({ ...prev, logo_url: res.data.shopImageUrl }));
        toast.success("อัปโหลดรูปภาพหน้าร้านสำเร็จ! 📸");
      } catch (err) { toast.error("อัปโหลดรูปภาพล้มเหลว"); }
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('qrFile', e.target.files[0]);
      try {
        const res = await api.post(`/api/${user?.tenantPath}/owner/config/qr-upload`, formData);
        setQrPreview(res.data.qrCodeUrl);
        toast.success("อัปโหลด QR Code สำเร็จ");
      } catch (err) { toast.error("อัปโหลด QR ล้มเหลว"); }
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-primary animate-pulse italic">
       <Loader2 className="animate-spin mb-4" size={40} />
       <p className="font-black text-[10px] uppercase tracking-widest text-accent">เข้าสู่โหมดการตั้งค่าแบรนด์...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24 font-sans text-secondary-foreground No Italic">
      
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-primary tracking-tighter flex items-center gap-4 uppercase"><Settings size={36} /> Settings</h1>
        <p className="text-muted text-sm font-medium tracking-widest uppercase text-[10px]">Configure your brand and store operations</p>
      </header>

      <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* --- ฝั่งซ้าย: รูปภาพและข้อมูลหลัก --- */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 🖼️ ส่วนอัปโหลดรูปหน้าร้าน (Shop Cover) */}
          <div className="card-cozy p-0 border-stone-100 overflow-hidden shadow-xl shadow-black/5">
            <div className="relative h-72 bg-stone-100 group">
              {config.logo_url ? (
                <img src={config.logo_url} className="w-full h-full object-cover" alt="Shop Cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 gap-2 font-black text-[10px] uppercase tracking-widest"><LucideImage size={48} className="mb-2"/> No Cover Photo</div>
              )}
              <input type="file" id="shop-upload" hidden onChange={handleShopUpload} accept="image/*" />
              <label htmlFor="shop-upload" className="absolute inset-0 bg-primary/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white cursor-pointer font-black text-xs uppercase tracking-widest"><Camera size={32} className="mb-2"/> Change Cover Photo (16:9)</label>
            </div>
          </div>

          {/* ข้อมูลพื้นฐาน */}
          <div className="card-cozy p-10! border-stone-100 space-y-8">
            <h3 className="text-lg font-black text-primary border-b border-stone-50 pb-4 uppercase tracking-widest">General Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <input required className="input-warm" value={config.name} onChange={e => setConfig({...config, name: e.target.value})} placeholder="Brand / Business Name" />
              <input className="input-warm" value={config.phone} onChange={e => setConfig({...config, phone: e.target.value})} placeholder="Phone Number" />
              <textarea rows={3} className="input-warm md:col-span-2 Pt-5" value={config.address} onChange={e => setConfig({...config, address: e.target.value})} placeholder="Business Address" />
            </div>
          </div>

          {/* เวลาทำการ */}
          <div className="card-cozy p-10! border-stone-100 space-y-8">
            <h3 className="text-lg font-black text-primary border-b border-stone-50 pb-4 uppercase tracking-widest">Business Hours</h3>
            <div className="space-y-3">
              {DAYS.map((day, idx) => {
                const s = schedules.find(item => item.dayOfWeek === idx) || { dayOfWeek: idx, openTime: '09:00', closeTime: '20:00', isClosed: false };
                return (
                  <div key={idx} className={`flex flex-col md:flex-row items-center justify-between p-5 rounded-[24px] border transition-all ${s.isClosed ? 'bg-stone-50 border-stone-100 opacity-40' : 'bg-white border-stone-100 shadow-sm'}`}>
                    <span className="text-xs font-black w-32 mb-4 md:mb-0 uppercase tracking-widest">{day}</span>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <input type="time" disabled={s.isClosed} className="input-warm py-2 px-4 text-xs w-full" value={s.openTime} 
                        onChange={e => {
                          const newS = [...schedules];
                          const i = newS.findIndex(x => x.dayOfWeek === idx);
                          if (i > -1) newS[i].openTime = e.target.value; else newS.push({dayOfWeek: idx, openTime: e.target.value, closeTime: '20:00', isClosed: false});
                          setSchedules(newS);
                        }} 
                      />
                      <span className="text-stone-300 font-bold">to</span>
                      <input type="time" disabled={s.isClosed} className="input-warm py-2 px-4 text-xs w-full" value={s.closeTime} 
                        onChange={e => {
                          const newS = [...schedules];
                          const i = newS.findIndex(x => x.dayOfWeek === idx);
                          if (i > -1) newS[i].closeTime = e.target.value; else newS.push({dayOfWeek: idx, openTime: '09:00', closeTime: e.target.value, isClosed: false});
                          setSchedules(newS);
                        }} 
                      />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer mt-4 md:mt-0 ml-0 md:ml-6 font-black text-[10px] uppercase tracking-widest text-muted">
                      <input type="checkbox" checked={s.isClosed} className="w-5 h-5 accent-primary rounded-lg"
                        onChange={e => {
                          const newS = [...schedules];
                          const i = newS.findIndex(x => x.dayOfWeek === idx);
                          if (i > -1) newS[i].isClosed = e.target.checked;
                          setSchedules(newS);
                        }} 
                      />
                      Is Closed
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- ฝั่งขวา: QR & Notifications --- */}
        <div className="lg:col-span-4 space-y-8">
          <div className="card-cozy p-10! text-center space-y-6 border-stone-100 shadow-xl shadow-primary/5">
            <h3 className="font-black text-primary flex items-center justify-center gap-2 uppercase tracking-widest text-xs"><QrCode size={18}/> QR Payment</h3>
            <div className="relative group mx-auto w-full aspect-square max-w-[180px]">
              <div className="w-full h-full bg-secondary rounded-[40px] border-4 border-white shadow-inner flex items-center justify-center overflow-hidden">
                {qrPreview ? <img src={qrPreview} className="w-full h-full object-cover" /> : <Camera size={32} className="opacity-20 text-primary" />}
              </div>
              <input type="file" id="qr-upload" hidden onChange={handleQrUpload} accept="image/*" />
              <label htmlFor="qr-upload" className="absolute inset-0 bg-primary/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-[40px] backdrop-blur-sm">
                <Camera size={24} />
              </label>
            </div>
            <p className="text-[10px] text-muted font-bold tracking-widest uppercase">Show QR to Customer</p>
          </div>

          <div className="card-cozy p-10! border-stone-100 bg-[#FDFCFB] space-y-8">
            <div className="flex items-center justify-between">
               <h3 className="font-black text-emerald-800 flex items-center gap-2 uppercase tracking-tighter text-sm"><BellRing size={16}/> LINE Notify</h3>
               <button type="button" onClick={() => setShowLineGuide(!showLineGuide)} className="text-primary hover:rotate-90 transition-transform"><HelpCircle size={20}/></button>
            </div>
            {showLineGuide && <LINEGuide config={config}/>}
            <div className="space-y-4">
               <input className="input-warm w-full text-xs" placeholder="Bot ID (@...)" value={config.lineBotId} onChange={e => setConfig({...config, lineBotId: e.target.value})}/>
               <input className="input-warm w-full text-xs font-mono" placeholder="Owner User ID (U...)" value={config.lineUserId} onChange={e => setConfig({...config, lineUserId: e.target.value})}/>
               <input type="password" className="input-warm w-full text-xs font-mono" placeholder="Channel Access Token" value={config.lineChannelToken} onChange={e => setConfig({...config, lineChannelToken: e.target.value})}/>
            </div>
          </div>

          <button disabled={saving} type="submit" className="btn-primary w-full py-6 text-lg shadow-2xl shadow-primary/30 uppercase tracking-[0.2em] font-black"><Save size={20}/> Save All Changes</button>
        </div>

      </form>
    </div>
  );
}

// LINE Guide Sub-component
function LINEGuide({ config }: any) {
  return (
    <div className="bg-emerald-50 rounded-3xl p-6 mb-6 border border-emerald-100 animate-in zoom-in-95 duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-emerald-100">
          {config.lineBotId ? <img src={`https://qr-official.line.me/sid/M/${config.lineBotId.replace('@', '')}.png`} className="w-8 h-8" alt="Bot QR"/> : <Info size={18} className="text-emerald-200" />}
        </div>
        <p className="text-[10px] font-bold text-emerald-900 leading-tight">ทักบอทว่า "ID" เพื่อรับ User ID<br/>มาใส่ในช่องด้านล่างครับ</p>
      </div>
    </div>
  );
}