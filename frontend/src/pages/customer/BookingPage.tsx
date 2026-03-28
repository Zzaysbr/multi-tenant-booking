import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'sonner';
import { 
  Calendar, Clock, Scissors, User, 
  ChevronRight, ArrowLeft, Loader2, Coffee 
} from 'lucide-react';

export default function BookingPage() {
  const { tenantPath } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data from Backend
  const [services, setServices] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [businessHours, setBusinessHours] = useState<any[]>([]);

  // Selection State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    api.get(`/api/${tenantPath}/bookings/init`)
      .then(res => {
        setServices(res.data.services);
        setStaffs(res.data.staffs);
        setBusinessHours(res.data.businessHours || []);
      })
      .finally(() => setLoading(false));
  }, [tenantPath]);

  // 🕒 Logic: เจนเนอเรตช่วงเวลาที่ร้านเปิด (Time Slots)
  const availableSlots = useMemo(() => {
    const dayOfWeek = new Date(selectedDate).getDay();
    const hours = businessHours.find(h => h.dayOfWeek === dayOfWeek);

    if (!hours || hours.isClosed) return [];

    const slots = [];
    let current = new Date(`${selectedDate}T${hours.openTime}`);
    const end = new Date(`${selectedDate}T${hours.closeTime}`);

    // เพิ่มทีละ 30 นาที (หรือปรับตามความเหมาะสม)
    while (current < end) {
      slots.push(current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }));
      current.setMinutes(current.getMinutes() + 30);
    }
    return slots;
  }, [selectedDate, businessHours]);

  const handleBooking = async () => {
    if (!selectedService || !selectedStaff || !selectedTime) {
      return toast.error("กรุณาเลือกข้อมูลให้ครบถ้วนก่อนนะครับพี่");
    }

    setSubmitting(true);
    try {
      const startTime = `${selectedDate}T${selectedTime}:00`;
      const endTime = new Date(new Date(startTime).getTime() + (selectedService.durationMinutes || 60) * 60000).toISOString();

      await api.post(`/api/${tenantPath}/bookings`, {
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        startTime,
        endTime
      });

      toast.success("จองคิวเรียบร้อย! เตรียมตัวมาหาเราได้เลยครับ ✨");
      navigate(`/${tenantPath}/my-bookings`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "จองไม่สำเร็จ ลองเลือกเวลาอื่นดูนะครับ");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center text-accent animate-pulse font-sans">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p>กำลังเตรียมเมนูบริการให้ครับพี่...</p>
    </div>
  );

  const isClosedToday = availableSlots.length === 0;

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24 font-sans animate-in fade-in duration-700">
      {/* Header */}
      <div className="max-w-xl mx-auto p-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100">
          <ArrowLeft size={20} className="text-secondary-foreground" />
        </button>
        <h1 className="text-xl font-black text-secondary-foreground tracking-tight">นัดหมายรับบริการ</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="max-w-xl mx-auto px-6 space-y-8">
        
        {/* 1. เลือกบริการ */}
        <section className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
            <Scissors size={14} className="text-primary" /> เลือกบริการที่ต้องการ
          </label>
          <div className="grid grid-cols-1 gap-3">
            {services.map(s => (
              <button 
                key={s.id}
                onClick={() => setSelectedService(s)}
                className={`p-5 rounded-[32px] border text-left transition-all flex justify-between items-center ${
                  selectedService?.id === s.id ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' : 'bg-white border-stone-100 hover:border-primary/30'
                }`}
              >
                <div>
                  <p className="font-bold">{s.name}</p>
                  <p className={`text-[10px] ${selectedService?.id === s.id ? 'text-white/70' : 'text-accent'}`}>{s.durationMinutes} นาที</p>
                </div>
                <p className="font-black">฿{s.price}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 2. เลือกพนักงาน */}
        <section className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
            <User size={14} className="text-primary" /> เลือกช่าง/พนักงาน
          </label>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {staffs.map(st => (
              <button 
                key={st.id}
                onClick={() => setSelectedStaff(st)}
                className={`shrink-0 px-6 py-3 rounded-full border font-bold text-xs transition-all ${
                  selectedStaff?.id === st.id ? 'bg-secondary-foreground text-white border-secondary-foreground' : 'bg-white border-stone-100'
                }`}
              >
                {st.name}
              </button>
            ))}
          </div>
        </section>

        {/* 3. เลือกวันและเวลา */}
        <section className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
            <Calendar size={14} className="text-primary" /> เลือกวันและเวลา
          </label>
          <input 
            type="date" 
            min={new Date().toISOString().split('T')[0]}
            className="input-warm w-full py-4 px-6 text-sm"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
          />

          <div className="pt-4">
            {isClosedToday ? (
              <div className="p-10 bg-stone-100 rounded-[40px] text-center space-y-3">
                <Coffee size={32} className="mx-auto text-stone-300" />
                <p className="text-sm font-bold text-stone-400">ขออภัยครับ วันนี้ร้านปิดให้บริการ</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map(slot => (
                  <button 
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-3 rounded-2xl text-[11px] font-black transition-all border ${
                      selectedTime === slot ? 'bg-primary text-white border-primary shadow-lg shadow-primary/10' : 'bg-white border-stone-100 text-secondary-foreground'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Confirm Button */}
        <div className="pt-8">
          <button 
            disabled={submitting || isClosedToday || !selectedTime}
            onClick={handleBooking}
            className="w-full bg-primary text-white py-5 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 disabled:opacity-30 disabled:shadow-none hover:scale-[1.02] active:scale-95 transition-all"
          >
            {submitting ? <Loader2 className="animate-spin" /> : <>ยืนยันการจองคิว <ChevronRight size={20} /></>}
          </button>
        </div>

      </div>
    </div>
  );
}