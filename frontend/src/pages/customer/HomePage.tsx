import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Store, ArrowRight, Star } from 'lucide-react';

export default function HomePage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // สร้าง API เส้นใหม่ใน auth หรือ public เพื่อดึงรายชื่อร้าน
    api.get('/auth/shops') // เดี๋ยวไปเพิ่มใน Backend กันครับ
      .then(res => setShops(res.data.shops))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-black text-secondary-foreground">ค้นหาร้านบริการที่ถูกใจ ✨</h1>
          <p className="text-accent font-medium">จองง่าย จ่ายสะดวก นัดหมายล่วงหน้าได้ทันที</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shops.map((shop: any) => (
            <Link key={shop.id} to={`/${shop.path_name}`} className="card-cozy p-6! group hover:border-primary transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-primary">
                    <Store size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-secondary-foreground">{shop.name}</h2>
                  <div className="flex items-center gap-1 text-orange-500">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-bold text-accent">5.0 (20+ รีวิว)</span>
                  </div>
                </div>
                <div className="bg-primary/10 p-2 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <ArrowRight size={20} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}