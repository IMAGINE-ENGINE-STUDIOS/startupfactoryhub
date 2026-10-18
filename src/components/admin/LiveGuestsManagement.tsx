import { useEffect, useMemo, useState } from 'react';
import { Download, Search, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Row = { id: string; room_name: string; full_name: string; email: string; guest_role: string; created_at: string };

export default function LiveGuestsManagement() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'all' | 'startup' | 'investor'>('all');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('live_guest_checkins' as any).select('*').order('created_at', { ascending: false }).limit(1000);
    setRows((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const shown = useMemo(() => rows.filter((r) =>
    (role === 'all' || r.guest_role === role) &&
    (!q || `${r.full_name} ${r.email} ${r.room_name}`.toLowerCase().includes(q.toLowerCase()))), [rows, q, role]);

  const exportCsv = () => {
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = ['Name,Email,Role,Room,Joined', ...shown.map((r) => [r.full_name, r.email, r.guest_role, r.room_name, new Date(r.created_at).toISOString()].map(esc).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `live-guests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };
  const del = async (id: string) => { await supabase.from('live_guest_checkins' as any).delete().eq('id', id); setRows((r) => r.filter((x) => x.id !== id)); };

  const count = (k: string) => rows.filter((r) => r.guest_role === k).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[['Total guests', rows.length], ['Startups', count('startup')], ['Investors', count('investor')]].map(([l, v]) => (
          <div key={l as string} className="bg-[#0A1418] border border-cyan-400/15 rounded-md p-4"><p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73]">{l}</p><p className="text-2xl font-semibold mt-1 font-['JetBrains_Mono']">{v}</p></div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or room" className="pl-9 bg-white/[0.03] border-white/10 focus:border-[#00E5FF]/50" /></div>
        {(['all', 'startup', 'investor'] as const).map((r) => <Button key={r} size="sm" variant={role === r ? 'default' : 'outline'} onClick={() => setRole(r)} className="capitalize">{r}</Button>)}
        <Button size="sm" variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-1" />CSV</Button>
      </div>
      <div className="bg-[#0A1418] border border-cyan-400/15 rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73] border-b border-white/[0.05]"><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Room</th><th className="p-3">Joined</th><th /></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading...</td></tr>
              : shown.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No guests yet</td></tr>
              : shown.map((r) => (
                <tr key={r.id} className="border-b border-white/[0.05]">
                  <td className="p-3 font-medium">{r.full_name}</td>
                  <td className="p-3"><a href={`mailto:${r.email}`} className="text-primary hover:underline">{r.email}</a></td>
                  <td className="p-3"><Badge variant="secondary" className="font-['JetBrains_Mono'] uppercase text-[10px] tracking-wider">{r.guest_role}</Badge></td>
                  <td className="p-3 text-muted-foreground">{r.room_name}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3"><button aria-label="Delete" onClick={() => del(r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
