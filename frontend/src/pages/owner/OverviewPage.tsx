import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function OverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🛡️ ป้องกันไม่ให้ยิง API ถ้า user ยังโหลดไม่เสร็จ
    if (!user || !user.tenantPath) return;

    console.log(`กำลังดึงข้อมูลสถิติของร้าน: ${user.tenantPath}`);

    api.get(`/api/${user.tenantPath}/owner/stats`)
      .then((res) => {
        if (res.data.stats) setStats(res.data.stats);
      })
      .catch((err) => console.error("โหลดสถิติพัง:", err))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="p-8">กำลังเชื่อมต่อฐานข้อมูล...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">แดชบอร์ดร้าน {user?.tenantPath}</h1>
      <div className="flex gap-4">
        <div className="p-6 bg-white border rounded shadow-sm w-48">
          <p className="text-sm text-gray-500">นัดหมายรวม</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="p-6 bg-white border rounded shadow-sm w-48">
          <p className="text-sm text-gray-500">รอยืนยัน</p>
          <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
        </div>
      </div>
    </div>
  );
}