// src/pages/owner/CustomersPage.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Users, Search, Mail, CalendarCheck, Loader2, Star, UserCircle, Phone } from 'lucide-react';

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.tenantPath) return;
    api.get(`/api/${user.tenantPath}/owner/customers`)
      .then(res => setCustomers(res.data.customers || []))
      .catch(() => console.error("Error loading customers data"))
      .finally(() => setLoading(false));
  }, [user?.tenantPath]);

  const filtered = customers.filter((c: any) => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse">
       <Loader2 className="animate-spin text-primary mb-4" size={40} />
       <p className="font-black text-[10px] uppercase tracking-widest text-accent">Accessing Client Database...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans No Italic pb-20">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none flex items-center gap-4">
            <Users size={36} /> CRM Hub
          </h1>
          <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em]">Manage your VIP client profiles and history</p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-accent transition-colors" size={18} />
          <input 
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="input-warm w-full pl-14 py-4 text-xs font-black uppercase tracking-widest" placeholder="Search by Name or Email..."
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((c: any) => (
          <div key={c.id} className="card-cozy p-10 border-stone-50 hover:border-accent/30 transition-all group bg-white shadow-xl shadow-black/[0.02] hover:-translate-y-2 duration-500 relative overflow-hidden">
            
            <div className="flex items-start justify-between mb-8">
               <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center text-primary border border-stone-100 shadow-inner group-hover:rotate-6 transition-transform duration-500 font-black text-2xl uppercase tracking-tighter">
                 {c.name?.charAt(0)}
               </div>
               <div className="flex gap-1 text-accent/30 group-hover:text-accent transition-colors">
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
               </div>
            </div>

            <div className="space-y-4 mb-8 text-left">
              <div>
                <h4 className="text-xl font-black text-primary tracking-tight leading-none uppercase">{c.name}</h4>
                <p className="text-[9px] font-bold text-accent uppercase tracking-widest mt-2">Preferred Member</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[10px] font-black text-muted uppercase tracking-tight">
                  <Mail size={14} className="text-stone-300" /> {c.email || 'Private Email'}
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black text-muted uppercase tracking-tight">
                  <Phone size={14} className="text-stone-300" /> {c.phone || 'No Contact'}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-stone-50">
                <div className="flex justify-between items-center bg-stone-50/50 p-4 rounded-2xl border border-stone-100 group-hover:bg-white transition-colors">
                   <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-widest">
                      <CalendarCheck size={18} className="text-stone-200" /> Usage History
                   </div>
                   <span className="text-sm font-black text-primary">{c.bookingCount || 0} TIMES</span>
                </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="md:col-span-3 py-24 bg-stone-50/30 rounded-4xl border-2 border-dashed border-stone-100 flex flex-col items-center justify-center text-stone-300 gap-4">
             <UserCircle size={56} className="opacity-20" />
             <p className="font-black text-[10px] uppercase tracking-[0.4em]">No matching client profiles</p>
          </div>
        )}
      </div>
    </div>
  );
}