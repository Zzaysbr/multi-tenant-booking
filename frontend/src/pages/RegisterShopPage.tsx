import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function RegisterShopPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shopName: '', pathName: '', email: '', password: '', ownerName: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/create-shop', formData);
      alert("สร้างร้านสำเร็จ! กรุณาล็อกอิน");
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการสร้างร้าน');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="card-slate w-full max-w-lg">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">เริ่มสร้างธุรกิจของคุณ</h2>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-btn text-sm mb-4 border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-600 mb-1">ชื่อร้าน</label>
              <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-btn" 
                     onChange={(e) => setFormData({...formData, shopName: e.target.value})} required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-600 mb-1">URL ร้าน (ภาษาอังกฤษเท่านั้น)</label>
              <input type="text" placeholder="เช่น my-barber" className="w-full px-4 py-2 border border-slate-200 rounded-btn" 
                     onChange={(e) => setFormData({...formData, pathName: e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">ชื่อเจ้าของร้าน</label>
            <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-btn" 
                   onChange={(e) => setFormData({...formData, ownerName: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">อีเมลผู้ใช้งาน</label>
            <input type="email" className="w-full px-4 py-2 border border-slate-200 rounded-btn" 
                   onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">รหัสผ่าน</label>
            <input type="password" title="รหัสผ่าน" className="w-full px-4 py-2 border border-slate-200 rounded-btn" 
                   onChange={(e) => setFormData({...formData, password: e.target.value})} required />
          </div>
          <button type="submit" className="btn-primary w-full py-3 mt-4">
            สร้างร้านและบัญชีผู้ใช้
          </button>
        </form>
      </div>
    </div>
  );
}