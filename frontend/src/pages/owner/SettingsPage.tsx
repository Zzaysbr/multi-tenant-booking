import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext'; // 👈 นำเข้า Context
import { 
  Settings, Globe, Bell, ShieldCheck, 
  Save, Loader2, Store, MessageCircle 
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth(); // 👈 ดึงข้อมูลร้าน
  const [activeTab, setActiveTab] = useState<'general' | 'integration'>('general');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shopData, setShopData] = useState({
    name: '',
    phone: '',
    address: '',
    lineChannelToken: '',
    lineChannelSecret: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      // 🛡️ ป้องกันไม่ให้ยิง API ถ้ายังไม่มีชื่อร้าน
      if (!user?.tenantPath) return;

      try {
        // ✅ ใช้ตัวแปร ${user.tenantPath} ให้ถูกต้อง
        const res = await api.get(`/api/${user.tenantPath}/owner/config`);
        
        // ถ้ามีข้อมูลตอบกลับมา ให้เอามาใส่ใน Form
        if (res.data.config) {
          setShopData(prev => ({
            ...prev,
            name: res.data.config.name || '',
            lineChannelToken: res.data.config.line_channel_token || ''
          }));
        }
      } catch (error) {
        console.error("Error fetching settings", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [user]); // 👈 ผูก useEffect ไว้กับ user

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantPath) return;

    setSubmitting(true);
    try {
      // ✅ ส่งข้อมูลไปอัปเดต โดยใช้ URL ที่ถูกต้อง
      await api.patch(`/api/${user.tenantPath}/owner/config`, shopData);
      alert("บันทึกการตั้งค่าสำเร็จ! ✨");
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-primary italic font-medium">กำลังโหลดการตั้งค่า... 🍵</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- Header --- */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-secondary-foreground flex items-center gap-3">
          <Settings className="text-primary" size={32} />
          ตั้งค่าร้านค้า
        </h1>
        <p className="text-accent text-sm md:text-base font-medium mt-1">จัดการข้อมูลโปรไฟล์และการเชื่อมต่อระบบแจ้งเตือน</p>
      </div>

      {/* --- Tab Switcher --- */}
      <div className="flex border-b border-accent/10 gap-8">
        <button 
          onClick={() => setActiveTab('general')}
          className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'general' ? 'text-primary' : 'text-accent hover:text-primary'}`}
        >
          <div className="flex items-center gap-2"><Store size={18} /> ข้อมูลทั่วไป</div>
          {activeTab === 'general' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('integration')}
          className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'integration' ? 'text-primary' : 'text-accent hover:text-primary'}`}
        >
          <div className="flex items-center gap-2"><MessageCircle size={18} /> การเชื่อมต่อ (LINE)</div>
          {activeTab === 'integration' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
        </button>
      </div>

      {/* --- Form Area --- */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="card-cozy p-6! md:p-10!">
          
          {activeTab === 'general' ? (
            /* --- General Settings --- */
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1 flex items-center gap-2"><Globe size={16}/> ชื่อร้านค้า</label>
                  <input 
                    type="text" 
                    className="input-warm" 
                    value={shopData.name}
                    onChange={(e) => setShopData({...shopData, name: e.target.value})}
                    placeholder="เช่น ลอเฟี้ยว บาร์เบอร์"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input 
                    type="text" 
                    className="input-warm" 
                    value={shopData.phone}
                    onChange={(e) => setShopData({...shopData, phone: e.target.value})}
                    placeholder="08x-xxx-xxxx"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">ที่อยู่ร้าน</label>
                <textarea 
                  className="input-warm min-h-[100px] py-4" 
                  value={shopData.address}
                  onChange={(e) => setShopData({...shopData, address: e.target.value})}
                  placeholder="ระบุที่อยู่เพื่อให้ลูกค้าเดินทางมาถูก..."
                />
              </div>
            </div>
          ) : (
            /* --- Integration Settings (LINE) --- */
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-secondary/50 p-4 rounded-2xl border border-primary/10 mb-6">
                <p className="text-sm text-primary font-medium flex items-center gap-2">
                  <Bell size={18} /> ระบบจะส่งข้อความแจ้งเตือนผ่าน LINE OA เมื่อมีการจองหรืออัปเดตสถานะ
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1 flex items-center gap-2 text-secondary-foreground">
                  <ShieldCheck size={16} className="text-emerald-600" /> LINE Channel Access Token
                </label>
                <input 
                  type="password" 
                  className="input-warm font-mono text-sm" 
                  value={shopData.lineChannelToken}
                  onChange={(e) => setShopData({...shopData, lineChannelToken: e.target.value})}
                  placeholder="eyJhbGciOiJIUzI1Ni..."
                />
                <p className="text-[10px] text-accent mt-1 ml-1">* Token นี้ได้จาก LINE Developers Console</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">LINE Channel Secret</label>
                <input 
                  type="password" 
                  className="input-warm font-mono text-sm" 
                  value={shopData.lineChannelSecret}
                  onChange={(e) => setShopData({...shopData, lineChannelSecret: e.target.value})}
                  placeholder="8b5982..."
                />
              </div>
            </div>
          )}
        </div>

        {/* --- Action Buttons --- */}
        <div className="flex justify-end gap-4">
          <button type="button" className="btn-outline px-8">ล้างค่า</button>
          <button type="submit" disabled={submitting} className="btn-primary px-10">
            {submitting ? <Loader2 className="animate-spin" /> : (
              <div className="flex items-center gap-2"><Save size={20} /> บันทึกการเปลี่ยนแปลง</div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}