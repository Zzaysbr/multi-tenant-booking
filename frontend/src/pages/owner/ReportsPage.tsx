// src/pages/owner/ReportsPage.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { BarChart3, TrendingUp, Users, Scissors, DollarSign, Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.tenantPath) return;
    api.get(`/api/${user.tenantPath}/owner/reports`)
      .then(res => setData(res.data))
      .catch(() => console.error("Report Fetch Failed"))
      .finally(() => setLoading(false));
  }, [user?.tenantPath]);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse">
       <Loader2 className="animate-spin text-primary mb-4" />
       <p className="font-black text-[10px] uppercase tracking-widest text-accent">Calculating Analytics...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 font-sans No Italic pb-20">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none flex items-center gap-4">
          <BarChart3 size={36} /> Intelligence
        </h1>
        <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em]">Comprehensive revenue and performance analysis</p>
      </header>

      {/* --- 💰 Summary Cards (High Contrast) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-primary p-10 rounded-card text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
          <DollarSign className="absolute -right-5 -bottom-5 size-44 opacity-5 group-hover:scale-110 transition-transform duration-700" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Revenue Portfolio</p>
          <p className="text-5xl font-black mt-4 tracking-tighter">฿{data?.totalRevenue?.toLocaleString()}</p>
          <div className="mt-6 flex items-center gap-2 text-[10px] font-black bg-white/10 w-fit px-4 py-2 rounded-full uppercase tracking-widest border border-white/5">
            <TrendingUp size={14} className="text-accent" /> +12.5% Growth Rate
          </div>
        </div>

        <div className="card-cozy p-10! flex flex-col justify-between border-stone-100 bg-white">
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Signature Service</p>
          <div className="space-y-2">
            <p className="text-2xl font-black text-primary uppercase tracking-tight truncate">
              {data?.revenueByService?.[0]?.name || 'No Data'}
            </p>
            <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Most Requested Collection</p>
          </div>
        </div>

        <div className="card-cozy p-10! flex flex-col justify-between border-stone-100 bg-white">
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Top Talent</p>
          <div className="space-y-2">
            <p className="text-2xl font-black text-primary uppercase tracking-tight">
              {data?.bookingsByStaff?.[0]?.name || 'N/A'}
            </p>
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Highest Completion Rate</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* --- Revenue by Service (Elegant Progress) --- */}
        <div className="card-cozy p-10! border-stone-100 bg-white shadow-xl shadow-black/2">
          <div className="flex items-center gap-3 mb-10">
             <Scissors size={18} className="text-accent" />
             <h3 className="text-xs font-black text-primary uppercase tracking-widest">Revenue Distribution</h3>
          </div>
          <div className="space-y-8">
            {data?.revenueByService?.map((s: any, idx: number) => {
              const percentage = (s.totalRevenue / data.totalRevenue) * 100;
              return (
                <div key={idx} className="space-y-3 group">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-black text-primary uppercase tracking-wider">{s.name}</span>
                    <span className="text-xs font-black text-primary">฿{Number(s.totalRevenue).toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-stone-50 rounded-full overflow-hidden border border-stone-100">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000 shadow-sm" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- Staff Performance (Leaderboard Style) --- */}
        <div className="card-cozy p-10! border-stone-100 bg-white shadow-xl shadow-black/2">
          <div className="flex items-center gap-3 mb-10">
             <Users size={18} className="text-accent" />
             <h3 className="text-xs font-black text-primary uppercase tracking-widest">Talent Bookings</h3>
          </div>
          <div className="space-y-4">
            {data?.bookingsByStaff?.map((st: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-5 bg-stone-50/50 rounded-2xl border border-stone-100 transition-all hover:bg-white hover:shadow-md group">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm text-primary font-black text-sm border border-stone-100 group-hover:bg-primary group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>
                  <div className="text-left">
                     <span className="block font-black text-[13px] text-primary uppercase tracking-tight">{st.name}</span>
                     <span className="text-[8px] font-bold text-muted uppercase tracking-[0.2em]">Verified Staff</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-primary">{st.count}</span>
                  <span className="text-[9px] font-bold text-accent ml-2 uppercase tracking-widest">Tickets</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}