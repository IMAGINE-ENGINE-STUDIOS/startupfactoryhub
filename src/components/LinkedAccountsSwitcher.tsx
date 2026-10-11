import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { ArrowLeftRight, Link2, Unlink, Loader2, Check } from 'lucide-react';
import { LinkedAccount, linkAccount, listLinkedAccounts, switchToAccount, unlinkCurrentAccount, hasSavedSession } from '@/lib/linkedAccounts';

export default function LinkedAccountsSwitcher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => listLinkedAccounts().then(setAccounts).catch(() => setAccounts([]));
  useEffect(() => { if (user && open) load(); }, [user, open]);

  const doLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await linkAccount(email.trim(), password);
      setEmail(''); setPassword('');
      toast({ title: 'Account linked', description: 'You can now switch to it from here.' });
      load();
    } catch (err: any) {
      toast({ title: 'Could not link account', description: err?.message || 'Check the email and password.', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const doSwitch = async (a: LinkedAccount) => {
    setBusy(true);
    const ok = await switchToAccount(a.user_id);
    setBusy(false);
    if (ok) { setOpen(false); navigate('/dashboard'); window.location.reload(); return; }
    setEmail(a.email);
    toast({ title: 'Sign in once on this device', description: 'Enter the password for that account below to switch to it.' });
  };

  const doUnlink = async () => {
    try { await unlinkCurrentAccount(); toast({ title: 'This account is no longer linked' }); load(); }
    catch (err: any) { toast({ title: 'Could not unlink', description: err?.message, variant: 'destructive' }); }
  };

  if (!user) return null;
  const others = accounts.filter(a => !a.is_current);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeftRight className="h-4 w-4" /> Switch account
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 bg-background backdrop-blur-none p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your linked accounts</p>
        {accounts.length === 0 && <p className="text-sm text-muted-foreground">No linked accounts yet.</p>}
        <div className="space-y-1">
          {accounts.map(a => (
            <button
              key={a.user_id}
              disabled={a.is_current || busy}
              onClick={() => doSwitch(a)}
              className="w-full flex items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted disabled:hover:bg-transparent"
            >
              <RoleBasedAvatar avatarUrl={a.avatar_url} role={(a.role as any) || null} fallbackText={a.full_name || a.email} className="h-8 w-8" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{a.full_name || a.email}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{a.role || 'member'} · {a.email}</p>
              </div>
              {a.is_current ? <Check className="h-4 w-4 text-primary" /> : !hasSavedSession(a.user_id) && <span className="text-[10px] text-muted-foreground">sign in</span>}
            </button>
          ))}
        </div>

        <form onSubmit={doLink} className="space-y-2 border-t border-border/40 pt-3">
          <p className="text-xs text-muted-foreground">
            {others.length ? 'Sign in to another account to link it or switch to it:' : 'Sign in to another of your accounts to link it:'}
          </p>
          <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" size="sm" className="w-full gap-2" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Sign in and link
          </Button>
        </form>

        {accounts.length > 1 && (
          <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground" onClick={doUnlink}>
            <Unlink className="h-4 w-4" /> Unlink this account
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
