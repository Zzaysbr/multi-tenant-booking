import { Outlet } from 'react-router-dom';
import CustomerNavbar from './CustomerNavbar';

export default function CustomerLayout() {
  return (
    <div className="min-h-screen bg-bg font-sans text-secondary-foreground">
      {/* ส่วน Navbar ติดด้านบน */}
      <CustomerNavbar />
      
      {/* ส่วนเนื้อหาหลัก: เว้นที่ด้านบน 100px เพื่อไม่ให้ Navbar บังเนื้อหา */}
      <main className="pt-25 pb-20">
        <Outlet />
      </main>
    </div>
  );
}