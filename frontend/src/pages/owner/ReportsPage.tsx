import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { BarChart3, TrendingUp, Users, Scissors, DollarSign, Award } from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/${user?.tenantPath}/owner/reports`)
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, [user?.tenantPath]);

  if (loading) return <div className="p-20 text-center italic text-accent animate-pulse">กำลังคำนวณยอดขาย...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <header>
        <h1 className="text-3xl font-black text-secondary-foreground flex items-center gap-3">
          <BarChart3 className="text-primary" size={32} /> รายงานและสถิติ
        </h1>
        <p className="text-accent font-medium mt-1">สรุปภาพรวมรายได้และประสิทธิภาพของร้านคุณ</p>
      </header>

      {/* --- Cards Summary --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary p-8 rounded-[32px] text-white shadow-xl shadow-primary/20 relative overflow-hidden">
          <DollarSign className="absolute right-[-10px] bottom-[-10px] size-32 opacity-10" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Total Revenue</p>
          <p className="text-4xl font-black mt-2">฿ {data.totalRevenue.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1 rounded-full">
            <TrendingUp size={14} /> +12% จากเดือนที่แล้ว
          </div>
        </div>

        <div className="card-cozy p-8! flex flex-col justify-between">
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Top Service</p>
          <div>
            <p className="text-2xl font-black text-secondary-foreground truncate">
              {data.revenueByService[0]?.name || 'N/A'}
            </p>
            <p className="text-xs font-bold text-primary mt-1">
              ทำเงินได้มากที่สุดในร้าน
            </p>
          </div>
        </div>

        <div className="card-cozy p-8! flex flex-col justify-between">
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Busiest Staff</p>
          <div>
            <p className="text-2xl font-black text-secondary-foreground">
              {data.bookingsByStaff[0]?.name || 'N/A'}
            </p>
            <p className="text-xs font-bold text-emerald-600 mt-1">
              พนักงานที่มีการจองเยอะที่สุด
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- รายได้แยกตามบริการ --- */}
        <div className="card-cozy p-8!">
          <h3 className="font-black text-secondary-foreground flex items-center gap-2 mb-8 uppercase text-xs tracking-widest">
            <Scissors size={16} className="text-primary" /> Revenue by Service
          </h3>
          <div className="space-y-6">
            {data.revenueByService.map((s: any, idx: number) => {
              const percentage = (s.totalRevenue / data.totalRevenue) * 100;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-secondary-foreground">
                    <span>{s.name}</span>
                    <span>฿{Number(s.totalRevenue).toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-secondary/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- งานแยกตามช่าง --- */}
        <div className="card-cozy p-8!">
          <h3 className="font-black text-secondary-foreground flex items-center gap-2 mb-8 uppercase text-xs tracking-widest">
            <Users size={16} className="text-primary" /> Bookings by Staff
          </h3>
          <div className="space-y-4">
            {data.bookingsByStaff.map((st: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-bg rounded-2xl border border-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-primary font-black">
                    {idx + 1}
                  </div>
                  <span className="font-bold text-secondary-foreground">{st.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-secondary-foreground">{st.count}</span>
                  <span className="text-[10px] font-bold text-accent ml-1 uppercase">Jobs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}