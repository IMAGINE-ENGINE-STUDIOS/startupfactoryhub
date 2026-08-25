import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Linkedin, CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/** Scopes the LinkedIn app is approved for, with plain-language descriptions. */
export const LINKEDIN_SCOPE_CATALOG: { id: string; label: string; description: string; required?: boolean }[] = [
  { id: 'openid', label: 'OpenID', description: 'Use your name and photo', required: true },
  { id: 'profile', label: 'Profile', description: 'Use your name and photo', required: true },
  { id: 'email', label: 'Email', description: 'Use the primary email address associated with your LinkedIn account' },
  { id: 'r_liteprofile', label: 'Lite profile', description: 'Use your name and photo' },
  { id: 'r_profile_basicinfo', label: 'Basic profile info', description: 'Access your basic profile information, such as your name, headline, profile photo, and profile URL.' },
  { id: 'w_member_social', label: 'Member posting', description: 'Create, modify, and delete posts, comments, and reactions on your behalf' },
  { id: 'r_organization_admin', label: 'Organization admin', description: "Retrieve your organization's pages and their reporting data (including follower, visitor and content analytics)" },
  { id: 'rw_events', label: 'Manage events', description: "Manage your organization's events (including create related posts)" },
  { id: 'r_events', label: 'Read events', description: "Retrieve your organization's events." },
  { id: 'r_ads', label: 'Ads accounts', description: 'Retrieve your advertising accounts' },
  { id: 'r_ads_leadgen_automation', label: 'Ads lead gen', description: 'Access your Lead Gen Forms and retrieve leads' },
  { id: 'r_marketing_leadgen_automation', label: 'Marketing lead gen', description: 'Access your lead generation forms and retrieve leads (including event leads, ad leads, and organization page leads).' },
  { id: 'r_verify', label: 'Verification', description: 'Get your profile verification' },
];

const SETTING_KEY = 'linkedin_scopes';

type Capability = { label: string; scopes: string[]; note: string };
const CAPABILITIES: Capability[] = [
  { label: 'Post as member (feed cross-post)', scopes: ['w_member_social'], note: 'Required for LinkedIn campaign posts authored by the connected member.' },
  { label: 'Company Page events sync', scopes: ['r_events'], note: 'Reads events owned by the page.' },
  { label: 'Create / manage page events', scopes: ['rw_events'], note: 'Creates events and their related posts on the page.' },
  { label: 'Page analytics', scopes: ['r_organization_admin'], note: 'Follower, visitor and content reporting.' },
  { label: 'Lead gen form retrieval', scopes: ['r_marketing_leadgen_automation'], note: 'Pulls event, ad and page leads.' },
];

export default function LinkedInPermissionsPanel() {
  const [granted, setGranted] = useState<string[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [org, setOrg] = useState<{ org_name?: string | null; expires_at?: string | null } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [{ data: conn }, { data: catalog }, { data: setting }] = await Promise.all([
        supabase.functions.invoke('linkedin-org-auth', { body: { action: 'check-connection' } }),
        supabase.functions.invoke('linkedin-org-auth', { body: { action: 'scope-catalog' } }),
        supabase.from('admin_settings').select('setting_value').eq('setting_key', SETTING_KEY).maybeSingle(),
      ]);
      setConnected(!!conn?.isConnected);
      setOrg(conn?.org ?? null);
      setGranted(Array.isArray(conn?.granted) ? conn.granted : []);
      const saved = (setting?.setting_value as any)?.scopes;
      setSelected(Array.isArray(saved) && saved.length ? saved : (catalog?.defaults ?? []));
    } catch (e) {
      console.error('linkedin permissions load failed', e);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string, on: boolean) {
    setSelected((prev) => (on ? Array.from(new Set([...prev, id])) : prev.filter((s) => s !== id)));
  }

  async function saveAndConnect() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('admin_settings').upsert({
        setting_key: SETTING_KEY,
        setting_value: { scopes: selected },
        description: 'LinkedIn OAuth scopes requested on the next Company Page authorization',
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'setting_key' });

      const { data, error } = await supabase.functions.invoke('linkedin-org-auth', {
        body: { action: 'get-auth-url', scopes: selected, origin: window.location.origin },
      });
      if (error || !data?.authUrl) {
        toast.error('Failed to start LinkedIn authorization');
        return;
      }
      const w = window.open(data.authUrl, 'linkedin-org', 'width=600,height=740');
      const onMsg = (e: MessageEvent) => {
        if (e.data?.type === 'linkedin-org-success') {
          toast.success('LinkedIn authorized');
          void load();
          window.removeEventListener('message', onMsg);
          w?.close();
        }
        if (e.data?.type === 'linkedin-org-error') {
          toast.error('LinkedIn authorization failed');
          window.removeEventListener('message', onMsg);
        }
      };
      window.addEventListener('message', onMsg);
    } finally {
      setSaving(false);
    }
  }

  const missing = selected.filter((s) => connected && !granted.includes(s));
  const expiry = org?.expires_at ? new Date(org.expires_at) : null;
  const daysLeft = expiry ? Math.ceil((expiry.getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="tech-card border-0 rounded-xl p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">LinkedIn Permissions</span>
              {connected === true && (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Connected{org?.org_name ? ` · ${org.org_name}` : ''}
                </Badge>
              )}
              {connected === false && (
                <Badge variant="outline" className="border-amber-500/40 text-amber-400">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Not connected
                </Badge>
              )}
              {daysLeft !== null && (
                <Badge variant="outline" className={daysLeft < 7 ? 'border-amber-500/40 text-amber-400' : 'border-border'}>
                  Token {daysLeft > 0 ? `expires in ${daysLeft}d` : 'expired'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Scopes define what the app can do on LinkedIn's behalf. Only scopes your LinkedIn app is approved for can be
              requested — asking for an unapproved scope makes LinkedIn reject the whole authorization.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => void saveAndConnect()} disabled={saving}>
            <Linkedin className="h-4 w-4 mr-2" />
            {connected ? 'Reauthorize with selected scopes' : 'Authorize LinkedIn'}
          </Button>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-300">
          Requested but not granted: {missing.join(', ')}. Reauthorize and approve them on the LinkedIn consent screen.
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {LINKEDIN_SCOPE_CATALOG.map((s) => {
          const isGranted = granted.includes(s.id);
          const isSelected = selected.includes(s.id) || !!s.required;
          return (
            <label
              key={s.id}
              className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 cursor-pointer hover:bg-white/[0.05] transition-colors"
            >
              <Checkbox
                checked={isSelected}
                disabled={!!s.required}
                onCheckedChange={(v) => toggle(s.id, v === true)}
                className="mt-0.5"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-xs font-mono text-foreground">{s.id}</code>
                  {s.required && <Lock className="h-3 w-3 text-muted-foreground" />}
                  {connected && (
                    isGranted ? (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] py-0">granted</Badge>
                    ) : (
                      <Badge variant="outline" className="border-border text-muted-foreground text-[10px] py-0">not granted</Badge>
                    )
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/10 p-4 space-y-2">
        <div className="text-sm font-medium">What the granted scopes enable</div>
        {CAPABILITIES.map((c) => {
          const ok = c.scopes.every((s) => granted.includes(s));
          return (
            <div key={c.label} className="flex items-start gap-2 text-sm">
              {ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              )}
              <span className={ok ? '' : 'text-muted-foreground'}>
                {c.label} <span className="text-xs text-muted-foreground">— {c.note}</span>
              </span>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground pt-1">
          Posting directly to the Company Page feed requires <code className="font-mono">w_organization_social</code>, which is not
          in this app's approved scope list. Until LinkedIn approves it, page campaigns publish through the connected member
          token (<code className="font-mono">w_member_social</code>) and page events use <code className="font-mono">rw_events</code>.
        </p>
      </div>
    </div>
  );
}
