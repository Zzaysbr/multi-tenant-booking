import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { 
  Store, Phone, MapPin, QrCode, Save, Loader2, 
  Camera, BellRing, HelpCircle, CheckCircle2, 
  X, Clock, CalendarDays 
} from 'lucide-react';

const DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLineGuide, setShowLineGuide] = useState(false);
  
  const [config, setConfig] = useState({ 
    name: '', phone: '', address: '', qrCodeUrl: '', 
    lineBotId: '', lineChannelToken: '', lineUserId: '' 
  });
  
  // ✅ State สำหรับเวลาทำการ
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
          lineBotId: c.line_bot_id || '', 
          lineChannelToken: c.line_channel_token || '',
          lineUserId: c.line_user_id || ''
        });
        setQrPreview(c.qrCodeUrl);

        if (hoursRes.data.businessHours?.length > 0) {
          setSchedules(hoursRes.data.businessHours);
        }
      } catch (err) {
        toast.error("โหลดข้อมูลไม่สำเร็จ");
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
      // บันทึกทั้งข้อมูลร้าน และ เวลาทำการพร้อมกัน
      await Promise.all([
        api.patch(`/api/${user?.tenantPath}/owner/config`, {
          ...config,
          line_bot_id: config.lineBotId,
          lineChannelToken: config.lineChannelToken,
          lineUserId: config.lineUserId
        }),
        api.patch(`/api/${user?.tenantPath}/business-hours`, { schedules })
      ]);
      toast.success("บันทึกการตั้งค่าทั้งหมดเรียบร้อยแล้วครับพี่! ✨");
    } catch (err) {
      toast.error("บันทึกไม่สำเร็จ ลองเช็กข้อมูลอีกครั้งนะครับ");
    } finally {
      setSaving(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('qrFile', e.target.files[0]);
      try {
        const res = await api.post(`/api/${user?.tenantPath}/owner/config/qr-upload`, formData);
        setQrPreview(res.data.qrCodeUrl);
        toast.success("อัปโหลด QR Code สำเร็จ!");
      } catch (err) {
        toast.error("อัปโหลดล้มเหลว");
      }
    }
  };

  if (loading) return (
    <div className="p-20 text-center space-y-4 italic text-accent animate-pulse font-sans">
      <Loader2 className="mx-auto animate-spin" size={40} />
      <p>กำลังเตรียมข้อมูลร้านให้ครับพี่...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 font-sans">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-secondary-foreground flex items-center gap-3">
          <Store className="text-primary" size={32} /> ตั้งค่าร้านค้า
        </h1>
        <p className="text-accent text-sm font-medium">จัดการข้อมูลร้าน เวลาทำการ และระบบแจ้งเตือน</p>
      </header>

      <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="card-cozy p-8! space-y-10 border border-primary/5">
            
            {/* 1. ข้อมูลร้าน */}
            <section className="space-y-6">
              <h3 className="font-bold text-secondary-foreground flex items-center gap-2 border-b border-secondary/50 pb-2">
                <Store size={18} className="text-primary" /> ข้อมูลทั่วไป
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-accent tracking-widest ml-1">ชื่อร้านค้า</label>
                  <input required className="input-warm w-full" value={config.name} onChange={e => setConfig({...config, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-accent tracking-widest ml-1">เบอร์โทรศัพท์</label>
                  <input className="input-warm w-full" value={config.phone} onChange={e => setConfig({...config, phone: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-accent tracking-widest ml-1">ที่อยู่ร้าน</label>
                  <textarea rows={2} className="input-warm w-full pt-4" value={config.address} onChange={e => setConfig({...config, address: e.target.value})} />
                </div>
              </div>
            </section>

            {/* 2. เวลาทำการ (Business Hours) */}
            <section className="space-y-6">
              <h3 className="font-bold text-secondary-foreground flex items-center gap-2 border-b border-secondary/50 pb-2">
                <Clock size={18} className="text-primary" /> เวลาทำการของร้าน
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {DAYS.map((day, idx) => {
                  const s = schedules.find(item => item.dayOfWeek === idx) || { dayOfWeek: idx, openTime: '09:00', closeTime: '20:00', isClosed: false };
                  return (
                    <div key={idx} className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${s.isClosed ? 'bg-stone-50 border-stone-100 opacity-50' : 'bg-white border-stone-100 shadow-sm'}`}>
                      <span className="text-xs font-black w-24">{day}</span>
                      <div className="flex items-center gap-2">
                        <input type="time" disabled={s.isClosed} className="input-warm py-1.5 px-3 text-xs" value={s.openTime} 
                          onChange={e => {
                            const newS = [...schedules];
                            const i = newS.findIndex(x => x.dayOfWeek === idx);
                            if (i > -1) newS[i].openTime = e.target.value; else newS.push({dayOfWeek: idx, openTime: e.target.value, closeTime: '20:00', isClosed: false});
                            setSchedules(newS);
                          }} 
                        />
                        <span className="text-stone-300">-</span>
                        <input type="time" disabled={s.isClosed} className="input-warm py-1.5 px-3 text-xs" value={s.closeTime} 
                          onChange={e => {
                            const newS = [...schedules];
                            const i = newS.findIndex(x => x.dayOfWeek === idx);
                            if (i > -1) newS[i].closeTime = e.target.value; else newS.push({dayOfWeek: idx, openTime: '09:00', closeTime: e.target.value, isClosed: false});
                            setSchedules(newS);
                          }} 
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={s.isClosed} className="w-4 h-4 accent-primary"
                          onChange={e => {
                            const newS = [...schedules];
                            const i = newS.findIndex(x => x.dayOfWeek === idx);
                            if (i > -1) newS[i].isClosed = e.target.checked;
                            setSchedules(newS);
                          }} 
                        />
                        <span className="text-[10px] font-black uppercase text-accent tracking-tighter">ปิดร้าน</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 3. LINE Notification */}
            <section className="space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-secondary/50 pb-2">
                <h3 className="font-bold text-emerald-700 flex items-center gap-2">
                  <BellRing size={18} /> ระบบแจ้งเตือน LINE
                </h3>
                <button type="button" onClick={() => setShowLineGuide(!showLineGuide)} className="text-[10px] font-black text-primary hover:underline flex items-center gap-1">
                  {showLineGuide ? <><X size={14} /> ปิดคู่มือ</> : <><HelpCircle size={14} /> วิธีตั้งค่า</>}
                </button>
              </div>

              {showLineGuide && (
                <div className="bg-emerald-50/50 rounded-[32px] p-8 border border-emerald-100 space-y-4 animate-in slide-in-from-top-4 duration-500">
                   <div className="flex items-center gap-4 border-b border-emerald-100 pb-4">
                    <div className="bg-white p-2 rounded-xl border border-emerald-100">
                      {config.lineBotId ? <img src={`https://qr-official.line.me/sid/M/${config.lineBotId.replace('@', '')}.png`} className="w-16 h-16" /> : <div className="w-16 h-16 bg-stone-100 rounded-lg" />}
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium">1. แอดบอท 2. ทักบอทว่า "ID" 3. ก๊อปเลข U... มาแปะด้านล่างครับพี่</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-accent tracking-widest ml-1">LINE BOT ID</label>
                  <input className="input-warm w-full text-xs" placeholder="@yourbot" value={config.lineBotId} onChange={e => setConfig({...config, lineBotId: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-accent tracking-widest ml-1">YOUR USER ID (U...)</label>
                  <input className="input-warm w-full text-xs font-mono" placeholder="Uxxxxxxxx..." value={config.lineUserId} onChange={e => setConfig({...config, lineUserId: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-accent tracking-widest ml-1">CHANNEL ACCESS TOKEN</label>
                  <input type="password" className="input-warm w-full text-xs font-mono" value={config.lineChannelToken} onChange={e => setConfig({...config, lineChannelToken: e.target.value})} />
                </div>
              </div>
            </section>

            <button disabled={saving} type="submit" className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-2 shadow-2xl shadow-primary/20">
              {saving ? <Loader2 className="animate-spin" /> : <><Save size={20}/> บันทึกการตั้งค่าทั้งหมด</>}
            </button>
          </div>
        </div>

        {/* --- ฝั่งขวา: QR Code --- */}
        <div className="space-y-6">
          <div className="card-cozy p-8! text-center space-y-6 h-fit sticky top-8 border border-primary/5">
            <h3 className="font-bold text-secondary-foreground border-b border-secondary/50 pb-2 flex items-center justify-center gap-2">
              <QrCode size={18} className="text-primary" /> รับเงินผ่าน QR
            </h3>
            <div className="relative group mx-auto">
              <div className="w-full aspect-square bg-secondary/30 rounded-4xl border-4 border-white shadow-inner flex items-center justify-center overflow-hidden">
                {qrPreview ? <img src={qrPreview} className="w-full h-full object-cover" /> : <Camera size={40} className="mx-auto opacity-20" />}
              </div>
              <input type="file" id="qr-upload" hidden onChange={handleQrUpload} accept="image/*" />
              <label htmlFor="qr-upload" className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-4xl backdrop-blur-sm">
                <Camera size={24} />
                <span className="text-[10px] font-bold mt-2">เปลี่ยนรูป QR</span>
              </label>
            </div>
            <p className="text-[10px] text-accent font-medium leading-relaxed italic px-4">รูปนี้จะโชว์ให้ลูกค้าสแกนจ่ายครับพี่</p>
          </div>
        </div>

      </form>
    </div>
  );
}