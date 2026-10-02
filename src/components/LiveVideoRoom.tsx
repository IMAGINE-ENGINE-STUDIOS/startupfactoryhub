import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, VideoTrack, useTracks, useConnectionState, useDataChannel, useLocalParticipant } from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import {
  Users, Timer, Crown, Mic, MicOff, Video, VideoOff, Hand, X, Plus, MonitorUp, Presentation,
  Heart, Flame, ThumbsUp, PhoneOff, Upload, Sliders, DollarSign, ShoppingBag, Copy, Check,
  MessageSquare, Radio, Circle, Trash2, ImagePlus, Link2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LiveChat, LocalChat } from './LiveChatPanel';

interface LiveVideoRoomProps { roomName?: string; room?: string; identity?: string; onLeave?: () => void }

type Product = { id: string; name: string; price: number; tag: string; image: string };
type CartItem = { id: string; name: string; price: number; qty: number };

const initials = (n: string) => n.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const REACTIONS = [{ k: 'heart', i: Heart, c: 'text-rose-500' }, { k: 'fire', i: Flame, c: 'text-orange-500' }, { k: 'up', i: ThumbsUp, c: 'text-amber-500' }];

const readCart = (): CartItem[] => {
  const c = (window as any).__IECart;
  if (c?.items) { try { return c.items(); } catch { /* ignore */ } }
  try { return JSON.parse(localStorage.getItem('ie-live-cart') || '[]'); } catch { return []; }
};
const addToCart = (p: Product) => {
  const cart = (window as any).__IECart;
  if (cart?.add) { cart.add({ id: p.id, name: p.name, price: p.price, image: p.image, qty: 1 }); }
  else {
    const items = readCart();
    const found = items.find((i) => i.id === p.id);
    found ? found.qty++ : items.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
    localStorage.setItem('ie-live-cart', JSON.stringify(items));
  }
  window.dispatchEvent(new CustomEvent('ie-live-cart', { detail: { added: p } }));
};
const removeFromCart = (id: string) => {
  const cart = (window as any).__IECart;
  if (cart?.remove) cart.remove(id);
  else localStorage.setItem('ie-live-cart', JSON.stringify(readCart().filter((i) => i.id !== id)));
  window.dispatchEvent(new CustomEvent('ie-live-cart'));
};

// Shrinks an uploaded photo so it can be shared live with everyone in the call.
const shrinkImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => {
    const s = Math.min(1, 240 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    resolve(c.toDataURL('image/webp', 0.72));
    URL.revokeObjectURL(img.src);
  };
  img.onerror = reject;
  img.src = URL.createObjectURL(file);
});

function RemoteTiles() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: true });
  const remote = tracks.filter((t) => !t.participant.isLocal && t.publication);
  return (
    <>
      {remote.map((t) => (
        <div key={t.participant.identity + t.source} className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.06]">
          <VideoTrack trackRef={t as any} className="w-full h-full object-cover" />
          <span className="absolute left-3 bottom-3 font-mono text-xs text-white">{t.participant.name || t.participant.identity}</span>
        </div>
      ))}
    </>
  );
}

// Publishes this person's real camera and microphone to everyone in the room, kept in sync with the buttons.
function LocalPublisher({ cam, mic }: { cam: boolean; mic: boolean }) {
  const { localParticipant } = useLocalParticipant();
  const state = useConnectionState();
  useEffect(() => { if (state === 'connected') localParticipant.setCameraEnabled(cam).catch(() => {}); }, [cam, state, localParticipant]);
  useEffect(() => { if (state === 'connected') localParticipant.setMicrophoneEnabled(mic).catch(() => {}); }, [mic, state, localParticipant]);
  return null;
}

function LocalVideo() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const mine = tracks.find((t) => t.participant.isLocal && t.publication?.track);
  if (!mine) return null;
  return <VideoTrack trackRef={mine as any} className="absolute inset-0 w-full h-full object-cover -scale-x-100" />;
}

function PeerCount({ onCount }: { onCount: (n: number) => void }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone], { onlySubscribed: false });
  const n = new Set(tracks.map((t) => t.participant.identity)).size;
  useEffect(() => { onCount(n); }, [n, onCount]);
  return null;
}

function ConnBadge() {
  const state = useConnectionState();
  return <span className="font-mono text-[11px] text-zinc-500">{state === 'connected' ? 'Live' : 'Connecting'}</span>;
}

// Bridges the shop to everyone in the call over the room's data channel.
function ShopSync({ onSend, onMessage }: { onSend: (fn: (m: any) => void) => void; onMessage: (m: any) => void }) {
  const { send } = useDataChannel('shop', (msg) => {
    try { onMessage(JSON.parse(new TextDecoder().decode(msg.payload))); } catch { /* ignore */ }
  });
  useEffect(() => {
    onSend((m) => { try { send(new TextEncoder().encode(JSON.stringify(m)), { reliable: true }); } catch { /* ignore */ } });
  }, [send, onSend]);
  return null;
}

function Toggle({ on, onClick, title, sub }: { on: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-start gap-3 text-left border border-zinc-200 rounded-2xl px-4 py-3 hover:bg-zinc-50">
      <span className={`mt-1 w-4 h-4 rounded border flex items-center justify-center ${on ? 'border-zinc-800' : 'border-zinc-400'}`}>{on && <Check className="w-3 h-3 text-zinc-900" />}</span>
      <span><span className="block text-[15px] text-zinc-900">{title}</span><span className="block text-xs text-zinc-500 mt-0.5">{sub}</span></span>
    </button>
  );
}

function Thumb({ p, className }: { p: Product; className: string }) {
  return p.image
    ? <img src={p.image} alt={p.name} className={`${className} object-cover bg-zinc-100`} />
    : <span className={`${className} bg-zinc-200 text-zinc-600 font-mono text-xs flex items-center justify-center`}>{initials(p.name)}</span>;
}

export default function LiveVideoRoom({ roomName, room, identity }: LiveVideoRoomProps) {
  const name = roomName || room || 'live-commerce-room';
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);
  const guestId = useMemo(() => `guest-${Math.floor(Math.random() * 100000)}`, []);
  const id = identity || user?.id || guestId;
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Guest';

  // Host = the person whose account id is in the invite link; the first signed-in person to open a room becomes its host.
  const hostId = useMemo(() => {
    const url = new URL(window.location.href);
    let h = url.searchParams.get('host');
    if (!h && user?.id) {
      h = user.id;
      url.searchParams.set('host', h);
      if (!url.searchParams.get('room')) url.searchParams.set('room', name);
      window.history.replaceState(null, '', url.toString());
    }
    return h;
  }, [user?.id, name]);
  const isHost = !hostId || hostId === id;

  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [connError, setConnError] = useState('');
  const [left, setLeft] = useState(false);

  const [seconds, setSeconds] = useState(0);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [hand, setHand] = useState(false);
  const [rec, setRec] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [pinned, setPinned] = useState<string | null>(null);
  const [floats, setFloats] = useState<{ key: number; icon: any; c: string; x: number }[]>([]);
  const [peerCount, setPeerCount] = useState(1);
  const recRef = useRef<MediaRecorder | null>(null);
  const [presentOpen, setPresentOpen] = useState(false);
  const [link, setLink] = useState('');
  const [presenting, setPresenting] = useState<{ name: string; url: string; kind: 'image' | 'video' | 'pdf' | 'link' } | null>(null);
  const [tab, setTab] = useState<'shop' | 'chat' | 'money' | 'rules'>('shop');
  const [chatCount, setChatCount] = useState(0);
  const [seenCount, setSeenCount] = useState(0);
  useEffect(() => { if (tab === 'chat') setSeenCount(chatCount); }, [tab, chatCount]);
  const unread = Math.max(0, chatCount - seenCount);
  const [userLimit, setUserLimit] = useState(100);
  const [timeLimit, setTimeLimit] = useState(120);
  const [rules, setRules] = useState({ autoEnd: true, approval: false, muteEntry: true, hideCount: false, hostProducts: true });
  const [copied, setCopied] = useState(false);
  const [cartTick, setCartTick] = useState(0);

  // Shop
  const catalogKey = `ie-live-catalog:${name}`;
  const [catalog, setCatalog] = useState<Product[]>(() => { try { return JSON.parse(localStorage.getItem(catalogKey) || '[]'); } catch { return []; } });
  const [drop, setDrop] = useState<Product | null>(null);
  const [stageOffer, setStageOffer] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', price: '', tag: '', image: '' });
  const [stats, setStats] = useState({ adds: 0, value: 0 });
  useEffect(() => { try { localStorage.setItem(catalogKey, JSON.stringify(catalog)); } catch { /* storage full */ } }, [catalog, catalogKey]);

  const sendRef = useRef<(m: any) => void>(() => {});
  const setSend = useCallback((fn: (m: any) => void) => { sendRef.current = fn; }, []);
  const broadcast = (m: any) => sendRef.current(m);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) { setProfile(null); return; }
    supabase.from('profiles').select('full_name, avatar_url').eq('user_id', user.id).order('created_at').limit(1)
      .then(({ data }) => setProfile(data?.[0] ?? null));
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('livekit-token', { body: { roomName: name, identity: id, name: displayName } });
        if (error) throw error;
        if (!data?.token) throw new Error(data?.error || 'No token returned');
        const url = data.url || import.meta.env.VITE_LIVEKIT_URL;
        if (!url) throw new Error('LiveKit server address is missing');
        if (!cancelled) { setServerUrl(url); setToken(data.token); }
      } catch (err: any) {
        if (!cancelled) setConnError(err.message || 'Failed to join room');
      }
    })();
    return () => { cancelled = true; };
  }, [name, id, displayName]);

  useEffect(() => { const t = setInterval(() => setSeconds((s) => s + 1), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (rules.autoEnd && seconds >= timeLimit * 60) setLeft(true); }, [seconds, timeLimit, rules.autoEnd]);

  useEffect(() => {
    const h = (e: Event) => {
      setCartTick((n) => n + 1);
      const added = (e as CustomEvent).detail?.added as Product | undefined;
      if (added) setStats((s) => ({ adds: s.adds + 1, value: s.value + added.price }));
    };
    window.addEventListener('ie-live-cart', h);
    window.addEventListener('ie-cart', h);
    return () => { window.removeEventListener('ie-live-cart', h); window.removeEventListener('ie-cart', h); };
  }, []);

  useEffect(() => {
    let active = true;
    if (token) { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; return; }
    if (!cam && !mic) { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; return; }
    navigator.mediaDevices?.getUserMedia({ video: cam, audio: mic }).then((s) => {
      if (!active) { s.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
    }).catch(() => {});
    return () => { active = false; };
  }, [cam, mic, token]);
  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const onShopMessage = useCallback((m: any) => {
    if (m.t === 'push' && m.p) { setDrop(m.p); setStageOffer(true); setCatalog((c) => c.some((x) => x.id === m.p.id) ? c : [...c, m.p]); }
    if (m.t === 'product' && m.p) setCatalog((c) => c.some((x) => x.id === m.p.id) ? c.map((x) => x.id === m.p.id ? m.p : x) : [...c, m.p]);
    if (m.t === 'remove') setCatalog((c) => c.filter((x) => x.id !== m.id));
    if (m.t === 'present') setPresenting(m.p || null);
    if (m.t === 'react') { const r = REACTIONS.find((x) => x.k === m.k); if (r) showReaction(r); }
  }, []); // eslint-disable-line

  const showReaction = (r: typeof REACTIONS[number]) => {
    const key = Date.now() + Math.random();
    setFloats((f) => [...f, { key, icon: r.i, c: r.c, x: 10 + Math.random() * 25 }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.key !== key)), 2600);
  };
  const react = (r: typeof REACTIONS[number]) => { showReaction(r); broadcast({ t: 'react', k: r.k }); };
  const canSell = isHost || !rules.hostProducts;
  const pushToAll = (p: Product) => { setDrop(p); setStageOffer(true); broadcast({ t: 'push', p }); };
  const saveProduct = () => {
    const price = parseFloat(draft.price);
    if (!draft.name.trim() || !(price >= 0)) return;
    const p: Product = { id: `lp-${Date.now()}`, name: draft.name.trim(), price, tag: draft.tag.trim().toUpperCase(), image: draft.image };
    setCatalog((c) => [...c, p]);
    broadcast({ t: 'product', p });
    setDraft({ name: '', price: '', tag: '', image: '' });
    setAdding(false);
  };
  const deleteProduct = (pid: string) => { setCatalog((c) => c.filter((x) => x.id !== pid)); if (drop?.id === pid) setDrop(null); broadcast({ t: 'remove', id: pid }); };

  const toggleShare = async () => {
    if (sharing) { (screenRef.current?.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop()); setSharing(false); return; }
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setSharing(true);
      setTimeout(() => { if (screenRef.current) screenRef.current.srcObject = s; }, 0);
      s.getVideoTracks()[0].onended = () => setSharing(false);
    } catch { /* cancelled */ }
  };
  const present = (p: typeof presenting, share = true) => { setPresenting(p); if (share) broadcast({ t: 'present', p }); };
  const onFiles = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setPresentOpen(false);
    if (f.type.startsWith('image/')) {
      // Photos are resized so they can be sent live to everyone in the call.
      const url = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, 1280 / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); resolve(c.toDataURL('image/jpeg', 0.7));
        };
        img.src = URL.createObjectURL(f);
      });
      present({ name: f.name, url, kind: 'image' });
    } else if (f.type.startsWith('video/')) present({ name: f.name, url: URL.createObjectURL(f), kind: 'video' }, false);
    else present({ name: f.name, url: URL.createObjectURL(f), kind: 'pdf' }, false);
  };
  const toggleRec = async () => {
    if (recRef.current) { recRef.current.stop(); return; }
    try {
      const screen = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true, preferCurrentTab: true });
      let tracks: MediaStreamTrack[] = [...screen.getTracks()];
      try { const m = await navigator.mediaDevices.getUserMedia({ audio: true }); tracks = [...tracks, ...m.getAudioTracks()]; } catch { /* no mic */ }
      const stream = new MediaStream(tracks);
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm' });
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      mr.onstop = () => {
        tracks.forEach((t) => t.stop());
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
        a.download = `recording-${name}-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
        a.click();
        recRef.current = null; setRec(false);
      };
      screen.getVideoTracks()[0].onended = () => { if (mr.state !== 'inactive') mr.stop(); };
      mr.start(1000); recRef.current = mr; setRec(true);
    } catch { /* cancelled */ }
  };
  const openLink = () => {
    if (!link.trim()) return;
    const url = link.startsWith('http') ? link : `https://${link}`;
    present({ name: url, url, kind: 'link' });
    setLink(''); setPresentOpen(false);
  };

  const inviteUrl = (() => {
    const host = /lovable\.app$|localhost/.test(window.location.hostname) ? 'https://startupfactoryhub.com' : window.location.origin;
    const u = new URL(`${host}/live-video`);
    u.searchParams.set('room', name);
    if (hostId) u.searchParams.set('host', hostId);
    return u.toString();
  })();
  const copyInvite = () => { navigator.clipboard?.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 1200); };
  const cartItems = useMemo(readCart, [cartTick]); // eslint-disable-line
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const totalPeers = token ? peerCount : 1;
  const timeLabel = `${Math.floor(timeLimit / 60)}h ${timeLimit % 60}m`;
  const checkout = () => { const c = (window as any).__IECart; c?.checkout ? c.checkout() : c?.open?.(); };

  if (left) {
    return (
      <div className="w-full h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-[2rem] p-10 max-w-sm w-full text-center">
          <p className="text-white font-medium">You left the call</p>
          <button onClick={() => { setLeft(false); setSeconds(0); }} className="mt-6 px-5 py-2 rounded-full bg-white text-zinc-900 text-sm">Rejoin</button>
        </div>
      </div>
    );
  }

  const tileBase = 'relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-800 to-zinc-900 border border-white/[0.06]';

  const stage = (
    <div className="flex-1 min-w-0 flex flex-col rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-950"
      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
      <div className="h-14 bg-white flex items-center gap-4 px-5 font-mono text-[13px] text-zinc-800 border-b border-zinc-200">
        <span className="flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" />{fmtTime(seconds)}</span>
        <span className="w-px h-4 bg-zinc-200" />
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{rules.hideCount ? 'hidden' : `${totalPeers} in call`}</span>
        <div className="ml-auto flex items-center gap-2">
          {isHost && <button onClick={toggleRec} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border ${rec ? 'border-red-300 text-red-600' : 'border-zinc-200'}`}><Circle className={`w-3.5 h-3.5 ${rec ? 'fill-red-500 text-red-500' : ''}`} />REC {rec ? 'ON' : 'OFF'}</button>}
          <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-zinc-200 bg-zinc-50">
            <span className={`w-1.5 h-1.5 rounded-full ${token ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
            {token ? <ConnBadge /> : <span className="font-mono text-[11px] text-zinc-500" title={connError}>{connError ? 'Offline' : 'Connecting'}</span>}
          </span>
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
        {floats.map((f) => <span key={f.key} className="absolute bottom-4 animate-[ie-float_2.6s_ease-out_forwards]" style={{ right: `${f.x}%` }}><f.icon className={`w-10 h-10 fill-current ${f.c}`} /></span>)}
      </div>
      <style>{`@keyframes ie-float{0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:1;transform:translateY(-40px) scale(1.1)}100%{transform:translateY(-420px) scale(1);opacity:0}}`}</style>
      <div className="h-full overflow-y-auto p-4">
        {drop && stageOffer && (
          <div className="sticky top-0 z-20 mb-3 ml-auto w-full max-w-md bg-white rounded-2xl p-3 flex items-center gap-3 shadow-2xl">
            <Thumb p={drop} className="w-14 h-14 rounded-xl shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-600"><Radio className="w-3 h-3" />LIVE DROP</span>
              <span className="block text-[15px] text-zinc-900 truncate">{drop.name}</span>
              <span className="block font-mono text-xs text-zinc-500">${drop.price}</span>
            </span>
            <button onClick={() => addToCart(drop)} className="px-3.5 py-2 rounded-full bg-zinc-900 text-white text-sm">Add to cart</button>
            <button aria-label="Hide offer" onClick={() => setStageOffer(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center"><X className="w-4 h-4 text-zinc-700" /></button>
          </div>
        )}
        {(sharing || presenting) && (
          <div className="relative mb-3 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 h-[360px]">
            {sharing ? <video ref={screenRef} autoPlay muted playsInline className="w-full h-full object-contain" />
              : presenting && (presenting.kind === 'image'
                ? <img src={presenting.url} alt={presenting.name} className="w-full h-full object-contain" />
                : presenting.kind === 'video' ? <video src={presenting.url} controls autoPlay className="w-full h-full object-contain" />
                : presenting.kind === 'pdf' ? <object data={presenting.url} type="application/pdf" className="w-full h-full bg-white"><a href={presenting.url} target="_blank" rel="noreferrer" className="block p-6 text-white underline">Open {presenting.name}</a></object>
                : <iframe title="presentation" src={presenting.url.includes('docs.google.com') ? presenting.url.replace(/\/edit.*$/, '/preview') : presenting.url} className="w-full h-full bg-white" />)}
            <button aria-label="Stop presenting" onClick={() => { if (sharing) toggleShare(); else present(null); }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          <div onClick={() => setPinned(pinned === 'host' ? null : 'host')} className={`${tileBase} ring-2 ring-white ${pinned === 'host' ? 'col-span-2 row-span-2' : ''}`}>
            {cam && token ? <LocalVideo /> : cam ? <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
              : <div className="absolute inset-0 flex items-center justify-center">
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                    : <span className="w-14 h-14 rounded-full bg-white/10 text-zinc-200 flex items-center justify-center">{initials(displayName)}</span>}
                </div>}
            <div className="absolute inset-x-0 bottom-0 p-3 flex items-center bg-gradient-to-t from-black/70 to-transparent">
              <span className="font-mono text-xs text-white flex items-center gap-1.5">{displayName} (You){isHost && <Crown className="w-3.5 h-3.5 text-amber-400" />}{hand && <Hand className="w-3.5 h-3.5 text-amber-400" />}</span>
              <span className="ml-auto flex gap-1.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${mic ? 'bg-white/15' : 'bg-red-500'}`}>{mic ? <Mic className="w-3 h-3 text-white" /> : <MicOff className="w-3 h-3 text-white" />}</span>
              </span>
            </div>
          </div>

          {token && <RemoteTiles />}
        </div>
      </div>
      </div>

      {catalog.length > 0 && (
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          {catalog.map((p) => (
            <button key={p.id} onClick={() => addToCart(p)} className="shrink-0 flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-white font-mono text-xs text-zinc-800 hover:bg-zinc-100">
              <Thumb p={p} className="w-8 h-8 rounded-full" />{p.name} • ${p.price}<Plus className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      <div className="relative mx-4 mb-4 flex justify-center">
        {presentOpen && (
          <div className="absolute bottom-14 z-30 w-[360px] rounded-2xl bg-zinc-900 border border-white/10 p-3 space-y-2 shadow-2xl">
            <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/10">
              <Link2 className="w-4 h-4 text-zinc-500 shrink-0" />
              <input autoFocus value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && openLink()} placeholder="Paste a Google Drive / Slides link"
                className="flex-1 min-w-0 bg-transparent font-mono text-sm text-zinc-200 placeholder:text-zinc-500 outline-none" />
              <button onClick={openLink} className="px-3 py-1 rounded-full bg-white text-zinc-900 text-xs">Open</button>
            </div>
            <button onClick={() => fileInput.current?.click()} className="w-full flex items-center justify-center gap-2 py-2 rounded-full border border-white/10 text-zinc-200 text-sm"><Upload className="w-4 h-4" />Upload a file (or drop it on the call)</button>
          </div>
        )}
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-zinc-900 border border-white/10">
          {[
            { on: mic, icon: mic ? Mic : MicOff, fn: () => setMic((v) => !v), label: 'Microphone', danger: true },
            { on: cam, icon: cam ? Video : VideoOff, fn: () => setCam((v) => !v), label: 'Camera', danger: true },
            { on: sharing, icon: MonitorUp, fn: toggleShare, label: 'Share screen' },
            { on: presentOpen || !!presenting, icon: Presentation, fn: () => setPresentOpen((v) => !v), label: 'Present' },
            { on: hand, icon: Hand, fn: () => setHand((h) => !h), label: 'Raise hand' },
          ].map((b) => (
            <button key={b.label} aria-label={b.label} title={b.label} onClick={b.fn}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${b.danger ? (b.on ? 'bg-zinc-800 text-white' : 'bg-red-500 text-white') : b.on ? 'bg-white text-zinc-900' : 'bg-zinc-800 text-white'}`}><b.icon className="w-4 h-4" /></button>
          ))}
          <button onClick={() => { streamRef.current?.getTracks().forEach((t) => t.stop()); setLeft(true); }} className="ml-1 flex items-center gap-2 px-5 h-10 rounded-full bg-red-500 text-white text-sm font-medium"><PhoneOff className="w-4 h-4" />Leave</button>
        </div>
        <input ref={fileInput} type="file" hidden onChange={(e) => onFiles(e.target.files)} />
      </div>
    </div>
  );

  const pills = [
    { k: 'shop', label: `SHOP • ${catalog.length}` },
    { k: 'chat', label: `CHAT • ${chatCount}` },
    ...(isHost ? [{ k: 'money', label: '$' }, { k: 'rules', label: 'RULES' }] : []),
  ] as const;

  const shop = (
    <div className="space-y-4">
      {drop ? (
        <div className="rounded-3xl bg-zinc-900 p-4 text-white">
          <div className="flex items-center justify-between font-mono text-[11px] tracking-wider">
            <span className="flex items-center gap-1.5 text-zinc-400"><Radio className="w-3.5 h-3.5 text-emerald-400" />LIVE NOW • HOST PUSH</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white text-zinc-900">LIVE DROP</span>
          </div>
          <div className="mt-3 flex gap-4">
            <Thumb p={drop} className="w-24 h-24 rounded-2xl shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{drop.name}</p>
              <p className="font-mono text-sm text-zinc-300 mt-1">${drop.price}</p>
              <button onClick={() => addToCart(drop)} className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-white text-zinc-900 font-mono text-sm"><ShoppingBag className="w-4 h-4" />Add to Cart</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-zinc-300 p-4 font-mono text-xs text-zinc-500">No live drop yet. {canSell ? 'Use "Push to All" on a product.' : 'The host will push products here.'}</div>
      )}

      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-[0.2em] text-zinc-500">CATALOG</p>
        {canSell && !adding && <button onClick={() => setAdding(true)} className="flex items-center gap-1 font-mono text-xs text-zinc-900 underline"><Plus className="w-3 h-3" />Add product</button>}
      </div>

      {adding && (
        <div className="rounded-2xl border border-zinc-200 p-3 space-y-2">
          <div className="flex gap-3">
            <button onClick={() => imgInput.current?.click()} className="w-20 h-20 shrink-0 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 overflow-hidden flex items-center justify-center">
              {draft.image ? <img src={draft.image} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-5 h-5 text-zinc-400" />}
            </button>
            <div className="flex-1 space-y-2">
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Product name" className="w-full text-sm px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900" />
              <div className="flex gap-2">
                <input value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} placeholder="Price" inputMode="decimal" className="w-24 text-sm px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900" />
                <input value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })} placeholder="Tag (optional)" className="flex-1 min-w-0 text-sm px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900" />
              </div>
            </div>
          </div>
          <input value={draft.image.startsWith('data:') ? '' : draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} placeholder="…or paste a photo link" className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setAdding(false); setDraft({ name: '', price: '', tag: '', image: '' }); }} className="px-4 py-1.5 rounded-full border border-zinc-200 text-sm text-zinc-700">Cancel</button>
            <button onClick={saveProduct} className="px-4 py-1.5 rounded-full bg-zinc-900 text-white text-sm">Save</button>
          </div>
          <input ref={imgInput} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) shrinkImage(f).then((img) => setDraft((d) => ({ ...d, image: img }))); e.target.value = ''; }} />
        </div>
      )}

      {catalog.length === 0 && !adding && <p className="rounded-2xl border border-dashed border-zinc-300 p-4 font-mono text-xs text-zinc-500">No products yet.{canSell ? ' Add one with a photo and price.' : ''}</p>}
      {catalog.map((p) => (
        <div key={p.id} className="flex gap-4 border border-zinc-200 rounded-2xl p-4">
          <Thumb p={p} className="w-20 h-20 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <p className="flex-1 text-[15px] text-zinc-900 truncate">{p.name}</p>
              {canSell && <button aria-label="Delete product" onClick={() => deleteProduct(p.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
            <p className="font-mono text-xs text-zinc-500 mt-1">${p.price}{p.tag && ` • ${p.tag}`}</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => addToCart(p)} className="px-4 py-1.5 rounded-full bg-zinc-900 text-white text-sm">Add</button>
              {canSell && <button onClick={() => pushToAll(p)} className="px-4 py-1.5 rounded-full border border-zinc-200 font-mono text-xs text-zinc-800">Push to All</button>}
            </div>
          </div>
        </div>
      ))}

      <div className="border-t border-zinc-100 pt-4">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] tracking-[0.2em] text-zinc-500">UNIVERSAL CART • {cartCount}</p>
          <button onClick={checkout} className="font-mono text-xs text-zinc-900 underline">View</button>
        </div>
        {cartItems.length === 0
          ? <p className="mt-3 rounded-2xl border border-dashed border-zinc-300 p-4 font-mono text-xs text-zinc-500">No items yet. Add from live push.</p>
          : (
            <div className="mt-3 space-y-1">
              {cartItems.map((i) => (
                <div key={i.id} className="flex items-center gap-2 text-sm text-zinc-800 py-1.5">
                  <span className="flex-1 truncate">{i.name} x{i.qty}</span>
                  <span className="font-mono">${(i.price * i.qty).toFixed(2)}</span>
                  <button aria-label="Remove" onClick={() => removeFromCart(i.id)} className="text-zinc-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button onClick={checkout} className="w-full mt-2 py-2.5 rounded-full bg-zinc-900 text-white text-sm">Checkout • ${cartTotal.toFixed(2)}</button>
            </div>
          )}
      </div>
    </div>
  );

  const sidebar = (
    <aside className="w-[400px] shrink-0 rounded-2xl border border-zinc-200 bg-white flex flex-col overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs px-3 py-1.5 rounded-full border border-zinc-200 text-zinc-500 truncate max-w-[150px]">ROOM {name}</span>
          <button onClick={copyInvite} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 font-mono text-xs text-zinc-800">{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied' : 'Copy Invite'}</button>
          <span className="ml-auto font-mono text-[10px] px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700">{isHost ? 'HOST' : 'GUEST'}</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex gap-1 p-1 rounded-full bg-zinc-100 font-mono text-[11px]">
            {pills.map((t) => (
              <button key={t.k} onClick={() => setTab(t.k as any)} className={`relative whitespace-nowrap px-3 py-1.5 rounded-full ${tab === t.k ? 'bg-zinc-900 text-white' : 'text-zinc-500'}`}>
                {t.k === 'money' ? <DollarSign className="w-3.5 h-3.5" /> : t.k === 'rules' ? <Sliders className="w-3.5 h-3.5" /> : t.label}
                {t.k === 'chat' && unread > 0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">{unread}</span>}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-1.5">
            {REACTIONS.map((r) => (
              <button key={r.k} aria-label={`React ${r.k}`} onClick={() => react(r)} className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center"><r.i className={`w-4 h-4 ${r.c}`} /></button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
        <div className={tab === 'chat' ? 'h-full' : 'hidden'}>
          {token ? <LiveChat onCount={setChatCount} /> : <LocalChat onCount={setChatCount} />}
        </div>
        {tab === 'shop' && shop}
        {tab === 'money' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-200 p-4"><p className="font-mono text-[10px] text-zinc-500">ADDED TO CART THIS CALL</p><p className="text-2xl font-semibold text-zinc-900 mt-1">{stats.adds}</p></div>
              <div className="rounded-2xl border border-zinc-200 p-4"><p className="font-mono text-[10px] text-zinc-500">VALUE ADDED</p><p className="text-2xl font-semibold text-zinc-900 mt-1">${stats.value.toFixed(2)}</p></div>
            </div>
            <div className="rounded-2xl border border-zinc-200 p-4"><p className="font-mono text-[10px] text-zinc-500">YOUR CART NOW</p><p className="text-2xl font-semibold text-zinc-900 mt-1">${cartTotal.toFixed(2)}</p></div>
            <p className="text-xs text-zinc-500">Counts what was added from this screen. Payments go through the project's shared cart and checkout.</p>
          </div>
        )}
        {tab === 'rules' && (
          <>
            <div className="flex items-center justify-between"><span className="text-[15px] text-zinc-900">User limit</span><span className="font-mono text-sm px-3 py-1 rounded-full bg-zinc-900 text-white">{userLimit}</span></div>
            <input type="range" min={2} max={1000} value={userLimit} onChange={(e) => setUserLimit(+e.target.value)} className="w-full accent-zinc-900" />
            <div className="flex items-center justify-between pt-2"><span className="text-[15px] text-zinc-900">Time limit</span><span className="font-mono text-sm px-3 py-1 rounded-full bg-zinc-100 text-zinc-800">{timeLabel}</span></div>
            <input type="range" min={5} max={720} step={5} value={timeLimit} onChange={(e) => setTimeLimit(+e.target.value)} className="w-full accent-zinc-900" />
            <div className="pt-2 space-y-3">
              <Toggle on={rules.autoEnd} onClick={() => setRules((r) => ({ ...r, autoEnd: !r.autoEnd }))} title="Auto end when time limit" sub="Ends call for all after timer" />
              <Toggle on={rules.approval} onClick={() => setRules((r) => ({ ...r, approval: !r.approval }))} title="Require approval to join" sub="Host approves lobby" />
              <Toggle on={rules.muteEntry} onClick={() => setRules((r) => ({ ...r, muteEntry: !r.muteEntry }))} title="Mute on entry" sub="New people start muted" />
              <Toggle on={rules.hideCount} onClick={() => setRules((r) => ({ ...r, hideCount: !r.hideCount }))} title="Hide participant count" sub="Privacy for large rooms" />
              <Toggle on={rules.hostProducts} onClick={() => setRules((r) => ({ ...r, hostProducts: !r.hostProducts }))} title="Only host can share products" sub="Commerce control" />
            </div>
          </>
        )}
      </div>
    </aside>
  );

  const body = (
    <div className="w-full h-screen bg-zinc-100 p-3 flex gap-3 overflow-hidden">
      {stage}
      {sidebar}
    </div>
  );

  if (!token) return body;
  return (
    <LiveKitRoom serverUrl={serverUrl} token={token} connect video={false} audio={false} data-lk-theme="default"
      onError={(e) => setConnError(e.message)} style={{ height: '100vh' }}>
      <ShopSync onSend={setSend} onMessage={onShopMessage} />
      <LocalPublisher cam={cam} mic={mic} />
      <PeerCount onCount={setPeerCount} />
      {body}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
