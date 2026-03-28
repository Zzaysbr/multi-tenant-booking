// src/pages/customer/BookingPage.tsx
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'sonner';
import { 
  Calendar, Clock, Scissors, User, 
  ChevronRight, Loader2, Sparkles, Info
} from 'lucide-react';

export default function BookingPage() {
  const { tenantPath } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shopConfig, setShopConfig] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [businessHours, setBusinessHours] = useState<any[]>([]);
  const [busySlots, setBusySlots] = useState<any[]>([]);

  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    const initBooking = async () => {
      try {
        // ✅ แก้ไข Path: เติม /api กลับเข้าไป
        const [initRes, configRes] = await Promise.all([
          api.get(`/api/${tenantPath}/bookings/init`),
          api.get(`/api/${tenantPath}/config`)
        ]);
        setServices(initRes.data.services || []);
        setStaffs(initRes.data.staffs || []);
        setBusinessHours(initRes.data.businessHours || []);
        setShopConfig(configRes.data.config);
      } catch (err) {
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };
    initBooking();
  }, [tenantPath]);

  useEffect(() => {
    if (selectedStaff && selectedDate) {
      // ✅ แก้ไข Path: เติม /api กลับเข้าไป
      api.get(`/api/${tenantPath}/bookings/busy-slots`, { 
        params: { staffId: selectedStaff.id, date: selectedDate } 
      }).then(res => setBusySlots(res.data.busy || []));
    }
  }, [selectedStaff, selectedDate, tenantPath]);

  const availableSlots = useMemo(() => {
    const dayOfWeek = new Date(selectedDate).getDay();
    const hours = businessHours.find(h => h.dayOfWeek === dayOfWeek);
    if (!hours || hours.isClosed) return [];
    const slots = [];
    let current = new Date(`${selectedDate}T${hours.openTime}`);
    const end = new Date(`${selectedDate}T${hours.closeTime}`);
    while (current < end) {
      const timeStr = current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
      const isBusy = busySlots.some(busy => {
        const bStart = new Date(busy.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        const bEnd = new Date(busy.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        return timeStr >= bStart && timeStr < bEnd;
      });
      if (!isBusy) slots.push(timeStr);
      current.setMinutes(current.getMinutes() + 30);
    }
    return slots;
  }, [selectedDate, businessHours, busySlots]);

  const handleBooking = async () => {
    if (!selectedService || !selectedStaff || !selectedTime) return toast.error("กรุณาเลือกข้อมูลให้ครบถ้วน");
    setSubmitting(true);
    try {
      const startTime = `${selectedDate}T${selectedTime}:00`;
      const endTime = new Date(new Date(startTime).getTime() + (selectedService.durationMinutes || 60) * 60000).toISOString();
      // ✅ แก้ไข Path: เติม /api กลับเข้าไป
      const res = await api.post(`/api/${tenantPath}/bookings`, { 
        serviceId: selectedService.id, 
        staffId: selectedStaff.id, 
        startTime, 
        endTime 
      });
      toast.success("นัดหมายสำเร็จ!");
      navigate(`/${tenantPath}/pay/${res.data.booking.id}`);
    } catch (err: any) {
      toast.error("จองไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center font-black text-accent animate-pulse font-sans">
      PREPARING...
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-6 space-y-12 pb-40 font-sans No Italic">
       {/* Header Card */}
       <div className="relative h-48 rounded-card overflow-hidden mt-6 shadow-lg bg-stone-100">
         <img src={shopConfig?.logo_url || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000"} className="w-full h-full object-cover" />
         <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Book Appointment</h1>
         </div>
       </div>

       {/* Step 1: Services */}
       <section className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-accent flex items-center gap-2"><Sparkles size={14}/> 01: Choose Service</label>
          <div className="grid grid-cols-1 gap-4">
            {services.map(s => (
              <button 
                key={s.id} 
                onClick={() => setSelectedService(s)} 
                className={`p-6 rounded-card border text-left transition-all flex justify-between items-center ${
                  selectedService?.id === s.id ? 'bg-primary text-white border-primary shadow-xl scale-[1.02]' : 'bg-white border-stone-100'
                }`}
              >
                <div className="space-y-1">
                  <p className="font-black uppercase tracking-tight leading-none">{s.name}</p>
                  <p className="text-[10px] font-bold opacity-60">Duration: {s.durationMinutes} Mins</p>
                </div>
                <p className="font-black text-xl">฿{s.price}</p>
              </button>
            ))}
          </div>
       </section>

       {/* Step 2: Staff */}
       <section className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-accent flex items-center gap-2"><User size={14}/> 02: Select Provider</label>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {staffs.map(st => (
              <button 
                key={st.id} 
                onClick={() => { setSelectedStaff(st); setSelectedTime(''); }} 
                className={`shrink-0 flex flex-col items-center gap-4 px-10 py-8 rounded-card border transition-all ${
                  selectedStaff?.id === st.id ? 'bg-secondary border-accent' : 'bg-white border-stone-100'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${selectedStaff?.id === st.id ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-stone-50 text-stone-300'}`}>
                  {st.name.charAt(0)}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{st.name}</span>
              </button>
            ))}
          </div>
       </section>

       {/* Step 3: Date & Time */}
       <section className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-accent flex items-center gap-2"><Calendar size={14}/> 03: Schedule</label>
          <input 
            type="date" 
            min={new Date().toISOString().split('T')[0]} 
            className="input-warm w-full py-5 text-lg font-black" 
            value={selectedDate} 
            onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }} 
          />
          <div className="grid grid-cols-4 gap-3 pt-6">
            {availableSlots.map(slot => (
              <button 
                key={slot} 
                onClick={() => setSelectedTime(slot)} 
                className={`py-4 rounded-2xl text-[11px] font-black transition-all border ${
                  selectedTime === slot ? 'bg-accent text-white border-accent shadow-lg scale-105' : 'bg-white border-stone-100 text-primary'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
          {availableSlots.length === 0 && selectedStaff && (
             <div className="py-10 text-center bg-stone-50 rounded-card border border-dashed border-stone-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">No slots available for this date</p>
             </div>
          )}
       </section>

       {/* Checkout Bar */}
       <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-stone-100 z-50">
          <div className="max-w-xl mx-auto flex items-center gap-6">
             <div className="flex-1">
                <p className="text-[9px] font-black uppercase text-accent tracking-[0.2em] mb-1">Price</p>
                <p className="text-3xl font-black text-primary tracking-tighter">฿{selectedService?.price || 0}</p>
             </div>
             <button 
               disabled={!selectedTime || submitting} 
               onClick={handleBooking} 
               className="btn-primary flex-1 py-5 shadow-2xl disabled:opacity-30"
             >
               {submitting ? <Loader2 className="animate-spin"/> : <span className="flex items-center gap-2">CONFIRM BOOKING <ChevronRight size={18}/></span>}
             </button>
          </div>
       </div>
    </div>
  );
}