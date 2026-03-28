import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, 
  ArrowUpRight, Loader2, Calendar 
} from 'lucide-react';

// 🎨 Earth-tone Palette สำหรับกราฟ
const COLORS = ['#B38B6D', '#D4A373', '#A98467', '#827397', '#E9EDC9'];

export default function OverviewPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [reportRes, statsRes] = await Promise.all([
          api.get(`/api/${user?.tenantPath}/owner/reports`),
          api.get(`/api/${user?.tenantPath}/owner/stats`)
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
    <div className="h-[70vh] flex flex-col items-center justify-center text-accent animate-pulse">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="italic font-medium">กำลังรวบรวมตัวเลขให้ครับพี่...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 font-sans">
      
      {/* --- Header --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary-foreground flex items-center gap-3">
            <TrendingUp className="text-primary" size={32} /> ภาพรวมธุรกิจ
          </h1>
          <p className="text-accent text-sm font-medium italic mt-1">สรุปรายได้และสถิติการจองของร้านคุณในวันนี้</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-3">
          <Calendar size={18} className="text-primary" />
          <span className="text-sm font-bold text-secondary-foreground">28 มีนาคม 2026</span>
        </div>
      </header>

      {/* --- 🚀 Quick Stats Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="รายได้รวม" 
          value={`฿${data?.totalRevenue?.toLocaleString() || 0}`} 
          icon={<DollarSign className="text-emerald-600" />}
          trend="+12% จากเดือนที่แล้ว"
          color="bg-emerald-50"
        />
        <StatCard 
          title="รายการจองทั้งหมด" 
          value={stats?.total || 0} 
          icon={<ShoppingBag className="text-primary" />}
          trend="รวมทุกสถานะ"
          color="bg-primary/5"
        />
        <StatCard 
          title="รอยืนยัน" 
          value={stats?.pending || 0} 
          icon={<Loader2 className="text-orange-500" />}
          trend="ต้องตรวจสอบสลิป"
          color="bg-orange-50"
        />
        <StatCard 
          title="สำเร็จแล้ว" 
          value={stats?.confirmed || 0} 
          icon={<Users className="text-blue-500" />}
          trend="คิวที่เข้าใช้บริการแล้ว"
          color="bg-blue-50"
        />
      </div>

      {/* --- 📈 Charts Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* กราฟวงกลม: สัดส่วนรายได้แยกตามบริการ */}
        <div className="card-cozy p-8! border border-stone-100 bg-white shadow-sm">
          <h3 className="text-lg font-bold text-secondary-foreground mb-8 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" /> รายได้แยกตามบริการ
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.revenueByService}
                  cx="50%" cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="totalRevenue"
                  nameKey="name"
                >
                  {data?.revenueByService.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                   formatter={(value: any) => [`฿${value.toLocaleString()}`, 'รายได้']}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* กราฟแท่ง: จำนวนงานแยกตามพนักงาน */}
        <div className="card-cozy p-8! border border-stone-100 bg-white shadow-sm">
          <h3 className="text-lg font-bold text-secondary-foreground mb-8 flex items-center gap-2">
            <Users size={18} className="text-primary" /> ภาระงานพนักงาน (คิว)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.bookingsByStaff}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#F9F8F6' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" fill="#B38B6D" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

// Sub-component สำหรับ Stat Card
function StatCard({ title, value, icon, trend, color }: any) {
  return (
    <div className={`p-6 rounded-[32px] border border-white shadow-sm transition-all hover:shadow-md ${color}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white rounded-2xl shadow-sm">{icon}</div>
        <ArrowUpRight size={16} className="text-accent opacity-30" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">{title}</p>
        <h4 className="text-2xl font-black text-secondary-foreground">{value}</h4>
        <p className="text-[10px] font-bold text-accent mt-2 italic">{trend}</p>
      </div>
    </div>
  );
}