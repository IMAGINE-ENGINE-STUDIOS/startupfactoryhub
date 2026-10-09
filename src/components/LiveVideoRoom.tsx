import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, VideoTrack, useTracks, useConnectionState, useDataChannel, useLocalParticipant } from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import {
  Users, Timer, Crown, Mic, MicOff, Video, VideoOff, Hand, X, Plus, MonitorUp, Presentation,
  Heart, Flame, ThumbsUp, PhoneOff, Upload, Sliders, DollarSign, ShoppingBag, Copy, Check,
  MessageSquare, Radio, Circle, Trash2, ImagePlus, Link2, Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LiveChat, LocalChat } from './LiveChatPanel';
import LiveStage from './live/LiveStage';
import sfhLogo from '@/assets/sfh-logo-emblem.png';
import { SFH_PACKAGES } from './live/sfhPackages';
import { BackgroundApplier, BackgroundPicker, readBgChoice, type BgChoice } from './live/BackgroundEffects';
import GuestCheckIn, { readCheckin, type Checkin } from './live/GuestCheckIn';

interface LiveVideoRoomProps { roomName?: string; room?: string; identity?: string; onLeave?: () => void }

type Product = { id: string; name: string; price: number; tag: string; image: string; pkg?: string; interval?: 'month' | 'year'; perks?: string[] };
type CartItem = { id: string; name: string; price: number; qty: number; image?: string };
const absUrl = (u: string) => { try { return u && !u.startsWith('data:') ? new URL(u, window.location.origin).href : u; } catch { return u; } };
const priceLabel = (p: Product) => `$${p.price.toLocaleString()}${p.interval ? (p.interval === 'year' ? '/yr' : '/mo') : ''}`;
// Old demo-account ids that must never be treated as a room host.
const DEMO_HOST_IDS = ['dc29b196-c2c5-46aa-bdac-8bc762b739c1'];

const initials = (n: string) => n.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const REACTIONS = [{ k: 'heart', i: Heart, c: 'text-rose-500' }, { k: 'fire', i: Flame, c: 'text-orange-500' }, { k: 'up', i: ThumbsUp, c: 'text-amber-500' }];

const readCart = (): CartItem[] => {
  try { return JSON.parse(localStorage.getItem('ie-live-cart') || '[]'); } catch { return []; }
};
const addToCart = (p: Product) => {
  const items = readCart();
  const found = items.find((i) => i.id === p.id);
  found ? found.qty++ : items.push({ id: p.id, name: p.name, price: p.price, qty: 1, image: absUrl(p.image) });
  localStorage.setItem('ie-live-cart', JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('ie-live-cart', { detail: { added: p } }));
};
const removeFromCart = (id: string) => {
  localStorage.setItem('ie-live-cart', JSON.stringify(readCart().filter((i) => i.id !== id)));
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

// Sends this person's shared screen (and its sound) to everyone in the room using LiveKit's native screen share.
function ScreenPublisher({ on, onStream, onEnd, onFail }: { on: boolean; onStream: (s: MediaStream) => void; onEnd: () => void; onFail: (msg: string) => void }) {
  const { localParticipant } = useLocalParticipant();
  const state = useConnectionState();
  const cbs = useRef({ onStream, onEnd, onFail }); cbs.current = { onStream, onEnd, onFail };
  useEffect(() => {
    if (state !== 'connected') return;
    let cancelled = false;
    if (on) {
      localParticipant.setScreenShareEnabled(true, { audio: true, video: { frameRate: 15 } as any, selfBrowserSurface: 'include', systemAudio: 'include' } as any, { simulcast: false, videoEncoding: { maxBitrate: 3_000_000, maxFramerate: 15 } } as any)
        .then((pub) => {
          const tr = pub?.track?.mediaStreamTrack;
          if (!tr) { if (!cancelled) cbs.current.onEnd(); return; }
          cbs.current.onStream(new MediaStream([tr]));
          tr.addEventListener('ended', () => cbs.current.onEnd());
        })
        .catch((e) => {
          console.warn('Screen share failed', e);
          const msg = String(e?.name || e?.message || '');
          if (!/NotAllowed|Abort|cancel/i.test(msg)) cbs.current.onFail('Screen share failed. Use Chrome or Edge on a computer and allow screen sharing.');
          cbs.current.onEnd();
        });
    } else if (localParticipant.isScreenShareEnabled) {
      localParticipant.setScreenShareEnabled(false).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [on, state, localParticipant]);
  return null;
}

// Publishes this person's real camera and microphone to everyone in the room, kept in sync with the buttons.
function LocalPublisher({ cam, mic }: { cam: boolean; mic: boolean }) {
  const { localParticipant } = useLocalParticipant();
  const state = useConnectionState();
  useEffect(() => { if (state === 'connected') localParticipant.setCameraEnabled(cam).catch(() => {}); }, [cam, state, localParticipant]);
  useEffect(() => { if (state === 'connected') localParticipant.setMicrophoneEnabled(mic).catch(() => {}); }, [mic, state, localParticipant]);
  return null;
}

function PeerCount({ onCount }: { onCount: (n: number) => void }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone], { onlySubscribed: false });
  const n = new Set(tracks.map((t) => t.participant.identity)).size;
  useEffect(() => { onCount(Math.max(1, n)); }, [n, onCount]);
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

function LiveVideoRoomInner({ roomName, room, identity, guest, chosenName }: LiveVideoRoomProps & { guest?: Checkin | null; chosenName?: string | null }) {
  const name = roomName || room || 'live-commerce-room';
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);
  const guestId = useMemo(() => `guest-${Math.floor(Math.random() * 100000)}`, []);
  const id = identity || user?.id || guestId;
  const displayName = chosenName || profile?.full_name || user?.email?.split('@')[0]
    || (guest ? `${guest.name} (${guest.role === 'investor' ? 'Investor' : 'Startup'})` : 'Guest');

  // Platform admins can always take over as host (e.g. when an old link names someone else).
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user?.id) { setIsAdmin(false); return; }
    if (user.email?.toLowerCase() === 'ceo@imagineengine.space') { setIsAdmin(true); return; }
    supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }).then(({ data }) => setIsAdmin(!!data));
  }, [user?.id, user?.email]);
  const [hostTick, setHostTick] = useState(0);
  // Host = the person whose account id is in the invite link; the first signed-in person to open a room becomes its host.
  const hostId = useMemo(() => {
    const url = new URL(window.location.href);
    let h = url.searchParams.get('host');
    if (h && DEMO_HOST_IDS.includes(h) && user?.id) h = null; // old demo account links never own a room
    // The public conference room ("main") is only ever hosted by a platform admin; other rooms by whoever opens them first.
    if (!h && user?.id && (name !== 'main' || isAdmin)) {
      h = user.id;
      url.searchParams.set('host', h);
      if (!url.searchParams.get('room')) url.searchParams.set('room', name);
      window.history.replaceState(null, '', url.toString());
    }
    return h;
  }, [user?.id, name, hostTick, isAdmin]); // eslint-disable-line
  // Guests without an account are never host.
  const isHost = !!user?.id && (hostId === id || (!hostId && isAdmin));
  const canClaimHost = !!user?.id && isAdmin;
  const claimHost = () => {
    if (!user?.id) return;
    const url = new URL(window.location.href);
    url.searchParams.set('host', user.id);
    window.history.replaceState(null, '', url.toString());
    setHostTick((t) => t + 1);
  };

  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [connError, setConnError] = useState('');
  const [left, setLeft] = useState(false);

  const [seconds, setSeconds] = useState(0);
  // Hosts start live; guests start muted with camera off.
  const [mic, setMic] = useState(isHost);
  const [cam, setCam] = useState(isHost);
  const [bg, setBg] = useState<BgChoice>(readBgChoice);
  const [bgOpen, setBgOpen] = useState(false);
  const [hand, setHand] = useState(false);
  const [rec, setRec] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [spotlight, setSpotlight] = useState<string | null>(null); // host pin, seen by everyone
  const [localPin, setLocalPin] = useState<string | null | undefined>(undefined); // guest's own pin
  const [allowed, setAllowed] = useState<string[]>([]);
  const [banned, setBanned] = useState<string[]>([]);
  const kickKey = `ie-live-kicked:${name}`;
  const [kicked, setKicked] = useState(() => { try { return localStorage.getItem(kickKey) === '1'; } catch { return false; } });
  const beKicked = () => { try { localStorage.setItem(kickKey, '1'); } catch { /* ignore */ } setKicked(true); setLeft(true); };
  const beKickedRef = useRef(beKicked); beKickedRef.current = beKicked;
  const [recSecs, setRecSecs] = useState(0);
  useEffect(() => { if (!rec) return; const t = setInterval(() => setRecSecs((s) => s + 1), 1000); return () => clearInterval(t); }, [rec]);
  const [roomAudience, setRoomAudience] = useState(false);
  const [notice, setNotice] = useState('');
  const idRef = useRef(id);
  idRef.current = id;
  const [floats, setFloats] = useState<{ key: number; icon: any; c: string; x: number }[]>([]);
  const [peerCount, setPeerCount] = useState(1);
  const recRef = useRef<MediaRecorder | null>(null);
  const [presentOpen, setPresentOpen] = useState(false);
  const [link, setLink] = useState('');
  const [presenting, setPresenting] = useState<{ name: string; url: string; kind: 'image' | 'video' | 'pdf' | 'link' } | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [tab, setTab] = useState<'shop' | 'chat' | 'money' | 'rules'>('shop');
  const [chatCount, setChatCount] = useState(0);
  const [seenCount, setSeenCount] = useState(0);
  useEffect(() => { if (tab === 'chat') setSeenCount(chatCount); }, [tab, chatCount]);
  const unread = Math.max(0, chatCount - seenCount);
  const [userLimit, setUserLimit] = useState(100);
  const [timeLimit, setTimeLimit] = useState(120);
  const [rules, setRules] = useState({ autoEnd: true, approval: false, muteEntry: true, hideCount: false, hostProducts: true, audience: false, autoFollow: false });
  const [showPkgs, setShowPkgs] = useState(false);
  const [paying, setPaying] = useState('');
  const [copied, setCopied] = useState(false);
  const [cartTick, setCartTick] = useState(0);

  // Shop
  const catalogKey = `ie-live-catalog:${name}`;
  const [catalog, setCatalog] = useState<Product[]>(() => { try { return JSON.parse(localStorage.getItem(catalogKey) || '[]'); } catch { return []; } });
  const [drop, setDrop] = useState<Product | null>(null);
  const [stageOffer, setStageOffer] = useState(true);
  const [adding, setAdding] = useState(false);
  const [pkgPick, setPkgPick] = useState(SFH_PACKAGES[0].id);
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
    if (m.t === 'present') { presentMine.current = false; setPresenting(m.p || null); }
    if (m.t === 'react') { const r = REACTIONS.find((x) => x.k === m.k); if (r) showReaction(r); }
    if (m.t === 'room') { setSpotlight(m.spot ?? null); setRoomAudience(!!m.audience); setAllowed(Array.isArray(m.allowed) ? m.allowed : []); setBanned(Array.isArray(m.banned) ? m.banned : []); }
    if (m.t === 'hand' && m.up) setNotice(`${m.name || 'Someone'} raised their hand`);
    if (m.t === 'mod' && m.to === idRef.current) {
      if (m.a === 'kick') { beKickedRef.current(); return; }
      if (m.a === 'mute') { setMic(false); setNotice('The host muted your microphone'); }
      if (m.a === 'cam') { setCam(false); setNotice('The host turned your camera off'); }
      if (m.a === 'allow') setNotice('The host invited you to speak. Turn on your mic or camera.');
      if (m.a === 'revoke') setNotice('You were moved to the audience');
    }
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
  const pkgProduct = (k: typeof SFH_PACKAGES[number]): Product => ({ id: `pkg-${k.id}`, pkg: k.id, name: k.name, price: k.price, interval: k.interval, tag: k.tag, perks: k.perks, image: absUrl(k.image) });
  const addPackage = (k: typeof SFH_PACKAGES[number], push = false) => {
    const p = pkgProduct(k);
    setCatalog((c) => c.some((x) => x.id === p.id) ? c : [...c, p]);
    broadcast({ t: 'product', p });
    if (push) pushToAll(p);
  };

  // Stage control: who is on stage, who is pinned, audience mode.
  const audience = isHost ? rules.audience : roomAudience;
  const canSpeak = isHost || !audience || allowed.includes(id);
  const pinned = isHost ? spotlight : (localPin !== undefined ? localPin : spotlight);
  const roomRef = useRef({ spot: spotlight, audience: rules.audience, allowed, banned });
  roomRef.current = { spot: spotlight, audience: rules.audience, allowed, banned };
  const syncRoom = useCallback(() => { if (isHost) sendRef.current({ t: 'room', ...roomRef.current }); }, [isHost]);
  const catRef = useRef(catalog); catRef.current = catalog;
  // Late joiners: host resends the room catalog whenever someone joins.
  useEffect(() => { if (isHost) catRef.current.forEach((p) => sendRef.current({ t: 'product', p })); }, [peerCount, token, isHost]);
  useEffect(() => { syncRoom(); }, [spotlight, rules.audience, allowed, peerCount, token, syncRoom]);
  const onPin = (who: string | null) => { if (isHost) setSpotlight(who); else setLocalPin(who); };
  const onMod = (to: string, a: 'mute' | 'cam' | 'allow' | 'revoke' | 'kick') => {
    if (a === 'allow') setAllowed((l) => l.includes(to) ? l : [...l, to]);
    if (a === 'revoke') setAllowed((l) => l.filter((x) => x !== to));
    if (a === 'kick') {
      if (!window.confirm('Remove this person from the call? They can ask to rejoin and you decide.')) return;
      setBanned((l) => l.includes(to) ? l : [...l, to]);
      if (spotlight === to) setSpotlight(null);
      setNotice('Participant removed');
    }
    broadcast({ t: 'mod', to, a });
  };
  useEffect(() => { if (!canSpeak) { setMic(false); setCam(false); } }, [canSpeak]);
  useEffect(() => { if (!isHost && banned.includes(id)) beKicked(); }, [banned, id, isHost]); // eslint-disable-line

  // Removed people can knock; the host admits or denies them (works while they're out of the call).
  const [knocks, setKnocks] = useState<{ id: string; name: string }[]>([]);
  const [knockState, setKnockState] = useState<'idle' | 'waiting' | 'denied'>('idle');
  const knockChan = useRef<ReturnType<typeof supabase.channel> | null>(null);
  useEffect(() => {
    if (!isHost && !kicked) return;
    const ch = supabase.channel(`live-knock:${name}`, { config: { broadcast: { self: false } } });
    ch.on('broadcast', { event: 'knock' }, ({ payload }) => {
      if (!isHost || !payload?.id) return;
      setKnocks((l) => l.some((k) => k.id === payload.id) ? l : [...l, { id: payload.id, name: payload.name || 'Someone' }]);
    });
    ch.on('broadcast', { event: 'reply' }, ({ payload }) => {
      if (isHost || payload?.to !== idRef.current) return;
      if (payload.ok) {
        try { localStorage.removeItem(kickKey); } catch { /* ignore */ }
        setKnockState('idle'); setKicked(false); setLeft(false); setSeconds(0);
      } else setKnockState('denied');
    });
    ch.subscribe();
    knockChan.current = ch;
    return () => { supabase.removeChannel(ch); knockChan.current = null; };
  }, [isHost, kicked, name, kickKey]);
  const askToJoin = () => {
    setKnockState('waiting');
    knockChan.current?.send({ type: 'broadcast', event: 'knock', payload: { id, name: displayName } });
  };
  const answerKnock = (who: string, ok: boolean) => {
    setKnocks((l) => l.filter((k) => k.id !== who));
    if (ok) setBanned((l) => l.filter((x) => x !== who));
    knockChan.current?.send({ type: 'broadcast', event: 'reply', payload: { to: who, ok } });
  };
  useEffect(() => { if (notice) { const t = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(t); } }, [notice]);

  // Checkout through Startup Factory Hub's Stripe account.
  const returnUrl = () => { const u = new URL(window.location.href); u.searchParams.delete('checkout'); return u.toString(); };
  const pay = async (key: string, body: Record<string, unknown>) => {
    setPaying(key);
    try {
      const { data, error } = await supabase.functions.invoke('live-checkout', { body: { ...body, room: name, returnUrl: returnUrl() } });
      if (error || !data?.url) throw new Error(data?.error || error?.message || 'Checkout failed');
      window.open(data.url, '_blank', 'noopener');
    } catch (e: any) { setNotice(e.message || 'Checkout failed'); }
    setPaying('');
  };
  const buy = (p: Product) => p.pkg ? pay(p.id, { pkg: p.pkg }) : (addToCart(p), undefined);
  useEffect(() => {
    if (/checkout=success/.test(window.location.search)) { localStorage.removeItem('ie-live-cart'); setCartTick((n) => n + 1); setNotice('Payment complete. Thank you!'); }
  }, []);

  const [shareOn, setShareOn] = useState(false);
  const stopShare = () => { setShareOn(false); setScreenStream(null); setSharing(false); };
  const onShareStream = (s: MediaStream) => {
    setScreenStream(s); setSharing(true);
    setTimeout(() => { if (screenRef.current) screenRef.current.srcObject = s; }, 0);
  };
  const toggleShare = async () => {
    if (sharing || shareOn) { if (!token) screenStream?.getTracks().forEach((t) => t.stop()); stopShare(); return; }
    if (presenting) present(null);
    if (token) { setShareOn(true); return; } // LiveKit asks for the screen and sends it to everyone
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 }, audio: true });
      onShareStream(s);
      s.getVideoTracks()[0].onended = stopShare;
    } catch { /* cancelled */ }
  };
  const presentMine = useRef(false);
  const present = (p: typeof presenting, share = true) => { setPresenting(p); presentMine.current = !!p; if (share) broadcast({ t: 'present', p }); };
  // Re-send what I'm presenting so people who join later see it too.
  useEffect(() => { if (presentMine.current && presenting) broadcast({ t: 'present', p: presenting }); }, [peerCount, token]); // eslint-disable-line
  const onFiles = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setPresentOpen(false);
    if (sharing) toggleShare();
    // Files are uploaded so everyone in the call can open the same copy.
    setNotice(`Uploading ${f.name}...`);
    const path = `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from('live-shares').upload(path, f, { contentType: f.type || undefined });
    if (error) { setNotice('Could not upload the file. Please try again.'); return; }
    const { data } = await supabase.storage.from('live-shares').createSignedUrl(path, 60 * 60 * 24 * 7);
    const url = data?.signedUrl;
    if (!url) { setNotice('Could not share the file. Please try again.'); return; }
    setNotice('');
    const lower = f.name.toLowerCase();
    if (f.type.startsWith('image/')) present({ name: f.name, url, kind: 'image' });
    else if (f.type.startsWith('video/')) present({ name: f.name, url, kind: 'video' });
    else if (f.type === 'application/pdf' || lower.endsWith('.pdf')) present({ name: f.name, url, kind: 'pdf' });
    else if (/\.(pptx?|docx?|xlsx?)$/.test(lower)) present({ name: f.name, url: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`, kind: 'link' });
    else present({ name: f.name, url, kind: 'link' });
  };
  const toggleRec = async () => {
    if (recRef.current) { if (recRef.current.state !== 'inactive') recRef.current.stop(); return; }
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) { setNotice('Recording is not supported in this browser. Use Chrome or Edge on a computer.'); return; }
    let screen: MediaStream;
    try {
      screen = await (navigator.mediaDevices as any).getDisplayMedia({ video: { frameRate: 30 }, audio: true, preferCurrentTab: true, selfBrowserSurface: 'include', systemAudio: 'include' });
    } catch { setNotice('Recording cancelled'); return; }
    let mic: MediaStream | null = null;
    try { mic = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { /* no mic */ }
    // Mix tab/system audio and the host microphone into one track so everything is heard.
    let ac: AudioContext | null = null;
    const audioTracks: MediaStreamTrack[] = [];
    try {
      ac = new AudioContext();
      const dest = ac.createMediaStreamDestination();
      let any = false;
      [screen, mic].forEach((s) => { if (s && s.getAudioTracks().length) { ac!.createMediaStreamSource(new MediaStream(s.getAudioTracks())).connect(dest); any = true; } });
      if (any) audioTracks.push(...dest.stream.getAudioTracks());
    } catch { audioTracks.push(...screen.getAudioTracks(), ...(mic?.getAudioTracks() || []).slice(0, 1)); }
    const stream = new MediaStream([...screen.getVideoTracks(), ...audioTracks]);
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find((m) => MediaRecorder.isTypeSupported(m)) || '';
    let mr: MediaRecorder;
    try { mr = mime ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 }) : new MediaRecorder(stream); }
    catch { screen.getTracks().forEach((t) => t.stop()); mic?.getTracks().forEach((t) => t.stop()); setNotice('Could not start recording'); return; }
    const chunks: Blob[] = [];
    mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    mr.onstop = () => {
      screen.getTracks().forEach((t) => t.stop()); mic?.getTracks().forEach((t) => t.stop()); ac?.close().catch(() => {});
      const type = mr.mimeType || mime || 'video/webm';
      const ext = type.includes('mp4') ? 'mp4' : 'webm';
      if (chunks.length) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(chunks, { type }));
        a.download = `Startup-Factory-${name}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.${ext}`;
        document.body.appendChild(a); a.click(); a.remove();
        setNotice('Recording saved to your downloads');
      }
      recRef.current = null; setRec(false);
    };
    screen.getVideoTracks()[0]?.addEventListener('ended', () => { if (mr.state !== 'inactive') mr.stop(); });
    mr.start(1000); recRef.current = mr; setRec(true); setRecSecs(0);
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
  const checkout = () => { if (cartItems.length) pay('cart', { items: cartItems }); };

  if (kicked) {
    return (
      <div className="w-full h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-[2rem] p-10 max-w-sm w-full text-center">
          <p className="text-white font-medium">You were removed from this call by the host</p>
          {knockState === 'waiting'
            ? <p className="mt-6 text-sm text-zinc-300">Request sent. Waiting for the host to let you in…</p>
            : <>
                {knockState === 'denied' && <p className="mt-4 text-sm text-zinc-400">The host declined your request.</p>}
                <button onClick={askToJoin} className="mt-6 px-5 py-2 rounded-full bg-white text-zinc-900 text-sm">Ask to join again</button>
              </>}
        </div>
      </div>
    );
  }
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
      <div className="h-14 bg-white flex items-center gap-4 pl-2 pr-5 font-mono text-[13px] text-zinc-800 border-b border-zinc-200">
        <img src={sfhLogo} alt="Startup Factory Hub" className="h-[52px] w-24 object-contain" />
        <span className="w-px h-4 bg-zinc-200" />
        <span className="flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" />{fmtTime(seconds)}</span>
        <span className="w-px h-4 bg-zinc-200" />
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{rules.hideCount ? 'hidden' : `${totalPeers} in call`}</span>
        <div className="ml-auto flex items-center gap-2">
          {!isHost && canClaimHost && <button onClick={claimHost} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-amber-300 text-amber-700"><Crown className="w-3.5 h-3.5" />Claim host</button>}
          {isHost && <button onClick={toggleRec} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border ${rec ? 'border-red-300 text-red-600' : 'border-zinc-200'}`}><Circle className={`w-3.5 h-3.5 ${rec ? 'fill-red-500 text-red-500 animate-pulse' : ''}`} />{rec ? `REC ${fmtTime(recSecs)}` : 'REC OFF'}</button>}
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
      {notice && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-white text-zinc-900 text-sm shadow-2xl">{notice}</div>}
      {isHost && knocks.length > 0 && (
        <div className="absolute top-16 right-4 z-50 w-72 space-y-2">
          {knocks.map((k) => (
            <div key={k.id} className="rounded-2xl bg-white text-zinc-900 shadow-2xl p-3">
              <p className="text-sm font-medium">{k.name} asks to join again</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => answerKnock(k.id, true)} className="flex-1 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-xs">Let in</button>
                <button onClick={() => answerKnock(k.id, false)} className="flex-1 px-3 py-1.5 rounded-full border border-zinc-300 text-xs">Deny</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {drop && stageOffer && (
        <div className="absolute top-3 right-3 z-20 w-[calc(100%-1.5rem)] max-w-md bg-white rounded-2xl p-3 flex items-center gap-3 shadow-2xl">
          <Thumb p={drop} className="w-14 h-14 rounded-xl shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-600"><Radio className="w-3 h-3" />LIVE DROP</span>
            <span className="block text-[15px] text-zinc-900 truncate">{drop.name}</span>
            <span className="block font-mono text-xs text-zinc-500">{priceLabel(drop)}</span>
          </span>
          <button disabled={paying === drop.id} onClick={() => buy(drop)} className="px-3.5 py-2 rounded-full bg-zinc-900 text-white text-sm disabled:opacity-60">{drop.pkg ? (paying === drop.id ? 'Opening…' : 'Subscribe') : 'Add to cart'}</button>
          <button aria-label="Hide offer" onClick={() => setStageOffer(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center"><X className="w-4 h-4 text-zinc-700" /></button>
        </div>
      )}
      <div className="h-full p-3">
        {(() => {
          const hero = (sharing || presenting) ? (
            <div className="relative w-full h-full">
              {sharing ? <video ref={screenRef} autoPlay muted playsInline className="w-full h-full object-contain" />
                : presenting && (presenting.kind === 'image'
                  ? <img src={presenting.url} alt={presenting.name} className="w-full h-full object-contain" />
                  : presenting.kind === 'video' ? <video src={presenting.url} controls autoPlay className="w-full h-full object-contain" />
                  : presenting.kind === 'pdf' ? <object data={presenting.url} type="application/pdf" className="w-full h-full bg-white"><a href={presenting.url} target="_blank" rel="noreferrer" className="block p-6 text-white underline">Open {presenting.name}</a></object>
                  : <iframe title="presentation" src={presenting.url.includes('docs.google.com') ? presenting.url.replace(/\/edit.*$/, '/preview') : presenting.url} className="w-full h-full bg-white" />)}
              <button aria-label="Stop presenting" onClick={() => { if (sharing) toggleShare(); else present(null); }} className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
          ) : null;
          if (token) return <LiveStage isHost={isHost} hostId={hostId} pinned={pinned} onPin={onPin} autoFollow={rules.autoFollow} audience={audience} allowed={allowed} onMod={onMod} hero={hero} localAvatar={profile?.avatar_url} />;
          return (
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-800 to-zinc-900 border border-white/[0.06]">
              {hero || (cam ? <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
                : <div className="absolute inset-0 flex items-center justify-center">
                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover" />
                      : <span className="w-20 h-20 rounded-full bg-white/10 text-zinc-200 text-2xl flex items-center justify-center">{initials(displayName)}</span>}
                  </div>)}
              {!hero && <span className="absolute left-3 bottom-3 font-mono text-xs text-white flex items-center gap-1.5">{displayName} (You){isHost && <Crown className="w-3.5 h-3.5 text-amber-400" />}</span>}
            </div>
          );
        })()}
      </div>
      </div>

      {catalog.length > 0 && (
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          {catalog.map((p) => (
            <button key={p.id} onClick={() => buy(p)} className="shrink-0 flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-white font-mono text-xs text-zinc-800 hover:bg-zinc-100">
              <Thumb p={p} className="w-8 h-8 rounded-full" />{p.name} • {priceLabel(p)}<Plus className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      <div className="relative mx-4 mb-4 flex justify-center">
        {bgOpen && <BackgroundPicker choice={bg} onChoose={setBg} onClose={() => setBgOpen(false)} />}
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
            { on: mic, icon: mic ? Mic : MicOff, fn: () => canSpeak ? setMic((v) => !v) : setNotice('Raise your hand. The host can invite you to speak.'), label: canSpeak ? 'Microphone' : 'Microphone (host invite needed)', danger: true },
            { on: cam, icon: cam ? Video : VideoOff, fn: () => canSpeak ? setCam((v) => !v) : setNotice('Raise your hand. The host can invite you to speak.'), label: canSpeak ? 'Camera' : 'Camera (host invite needed)', danger: true },
            { on: bgOpen || bg.kind !== 'none', icon: Sparkles, fn: () => { setBgOpen((v) => !v); setPresentOpen(false); }, label: 'Background' },
            { on: sharing, icon: MonitorUp, fn: toggleShare, label: 'Share screen' },
            { on: presentOpen || !!presenting, icon: Presentation, fn: () => setPresentOpen((v) => !v), label: 'Present' },
            { on: hand, icon: Hand, fn: () => { const up = !hand; setHand(up); broadcast({ t: 'hand', id, name: displayName, up }); }, label: 'Raise hand' },
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
              <button disabled={paying === drop.id} onClick={() => buy(drop)} className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-white text-zinc-900 font-mono text-sm disabled:opacity-60"><ShoppingBag className="w-4 h-4" />{drop.pkg ? (paying === drop.id ? 'Opening checkout…' : 'Subscribe now') : 'Add to Cart'}</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-zinc-300 p-4 font-mono text-xs text-zinc-500">No live drop yet. {canSell ? 'Use "Push to All" on a product.' : 'The host will push products here.'}</div>
      )}

      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-[0.2em] text-zinc-500">CATALOG</p>
        {canSell && !adding && <span className="flex gap-3">
          <button onClick={() => setShowPkgs((v) => !v)} className="flex items-center gap-1 font-mono text-xs text-zinc-900 underline"><Crown className="w-3 h-3" />{showPkgs ? 'Hide packages' : 'Startup Factory packages'}</button>
          <button onClick={() => setAdding(true)} className="flex items-center gap-1 font-mono text-xs text-zinc-900 underline"><Plus className="w-3 h-3" />Add product</button>
        </span>}
      </div>

      {canSell && showPkgs && (() => {
        const k = SFH_PACKAGES.find((x) => x.id === pkgPick) || SFH_PACKAGES[0];
        const inCat = catalog.some((x) => x.id === `pkg-${k.id}`);
        return (
          <div className="rounded-2xl border border-zinc-200 overflow-hidden">
            <select value={k.id} onChange={(e) => setPkgPick(e.target.value)} className="w-full text-sm px-3 py-2 border-b border-zinc-200 bg-white text-zinc-900">
              {SFH_PACKAGES.map((x) => <option key={x.id} value={x.id}>{catalog.some((c) => c.id === `pkg-${x.id}`) ? '(added) ' : ''}{x.name} — ${x.price.toLocaleString()}/{x.interval === 'year' ? 'yr' : 'mo'}</option>)}
            </select>
            <div className="relative h-32">
              <img src={k.image} alt={k.name} className="w-full h-full object-cover" />
              <span className="absolute left-2 top-2 font-mono text-[9px] px-2 py-0.5 rounded-full bg-black/60 text-white">{k.tag}</span>
            </div>
            <div className="p-3">
              <p className="text-[14px] text-zinc-900">{k.name}</p>
              <p className="font-mono text-[11px] text-zinc-500">${k.price.toLocaleString()}/{k.interval === 'year' ? 'yr' : 'mo'}</p>
              <ul className="mt-1 text-[11px] text-zinc-500">{k.perks.map((x) => <li key={x}>{x}</li>)}</ul>
              <div className="mt-2 flex gap-2">
                <button onClick={() => addPackage(k)} disabled={inCat} className="flex-1 py-1.5 rounded-full border border-zinc-200 text-xs text-zinc-800 disabled:opacity-50">{inCat ? 'In catalog' : 'Add to catalog'}</button>
                <button onClick={() => addPackage(k, true)} className="flex-1 py-1.5 rounded-full bg-zinc-900 text-white text-xs">Drop live now</button>
              </div>
            </div>
          </div>
        );
      })()}
      <div className="hidden">
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
            <p className="font-mono text-xs text-zinc-500 mt-1">{priceLabel(p)}{p.tag && ` • ${p.tag}`}</p>
            {p.perks && <ul className="mt-1 text-[11px] text-zinc-500 space-y-0.5">{p.perks.map((x) => <li key={x}>{x}</li>)}</ul>}
            <div className="mt-2 flex gap-2">
              <button disabled={paying === p.id} onClick={() => buy(p)} className="px-4 py-1.5 rounded-full bg-zinc-900 text-white text-sm disabled:opacity-60">{p.pkg ? (paying === p.id ? 'Opening…' : 'Subscribe') : 'Add'}</button>
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
      <LocalPublisher cam={cam} mic={mic} />
      <ScreenPublisher on={shareOn} onStream={onShareStream} onEnd={stopShare} onFail={setNotice} />
              <Toggle on={rules.approval} onClick={() => setRules((r) => ({ ...r, approval: !r.approval }))} title="Require approval to join" sub="Host approves lobby" />
              <Toggle on={rules.muteEntry} onClick={() => setRules((r) => ({ ...r, muteEntry: !r.muteEntry }))} title="Mute on entry" sub="New people start muted" />
              <Toggle on={rules.hideCount} onClick={() => setRules((r) => ({ ...r, hideCount: !r.hideCount }))} title="Hide participant count" sub="Privacy for large rooms" />
              <Toggle on={rules.hostProducts} onClick={() => setRules((r) => ({ ...r, hostProducts: !r.hostProducts }))} title="Only host can share products" sub="Commerce control" />
              <Toggle on={rules.audience} onClick={() => setRules((r) => ({ ...r, audience: !r.audience }))} title="Audience mode" sub="Guests watch only until you invite them to speak" />
              <Toggle on={rules.autoFollow} onClick={() => setRules((r) => ({ ...r, autoFollow: !r.autoFollow }))} title="Auto-follow speaker" sub="Pins whoever is talking for everyone" />
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
      <BackgroundApplier choice={bg} cam={cam} />
      <PeerCount onCount={setPeerCount} />
      {body}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

// Guests without an account check in with name, email and startup/investor before joining.
export default function LiveVideoRoom(props: LiveVideoRoomProps) {
  const { user, loading } = useAuth();
  const [checkin, setCheckin] = useState<Checkin | null>(readCheckin);
  const name = props.roomName || props.room || 'live-commerce-room';
  const nameKey = user ? `sfh-live-name:${user.id}` : '';
  const [chosen, setChosen] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  useEffect(() => {
    if (!user) return;
    let saved: string | null = null;
    try { saved = localStorage.getItem(nameKey); } catch { /* ignore */ }
    setDraft(saved || (user.user_metadata as any)?.full_name || user.email?.split('@')[0] || '');
  }, [user, nameKey]);
  if (loading) return <div className="w-full h-screen bg-zinc-950" />;
  if (!user && !checkin) return <GuestCheckIn room={name} onDone={setCheckin} />;
  if (user && !chosen) {
    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      const v = draft.trim().slice(0, 60);
      if (!v) return;
      try { localStorage.setItem(nameKey, v); } catch { /* ignore */ }
      setChosen(v);
    };
    return (
      <div className="w-full h-screen bg-zinc-950 flex items-center justify-center p-4">
        <form onSubmit={submit} className="tech-card border-0 w-full max-w-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Choose your display name</h2>
          <p className="text-sm text-muted-foreground">This is how others will see you in the call.</p>
          <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={60}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            placeholder="Your name" />
          <button type="submit" disabled={!draft.trim()}
            className="w-full rounded-md bg-primary text-primary-foreground py-2 font-medium disabled:opacity-50">Join call</button>
        </form>
      </div>
    );
  }
  return <LiveVideoRoomInner {...props} guest={user ? null : checkin} chosenName={chosen} />;
}
