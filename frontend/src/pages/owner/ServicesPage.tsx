import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ name: '', price: '', durationMinutes: '60' });

  const fetchServices = () => {
    if (!user?.tenantPath) return;
    api.get(`/api/${user.tenantPath}/owner/services`)
      .then(res => setServices(res.data.services || []))
      .catch(() => toast.error("โหลดข้อมูลบริการไม่สำเร็จ"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchServices(); }, [user]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/api/${user?.tenantPath}/owner/services`, newService);
      toast.success("เพิ่มบริการสำเร็จ");
      setNewService({ name: '', price: '', durationMinutes: '60' });
      fetchServices();
    } catch (err) { toast.error("เพิ่มบริการไม่สำเร็จ"); }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("ต้องการลบบริการนี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/api/${user?.tenantPath}/owner/services/${id}`);
      toast.success("ลบสำเร็จ");
      fetchServices();
    } catch (err) { toast.error("ลบไม่สำเร็จ"); }
  };

  if (loading) return <div className="p-8">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary-foreground">จัดการบริการ</h1>
      
      <div className="bg-white p-6 rounded-card shadow-sm border border-accent/10">
        <form onSubmit={handleAddService} className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">ชื่อบริการ</label>
            <input required type="text" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="input-warm w-full" placeholder="เช่น ตัดผมชาย" />
          </div>
          <div className="w-32 space-y-2">
            <label className="text-sm font-medium">ราคา (บาท)</label>
            <input required type="number" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} className="input-warm w-full" />
          </div>
          <div className="w-32 space-y-2">
            <label className="text-sm font-medium">เวลา (นาที)</label>
            <input required type="number" value={newService.durationMinutes} onChange={e => setNewService({...newService, durationMinutes: e.target.value})} className="input-warm w-full" />
          </div>
          <button type="submit" className="btn-primary h-[42px] px-6">เพิ่มบริการ</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((s: any) => (
          <div key={s.id} className="bg-white p-4 rounded-card shadow-sm border border-accent/10 flex justify-between items-center">
            <div>
              <p className="font-bold text-secondary-foreground">{s.name}</p>
              <p className="text-sm text-accent">{s.durationMinutes} นาที • ฿{s.price}</p>
            </div>
            <button onClick={() => handleDelete(s.id)} className="text-red-500 text-sm hover:underline">ลบ</button>
          </div>
        ))}
      </div>
    </div>
  );
}