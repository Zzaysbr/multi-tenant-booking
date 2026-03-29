// src/pages/owner/OverviewPage.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { 
  Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  ShoppingBag, DollarSign, 
  ArrowUpRight, Loader2, Calendar, Sparkles, UserCheck
} from 'lucide-react';

// ☕️ Premium Boutique Palette
const COLORS = ['#4A3728', '#B38B6D', '#8C7E74', '#D4B9A3', '#E8DED3'];

export default function OverviewPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.tenantPath) return;
      try {
        const [reportRes, statsRes] = await Promise.all([
          api.get(`/${user.tenantPath}/owner/reports`),
          api.get(`/${user.tenantPath}/owner/stats`)
        ]);
        setData(reportRes.data);
        setStats(statsRes.data.stats);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user?.tenantPath]);

  if (loading) return (
    <div className="h-[70vh] flex flex-col items-center justify-center text-primary animate-pulse font-sans">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="font-black text-[10px] uppercase tracking-[0.3em]">Gathering Intelligence...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20 font-sans No Italic">
      
      {/* --- ☕️ Header --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <div className="p-1.5 bg-accent/10 rounded-lg text-accent"><Sparkles size={16}/></div>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Business Intelligence</span>
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">ภาพรวมความสำเร็จ</h1>
        </div>
        <div className="bg-white px-6 py-4 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-3">
          <Calendar size={18} className="text-accent" />
          <span className="text-xs font-black text-primary uppercase tracking-widest">
            {new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </header>

      {/* --- 🚀 Quick Stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="รายได้รวม" value={`฿${data?.totalRevenue?.toLocaleString() || 0}`} icon={<DollarSign size={20} />} trend="+12% vs last month" isPrimary />
        <StatCard title="รายการจอง" value={stats?.total || 0} icon={<ShoppingBag size={20} />} trend="ยอดจองทุุกสถานะ" />
        <StatCard title="รอตรวจสอบ" value={stats?.pending || 0} icon={<Loader2 size={20} />} trend="ต้องเช็คสลิปโอน" />
        <StatCard title="สำเร็จแล้ว" value={stats?.confirmed || 0} icon={<UserCheck size={20} />} trend="ยืนยันคิวแล้ว" />
      </div>

      {/* --- 📈 Charts Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-7 card-cozy p-10! border-stone-100 shadow-xl shadow-black/5">
          <h3 className="text-xl font-black text-primary tracking-tight uppercase mb-10">Revenue by Service</h3>
          <div className="h-87.5">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <PieChart>
                <Pie data={data?.revenueByService} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="totalRevenue" nameKey="name">
                  {data?.revenueByService?.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px' }}
                  itemStyle={{ fontWeight: '900', fontSize: '11px', textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
           <div className="card-cozy p-10! bg-primary text-white border-none shadow-2xl shadow-primary/20 h-full">
              <h3 className="text-xl font-black mb-8 tracking-tight uppercase">Top Performers</h3>
              <div className="space-y-6">
                {data?.bookingsByStaff?.map((st: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-lg border border-white/5 group-hover:bg-accent transition-colors">
                          {st.name.charAt(0)}
                       </div>
                       <div>
                          <p className="font-black text-sm uppercase">{st.name}</p>
                          <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Verified Staff</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-black">{st.count}</p>
                       <p className="text-[9px] font-bold text-white/20 uppercase">Jobs Done</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, isPrimary }: any) {
  return (
    <div className={`card-cozy p-8! border-stone-100 group transition-all duration-500 hover:-translate-y-2 cursor-pointer ${isPrimary ? 'bg-linear-to-br from-white to-secondary/30' : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl ${isPrimary ? 'bg-primary text-white shadow-lg' : 'bg-secondary text-accent'}`}>{icon}</div>
        <ArrowUpRight size={16} className="text-stone-300 group-hover:text-accent" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted mb-2 leading-none">{title}</p>
        <h4 className="text-3xl font-black text-primary tracking-tighter">{value}</h4>
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-3 opacity-60">{trend}</p>
      </div>
    </div>
  );
}