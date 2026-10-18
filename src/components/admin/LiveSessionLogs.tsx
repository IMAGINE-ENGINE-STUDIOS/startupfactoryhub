import { useEffect, useMemo, useState } from 'react';
import { Download, Search, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Row = { id: string; room_name: string; kind: 'transcript' | 'chat'; speaker: string; content: string; created_at: string };

export default function LiveSessionLogs() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<'all' | 'transcript' | 'chat'>('all');
  const [room, setRoom] = useState('all');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('live_session_logs' as any).select('*').order('created_at', { ascending: true }).limit(5000);
    setRows((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const rooms = useMemo(() => [...new Set(rows.map((r) => r.room_name))], [rows]);
  const shown = useMemo(() => rows.filter((r) => (kind === 'all' || r.kind === kind) && (room === 'all' || r.room_name === room) &&
    (!q || `${r.speaker} ${r.content}`.toLowerCase().includes(q.toLowerCase()))), [rows, q, kind, room]);

  const download = () => {
    const txt = shown.map((r) => `[${new Date(r.created_at).toLocaleString()}] (${r.room_name} - ${r.kind}) ${r.speaker}: ${r.content}`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
    a.download = `live-${kind}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
  };
  const del = async (id: string) => { await supabase.from('live_session_logs' as any).delete().eq('id', id); setRows((r) => r.filter((x) => x.id !== id)); };

  return (
    <div className="bg-[#0A1418] border border-cyan-400/15 rounded-md p-5 space-y-4 mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold mr-auto font-['Space_Grotesk'] tracking-wide">Call transcripts and chat history</h3>
        <Badge variant="secondary">{rows.filter((r) => r.kind === 'transcript').length} transcript lines</Badge>
        <Badge variant="secondary">{rows.filter((r) => r.kind === 'chat').length} chat messages</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search words or speaker" className="pl-9 bg-white/[0.03] border-white/10 focus:border-[#00E5FF]/50" />
        </div>
        {(['all', 'transcript', 'chat'] as const).map((k) => <Button key={k} size="sm" variant={kind === k ? 'default' : 'outline'} onClick={() => setKind(k)}>{k === 'all' ? 'All' : k === 'chat' ? 'Chat' : 'Transcript'}</Button>)}
        <select value={room} onChange={(e) => setRoom(e.target.value)} className="h-9 rounded-md border border-white/10 bg-white/[0.03] px-2 text-sm focus:border-[#00E5FF]/50">
          <option value="all">All rooms</option>
          {rooms.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <Button size="sm" variant="outline" onClick={download} disabled={!shown.length}><Download className="w-4 h-4 mr-1" />Download</Button>
      </div>
      <div className="max-h-[520px] overflow-y-auto space-y-1.5">
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : shown.length === 0 ? <p className="text-sm text-muted-foreground">Nothing recorded yet.</p> :
          shown.map((r) => (
            <div key={r.id} className="group flex gap-2 text-sm">
              <span className="text-xs text-muted-foreground shrink-0 w-36">{new Date(r.created_at).toLocaleString()}</span>
              <Badge variant="outline" className="shrink-0 h-5 font-['JetBrains_Mono'] uppercase text-[10px] tracking-wider">{r.kind}</Badge>
              <p className="flex-1"><span className="font-medium">{r.speaker}:</span> {r.content}</p>
              <button aria-label="Delete" onClick={() => del(r.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
      </div>
    </div>
  );
}
