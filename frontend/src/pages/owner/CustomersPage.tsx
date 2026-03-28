// src/pages/owner/CustomersPage.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Users, Search, Mail, CalendarCheck, Loader2, Star, UserCircle } from 'lucide-react';

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get(`/api/${user?.tenantPath}/owner/customers`)
      .then(res => setCustomers(res.data.customers || []))
      .catch(() => console.error("Error loading customers data"))
      .finally(() => setLoading(false));
  }, [user?.tenantPath]);

  const filtered = customers.filter((c: any) => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse font-sans font-black text-[10px] uppercase tracking-widest text-accent">
       <Loader2 className="animate-spin mb-4" size={40} />
       ACCESSING CLIENT DATABASE...
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans pb-20 text-secondary-foreground No Italic">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-3 tracking-tighter uppercase"><Users size={32} /> Customers</h1>
          <p className="text-muted text-[10px] font-black mt-1 uppercase tracking-widest">Manage your VIP client profiles and history</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
          <input 
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="input-warm w-full pl-12" placeholder="Search by Name or Email..."
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {filtered.map((c: any) => (
          <div key={c.id} className="card-cozy p-8 border-stone-50 hover:border-accent/30 transition-all group shadow-xl shadow-black/5 hover:-translate-y-1 duration-500">
            <div className="flex items-start justify-between mb-6">
               <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center text-primary border border-stone-100 shadow-inner group-hover:scale-110 transition-transform duration-500 font-black text-2xl uppercase tracking-tighter">
                 {c.name?.charAt(0)}
               </div>
               <div className="flex gap-1.5 text-accent opacity-60">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
               </div>
            </div>

            <div className="space-y-1.5 mb-6">
              <h4 className="text-xl font-black text-primary tracking-tight leading-none">{c.name}</h4>
              <p className="text-xs font-bold text-muted flex items-center gap-2">
                <Mail size={14} className="opacity-60" /> {c.email || 'No email provided'}
              </p>
              <p className="text-[9px] font-bold text-muted uppercase tracking-[0.2em]">Contact: {c.phone || '-'}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 py-4 border-t border-stone-50 mt-4 text-sm font-black text-primary uppercase">
                <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100">
                   <div className="flex items-center gap-2">
                      <CalendarCheck size={18} className="text-stone-300" /> Total Bookings
                   </div>
                   {c.bookingCount || 0} ครั้ง
                </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="md:col-span-3 py-20 bg-stone-50/50 rounded-[40px] border-2 border-dashed border-stone-100 flex flex-col items-center justify-center text-stone-300 gap-3">
             <UserCircle size={48} />
             <p className="font-bold text-[10px] uppercase tracking-widest">No customer profiles found</p>
          </div>
        )}
      </div>
    </div>
  );
}