import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Store, Phone, MapPin, QrCode, Save, Loader2, Camera } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({ name: '', phone: '', address: '', qrCodeUrl: '' });
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/api/${user?.tenantPath}/owner/config`)
      .then(res => {
        setConfig(res.data.config);
        setQrPreview(res.data.config.qrCodeUrl);
      })
      .finally(() => setLoading(false));
  }, [user?.tenantPath]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/api/${user?.tenantPath}/owner/config`, config);
      toast.success("บันทึกข้อมูลร้านเรียบร้อย ✨");
    } catch (err) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('qrFile', file);

      try {
        const res = await api.post(`/api/${user?.tenantPath}/owner/config/qr-upload`, formData);
        setQrPreview(res.data.qrCodeUrl);
        toast.success("อัปโหลด QR Code ใหม่แล้ว");
      } catch (err) {
        toast.error("อัปโหลดไม่สำเร็จ");
      }
    }
  };

  if (loading) return <div className="p-20 text-center italic text-accent animate-pulse">กำลังโหลดการตั้งค่า...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-black text-secondary-foreground flex items-center gap-3">
          <Store className="text-primary" size={32} /> ตั้งค่าร้านค้า
        </h1>
        <p className="text-accent font-medium mt-1 text-sm">จัดการข้อมูลพื้นฐานและช่องทางการรับเงินของร้านคุณ</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- ฝั่งซ้าย: ข้อมูลร้าน --- */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveConfig} className="card-cozy p-8! space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-accent tracking-widest ml-1">ชื่อร้านค้า</label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/40" size={18} />
                <input required className="input-warm pl-12 w-full" value={config.name} 
                  onChange={e => setConfig({...config, name: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-accent tracking-widest ml-1">เบอร์โทรศัพท์ติดต่อ</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/40" size={18} />
                  <input className="input-warm pl-12 w-full" value={config.phone || ''} 
                    onChange={e => setConfig({...config, phone: e.target.value})} placeholder="08x-xxx-xxxx" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-accent tracking-widest ml-1">ที่อยู่ร้าน / คำอธิบายเพิ่มเติม</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-accent/40" size={18} />
                <textarea rows={3} className="input-warm pl-12 w-full pt-4" value={config.address || ''} 
                  onChange={e => setConfig({...config, address: e.target.value})} placeholder="ระบุตำแหน่งร้านของคุณ..." />
              </div>
            </div>

            <button disabled={saving} type="submit" className="btn-primary w-full py-4 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="animate-spin" /> : <><Save size={20}/> บันทึกข้อมูลร้าน</>}
            </button>
          </form>
        </div>

        {/* --- ฝั่งขวา: QR Code สำหรับรับเงิน --- */}
        <div className="space-y-6">
          <div className="card-cozy p-8! text-center space-y-4">
            <h3 className="font-black text-secondary-foreground flex items-center justify-center gap-2">
              <QrCode size={20} className="text-primary" /> รับเงินผ่าน QR
            </h3>
            
            <div className="relative group">
              <div className="w-full aspect-square bg-secondary/30 rounded-3xl border-4 border-white shadow-inner flex items-center justify-center overflow-hidden">
                {qrPreview ? (
                  <img src={qrPreview} alt="Shop QR" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-[10px] text-accent font-bold px-6">ยังไม่ได้อัปโหลด QR Code</p>
                )}
              </div>
              <input type="file" id="qr-upload" hidden onChange={handleQrUpload} accept="image/*" />
              <label htmlFor="qr-upload" className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-3xl backdrop-blur-[2px]">
                <Camera size={32} />
                <span className="text-xs font-bold mt-2">เปลี่ยนรูป QR</span>
              </label>
            </div>
            
            <p className="text-[10px] text-accent font-medium leading-relaxed px-2">
              รูปภาพนี้จะไปแสดงในหน้าแจ้งโอนเงินของลูกค้า เพื่อให้ลูกค้าสแกนจ่ายได้ทันที
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}