import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Loader2, Save, Download, Linkedin, RefreshCw, Send, Link2,
  Sparkles, Copy, CheckCircle2, AlertCircle, ChevronDown, ShieldCheck, Radio, FlaskConical,
} from 'lucide-react';

import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import html2canvas from 'html2canvas';

interface Template {
  id: string;
  name: string;
  layout: string;
  background_type: string;
  background_value: string;
  headline: string;
  subtext: string;
  primary_color: string;
  accent_color: string;
  font_family: string;
  is_default: boolean;
}

interface Startup {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  stage: string | null;
  logo_url: string | null;
  website: string | null;
}

const LAYOUTS = [
  { value: 'centered', label: 'Centered Logo' },
  { value: 'split', label: 'Split (Logo Left)' },
  { value: 'hero', label: 'Gradient Hero' },
];

const BG_PRESETS = [
  { label: 'Emerald Purple', value: 'linear-gradient(135deg,#10b981 0%,#8b5cf6 100%)' },
  { label: 'Deep Space', value: 'linear-gradient(135deg,#0f172a 0%,#1e40af 50%,#7c3aed 100%)' },
  { label: 'Sunset', value: 'linear-gradient(135deg,#f59e0b 0%,#ef4444 50%,#8b5cf6 100%)' },
  { label: 'Aurora', value: 'linear-gradient(135deg,#06b6d4 0%,#10b981 50%,#84cc16 100%)' },
  { label: 'Midnight', value: 'linear-gradient(135deg,#0a0a0a 0%,#1e293b 100%)' },
];

const FONTS = ['Inter', 'Space Grotesk', 'Orbitron', 'Poppins', 'DM Sans'];

const REDIRECT_URI = 'https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/linkedin-org-callback';

export default function StartupAnnouncementStudio() {
  const { role } = useUserRole();
  const isAdmin = role === 'admin';
  const [templates, setTemplates] = useState<Template[]>([]);
  const [template, setTemplate] = useState<Template | null>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [orgConnected, setOrgConnected] = useState(false);

  const [orgName, setOrgName] = useState<string | null>(null);
  const [postedCount, setPostedCount] = useState<number>(0);
  const [lastPostedAt, setLastPostedAt] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [{ data: tpls }, { data: sts }, { data: logs }] = await Promise.all([
      supabase.from('marketing_templates').select('*').order('created_at', { ascending: false }),
      supabase.from('companies').select('id,name,description,industry,stage,logo_url,website').not('logo_url', 'is', null).order('created_at', { ascending: false }).limit(50),
      supabase.from('marketing_posts_log').select('posted_at,status').eq('status', 'posted').order('posted_at', { ascending: false }).limit(50),
    ]);
    setTemplates(tpls || []);
    const def = (tpls || []).find(t => t.is_default) || (tpls || [])[0] || null;
    setTemplate(def);
    setStartups(sts || []);
    if (sts?.[0]) setSelectedStartup(sts[0]);
    setPostedCount((logs || []).length);
    setLastPostedAt((logs || [])[0]?.posted_at || null);
    checkOrg();
  }

  async function checkOrg() {
    try {
      const { data } = await supabase.functions.invoke('linkedin-org-auth', { body: { action: 'check-connection' } });
      setOrgConnected(!!data?.isConnected);
      setOrgName(data?.org?.org_name || null);
    } catch { /* not admin or not connected */ }
  }

  async function connectOrg() {
    const { data, error } = await supabase.functions.invoke('linkedin-org-auth', { body: { action: 'get-auth-url' } });
    if (error || !data?.authUrl) { toast.error('Failed to start LinkedIn OAuth'); return; }
    const w = window.open(data.authUrl, 'linkedin-org', 'width=600,height=700');
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'linkedin-org-success') { toast.success('Company Page connected'); checkOrg(); window.removeEventListener('message', onMsg); w?.close(); }
      if (e.data?.type === 'linkedin-org-error') { toast.error('Connection failed'); window.removeEventListener('message', onMsg); }
    };
    window.addEventListener('message', onMsg);
  }

  async function saveTemplate() {
    if (!template) return;
    setSaving(true);
    const { id, ...updates } = template;
    const { error } = await supabase.from('marketing_templates').update(updates).eq('id', id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success('Template saved'); loadAll(); }
  }

  async function exportPNG() {
    if (!canvasRef.current) return;
    const canvas = await html2canvas(canvasRef.current, { scale: 2, useCORS: true, backgroundColor: null });
    const link = document.createElement('a');
    link.download = `announcement-${selectedStartup?.name || 'preview'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function postNow() {
    if (!selectedStartup || !template) return;
    setPosting(true);
    const { data, error } = await supabase.functions.invoke('announce-new-startup', {
      body: { company_id: selectedStartup.id, template_id: template.id },
    });
    setPosting(false);
    if (error) toast.error('Post failed: ' + error.message);
    else if (data?.error) toast.error(data.error);
    else if (data?.success) { toast.success('Posted to LinkedIn Company Page'); loadAll(); }
    else toast.info(data?.skipped ? `Skipped: ${data.skipped}` : 'Done');
  }

  async function sendTestPost() {
    if (!selectedStartup || !template) return;
    if (!confirm('This will publish a real (test-labeled) post to your LinkedIn Company Page. Continue?')) return;
    setTesting(true);
    const { data, error } = await supabase.functions.invoke('announce-new-startup', {
      body: { company_id: selectedStartup.id, template_id: template.id, test_mode: true },
    });
    setTesting(false);
    if (error) toast.error('Test post failed: ' + error.message);
    else if (data?.error) toast.error(data.error + (data.details ? ` — ${data.details}` : ''));
    else if (data?.success) toast.success('Test post published — verify on your LinkedIn Company Page');
    else toast.info('Done');
  }


  function renderText(text: string): string {
    if (!selectedStartup) return text;
    return text
      .replace(/\{startup_name\}/g, selectedStartup.name || '')
      .replace(/\{industry\}/g, selectedStartup.industry || 'innovative')
      .replace(/\{stage\}/g, selectedStartup.stage || 'early-stage')
      .replace(/\{founder\}/g, '');
  }

  const renderedPost = useMemo(() => {
    if (!template) return '';
    return `${renderText(template.headline)}\n\n${renderText(template.subtext)}`;
  }, [template, selectedStartup]);

  async function copyPost() {
    await navigator.clipboard.writeText(renderedPost);
    toast.success('Post text copied');
  }

  async function copyRedirect() {
    await navigator.clipboard.writeText(REDIRECT_URI);
    toast.success('Redirect URL copied');
  }

  if (!template) return null;

  const bgStyle = template.background_type === 'gradient' || template.background_type === 'preset'
    ? { background: template.background_value }
    : { backgroundColor: template.background_value };

  return (
    <div className="tech-card border-0 p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs uppercase tracking-[0.2em] text-primary">
            <Sparkles className="w-3.5 h-3.5" /> Featured · Automation
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Startup Announcement Studio
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Auto-publishes a branded LinkedIn post the moment a startup completes their profile (logo, name, description).
            Edit the template below — preview updates live.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isAdmin && (
            orgConnected ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-sm">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> Live · {orgName || 'Company Page'}
                </span>
                <Button size="sm" variant="ghost" onClick={connectOrg} title="Reconnect"><RefreshCw className="w-3.5 h-3.5" /></Button>
              </div>
            ) : (
              <Button size="sm" onClick={connectOrg} variant="outline" className="border-primary/30">
                <Link2 className="w-4 h-4 mr-2" /> Connect LinkedIn Company Page
              </Button>
            )
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> {postedCount} auto-posted</span>
            {lastPostedAt && <span>· Last: {new Date(lastPostedAt).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>

      {/* Setup checklist */}
      {isAdmin && (
        <Collapsible defaultOpen={!orgConnected}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border hover:border-primary/40 transition-colors">
              <span className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="w-4 h-4 text-primary" /> LinkedIn setup checklist
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="p-5 rounded-lg bg-background/50 border border-border space-y-4 text-sm">
              <div>
                <div className="font-semibold text-foreground mb-1">1. LinkedIn Developer App</div>
                <p className="text-muted-foreground">
                  Create/select an app at <a className="text-primary underline" href="https://www.linkedin.com/developers/apps" target="_blank" rel="noreferrer">linkedin.com/developers/apps</a>,
                  associated with the <strong>Startup Factory Hub Company Page</strong>.
                </p>
              </div>
              <div>
                <div className="font-semibold text-foreground mb-1">2. Request these Products (require LinkedIn approval)</div>
                <ul className="space-y-1 text-muted-foreground list-disc pl-5">
                  <li><span className="text-foreground">Sign In with LinkedIn using OpenID Connect</span> — <code className="text-xs bg-background px-1.5 py-0.5 rounded">openid profile email</code></li>
                  <li><span className="text-foreground">Share on LinkedIn</span> — <code className="text-xs bg-background px-1.5 py-0.5 rounded">w_member_social</code></li>
                  <li><span className="text-foreground">Community Management API</span> — <code className="text-xs bg-background px-1.5 py-0.5 rounded">w_organization_social r_organization_social rw_organization_admin</code> <span className="text-amber-400">(needed to post AS the page)</span></li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-foreground mb-1">3. Add OAuth 2.0 Redirect URL</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background px-3 py-2 rounded border border-border break-all">{REDIRECT_URI}</code>
                  <Button size="sm" variant="outline" onClick={copyRedirect}><Copy className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <div>
                <div className="font-semibold text-foreground mb-1">4. Secrets already stored</div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs"><CheckCircle2 className="w-3 h-3" /> LINKEDIN_CLIENT_ID</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs"><CheckCircle2 className="w-3 h-3" /> LINKEDIN_CLIENT_SECRET</span>
                </div>
              </div>
              <div>
                <div className="font-semibold text-foreground mb-1">5. Click <span className="text-primary">Connect LinkedIn Company Page</span> above</div>
                <p className="text-muted-foreground">Approve OAuth once — from then on, every new startup that completes their profile auto-publishes.</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor Column */}
        <div className="space-y-4">
          {/* Content Card */}
          <div className="p-5 rounded-lg bg-background/40 border border-border space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content</div>
            <div>
              <Label>Preview startup</Label>
              <Select value={selectedStartup?.id || ''} onValueChange={(v) => setSelectedStartup(startups.find(s => s.id === v) || null)}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select startup..." /></SelectTrigger>
                <SelectContent className="bg-background backdrop-blur-none z-[100]">
                  {startups.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Headline <span className="text-xs text-muted-foreground">— variables: {'{startup_name}'}, {'{industry}'}, {'{stage}'}</span></Label>
              <Input value={template.headline} onChange={(e) => setTemplate({ ...template, headline: e.target.value })} className="bg-background" />
            </div>
            <div>
              <Label>Body / Subtext</Label>
              <Textarea value={template.subtext} onChange={(e) => setTemplate({ ...template, subtext: e.target.value })} className="bg-background" rows={7} />
            </div>
          </div>

          {/* Style Card */}
          <div className="p-5 rounded-lg bg-background/40 border border-border space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Style</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Layout</Label>
                <Select value={template.layout} onValueChange={(v) => setTemplate({ ...template, layout: v })}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background backdrop-blur-none z-[100]">
                    {LAYOUTS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Font</Label>
                <Select value={template.font_family} onValueChange={(v) => setTemplate({ ...template, font_family: v })}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background backdrop-blur-none z-[100]">
                    {FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Background preset</Label>
              <Select value={template.background_value} onValueChange={(v) => setTemplate({ ...template, background_type: 'gradient', background_value: v })}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-background backdrop-blur-none z-[100]">
                  {BG_PRESETS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Primary color</Label>
                <Input type="color" value={template.primary_color} onChange={(e) => setTemplate({ ...template, primary_color: e.target.value })} className="bg-background h-10" />
              </div>
              <div>
                <Label>Accent color</Label>
                <Input type="color" value={template.accent_color} onChange={(e) => setTemplate({ ...template, accent_color: e.target.value })} className="bg-background h-10" />
              </div>
            </div>
          </div>

          {/* Publish Card */}
          <div className="p-5 rounded-lg bg-background/40 border border-border space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Publish</div>
            <div className="flex flex-wrap gap-2">
              {isAdmin && (
                <Button onClick={saveTemplate} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save template
                </Button>
              )}
              <Button variant="outline" onClick={exportPNG}><Download className="w-4 h-4 mr-2" /> Export PNG</Button>
              <Button variant="outline" onClick={copyPost}><Copy className="w-4 h-4 mr-2" /> Copy post text</Button>
              {isAdmin && (
                <Button variant="outline" onClick={postNow} disabled={posting || !orgConnected || !selectedStartup}>
                  {posting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Post now
                </Button>
              )}
            </div>
            {!isAdmin && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Admin access required to edit the template or post.</p>
            )}
            {isAdmin && !orgConnected && (
              <p className="text-xs text-amber-400 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Connect your LinkedIn Company Page to enable auto-posting.</p>
            )}
          </div>
        </div>

        {/* Preview Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">LinkedIn preview</Label>
            <span className="text-[10px] text-muted-foreground">1200 × 627</span>
          </div>

          {/* LinkedIn feed chrome */}
          <div className="rounded-xl border border-border bg-background overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 p-3 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{orgName || 'Startup Factory Hub'}</div>
                <div className="text-[11px] text-muted-foreground">Just now · <span className="inline-block">🌐</span></div>
              </div>
            </div>

            {/* Post copy preview */}
            <div className="px-4 py-3 text-sm text-foreground whitespace-pre-wrap max-h-40 overflow-y-auto border-b border-border">
              {renderedPost}
            </div>

            {/* Banner canvas */}
            <div
              ref={canvasRef}
              style={{ ...bgStyle, aspectRatio: '1200/627', fontFamily: template.font_family }}
              className="relative w-full text-white p-10 flex items-center overflow-hidden"
            >
              <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 80% 20%, ${template.accent_color}, transparent 60%)` }} />

              {template.layout === 'centered' && (
                <div className="relative w-full text-center space-y-4">
                  {selectedStartup?.logo_url && (
                    <img src={selectedStartup.logo_url} alt="" className="h-24 mx-auto rounded-2xl bg-white/10 p-2 backdrop-blur-sm" crossOrigin="anonymous" />
                  )}
                  <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: template.primary_color }}>New Startup Joined</div>
                  <h1 className="text-3xl font-bold leading-tight">{renderText(template.headline)}</h1>
                  <p className="text-sm opacity-90 max-w-xl mx-auto line-clamp-3">{renderText(template.subtext)}</p>
                </div>
              )}

              {template.layout === 'split' && (
                <div className="relative w-full flex items-center gap-8">
                  {selectedStartup?.logo_url && (
                    <img src={selectedStartup.logo_url} alt="" className="h-40 w-40 rounded-2xl bg-white/10 p-3 backdrop-blur-sm object-contain" crossOrigin="anonymous" />
                  )}
                  <div className="flex-1 space-y-3">
                    <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: template.primary_color }}>New Startup Joined</div>
                    <h1 className="text-3xl font-bold leading-tight">{renderText(template.headline)}</h1>
                    <p className="text-sm opacity-90 line-clamp-3">{renderText(template.subtext)}</p>
                    <div className="text-xs opacity-70 pt-2">startupfactoryhub.com</div>
                  </div>
                </div>
              )}

              {template.layout === 'hero' && (
                <div className="relative w-full space-y-4">
                  <div className="flex items-center gap-3">
                    {selectedStartup?.logo_url && (
                      <img src={selectedStartup.logo_url} alt="" className="h-16 w-16 rounded-xl bg-white/10 p-1.5 object-contain" crossOrigin="anonymous" />
                    )}
                    <div className="text-[10px] tracking-[0.3em] uppercase font-semibold" style={{ color: template.primary_color }}>Welcome to the Ecosystem</div>
                  </div>
                  <h1 className="text-5xl font-black leading-none">{renderText(template.headline)}</h1>
                  <p className="text-base opacity-90 max-w-2xl line-clamp-2">{renderText(template.subtext)}</p>
                  <div className="pt-3 text-xs opacity-70">Startup Factory Hub · startupfactoryhub.com</div>
                </div>
              )}
            </div>

            {/* Fake action bar */}
            <div className="flex items-center gap-6 px-4 py-2 text-xs text-muted-foreground border-t border-border">
              <span>Like</span><span>Comment</span><span>Repost</span><span>Send</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
