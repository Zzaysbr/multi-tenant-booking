import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { 
  BarChart3, PieChart, TrendingUp, Download, 
  Calendar, Scissors, User, ChevronDown 
} from 'lucide-react';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  const tenantPath = ':tenantPath';

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // จำลองการดึงข้อมูลสถิติเชิงลึกจาก Backend
        const res = await api.get(`/api/${tenantPath}/owner/bookings`);
        const bookings = res.data.bookings;

        // Logic คำนวณเบื้องต้น (ในระบบจริงควรคำนวณจาก SQL Backend)
        const totalRevenue = bookings.filter((b:any) => b.status === 'confirmed').length * 350;
        const totalCustomers = [...new Set(bookings.map((b:any) => b.customerId))].length;

        setReportData({
          revenue: totalRevenue,
          customers: totalCustomers,
          avgValue: totalRevenue > 0 ? (totalRevenue / bookings.length).toFixed(0) : 0,
          performance: [
            { name: 'ตัดผมชาย', value: 65, color: 'bg-primary' },
            { name: 'สระไดร์', value: 20, color: 'bg-accent' },
            { name: 'ทำสีผม', value: 15, color: 'bg-secondary-foreground/20' },
          ]
        });
      } catch (error) {
        console.error("Report Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [tenantPath]);

  if (loading) return <div className="p-20 text-center text-primary italic font-medium">กำลังวิเคราะห์ข้อมูลเชิงลึก... 📊</div>;

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- Header & Filter --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-foreground flex items-center gap-3">
            <BarChart3 className="text-primary" size={32} />
            รายงานสรุปผล
          </h1>
          <p className="text-accent text-sm md:text-base font-medium mt-1">วิเคราะห์การเติบโตของร้านคุณด้วยข้อมูลที่แม่นยำ</p>
        </div>
        
        <div className="flex gap-2">
          <button className="btn-outline flex items-center gap-2 text-sm px-4! py-2!">
            <Calendar size={18} />
            เดือนนี้ <ChevronDown size={14} />
          </button>
          <button className="btn-primary flex items-center gap-2 text-sm px-4! py-2!">
            <Download size={18} />
            ส่งออกไฟล์
          </button>
        </div>
      </div>

      {/* --- Key Metrics --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-cozy p-8! bg-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={80} />
          </div>
          <p className="text-xs font-bold text-accent uppercase tracking-widest">ยอดขายสุทธิ</p>
          <h3 className="text-4xl font-black text-secondary-foreground mt-2">฿{reportData.revenue.toLocaleString()}</h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
             +12.5% จากเดือนที่แล้ว
          </p>
        </div>

        <div className="card-cozy p-8! bg-white">
          <p className="text-xs font-bold text-accent uppercase tracking-widest">ลูกค้าทั้งหมด</p>
          <h3 className="text-4xl font-black text-secondary-foreground mt-2">{reportData.customers} <span className="text-sm font-normal">คน</span></h3>
          <p className="text-[10px] text-primary font-bold mt-2">
             ฐานลูกค้าขยายตัวอย่างต่อเนื่อง
          </p>
        </div>

        <div className="card-cozy p-8! bg-white">
          <p className="text-xs font-bold text-accent uppercase tracking-widest">ยอดจองเฉลี่ย</p>
          <h3 className="text-4xl font-black text-secondary-foreground mt-2">฿{reportData.avgValue}</h3>
          <p className="text-[10px] text-accent font-bold mt-2">
             ต่อหนึ่งการจอง (Average Ticket Size)
          </p>
        </div>
      </div>

      {/* --- Detailed Analysis Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* บริการยอดนิยม */}
        <div className="card-cozy">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2"><Scissors size={20} className="text-primary"/> สัดส่วนบริการ</h3>
            <PieChart size={18} className="text-accent" />
          </div>
          
          <div className="space-y-6">
            {reportData.performance.map((item: any, i: number) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>{item.name}</span>
                  <span className="text-primary">{item.value}%</span>
                </div>
                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-1000`} 
                    style={{ width: `${item.value}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ช่างดีเด่น (Staff Leaderboard) */}
        <div className="card-cozy">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2"><User size={20} className="text-primary"/> อันดับช่างที่ลูกค้าไว้วางใจ</h3>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          
          <div className="space-y-4">
            {[
              { name: 'ช่างบอย', bookings: 42, rating: 4.9 },
              { name: 'ช่างเอก', bookings: 38, rating: 4.8 },
              { name: 'ช่างนัท', bookings: 25, rating: 4.7 },
            ].map((staff, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl hover:bg-secondary/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-secondary-foreground">{staff.name}</p>
                    <p className="text-[10px] text-accent uppercase font-medium">{staff.bookings} นัดหมาย</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-primary italic">⭐ {staff.rating}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}