import { useEffect, useMemo, useRef, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, VideoTrack, useTracks, useConnectionState } from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import {
  FileText, Circle, Users, Timer, Crown, Mic, MicOff, Video, VideoOff, Hand, X, Plus, Link2,
  MonitorUp, Presentation, Smile, Heart, Flame, ThumbsUp, Laugh, PhoneOff, Upload, Sliders,
  Package, DollarSign, ShoppingCart, Copy, Play, Sparkles, Check,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LiveVideoRoomProps {
  roomName?: string;
  room?: string;
  identity?: string;
  onLeave?: () => void;
}

type Peer = { id: string; name: string; muted: boolean; camOff: boolean; hand: boolean };
type Product = { id: string; code: string; name: string; price: number };

const PRODUCTS: Product[] = [
  { id: 'hs', code: 'HS', name: 'Studio Headset Pro', price: 249 },
  { id: 'rl', code: 'RL', name: '4K Ring Light', price: 89 },
  { id: 'ap', code: 'AP', name: 'Acoustic Panel Set', price: 129 },
];

const MOCK_NAMES = ['Alex Rivera', 'Sora Kim', 'Marcus Lee', 'Priya Nair', 'Jordan Wu', 'Lena Ortiz', 'Omar Haddad', 'Mia Chen', 'Noah Patel', 'Ava Rossi'];
const initials = (n: string) => n.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const addToCart = (p: Product) => {
  const cart = (window as any).__IECart;
  if (cart?.add) { cart.add({ id: p.id, name: p.name, price: p.price, qty: 1 }); cart.open?.(); }
  else {
    const key = 'ie-live-cart';
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    const found = items.find((i: any) => i.id === p.id);
    found ? found.qty++ : items.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('ie-live-cart'));
  }
};

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

function ConnBadge() {
  const state = useConnectionState();
  return <span className="font-mono text-[11px] text-zinc-400">{state === 'connected' ? 'LiveKit Live' : 'LiveKit Preview'}</span>;
}

function Toggle({ on, onClick, title, sub }: { on: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-start gap-3 text-left border border-zinc-200 rounded-2xl px-4 py-3 hover:bg-zinc-50">
      <span className={`mt-1 w-4 h-4 rounded border flex items-center justify-center ${on ? 'border-zinc-800' : 'border-zinc-400'}`}>
        {on && <Check className="w-3 h-3 text-zinc-900" />}
      </span>
      <span>
        <span className="block text-[15px] text-zinc-900">{title}</span>
        <span className="block text-xs text-zinc-500 mt-0.5">{sub}</span>
      </span>
    </button>
  );
}

export default function LiveVideoRoom({ roomName, room, identity }: LiveVideoRoomProps) {
  const name = roomName || room || 'live-commerce-room';
  const id = useMemo(() => identity || `user-${Math.floor(Math.random() * 10000)}`, [identity]);
  const roomCode = useMemo(() => `LIVE-${Math.floor(100 + Math.random() * 900)}`, []);

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
  const [reaction, setReaction] = useState<{ key: number; icon: any } | null>(null);
  const [spotlight, setSpotlight] = useState<Product | null>(PRODUCTS[0]);
  const [link, setLink] = useState('');
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [presenting, setPresenting] = useState<{ name: string; url: string } | null>(null);
  const [tab, setTab] = useState<'rules' | 'products' | 'money' | 'cart'>('rules');
  const [userLimit, setUserLimit] = useState(100);
  const [timeLimit, setTimeLimit] = useState(120);
  const [rules, setRules] = useState({ autoEnd: true, approval: false, muteEntry: true, hideCount: false, hostProducts: true });
  const [copied, setCopied] = useState('');
  const [cartTick, setCartTick] = useState(0);
  const [peers, setPeers] = useState<Peer[]>([
    { id: 'p1', name: 'Alex Rivera', muted: false, camOff: false, hand: false },
    { id: 'p2', name: 'Sora Kim', muted: true, camOff: false, hand: true },
    { id: 'p3', name: 'Marcus Lee', muted: false, camOff: true, hand: false },
    { id: 'p4', name: 'Priya Nair', muted: false, camOff: false, hand: false },
    { id: 'p5', name: 'Jordan Wu', muted: true, camOff: false, hand: false },
  ]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('livekit-token', { body: { roomName: name, identity: id } });
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
  }, [name, id]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (rules.autoEnd && seconds >= timeLimit * 60) setLeft(true);
  }, [seconds, timeLimit, rules.autoEnd]);

  useEffect(() => {
    const h = () => setCartTick((n) => n + 1);
    window.addEventListener('ie-live-cart', h);
    window.addEventListener('ie-cart', h);
    return () => { window.removeEventListener('ie-live-cart', h); window.removeEventListener('ie-cart', h); };
  }, []);

  useEffect(() => {
    let active = true;
    if (!cam && !mic) { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; return; }
    navigator.mediaDevices?.getUserMedia({ video: cam, audio: mic }).then((s) => {
      if (!active) { s.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
    }).catch(() => {});
    return () => { active = false; };
  }, [cam, mic]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const toggleShare = async () => {
    if (sharing) {
      (screenRef.current?.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop());
      setSharing(false);
      return;
    }
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setSharing(true);
      setTimeout(() => { if (screenRef.current) screenRef.current.srcObject = s; }, 0);
      s.getVideoTracks()[0].onended = () => setSharing(false);
    } catch { /* cancelled */ }
  };

  const react = (icon: any) => { setReaction({ key: Date.now(), icon }); setTimeout(() => setReaction(null), 1500); };
  const addPeer = () => {
    if (peers.length + 1 >= userLimit) return;
    const n = MOCK_NAMES[peers.length % MOCK_NAMES.length];
    setPeers((p) => [...p, { id: `p${Date.now()}`, name: n, muted: rules.muteEntry, camOff: false, hand: false }]);
  };
  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const added = Array.from(list).map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setFiles((f) => [...f, ...added]);
    setPresenting(added[0]);
  };
  const openLink = () => {
    if (!link.trim()) return;
    const url = link.startsWith('http') ? link : `https://${link}`;
    const item = { name: url, url };
    setFiles((f) => [...f, item]);
    setPresenting(item);
    setLink('');
  };
  const copy = (text: string, key: string) => { navigator.clipboard?.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1200); };

  const roomUrl = `${window.location.origin}/live-video?room=${encodeURIComponent(name)}`;
  const cartItems: { id: string; name: string; price: number; qty: number }[] = useMemo(() => {
    const c = (window as any).__IECart;
    if (c?.items) return c.items();
    try { return JSON.parse(localStorage.getItem('ie-live-cart') || '[]'); } catch { return []; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartTick]);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const totalPeers = peers.length + 1;
  const timeLabel = `${Math.floor(timeLimit / 60)}h ${timeLimit % 60}m`;

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
    <div className="flex-1 min-w-0 flex flex-col rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-950">
      {/* Header */}
      <div className="h-14 bg-white flex items-center gap-4 px-5 font-mono text-[13px] text-zinc-800 border-b border-zinc-200">
        <span className="tracking-wider">{roomCode}</span>
        <span className="w-px h-4 bg-zinc-200" />
        <span className="flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" />{fmtTime(seconds)}</span>
        <span className="w-px h-4 bg-zinc-200" />
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{rules.hideCount ? 'hidden' : `${totalPeers} peers`} • no cap</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => fileInput.current?.click()} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-zinc-200 hover:bg-zinc-50"><FileText className="w-3.5 h-3.5" />Present file</button>
          <button onClick={() => setRec((r) => !r)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border ${rec ? 'border-red-300 text-red-600' : 'border-zinc-200'}`}><Circle className={`w-3.5 h-3.5 ${rec ? 'fill-red-500 text-red-500' : ''}`} />REC {rec ? 'ON' : 'OFF'}</button>
          <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-zinc-200 bg-zinc-50">
            <span className={`w-1.5 h-1.5 rounded-full ${token ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
            {token ? <ConnBadge /> : <span className="font-mono text-[11px] text-zinc-400" title={connError}>LiveKit Preview</span>}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {(sharing || presenting) && (
          <div className="relative mb-3 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 h-[360px]">
            {sharing ? <video ref={screenRef} autoPlay muted playsInline className="w-full h-full object-contain" />
              : presenting && (/\.(png|jpe?g|gif|webp)$/i.test(presenting.name)
                ? <img src={presenting.url} alt={presenting.name} className="w-full h-full object-contain" />
                : <iframe title="presentation" src={presenting.url.includes('docs.google.com') ? presenting.url.replace(/\/edit.*$/, '/preview') : presenting.url} className="w-full h-full bg-white" />)}
            <button onClick={() => { if (sharing) toggleShare(); else setPresenting(null); }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          {/* Host */}
          <div onClick={() => setPinned(pinned === 'host' ? null : 'host')} className={`${tileBase} ring-2 ring-white ${pinned === 'host' ? 'col-span-2 row-span-2' : ''}`}>
            {cam ? <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
              : <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"><span className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center"><VideoOff className="w-5 h-5 text-zinc-300" /></span><span className="font-mono text-xs text-zinc-400">Camera off • voice still live</span></div>}
            <span className="absolute top-3 left-3 bg-white text-zinc-900 font-mono text-[10px] tracking-wider px-2.5 py-1 rounded-full">SPEAKING • VIDEO+VOICE</span>
            {spotlight && false}
            <div className="absolute inset-x-0 bottom-0 p-3 flex items-center bg-gradient-to-t from-black/70 to-transparent">
              <span className="font-mono text-xs text-white flex items-center gap-1.5">You (Host) <Crown className="w-3.5 h-3.5 text-amber-400" />{hand && <Hand className="w-3.5 h-3.5 text-amber-400" />}</span>
              <span className="ml-auto flex gap-1.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${mic ? 'bg-white/15' : 'bg-red-500'}`}>{mic ? <Mic className="w-3 h-3 text-white" /> : <MicOff className="w-3 h-3 text-white" />}</span>
                <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">{cam ? <Video className="w-3 h-3 text-white" /> : <VideoOff className="w-3 h-3 text-white" />}</span>
              </span>
            </div>
            {reaction && <span key={reaction.key} className="absolute right-4 bottom-12 animate-bounce"><reaction.icon className="w-8 h-8 text-rose-400" /></span>}
          </div>

          {token && <RemoteTiles />}

          {peers.map((p, i) => (
            <div key={p.id} onClick={() => setPinned(pinned === p.id ? null : p.id)} className={`${tileBase} ${pinned === p.id ? 'col-span-2 row-span-2' : ''}`}>
              {i === 0 && spotlight && (
                <div onClick={(e) => e.stopPropagation()} className="absolute top-1 left-1 right-1 z-10 bg-white rounded-2xl p-3 flex items-center gap-3 shadow-xl">
                  <span className="w-14 h-14 rounded-xl bg-zinc-900 text-white font-mono text-[10px] flex items-center justify-center">{spotlight.code}</span>
                  <span className="flex-1 min-w-0"><span className="block text-[15px] text-zinc-900 truncate">{spotlight.name}</span><span className="block font-mono text-xs text-zinc-500">${spotlight.price}</span></span>
                  <button onClick={() => addToCart(spotlight)} className="px-3.5 py-2 rounded-full bg-zinc-900 text-white text-sm">Add to cart</button>
                  <button onClick={() => setSpotlight(null)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center"><X className="w-4 h-4 text-zinc-700" /></button>
                </div>
              )}
              {p.camOff
                ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"><span className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center"><VideoOff className="w-5 h-5 text-zinc-300" /></span><span className="font-mono text-xs text-zinc-400">Camera off • voice still live</span></div>
                : <div className="absolute inset-0 flex items-center justify-center"><span className="w-14 h-14 rounded-full bg-white/10 text-zinc-200 font-medium flex items-center justify-center">{initials(p.name)}</span></div>}
              <div className="absolute inset-x-0 bottom-0 p-3 flex items-center bg-gradient-to-t from-black/60 to-transparent">
                <span className="font-mono text-xs text-white flex items-center gap-1.5">{p.name}{p.hand && <Hand className="w-3.5 h-3.5 text-amber-400" />}</span>
                <span className="ml-auto flex gap-1.5">
                  <button onClick={(e) => { e.stopPropagation(); setPeers((ps) => ps.map((x) => x.id === p.id ? { ...x, muted: !x.muted } : x)); }} className={`w-6 h-6 rounded-full flex items-center justify-center ${p.muted ? 'bg-red-500' : 'bg-white/15'}`}>{p.muted ? <MicOff className="w-3 h-3 text-white" /> : <Mic className="w-3 h-3 text-white" />}</button>
                  <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">{p.camOff ? <VideoOff className="w-3 h-3 text-white" /> : <Video className="w-3 h-3 text-white" />}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
          <button onClick={addPeer} className="flex items-center gap-1 px-4 py-2 rounded-full bg-zinc-800 text-zinc-200 border border-white/10"><Plus className="w-3 h-3" />Add mock peer (no cap) • {totalPeers}/{userLimit}</button>
          <span className="px-4 py-2 rounded-full border border-white/10 text-zinc-400">SFU • grid scrolls to 100+</span>
          <button onClick={() => fileInput.current?.click()} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-zinc-700"><FileText className="w-3 h-3" />Drop files or paste Google link</button>
          {files.map((f) => (
            <button key={f.url} onClick={() => setPresenting(f)} className="px-3 py-2 rounded-full border border-white/10 text-zinc-300 max-w-[200px] truncate">{f.name}</button>
          ))}
        </div>
      </div>

      {/* Offers ribbon */}
      <div className="px-4 pb-3 flex flex-wrap gap-2 bg-zinc-950">
        {PRODUCTS.map((p, i) => (
          <button key={p.id} onClick={() => addToCart(p)} className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-white font-mono text-xs text-zinc-800 hover:bg-zinc-100">
            <span className={`w-8 h-8 rounded-full text-[8px] flex items-center justify-center ${i === 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-600'}`}>{p.code}</span>
            {p.name} • ${p.price}
          </button>
        ))}
      </div>

      {/* Dock */}
      <div className="mx-4 mb-3 rounded-2xl border border-white/10 bg-zinc-900/80 p-2 flex items-center gap-2"
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
        <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2.5 rounded-full border border-white/10">
          <Link2 className="w-4 h-4 text-zinc-500 shrink-0" />
          <input value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && openLink()} placeholder="Paste Google Drive / Sheets / Slides link"
            className="flex-1 min-w-0 bg-transparent font-mono text-sm text-zinc-200 placeholder:text-zinc-400 outline-none" />
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-zinc-950 border border-white/10">
          {[
            { on: cam, icon: cam ? Video : VideoOff, fn: () => setCam((v) => !v), label: 'Camera' },
            { on: mic, icon: mic ? Mic : MicOff, fn: () => setMic((v) => !v), label: 'Microphone' },
            { on: sharing, icon: MonitorUp, fn: toggleShare, label: 'Share screen' },
            { on: !!pinned, icon: Presentation, fn: () => setPinned(pinned ? null : 'host'), label: 'Pin tile' },
          ].map((b) => (
            <button key={b.label} aria-label={b.label} onClick={b.fn} className={`w-10 h-10 rounded-full flex items-center justify-center ${b.label === 'Camera' || b.label === 'Microphone' ? (b.on ? 'bg-zinc-800 text-white' : 'bg-red-500 text-white') : b.on ? 'bg-white text-zinc-900' : 'bg-zinc-800 text-white'}`}><b.icon className="w-4 h-4" /></button>
          ))}
          <span className="w-px h-6 bg-white/10 mx-1" />
          <button aria-label="Raise hand" onClick={() => setHand((h) => !h)} className={`w-10 h-10 rounded-full flex items-center justify-center ${hand ? 'bg-amber-400 text-zinc-900' : 'bg-zinc-800 text-white'}`}><Hand className="w-4 h-4" /></button>
          <button aria-label="React" onClick={() => react(Smile)} className="w-10 h-10 rounded-full bg-zinc-800 text-white flex items-center justify-center"><Smile className="w-4 h-4" /></button>
          {[{ i: Heart, c: 'text-rose-400' }, { i: Flame, c: 'text-orange-400' }, { i: ThumbsUp, c: 'text-amber-300' }, { i: Laugh, c: 'text-yellow-300' }].map(({ i: I, c }, k) => (
            <button key={k} onClick={() => react(I)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><I className={`w-4 h-4 ${c}`} /></button>
          ))}
          <button onClick={() => { streamRef.current?.getTracks().forEach((t) => t.stop()); setLeft(true); }} className="ml-1 flex items-center gap-2 px-5 h-10 rounded-full bg-red-500 text-white text-sm font-medium"><PhoneOff className="w-4 h-4" />Leave</button>
        </div>
        <button onClick={openLink} className="px-5 h-10 rounded-full bg-white text-zinc-900 text-sm">Open</button>
        <button onClick={() => fileInput.current?.click()} className="flex items-center gap-2 px-5 h-10 rounded-full border border-white/10 text-white font-mono text-sm"><Upload className="w-4 h-4" />Upload file</button>
        <input ref={fileInput} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      </div>

      {/* Footer */}
      <div className="h-12 bg-white flex items-center px-5 font-mono text-xs text-zinc-500 border-t border-zinc-200">
        <span className="truncate">Video+Voice combined • Screenshare pinned large • File present independent pages • Drop files or paste Google link • You control your view</span>
        <span className="ml-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 text-white"><Sparkles className="w-3.5 h-3.5" />Ecommerce ready</span>
      </div>
    </div>
  );

  const tabs = [
    { k: 'rules', label: 'Rules', icon: Sliders },
    { k: 'products', label: 'Products', icon: Package },
    { k: 'money', label: '$', icon: DollarSign },
    { k: 'cart', label: 'Cart', icon: ShoppingCart },
  ] as const;

  const sidebar = (
    <aside className="w-[400px] shrink-0 rounded-2xl border border-zinc-200 bg-white flex flex-col overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center"><Sliders className="w-4 h-4 text-white" /></span>
          <span className="text-lg font-semibold text-zinc-900 tracking-tight">Control Room</span>
          <span className="ml-auto font-mono text-[10px] px-2.5 py-1 rounded-full border border-zinc-200 text-zinc-700">HOST</span>
        </div>
        <div className="mt-5 flex gap-1 p-1 rounded-full bg-zinc-100 font-mono text-[13px]">
          {tabs.map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full ${tab === t.k ? 'bg-zinc-900 text-white' : 'text-zinc-600'}`}><t.icon className="w-3.5 h-3.5" />{t.label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
        {tab === 'rules' && (
          <>
            <div className="flex items-center justify-between"><span className="text-[15px] text-zinc-900">User limit (no cap)</span><span className="font-mono text-sm px-3 py-1 rounded-full bg-zinc-900 text-white">{userLimit}</span></div>
            <input type="range" min={2} max={1000} value={userLimit} onChange={(e) => setUserLimit(+e.target.value)} className="w-full accent-zinc-900" />
            <p className="font-mono text-xs text-zinc-500 leading-relaxed">Default 100, slider to 1000, SFU allows unlimited. No cap enforced server-side.</p>
            <div className="flex items-center justify-between pt-2"><span className="text-[15px] text-zinc-900">Time limit</span><span className="font-mono text-sm px-3 py-1 rounded-full bg-zinc-100 text-zinc-800">{timeLabel}</span></div>
            <input type="range" min={5} max={720} step={5} value={timeLimit} onChange={(e) => setTimeLimit(+e.target.value)} className="w-full accent-zinc-900" />
            <div className="pt-2 space-y-3">
              <Toggle on={rules.autoEnd} onClick={() => setRules((r) => ({ ...r, autoEnd: !r.autoEnd }))} title="Auto end when time limit" sub="Ends call for all after timer" />
              <Toggle on={rules.approval} onClick={() => setRules((r) => ({ ...r, approval: !r.approval }))} title="Require approval to join" sub="Host approves lobby" />
              <Toggle on={rules.muteEntry} onClick={() => setRules((r) => ({ ...r, muteEntry: !r.muteEntry }))} title="Mute on entry" sub="New peers start muted, video on" />
              <Toggle on={rules.hideCount} onClick={() => setRules((r) => ({ ...r, hideCount: !r.hideCount }))} title="Hide participant count" sub="Privacy for large rooms" />
              <Toggle on={rules.hostProducts} onClick={() => setRules((r) => ({ ...r, hostProducts: !r.hostProducts }))} title="Only host can share products" sub="Commerce control" />
            </div>
            <div className="mt-4 rounded-2xl bg-zinc-900 p-5 text-zinc-200">
              <p className="font-mono text-xs tracking-[0.2em] text-zinc-400">SCREENSHARE + FILE PRESENT</p>
              <p className="mt-3 text-sm leading-relaxed">Screenshare pinned tile + file viewer. Use <code className="font-mono bg-white/10 px-1 rounded">forceSync</code> to force all to same page. Otherwise <code className="font-mono bg-white/10 px-1 rounded">You control your view</code> independent.</p>
            </div>
          </>
        )}
        {tab === 'products' && PRODUCTS.map((p) => (
          <div key={p.id} className="flex items-center gap-3 border border-zinc-200 rounded-2xl p-3">
            <span className="w-10 h-10 rounded-xl bg-zinc-900 text-white font-mono text-[10px] flex items-center justify-center">{p.code}</span>
            <span className="flex-1"><span className="block text-sm text-zinc-900">{p.name}</span><span className="font-mono text-xs text-zinc-500">${p.price}</span></span>
            <button onClick={() => setSpotlight(p)} className="px-3 py-1.5 rounded-full bg-zinc-900 text-white text-xs">Push to call</button>
          </div>
        ))}
        {tab === 'money' && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-zinc-200 p-4"><p className="font-mono text-xs text-zinc-500">CART VALUE THIS CALL</p><p className="text-2xl font-semibold text-zinc-900 mt-1">${cartTotal.toFixed(2)}</p></div>
            <p className="text-xs text-zinc-500">Purchases from the call go through the project's shared cart and checkout.</p>
          </div>
        )}
        {tab === 'cart' && (
          <div className="space-y-2">
            {cartItems.length === 0 && <p className="text-sm text-zinc-500">Cart is empty.</p>}
            {cartItems.map((i) => (
              <div key={i.id} className="flex justify-between text-sm text-zinc-800 border-b border-zinc-100 py-2"><span>{i.name} x{i.qty}</span><span className="font-mono">${(i.price * i.qty).toFixed(2)}</span></div>
            ))}
            {cartItems.length > 0 && <button onClick={() => (window as any).__IECart?.checkout?.()} className="w-full mt-2 py-2.5 rounded-full bg-zinc-900 text-white text-sm">Checkout • ${cartTotal.toFixed(2)}</button>}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 px-5 py-4 space-y-2">
        <div className="flex gap-2">
          <input readOnly value={roomUrl} className="flex-1 min-w-0 font-mono text-xs px-3 py-2.5 rounded-xl border border-zinc-200 text-zinc-700" />
          <button onClick={() => copy(roomUrl, 'url')} className="flex items-center gap-1.5 px-4 rounded-xl bg-zinc-900 text-white font-mono text-xs"><Copy className="w-3.5 h-3.5" />{copied === 'url' ? 'Copied' : 'Copy'}</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => copy(JSON.stringify({ serverUrl, room: name, identity: id }, null, 2), 'cfg')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-200 font-mono text-xs text-zinc-800"><Copy className="w-3.5 h-3.5" />{copied === 'cfg' ? 'Copied' : 'Copy LiveKit config'}</button>
          <button onClick={() => setSpotlight(PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)])} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 font-mono text-xs text-zinc-800"><Play className="w-3.5 h-3.5" />Demo push</button>
        </div>
        <p className="font-mono text-[11px] text-zinc-500 leading-relaxed">Integrate: LiveCall + file presentation + offers via data channel. Drop files or paste Google link inside call.</p>
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
      {body}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
