import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Scissors, User, Calendar, Check, Loader2, ArrowLeft, LogOut, UserCircle, CreditCard, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function BookingPage() {
  const { tenantPath } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth(); 
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [data, setData] = useState({ services: [], staffs: [] });
  const [selection, setSelection] = useState<any>({ service: null, staff: null, date: '', time: '' });

  useEffect(() => {
    if (!tenantPath) return;
    api.get(`/api/${tenantPath}/bookings/init`)
      .then(res => setData(res.data))
      .catch((err) => toast.error(err.response?.data?.error || "ไม่สามารถโหลดข้อมูลร้านได้"))
      .finally(() => setLoading(false));
  }, [tenantPath]);

  const handleBooking = async () => {
    // 🛡️ 1. เช็คว่า Login หรือยัง
    if (!user) {
      toast.info("กรุณาเข้าสู่ระบบก่อนจองคิวนะคะ");
      // ส่ง state { from } ไปให้หน้า Login เพื่อให้มันเด้งกลับมาที่นี่
      navigate('/login', { state: { from: location.pathname } }); 
      return;
    }

    if (!selection.service || !selection.staff || !selection.date || !selection.time) {
      return toast.error("กรุณาเลือกข้อมูลให้ครบถ้วนก่อนยืนยันค่ะ");
    }

    setSubmitting(true);
    try {
      const start = new Date(`${selection.date}T${selection.time}:00`);
      const end = new Date(start.getTime() + selection.service.durationMinutes * 60000);

      await api.post(`/api/${tenantPath}/bookings`, {
        serviceId: selection.service.id,
        staffId: selection.staff.id,
        startTime: start.toISOString(),
        endTime: end.toISOString()
      });

      setStep(4);
    } catch (err: any) {
        const errorMsg = err.response?.data?.error || "เวลานี้มีคนจองแล้ว กรุณาเลือกเวลาใหม่";
        toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-primary font-medium italic animate-pulse">กำลังเตรียมพื้นที่ร้าน... 🍵</div>;

  return (
    <div className="min-h-screen bg-bg p-6 font-sans">
      <div className="max-w-md mx-auto space-y-8">
        
        {/* --- Header & User Info --- */}
        <header className="relative py-6 text-center">
          {user && (
            <div className="absolute top-0 right-0 flex items-center gap-2 bg-white/50 p-2 rounded-full border border-primary/10">
              <UserCircle size={20} className="text-primary" />
              <span className="text-[10px] font-bold text-secondary-foreground truncate max-w-[80px]">{user.name}</span>
              <button onClick={logout} className="p-1 hover:text-red-500 transition-colors"><LogOut size={14}/></button>
            </div>
          )}
          <h1 className="text-3xl font-black text-secondary-foreground capitalize tracking-tighter">{tenantPath}</h1>
            <div className="flex justify-center gap-4 mb-4">
                <button onClick={() => navigate(`/${tenantPath}`)} className="text-xs font-bold text-primary">หน้าจองคิว</button>
                <div className="w-1 h-1 bg-accent/20 rounded-full my-auto" />
                <button onClick={() => navigate(`/${tenantPath}/my-bookings`)} className="text-xs font-bold text-accent">ประวัติการจอง</button>
            </div>
          <div className="h-1.5 w-10 bg-primary mx-auto mt-2 rounded-full" />
        </header>

        {/* --- Steps (1-3) เหมือนเดิม แต่เพิ่มการเช็คข้อมูลเล็กลงให้เนียนขึ้น --- */}
        {step === 1 && (
          <div className="space-y-4 animate-in slide-in-from-right duration-500">
            <h2 className="font-bold flex items-center gap-2 text-secondary-foreground"><Scissors size={18} className="text-primary"/> เลือกบริการ</h2>
            {data.services.map((s: any) => (
              <button key={s.id} onClick={() => { setSelection({...selection, service: s}); setStep(2); }}
                className="card-cozy w-full p-6! flex justify-between items-center active:scale-95 transition-all hover:border-primary/30">
                <div className="text-left">
                  <p className="font-black text-secondary-foreground text-lg">{s.name}</p>
                  <p className="text-[10px] text-accent font-bold uppercase tracking-widest mt-1">{s.durationMinutes} MINUTES</p>
                </div>
                <div className="text-primary font-black text-xl">฿{s.price}</div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right duration-500">
            <div className="flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2"><User size={18} className="text-primary"/> เลือกช่าง</h2>
              <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase text-accent hover:text-primary flex items-center gap-1"><ArrowLeft size={12}/> BACK</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {data.staffs.map((st: any) => (
                <button key={st.id} onClick={() => { setSelection({...selection, staff: st}); setStep(3); }}
                  className={`card-cozy p-6! font-black text-center active:scale-95 transition-all ${selection.staff?.id === st.id ? 'border-primary bg-primary/5 text-primary' : 'text-secondary-foreground'}`}>
                  {st.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500">
             <div className="flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2"><Calendar size={18} className="text-primary"/> เลือกวันเวลา</h2>
              <button onClick={() => setStep(2)} className="text-[10px] font-black uppercase text-accent hover:text-primary flex items-center gap-1"><ArrowLeft size={12}/> BACK</button>
            </div>

            <div className="bg-white p-5 rounded-3xl text-sm space-y-3 border border-primary/10 shadow-sm shadow-primary/5">
              <div className="flex justify-between border-b border-dashed border-accent/20 pb-2">
                <span className="text-accent font-medium">บริการ</span>
                <span className="font-black text-secondary-foreground">{selection.service?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-accent font-medium">ช่าง</span>
                <span className="font-black text-secondary-foreground">{selection.staff?.name}</span>
              </div>
            </div>

             <div className="space-y-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-accent ml-1 tracking-widest">Select Date</label>
                 <input type="date" className="input-warm w-full py-4" min={new Date().toISOString().split('T')[0]} 
                   onChange={e => setSelection({...selection, date: e.target.value})} value={selection.date} />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-accent ml-1 tracking-widest">Select Time</label>
                 <input type="time" className="input-warm w-full py-4" 
                   onChange={e => setSelection({...selection, time: e.target.value})} value={selection.time} />
               </div>
             </div>
             
             <button disabled={submitting} onClick={handleBooking} className="btn-primary w-full py-5 text-lg mt-4 shadow-xl shadow-primary/20">
               {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'ยืนยันการนัดหมาย'}
             </button>
          </div>
        )}

        {/* --- Step 4 (Success) เหมือนเดิม --- */}
        {step === 4 && (
        <div className="space-y-6 animate-in zoom-in fade-in duration-500">
          <div className="bg-white rounded-[40px] shadow-xl shadow-primary/5 border border-primary/5 overflow-hidden">
            
            {/* ส่วนหัวสีเขียวฉลองความสำเร็จ */}
            <div className="bg-emerald-50/50 p-10 text-center border-b border-dashed border-emerald-100">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30 animate-bounce">
                <Check size={40} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-black text-secondary-foreground tracking-tighter">จองคิวสำเร็จแล้ว! ✨</h2>
              <p className="text-emerald-700/70 text-sm font-medium mt-1">เราได้รับคำขอของคุณเรียบร้อยแล้วค่ะ</p>
            </div>

            {/* ส่วนสรุปข้อมูล (Digital Ticket) */}
            <div className="p-8 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">Service</span>
                  <span className="text-sm font-bold text-secondary-foreground">{selection.service?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">Staff</span>
                  <span className="text-sm font-bold text-secondary-foreground">{selection.staff?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">Date</span>
                  <span className="text-sm font-bold text-secondary-foreground">
                    {new Date(selection.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">Time</span>
                  <span className="text-sm font-black text-primary bg-primary/5 px-3 py-1 rounded-lg">
                    {selection.time} น.
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-accent/5">
                <div className="bg-secondary/20 p-4 rounded-2xl flex items-start gap-3">
                  <div className="mt-1 text-primary"><Info size={16} /></div>
                  <p className="text-[11px] text-accent leading-relaxed font-medium">
                    กรุณาแจ้งโอนเงินในหน้า <span className="text-secondary-foreground font-bold">"ประวัติการจอง"</span> 
                    เพื่อให้ทางร้านกดยืนยันคิวให้คุณได้รวดเร็วยิ่งขึ้นนะคะ
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ปุ่มกดไปต่อ */}
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => navigate(`/${tenantPath}/my-bookings`)}
              className="btn-primary py-5 text-lg shadow-2xl shadow-primary/20 flex items-center justify-center gap-2"
            >
              <CreditCard size={20} /> ไปหน้าแจ้งโอนเงิน
            </button>
            
            <button 
              onClick={() => navigate(`/${tenantPath}`)}
              className="w-full py-4 text-accent font-bold text-sm hover:text-primary transition-colors"
            >
              กลับสู่หน้าหลักของร้าน
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}