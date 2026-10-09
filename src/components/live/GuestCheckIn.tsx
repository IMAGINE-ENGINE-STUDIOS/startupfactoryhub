import { useState } from 'react';
import { Rocket, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import sfhLogo from '@/assets/sfh-logo-emblem.png';

export type Checkin = { name: string; email: string; role: 'startup' | 'investor' };
const KEY = 'sfh-live-checkin';
export const readCheckin = (): Checkin | null => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };

export default function GuestCheckIn({ room, onDone }: { room: string; onDone: (c: Checkin) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Checkin['role'] | ''>('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const n = name.trim(), e = email.trim().toLowerCase();
    if (!n) return setErr('Please enter your name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return setErr('Please enter a valid email');
    if (!role) return setErr('Please choose Startup or Investor');
    setBusy(true); setErr('');
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('live_guest_checkins' as any).insert({ room_name: room, full_name: n.slice(0, 120), email: e, guest_role: role, user_id: user?.id ?? null });
    setBusy(false);
    if (error) return setErr('Could not check you in. Please try again.');
    const c = { name: n, email: e, role };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* ignore */ }
    onDone(c);
  };

  const roleBtn = (r: Checkin['role'], label: string, Icon: any) => (
    <button type="button" onClick={() => setRole(r)}
      className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border text-sm ${role === r ? 'border-white bg-white text-zinc-900' : 'border-white/15 text-zinc-200 hover:border-white/40'}`}>
      <Icon className="w-5 h-5" />{label}
    </button>
  );

  return (
    <div className="w-full h-screen bg-zinc-950 flex items-center justify-center p-6">
      <form onSubmit={(ev) => { ev.preventDefault(); submit(); }} className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-[2rem] p-8 max-w-sm w-full space-y-4">
        <img src={sfhLogo} alt="Startup Factory Hub" className="h-12 mx-auto object-contain" />
        <div className="text-center">
          <h1 className="text-white text-lg font-semibold">Join the live event</h1>
          <p className="text-zinc-400 text-sm mt-1">No account needed. Tell us who you are.</p>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" maxLength={120}
          className="w-full px-4 py-3 rounded-full bg-white/[0.06] border border-white/10 text-white placeholder:text-zinc-500 outline-none focus:border-white/40" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" maxLength={255}
          className="w-full px-4 py-3 rounded-full bg-white/[0.06] border border-white/10 text-white placeholder:text-zinc-500 outline-none focus:border-white/40" />
        <div className="flex gap-3">{roleBtn('startup', 'Startup', Rocket)}{roleBtn('investor', 'Investor', TrendingUp)}</div>
        {err && <p className="text-red-400 text-xs text-center">{err}</p>}
        <button disabled={busy} className="w-full py-3 rounded-full bg-white text-zinc-900 font-medium disabled:opacity-60">{busy ? 'Joining...' : 'Join call'}</button>
      </form>
    </div>
  );
}
