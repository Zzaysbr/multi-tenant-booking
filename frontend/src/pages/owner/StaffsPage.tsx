import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';

export default function StaffsPage() {
  const { user } = useAuth();
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');

  const fetchStaffs = () => {
    if (!user?.tenantPath) return;
    api.get(`/api/${user.tenantPath}/owner/staffs`)
      .then(res => setStaffs(res.data.staffs || []))
      .catch(() => toast.error("โหลดข้อมูลพนักงานไม่สำเร็จ"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStaffs(); }, [user]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      await api.post(`/api/${user?.tenantPath}/owner/staffs`, { name });
      toast.success("เพิ่มช่างสำเร็จ");
      setName('');
      fetchStaffs();
    } catch (err) { toast.error("เพิ่มช่างไม่สำเร็จ"); }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("ต้องการลบช่างคนนี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/api/${user?.tenantPath}/owner/staffs/${id}`);
      toast.success("ลบสำเร็จ");
      fetchStaffs();
    } catch (err) { toast.error("ลบไม่สำเร็จ"); }
  };

  if (loading) return <div className="p-8">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary-foreground">จัดการพนักงาน/ช่าง</h1>
      
      <div className="bg-white p-6 rounded-card shadow-sm border border-accent/10">
        <form onSubmit={handleAddStaff} className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">ชื่อพนักงาน</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="input-warm w-full" placeholder="เช่น ช่างเอก" />
          </div>
          <button type="submit" className="btn-primary h-[42px] px-6">เพิ่มพนักงาน</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {staffs.map((st: any) => (
          <div key={st.id} className="bg-white p-4 rounded-card shadow-sm border border-accent/10 flex justify-between items-center">
            <p className="font-bold text-secondary-foreground">{st.name}</p>
            <button onClick={() => handleDelete(st.id)} className="text-red-500 text-sm hover:underline">ลบ</button>
          </div>
        ))}
      </div>
    </div>
  );
}