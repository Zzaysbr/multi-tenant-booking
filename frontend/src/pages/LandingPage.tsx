import { Link } from 'react-router-dom';
import { Scissors, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-slate-100 py-4 px-8 flex justify-between items-center">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
          <Calendar className="text-primary" />
          <span>SaaS Booking</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-4 py-2 text-slate-600 font-medium">เข้าสู่ระบบ</Link>
          <Link to="/create-shop" className="btn-primary">เปิดร้านเลย</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-6xl mx-auto px-8 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
          ระบบจองคิวอัจฉริยะ <br />
          <span className="text-slate-500">สำหรับธุรกิจยุคใหม่</span>
        </h1>
        <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
          จัดการคิวลูกค้าของคุณให้เป็นเรื่องง่าย ป้องกันการจองซ้อน รองรับการจ่ายเงิน 
          และแจ้งเตือนผ่าน LINE อัตโนมัติ ครบจบในที่เดียว
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/create-shop" className="btn-primary text-lg px-8 py-4">
            เริ่มต้นใช้งานฟรี <ArrowRight size={20} />
          </Link>
          <button className="px-8 py-4 bg-secondary text-secondary-foreground rounded-btn font-medium hover:bg-slate-200 transition-all">
            ดูตัวอย่างระบบ
          </button>
        </div>
      </header>

      {/* Feature Grid */}
      <section className="bg-slate-50 py-20 px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: ShieldCheck, title: "กันจองซ้อน 100%", desc: "ด้วยระบบ Database Transaction มั่นใจได้ว่าไม่มีคิวชนกันแน่นอน" },
            { icon: Scissors, title: "รองรับทุกธุรกิจ", desc: "ไม่ว่าจะเป็นร้านตัดผม คลินิก หรือร้านอาหาร ก็ปรับแต่งบริการได้ตามใจ" },
            { icon: Calendar, title: "แจ้งเตือนผ่าน LINE", desc: "ส่งนัดหมายยืนยันเข้ามือถือลูกค้าทันที ไม่ต้องกลัวลูกค้าลืม" },
          ].map((feature, idx) => (
            <div key={idx} className="card-slate border-none shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <feature.icon className="text-primary" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}