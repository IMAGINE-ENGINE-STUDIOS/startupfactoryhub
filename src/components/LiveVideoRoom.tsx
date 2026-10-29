import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, VideoTrack, useTracks, useConnectionState, useDataChannel, useLocalParticipant } from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import {
  Users, Timer, Crown, Mic, MicOff, Video, VideoOff, Hand, X, Plus, MonitorUp, Presentation,
  Heart, Flame, ThumbsUp, PhoneOff, Upload, Sliders, DollarSign, ShoppingBag, Copy, Check,
  MessageSquare, Radio, Circle, Trash2, ImagePlus, Link2, Sparkles, Captions,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { durableGetSync, durableSet } from '@/lib/durableStore';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ShoppingBag as ShopIcon, FileText, MoreHorizontal, PanelRightClose, PanelRightOpen, ChevronDown, BookOpen, PenLine, ExternalLink, Loader2 } from 'lucide-react';
import { LiveChat, LocalChat } from './LiveChatPanel';
import LiveStage from './live/LiveStage';
import sfhLogo from '@/assets/sfh-logo-emblem.png';
import { SFH_PACKAGES } from './live/sfhPackages';
import { BackgroundApplier, BackgroundPicker, readBgChoice, type BgChoice } from './live/BackgroundEffects';
import { TranscriptPanel, useSpeechTranscriber, saveLiveLog, type TxLine } from './live/Transcript';
import GuestCheckIn, { readCheckin, type Checkin } from './live/GuestCheckIn';

interface LiveVideoRoomProps { roomName?: string; room?: string; identity?: string; onLeave?: () => void }

type Product = { id: string; name: string; price: number; tag: string; image: string; pkg?: string; interval?: 'month' | 'year'; perks?: string[]; brochure?: string };
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
    // The CEO account always hosts the main conference room, whatever the link says.
    if (name === 'main' && user?.id && user.email?.toLowerCase() === 'ceo@imagineengine.space' && h !== user.id) h = null;
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
  const [mintNonce, setMintNonce] = useState(0);
  const leftRef = useRef(false);
  const hadConnectedRef = useRef(false);
  const rejoinLogRef = useRef<number[]>([]);
  const [serverUrl, setServerUrl] = useState('');
  const [connError, setConnError] = useState('');
  const [left, setLeft] = useState(false);
  const [recEmail, setRecEmail] = useState('');
  const [recState, setRecState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [recDismissed, setRecDismissed] = useState(false);
  useEffect(() => { if (user?.email) setRecEmail((e) => e || (user.email as string)); }, [user?.email]);

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
  const [presenting, setPresenting] = useState<{ name: string; url: string; kind: 'image' | 'video' | 'pdf' | 'link'; brochure?: boolean } | null>(null);
  // Brochure presentation sync. The presenter's page is the shared page:
  // their flips broadcast to the room and followers in sync flip with them.
  // A follower who flips away browses privately — it never touches anyone
  // else's screen — and the presenter's next move pops a small pill that
  // offers to restore following.
  const heroFrameRef = useRef<HTMLIFrameElement | null>(null);
  const presenterPageRef = useRef(0);
  const followingRef = useRef(true);
  const [presenterPage, setPresenterPage] = useState(0);
  const [myBrochurePage, setMyBrochurePage] = useState(0);
  const [following, setFollowing] = useState(true);
  const [pillDismissedFor, setPillDismissedFor] = useState(-1);
  const setFollow = (v: boolean) => { followingRef.current = v; setFollowing(v); };
  const resetBrochureSync = () => { presenterPageRef.current = 0; setPresenterPage(0); setMyBrochurePage(0); setFollow(true); setPillDismissedFor(-1); };
  const gotoBrochurePage = (page: number) => { try { heroFrameRef.current?.contentWindow?.postMessage({ t: 'sfh-brochure-goto', page }, window.location.origin); } catch { /* frame gone */ } };
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [tab, setTab] = useState<'shop' | 'chat' | 'text' | 'journal' | 'money' | 'rules'>('chat');
  const mobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [sideHidden, setSideHidden] = useState(false);
  const openSheet = (k: 'shop' | 'chat' | 'text') => { setTab(k); setSheetOpen(true); };
  const [txOn, setTxOn] = useState(true);
  const [txLines, setTxLines] = useState<TxLine[]>([]);
  const [txPartial, setTxPartial] = useState('');
  const [hostAsk, setHostAsk] = useState<'unmute' | 'camon' | null>(null);
  const [chatCount, setChatCount] = useState(0);
  const [seenCount, setSeenCount] = useState(0);
  useEffect(() => { if (tab === 'chat') setSeenCount(chatCount); }, [tab, chatCount]);
  const unread = Math.max(0, chatCount - seenCount);
  const [userLimit, setUserLimit] = useState(100);
  const [timeLimit, setTimeLimit] = useState(480);
  /* autoEnd defaults OFF (founder report 2026-10-26: "live video rooms
   * are restarting alone interrupting the meetings"). It used to
   * default ON with a 120-minute limit, so EVERY meeting silently
   * dumped each participant to the Rejoin screen at their own 2-hour
   * mark. A host can still set a limit deliberately in Room settings. */
  const [rules, setRules] = useState({ autoEnd: false, approval: false, muteEntry: true, hideCount: false, hostProducts: true, audience: false, autoFollow: false });
  const [showPkgs, setShowPkgs] = useState(false);
  const [paying, setPaying] = useState('');
  const [copied, setCopied] = useState(false);
  const [cartTick, setCartTick] = useState(0);

  // Shop
  const catalogKey = `ie-live-catalog:${name}`;
  const [catalog, setCatalog] = useState<Product[]>(() => { try { return JSON.parse(localStorage.getItem(catalogKey) || '[]'); } catch { return []; } });
  const [drop, setDrop] = useState<Product | null>(null);
  const [stageOffer, setStageOffer] = useState(true);
  // Brochures open as an overlay ON the live video screen — never a new window.
  const [brochureView, setBrochureView] = useState<{ url: string; name: string } | null>(null);
  const [flipCopied, setFlipCopied] = useState(false);
  const openBrochure = (url?: string, name?: string) => { if (!url) return; setFlipCopied(false); setBrochureView({ url, name: name || 'Brochure' }); };
  const copyFlipLink = async () => { if (!brochureView) return; try { await navigator.clipboard.writeText(absUrl(brochureView.url)); setFlipCopied(true); } catch { /* clipboard unavailable */ } };
  // Mini stickers along the bottom of the stage once a product is pushed:
  // the live drop first, then every catalog product that carries a brochure.
  const brochureStickers = useMemo(() => {
    const list: Product[] = [];
    if (drop?.brochure) list.push(drop);
    for (const p of catalog) if (p.brochure && !list.some((x) => x.id === p.id)) list.push(p);
    return list;
  }, [drop, catalog]);
  const [adding, setAdding] = useState(false);
  const [pkgPick, setPkgPick] = useState(SFH_PACKAGES[0].id);
  const [pkgOpen, setPkgOpen] = useState(false);
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
  }, [name, id, displayName, mintNonce]);

  /* Keep leftRef in step for the disconnect guard, and raise the
   * meeting shield while a token is live: the app's auto-repair must
   * never reload the page from under a meeting when a deploy lands
   * (see reloadForStaleBuild in lib/autoDebugger). */
  useEffect(() => { leftRef.current = left; }, [left]);
  useEffect(() => {
    const w = window as any;
    if (token) w.__sfhMeetingActive = true; else delete w.__sfhMeetingActive;
    return () => { delete w.__sfhMeetingActive; };
  }, [token]);

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
    if (m.t === 'present') { presentMine.current = false; setPresenting(m.p || null); resetBrochureSync(); }
    if (m.t === 'bpage' && typeof m.page === 'number') {
      const wasFollowing = followingRef.current;
      presenterPageRef.current = m.page;
      setPresenterPage(m.page);
      // Followers still in sync move with the presenter; anyone browsing on
      // their own keeps their page — the pill offers them the way back.
      if (wasFollowing && !presentMine.current) { setMyBrochurePage(m.page); gotoBrochurePage(m.page); }
    }
    if (m.t === 'react') { const r = REACTIONS.find((x) => x.k === m.k); if (r) showReaction(r); }
    if (m.t === 'room') { setSpotlight(m.spot ?? null); setRoomAudience(!!m.audience); setAllowed(Array.isArray(m.allowed) ? m.allowed : []); setBanned(Array.isArray(m.banned) ? m.banned : []); }
    if (m.t === 'hand' && m.up) setNotice(`${m.name || 'Someone'} raised their hand`);
    if (m.t === 'mod' && m.to === idRef.current) {
      if (m.a === 'kick') { beKickedRef.current(); return; }
      if (m.a === 'mute') { setMic(false); setNotice('The host muted your microphone'); }
      if (m.a === 'cam') { setCam(false); setNotice('The host turned your camera off'); }
      if (m.a === 'allow') setNotice('The host invited you to speak. Turn on your mic or camera.');
      if (m.a === 'revoke') setNotice('You were moved to the audience');
      if (m.a === 'unmute' || m.a === 'camon') setHostAsk(m.a);
    }
    if (m.t === 'tx' && m.line?.text) setTxLines((l) => l.some((x) => x.id === m.line.id) ? l : [...l, m.line].slice(-2000));
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
  const pkgProduct = (k: typeof SFH_PACKAGES[number]): Product => ({ id: `pkg-${k.id}`, pkg: k.id, name: k.name, price: k.price, interval: k.interval, tag: k.tag, perks: k.perks, brochure: k.brochure, image: absUrl(k.image) });
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
  const onMod = (to: string, a: 'mute' | 'cam' | 'unmute' | 'camon' | 'allow' | 'revoke' | 'kick') => {
    if (a === 'unmute' || a === 'camon') { setAllowed((l) => l.includes(to) ? l : [...l, to]); setNotice(a === 'unmute' ? 'Asked them to turn their mic on' : 'Asked them to turn their camera on'); }
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
  useSpeechTranscriber(txOn && mic && !!token, (text) => {
    const line: TxLine = { id: `${id}-${Date.now()}`, speaker: displayName, text, ts: Date.now() };
    setTxLines((l) => [...l, line].slice(-2000));
    broadcast({ t: 'tx', line });
    saveLiveLog(name, 'transcript', displayName, text, user?.id);
  }, setTxPartial);
  const toggleTx = () => { setTxOn((v) => { if (!v && !mic) setNotice('Transcript is on. Turn your mic on so your words are written.'); return !v; }); };
  // Journal: a session notepad. The draft and saved notes persist on this
  // device per room; "Save note to Genius" also drops the note into the
  // user's Genius bubble thread.
  const journalKey = `sfh-journal-${name}`;
  const [journal, setJournal] = useState<string>(() => { try { return localStorage.getItem(`${journalKey}-draft`) || ''; } catch { return ''; } });
  const [savedNotes, setSavedNotes] = useState<{ ts: number; text: string }[]>(() => { try { return JSON.parse(localStorage.getItem(`${journalKey}-saved`) || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem(`${journalKey}-draft`, journal); } catch { /* private mode */ } }, [journal, journalKey]);
  useEffect(() => { try { localStorage.setItem(`${journalKey}-saved`, JSON.stringify(savedNotes.slice(0, 50))); } catch { /* private mode */ } }, [savedNotes, journalKey]);
  // Append a message to the user's Genius bubble thread: written to the
  // durable thread store (cold start) and dispatched as an event the mounted
  // bubble adopts immediately. Deduped by exact content on both sides.
  const appendToGenius = (content: string) => {
    try {
      const KEY = 'sfh:genius:thread:v1';
      const cur = durableGetSync<{ role: string; content: string }[]>(KEY) || [];
      if (!cur.some((m) => m?.content === content)) durableSet(KEY, [...cur, { role: 'assistant', content }].slice(-80));
    } catch { /* the bubble also adopts via the event below */ }
    window.dispatchEvent(new CustomEvent('sfh:genius:append', { detail: { content } }));
    if (content.startsWith('📓') || content.startsWith('📋')) {
      try {
        const JKEY = 'sfh:genius:journal:v1';
        const entries = durableGetSync<{ ts: number; kind: string; content: string }[]>(JKEY) || [];
        if (!entries.some((e) => e?.content === content)) durableSet(JKEY, [{ ts: Date.now(), kind: content.startsWith('📓') ? 'note' : 'transcript', content }, ...entries].slice(0, 50));
      } catch { /* journal store is best-effort */ }
    }
  };
  const saveNoteToGenius = () => {
    const text = journal.trim(); if (!text) return;
    appendToGenius(`📓 Journal note — live session "${name}" • ${new Date().toLocaleString()}\n\n${text}`);
    setSavedNotes((n) => [{ ts: Date.now(), text }, ...n]);
    setJournal('');
    setNotice('Note saved to your Genius bubble');
  };
  // After the meeting: the full transcript lands in the user's Genius bubble,
  // so they can ask Genius anything about the call ("what did we decide?",
  // "what did Ana say about pricing?") and it answers from the transcript.
  const geniusTxRef = useRef(false);
  useEffect(() => {
    if (!left) { geniusTxRef.current = false; return; }
    if (geniusTxRef.current || txLines.length === 0) return;
    geniusTxRef.current = true;
    const clock = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const body = txLines.slice(-400).map((l) => `[${clock(l.ts)}] ${l.speaker}: ${l.text}`).join('\n');
    const note = txLines.length > 400 ? `\n\n(Showing the last 400 of ${txLines.length} lines — the full record is in your session download/email.)` : '';
    appendToGenius(`📋 Transcript — live session "${name}" • ${new Date().toLocaleString()} • ${txLines.length} lines\nAsk me anything about this meeting.\n\n${body}${note}`);
  }, [left]); // eslint-disable-line
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
  const present = (p: typeof presenting, share = true) => { setPresenting(p); presentMine.current = !!p; resetBrochureSync(); if (share) broadcast({ t: 'present', p }); };
  // Re-send what I'm presenting so people who join later see it too.
  useEffect(() => { if (presentMine.current && presenting) { broadcast({ t: 'present', p: presenting }); if (presenting.brochure) broadcast({ t: 'bpage', page: presenterPageRef.current }); } }, [peerCount, token]); // eslint-disable-line
  // Admin brochure feed for the Present panel: every brochure published from
  // the Brochure Studio, listed live from the studio-published bucket through
  // the admin list action — a brochure created in the studio appears here on
  // its own, no wiring per brochure.
  const [brochureList, setBrochureList] = useState<{ slug: string; title: string; path: string }[]>([]);
  const [brochureLoading, setBrochureLoading] = useState(false);
  const loadBrochures = useCallback(async () => {
    setBrochureLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('brochure-publish', { body: { action: 'list' } });
      if (error) throw error;
      const rows = (data?.brochures || []) as { slug: string }[];
      const list = await Promise.all(rows.map(async ({ slug }) => {
        const path = slug.startsWith('b-') ? `/b/${slug.slice(2)}` : `/${slug}`;
        let title = '';
        try {
          const r = await fetch(supabase.storage.from('studio-published').getPublicUrl(`brochures/${slug}.json`).data.publicUrl);
          if (r.ok) { const doc = await r.json(); if (doc && typeof doc.title === 'string') title = doc.title.trim(); }
        } catch { /* fall back to the slug */ }
        if (!title) title = (slug.startsWith('b-') ? slug.slice(2) : slug).replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        return { slug, title, path };
      }));
      setBrochureList(list);
    } catch {
      // List feed unavailable (function not redeployed yet): fall back to the
      // platform brochures wired into the live shop packages.
      const seen = new Set<string>();
      const fall: { slug: string; title: string; path: string }[] = [];
      for (const k of SFH_PACKAGES) { if (k.brochure && !seen.has(k.brochure)) { seen.add(k.brochure); fall.push({ slug: k.brochure.slice(1), title: k.name, path: k.brochure }); } }
      setBrochureList(fall);
    }
    setBrochureLoading(false);
  }, []);
  useEffect(() => {
    if (!presentOpen || !(isAdmin || isHost)) return;
    loadBrochures();
    const t = setInterval(loadBrochures, 20000);
    return () => clearInterval(t);
  }, [presentOpen, isAdmin, isHost, loadBrochures]);
  // Page reports from the presented brochure's iframe. The presenter's own
  // flips broadcast to the room; a follower's flips only move their own
  // follow state (in sync = their page matches the presenter's page).
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (!heroFrameRef.current || e.source !== heroFrameRef.current.contentWindow) return;
      const d = e.data as { t?: string; page?: number } | null;
      if (!d || d.t !== 'sfh-brochure-page' || typeof d.page !== 'number') return;
      setMyBrochurePage(d.page);
      if (presentMine.current) {
        if (presenterPageRef.current !== d.page) { presenterPageRef.current = d.page; setPresenterPage(d.page); broadcast({ t: 'bpage', page: d.page }); }
      } else {
        setFollow(d.page === presenterPageRef.current);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []); // eslint-disable-line
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
  const fmtClock = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const recordText = () => {
    const mins = Math.floor(seconds / 60); const dur = mins >= 60 ? `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m` : `${mins}m`;
    const head = ['Startup Factory Hub — live session record', `Room: ${name}`, `Date: ${new Date().toLocaleString()}`, `Duration: ${dur}`, `Transcript lines: ${txLines.length}`, ''];
    return [...head, ...txLines.map((l) => `[${fmtClock(l.ts)}] ${l.speaker}: ${l.text}`)].join('\n');
  };
  const emailRecord = async () => {
    const to = recEmail.trim(); if (!to || recState === 'sending') return;
    setRecState('sending');
    const lines = txLines.slice(0, 450).map((l) => `<b>${escHtml(l.speaker)}</b> <span style="color:#9ca3af">[${fmtClock(l.ts)}]</span> ${escHtml(l.text)}`).join('<br>');
    const more = txLines.length > 450 ? `<br><br>…and ${txLines.length - 450} more lines. The complete record is saved in Startup Factory Hub.` : '';
    const message = `Here is the full transcript record of your live session.<br><br><b>Room:</b> ${escHtml(name)}<br><b>Date:</b> ${escHtml(new Date().toLocaleString())}<br><b>Lines:</b> ${txLines.length}<br><br>${lines}${more}`;
    const { error } = await supabase.functions.invoke('send-notification-email', { body: { to, title: `Your live session record — ${name}`, message, type: 'session-record', recipientName: displayName } });
    setRecState(error ? 'error' : 'sent');
  };
  const downloadRecord = () => {
    const blob = new Blob([recordText()], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `session-record-${name}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  if (left) {
    return (
      <div className="w-full h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-[2rem] p-10 max-w-sm w-full text-center">
          <p className="text-white font-medium">You left the call</p>
          {txLines.length > 0 && !recDismissed && (
            <div className="mt-6 text-left rounded-2xl bg-white/[0.05] border border-white/[0.08] p-4">
              <p className="text-white text-sm font-medium">Your session record is ready</p>
              <p className="text-zinc-400 text-xs mt-1">{txLines.length} transcript lines from this call. Want it in your inbox?</p>
              {recState === 'sent' ? (
                <p className="mt-3 text-emerald-400 text-sm">Sent. Check your email.</p>
              ) : (
                <>
                  <input value={recEmail} onChange={(e) => setRecEmail(e.target.value)} placeholder="you@email.com" inputMode="email" className="mt-3 w-full text-sm px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-zinc-500 outline-none" />
                  {recState === 'error' && <p className="mt-2 text-xs text-red-400">Sending failed. Try again, or download the record instead.</p>}
                  <div className="mt-3 flex gap-2">
                    <button onClick={emailRecord} disabled={recState === 'sending' || !recEmail.trim()} className="flex-1 py-2 rounded-full bg-emerald-600 text-white text-sm disabled:opacity-50">{recState === 'sending' ? 'Sending…' : 'Email it to me'}</button>
                    <button onClick={downloadRecord} className="px-4 py-2 rounded-full border border-white/15 text-white text-sm">Download</button>
                  </div>
                  <button onClick={() => setRecDismissed(true)} className="mt-2 w-full text-center text-xs text-zinc-500 underline underline-offset-2">No thanks</button>
                </>
              )}
            </div>
          )}
          <button onClick={() => { setLeft(false); setSeconds(0); if (!kicked) { setToken(''); setMintNonce((n) => n + 1); } }} className="mt-6 px-5 py-2 rounded-full bg-white text-zinc-900 text-sm">Rejoin</button>
        </div>
      </div>
    );
  }

  const tileBase = 'relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-800 to-zinc-900 border border-white/[0.06]';

  const stage = (
    <div className={`flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-zinc-950 ${mobile ? '' : 'rounded-2xl border border-zinc-200'}`}
      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
      <div className={`bg-white flex items-center font-mono text-zinc-800 border-b border-zinc-200 shrink-0 ${mobile ? 'h-11 gap-2 pl-1 pr-2 text-[11px] pt-[env(safe-area-inset-top)]' : 'h-14 gap-4 pl-2 pr-5 text-[13px]'}`}>
        <img src={sfhLogo} alt="Startup Factory Hub" className={mobile ? 'h-10 w-14 object-contain' : 'h-[52px] w-24 object-contain'} />
        <span className="w-px h-4 bg-zinc-200" />
        <span className="flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" />{fmtTime(seconds)}</span>
        <span className="w-px h-4 bg-zinc-200" />
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{rules.hideCount ? 'hidden' : mobile ? totalPeers : `${totalPeers} in call`}</span>
        <div className="ml-auto flex items-center gap-2">
          {!isHost && canClaimHost && !mobile && <button onClick={claimHost} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-amber-300 text-amber-700"><Crown className="w-3.5 h-3.5" />Claim host</button>}
          {isHost && <button onClick={toggleRec} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border ${rec ? 'border-red-300 text-red-600' : 'border-zinc-200'}`}><Circle className={`w-3.5 h-3.5 ${rec ? 'fill-red-500 text-red-500 animate-pulse' : ''}`} />{rec ? `REC ${fmtTime(recSecs)}` : 'REC OFF'}</button>}
          {mobile && <span className="text-[10px] px-2 py-1 rounded-full bg-zinc-100 text-zinc-700">{isHost ? 'HOST' : 'GUEST'}</span>}
          {!mobile && !sideHidden && <button aria-label="Hide side menu" title="Hide side menu" onClick={() => setSideHidden(true)} className="lg:hidden w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center"><PanelRightClose className="w-4 h-4" /></button>}
          {!mobile && sideHidden && <button aria-label="Show side menu" title="Show side menu" onClick={() => setSideHidden(false)} className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center"><PanelRightOpen className="w-4 h-4" /></button>}
          <span className={`flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 ${mobile ? 'px-2 py-1' : 'px-4 py-1.5'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${token ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
            {mobile ? null : token ? <ConnBadge /> : <span className="font-mono text-[11px] text-zinc-500" title={connError}>{connError ? 'Offline' : 'Connecting'}</span>}
          </span>
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
        {floats.map((f) => <span key={f.key} className="absolute bottom-4 animate-[ie-float_2.6s_ease-out_forwards]" style={{ right: `${f.x}%` }}><f.icon className={`w-10 h-10 fill-current ${f.c}`} /></span>)}
      </div>
      <style>{`@keyframes ie-float{0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:1;transform:translateY(-40px) scale(1.1)}100%{transform:translateY(-420px) scale(1);opacity:0}}`}</style>
      {hostAsk && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] max-w-xs rounded-2xl bg-white text-zinc-900 shadow-2xl p-3">
          <p className="text-sm font-medium">The host asks you to turn your {hostAsk === 'unmute' ? 'microphone' : 'camera'} on</p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => { if (hostAsk === 'unmute') setMic(true); else setCam(true); setHostAsk(null); }} className="flex-1 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-xs">Turn on</button>
            <button onClick={() => setHostAsk(null)} className="flex-1 px-3 py-1.5 rounded-full border border-zinc-300 text-xs">Not now</button>
          </div>
        </div>
      )}
      {txOn && (txPartial || txLines.length > 0) && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-[92%] sm:max-w-[80%] px-4 py-2 rounded-xl bg-black/75 text-white text-sm text-center">
          {txLines.slice(-2).map((l) => <p key={l.id}><span className="text-zinc-400">{l.speaker}:</span> {l.text}</p>)}
          {txPartial && <p className="text-zinc-300">{txPartial}</p>}
        </div>
      )}
      {notice && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[92%] text-center px-4 py-2 rounded-full bg-white text-zinc-900 text-sm shadow-2xl">{notice}</div>}
      {isHost && knocks.length > 0 && (
        <div className="absolute top-3 right-2 sm:right-4 z-50 w-[calc(100%-1rem)] max-w-xs space-y-2">
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
          {drop.brochure && <button onClick={() => openBrochure(drop.brochure, drop.name)} className="px-3.5 py-2 rounded-full border border-emerald-600/40 bg-emerald-50 text-emerald-700 text-sm flex items-center gap-1.5 shrink-0"><BookOpen className="w-3.5 h-3.5" />Brochure</button>}
          <button aria-label="Hide offer" onClick={() => setStageOffer(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center"><X className="w-4 h-4 text-zinc-700" /></button>
        </div>
      )}
      {drop && !brochureView && brochureStickers.length > 0 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-end gap-2 max-w-[94%] overflow-x-auto px-1 py-0.5">
          {brochureStickers.map((p) => (
            <button key={p.id} onClick={() => openBrochure(p.brochure, p.name)} title={`${p.name} — view the brochure`} className="group flex flex-col items-center gap-1 shrink-0">
              <span className="relative block w-11 h-11 rounded-full ring-2 ring-white/80 shadow-xl overflow-hidden transition-transform group-hover:scale-110">
                <Thumb p={p} className="w-full h-full" />
                <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white flex items-center justify-center py-px"><BookOpen className="w-2.5 h-2.5" /></span>
              </span>
              <span className="max-w-[64px] truncate text-[9px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{p.name}</span>
            </button>
          ))}
        </div>
      )}
      {brochureView && (
        <div className="absolute inset-0 z-40 flex flex-col bg-zinc-950/95 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-3 py-2 shrink-0">
            <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1 min-w-0 truncate text-sm font-medium text-white">{brochureView.name} — brochure</span>
            <a href={absUrl(brochureView.url)} target="_blank" rel="noreferrer" title="Open in new tab" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs shrink-0"><ExternalLink className="w-3.5 h-3.5" />New tab</a>
            <button onClick={copyFlipLink} title="Copy the flipbook link" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs shrink-0">{flipCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}{flipCopied ? 'Link copied' : 'Flip link'}</button>
            <button aria-label="Close brochure" onClick={() => setBrochureView(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
          </div>
          <iframe title={`${brochureView.name} brochure`} src={brochureView.url} className="flex-1 w-full min-h-0 bg-white" />
        </div>
      )}
      {presenting?.brochure && !presentMine.current && !following && pillDismissedFor !== presenterPage && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-zinc-900/95 border border-white/15 shadow-2xl text-white max-w-[94%]">
          <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-xs truncate">You're browsing on your own — the presenter is on page {presenterPage + 1}</span>
          <button onClick={() => { setFollow(true); setMyBrochurePage(presenterPage); gotoBrochurePage(presenterPage); }} className="px-3 py-1 rounded-full bg-white text-zinc-900 text-xs shrink-0">Follow presenter</button>
          <button onClick={() => setPillDismissedFor(presenterPage)} className="px-2 py-1 text-xs text-zinc-300 shrink-0">Stay</button>
        </div>
      )}
      <div className={`h-full ${mobile ? 'p-1.5' : 'p-3'}`}>
        {(() => {
          const hero = (sharing || presenting) ? (
            <div className="relative w-full h-full">
              {sharing ? <video ref={screenRef} autoPlay muted playsInline className="w-full h-full object-contain" />
                : presenting && (presenting.kind === 'image'
                  ? <img src={presenting.url} alt={presenting.name} className="w-full h-full object-contain" />
                  : presenting.kind === 'video' ? <video src={presenting.url} controls autoPlay className="w-full h-full object-contain" />
                  : presenting.kind === 'pdf' ? <object data={presenting.url} type="application/pdf" className="w-full h-full bg-white"><a href={presenting.url} target="_blank" rel="noreferrer" className="block p-6 text-white underline">Open {presenting.name}</a></object>
                  : <iframe ref={heroFrameRef} onLoad={() => { try { heroFrameRef.current?.contentWindow?.postMessage({ t: 'sfh-brochure-hello' }, window.location.origin); } catch { /* ignore */ } }} title="presentation" src={presenting.url.includes('docs.google.com') ? presenting.url.replace(/\/edit.*$/, '/preview') : presenting.url} className="w-full h-full bg-white" />)}
              <button aria-label="Stop presenting" onClick={() => { if (sharing) toggleShare(); else present(null); }} className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
          ) : null;
          if (token) return <LiveStage isHost={isHost} hostId={hostId} pinned={pinned} onPin={onPin} autoFollow={rules.autoFollow} audience={audience} allowed={allowed} onMod={onMod} hero={hero} localAvatar={profile?.avatar_url} mobile={mobile} />;
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
        <div className={`flex gap-2 overflow-x-auto shrink-0 ${mobile ? 'px-2 pb-2' : 'px-4 pb-3'}`}>
          {catalog.map((p) => (
            <button key={p.id} onClick={() => buy(p)} className="shrink-0 flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-white font-mono text-xs text-zinc-800 hover:bg-zinc-100">
              <Thumb p={p} className="w-8 h-8 rounded-full" />{p.name} • {priceLabel(p)}<Plus className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      <div className={`relative flex justify-center shrink-0 ${mobile ? 'mx-1 mb-1 pb-[env(safe-area-inset-bottom)]' : 'mx-4 mb-4'}`}>
        {bgOpen && <BackgroundPicker choice={bg} onChoose={setBg} onClose={() => setBgOpen(false)} />}
        {presentOpen && (
          <div className="absolute bottom-14 z-30 w-[calc(100vw-1rem)] max-w-[360px] rounded-2xl bg-zinc-900 border border-white/10 p-3 space-y-2 shadow-2xl">
            <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/10">
              <Link2 className="w-4 h-4 text-zinc-500 shrink-0" />
              <input autoFocus value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && openLink()} placeholder="Paste a Google Drive / Slides link"
                className="flex-1 min-w-0 bg-transparent font-mono text-sm text-zinc-200 placeholder:text-zinc-500 outline-none" />
              <button onClick={openLink} className="px-3 py-1 rounded-full bg-white text-zinc-900 text-xs">Open</button>
            </div>
            <button onClick={() => fileInput.current?.click()} className="w-full flex items-center justify-center gap-2 py-2 rounded-full border border-white/10 text-zinc-200 text-sm"><Upload className="w-4 h-4" />Upload a file (or drop it on the call)</button>
            {(isAdmin || isHost) && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 px-1 font-mono text-[10px] tracking-wider text-zinc-400"><BookOpen className="w-3.5 h-3.5 text-emerald-400" />BROCHURES — SHARE TO THE SCREEN{brochureLoading && <Loader2 className="w-3 h-3 animate-spin" />}</p>
                {brochureList.length === 0 && !brochureLoading && <p className="px-1 text-xs text-zinc-500">No published brochures yet — create one in the Brochure Studio and it shows up here automatically.</p>}
                {brochureList.length > 0 && (
                  <div className="max-h-44 overflow-y-auto space-y-1">
                    {brochureList.map((b) => (
                      <button key={b.slug} onClick={() => { present({ name: b.title, url: b.path, kind: 'link', brochure: true }); setPresentOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-left hover:bg-white/5">
                        <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="flex-1 min-w-0"><span className="block truncate text-sm text-zinc-100">{b.title}</span><span className="block font-mono text-[10px] text-zinc-500">{b.path}</span></span>
                        <span className="px-2.5 py-1 rounded-full bg-white text-zinc-900 text-[11px] shrink-0">Share</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div className={`flex items-center gap-1.5 px-2 py-1.5 bg-zinc-900 border border-white/10 ${mobile ? 'w-full rounded-2xl justify-between' : 'rounded-full'}`}>
          {(() => { const all = [
            { on: mic, icon: mic ? Mic : MicOff, fn: () => canSpeak ? setMic((v) => !v) : setNotice('Raise your hand. The host can invite you to speak.'), label: canSpeak ? 'Microphone' : 'Microphone (host invite needed)', danger: true },
            { on: cam, icon: cam ? Video : VideoOff, fn: () => canSpeak ? setCam((v) => !v) : setNotice('Raise your hand. The host can invite you to speak.'), label: canSpeak ? 'Camera' : 'Camera (host invite needed)', danger: true },
            { on: bgOpen || bg.kind !== 'none', icon: Sparkles, fn: () => { setBgOpen((v) => !v); setPresentOpen(false); }, label: 'Background' },
            { on: txOn, icon: Captions, fn: toggleTx, label: 'Transcript' },
            { on: sharing, icon: MonitorUp, fn: toggleShare, label: 'Share screen' },
            { on: presentOpen || !!presenting, icon: Presentation, fn: () => setPresentOpen((v) => !v), label: 'Present' },
            { on: hand, icon: Hand, fn: () => { const up = !hand; setHand(up); broadcast({ t: 'hand', id, name: displayName, up }); }, label: 'Raise hand' },
          ];
          const cls = (b: typeof all[number]) => `${mobile ? 'w-11 h-11' : 'w-10 h-10'} shrink-0 rounded-full flex items-center justify-center ${b.danger ? (b.on ? 'bg-zinc-800 text-white' : 'bg-red-500 text-white') : b.on ? 'bg-white text-zinc-900' : 'bg-zinc-800 text-white'}`;
          const btn = (b: typeof all[number]) => <button key={b.label} aria-label={b.label} title={b.label} onClick={() => { b.fn(); setMoreOpen(false); }} className={cls(b)}><b.icon className="w-4 h-4" /></button>;
          if (!mobile) return all.map(btn);
          const main = all.filter((b) => ['Microphone', 'Camera', 'Transcript'].some((k) => b.label.startsWith(k)));
          const rest = all.filter((b) => !main.includes(b));
          return <>
            {main.map(btn)}
            <button aria-label="Chat" onClick={() => openSheet('chat')} className="relative w-11 h-11 shrink-0 rounded-full bg-zinc-800 text-white flex items-center justify-center"><MessageSquare className="w-4 h-4" />{unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[9px] flex items-center justify-center">{unread}</span>}</button>
            <button aria-label="Shop" onClick={() => openSheet('shop')} className="w-11 h-11 shrink-0 rounded-full bg-zinc-800 text-white flex items-center justify-center"><ShopIcon className="w-4 h-4" /></button>
            <span className="relative">
              <button aria-label="More" onClick={() => setMoreOpen((v) => !v)} className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center ${moreOpen ? 'bg-white text-zinc-900' : 'bg-zinc-800 text-white'}`}><MoreHorizontal className="w-4 h-4" /></button>
              {moreOpen && <div className="absolute bottom-14 right-0 z-40 w-56 rounded-2xl bg-zinc-900 border border-white/10 p-2 shadow-2xl space-y-1">
                {rest.map((b) => <button key={b.label} onClick={() => { b.fn(); setMoreOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${b.on ? 'bg-white text-zinc-900' : 'text-zinc-100'}`}><b.icon className="w-4 h-4" />{b.label}</button>)}
                <button onClick={() => { setTab('text'); setSheetOpen(true); setMoreOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-100"><FileText className="w-4 h-4" />Transcript text</button>
                {isHost && <button onClick={() => { setTab('rules'); setSheetOpen(true); setMoreOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-100"><Sliders className="w-4 h-4" />Host rules</button>}
                {isHost && <button onClick={() => { toggleRec(); setMoreOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-100"><Circle className="w-4 h-4" />{rec ? 'Stop recording' : 'Record'}</button>}
                {!isHost && canClaimHost && <button onClick={() => { claimHost(); setMoreOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-amber-300"><Crown className="w-4 h-4" />Claim host</button>}
              </div>}
            </span>
          </>; })()}
          <button aria-label="Leave" onClick={() => { streamRef.current?.getTracks().forEach((t) => t.stop()); setLeft(true); }} className={`ml-1 shrink-0 flex items-center gap-2 h-10 rounded-full bg-red-500 text-white text-sm font-medium ${mobile ? 'w-11 h-11 justify-center' : 'px-5'}`}><PhoneOff className="w-4 h-4" />{!mobile && 'Leave'}</button>
        </div>
        <input ref={fileInput} type="file" hidden onChange={(e) => onFiles(e.target.files)} />
      </div>
    </div>
  );

  const pills = [
    { k: 'chat', label: `CHAT • ${chatCount}` },
    { k: 'shop', label: `SHOP • ${catalog.length}` },
    { k: 'text', label: 'TEXT' },
    { k: 'journal', label: 'JOURNAL' },
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
              {drop.brochure && <button onClick={() => openBrochure(drop.brochure, drop.name)} className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-emerald-400 underline underline-offset-2"><BookOpen className="w-3.5 h-3.5" />View the brochure</button>}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-zinc-300 p-4 font-mono text-xs text-zinc-500">No live drop yet. {canSell ? 'Use "Push to All" on a product.' : 'The host will push products here.'}</div>
      )}

      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_6px_16px_rgba(16,185,129,0.35)]"><ShopIcon className="h-4 w-4" /></span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 leading-tight">Catalog</p>
          <p className="font-mono text-[10px] text-zinc-500">{catalog.length} product{catalog.length === 1 ? '' : 's'} in this room</p>
        </div>
        {canSell && !adding && <span className="flex gap-1.5">
          <button onClick={() => setShowPkgs((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium shadow-sm hover:from-emerald-600 hover:to-teal-600 transition"><Crown className="w-3.5 h-3.5" />{showPkgs ? 'Hide packages' : 'SFH packages'}</button>
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-300 text-xs text-zinc-800 hover:bg-zinc-50 transition"><Plus className="w-3.5 h-3.5" />Add product</button>
        </span>}
      </div>

      {canSell && showPkgs && (() => {
        const k = SFH_PACKAGES.find((x) => x.id === pkgPick) || SFH_PACKAGES[0];
        const inCat = catalog.some((x) => x.id === `pkg-${k.id}`);
        return (
          <div className="rounded-3xl border-2 border-zinc-900 overflow-hidden shadow-lg">
            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 text-white">
              <span className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0"><Crown className="w-4 h-4 text-white" /></span>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] tracking-[0.18em] text-emerald-400">STARTUP FACTORY HUB</p>
                <p className="text-sm font-semibold leading-tight">Memberships & Packages</p>
              </div>
              <span className="flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />SELL LIVE</span>
            </div>
            <div className="relative">
              <button onClick={() => setPkgOpen((v) => !v)} className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-zinc-50 text-left">
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-medium text-zinc-900 truncate">{k.name}</span>
                  <span className="block font-mono text-[11px] text-zinc-500">${k.price.toLocaleString()}/{k.interval === 'year' ? 'yr' : 'mo'} • {k.tag}</span>
                </span>
                <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${pkgOpen ? 'rotate-180' : ''}`} />
              </button>
              {pkgOpen && (
                <div className="border-t border-zinc-100 max-h-64 overflow-y-auto">
                  {SFH_PACKAGES.map((x) => (
                    <button key={x.id} onClick={() => { setPkgPick(x.id); setPkgOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 ${x.id === k.id ? 'bg-emerald-50' : ''}`}>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-zinc-900 truncate">{x.name}</span>
                        <span className="block font-mono text-[10px] text-zinc-500">{x.tag}</span>
                      </span>
                      {catalog.some((c) => c.id === `pkg-${x.id}`) && <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-zinc-900 text-white">ADDED</span>}
                      <span className="font-mono text-xs text-zinc-900">${x.price.toLocaleString()}/{x.interval === 'year' ? 'yr' : 'mo'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative h-32">
              <img src={k.image} alt={k.name} className="w-full h-full object-cover" />
              <span className="absolute left-2 top-2 font-mono text-[9px] px-2 py-0.5 rounded-full bg-black/60 text-white">{k.tag}</span>
            </div>
            <div className="p-3">
              <p className="text-[14px] text-zinc-900">{k.name}</p>
              <p className="font-mono text-[11px] text-zinc-500">${k.price.toLocaleString()}/{k.interval === 'year' ? 'yr' : 'mo'}</p>
              <ul className="mt-1 text-[11px] text-zinc-500">{k.perks.map((x) => <li key={x}>{x}</li>)}</ul>
              {k.brochure && <button onClick={() => openBrochure(k.brochure, k.name)} className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-full border border-emerald-600/30 bg-emerald-50 text-emerald-700 text-xs font-medium"><BookOpen className="w-3.5 h-3.5" />View the brochure</button>}
              <div className="mt-2 flex gap-2">
                <button onClick={() => addPackage(k)} disabled={inCat} className="flex-1 py-2 rounded-full border border-zinc-200 text-xs text-zinc-800 disabled:opacity-50">{inCat ? 'In catalog' : 'Add to catalog'}</button>
                <button onClick={() => addPackage(k, true)} className="flex-1 py-2 rounded-full bg-zinc-900 text-white text-xs">Drop live now</button>
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
      {catalog.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {catalog.map((p) => (
            <div key={p.id} className="relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white">
              <Thumb p={p} className="w-full h-24" />
              {p.tag && <span className="absolute left-2 top-2 font-mono text-[9px] px-2 py-0.5 rounded-full bg-black/60 text-white">{p.tag}</span>}
              {canSell && <button aria-label="Delete product" onClick={() => deleteProduct(p.id)} className="absolute right-2 top-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500"><Trash2 className="w-3 h-3" /></button>}
              <div className="flex flex-1 flex-col p-3">
                <p className="text-[13px] font-medium text-zinc-900 leading-snug line-clamp-2">{p.name}</p>
                <p className="font-mono text-xs text-zinc-500 mt-0.5">{priceLabel(p)}</p>
                {p.perks && <p className="mt-1 text-[11px] leading-snug text-zinc-500 line-clamp-2">{p.perks.join(' • ')}</p>}
                <div className="flex-1" />
                <button disabled={paying === p.id} onClick={() => buy(p)} className="mt-2 w-full py-2 rounded-full bg-zinc-900 text-white text-xs font-medium disabled:opacity-60">{p.pkg ? (paying === p.id ? 'Opening…' : 'Subscribe') : 'Add to cart'}</button>
                {(p.brochure || canSell) && (
                  <div className="mt-1.5 flex gap-1.5">
                    {p.brochure && <button onClick={() => openBrochure(p.brochure, p.name)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full border border-emerald-600/30 bg-emerald-50 text-emerald-700 text-[11px] font-medium"><BookOpen className="w-3 h-3" />Brochure</button>}
                    {canSell && <button onClick={() => pushToAll(p)} className="flex-1 py-1.5 rounded-full border border-zinc-200 font-mono text-[11px] text-zinc-800">Push to All</button>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[1.75rem] bg-zinc-900 text-white p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white"><ShoppingBag className="h-4 w-4" /></span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">Universal Cart</p>
            <p className="font-mono text-[10px] text-zinc-400">{cartCount} item{cartCount === 1 ? '' : 's'}</p>
          </div>
          <button onClick={checkout} className="font-mono text-xs text-emerald-400 underline underline-offset-2">View</button>
        </div>
        {cartItems.length === 0
          ? <p className="mt-3 rounded-2xl border border-dashed border-white/15 p-4 font-mono text-xs text-zinc-400">No items yet. Add from the catalog or a live push.</p>
          : (
            <div className="mt-3 space-y-1">
              {cartItems.map((i) => (
                <div key={i.id} className="flex items-center gap-2 text-sm text-zinc-100 py-1.5">
                  <span className="flex-1 truncate">{i.name} x{i.qty}</span>
                  <span className="font-mono">${(i.price * i.qty).toFixed(2)}</span>
                  <button aria-label="Remove" onClick={() => removeFromCart(i.id)} className="text-zinc-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button onClick={checkout} className="w-full mt-2 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium">Checkout • ${cartTotal.toFixed(2)}</button>
            </div>
          )}
      </div>
    </div>
  );

  const sidebar = (
    <aside className={mobile ? `fixed inset-x-0 bottom-0 z-[60] h-[78dvh] rounded-t-3xl bg-white flex flex-col overflow-hidden shadow-2xl transition-transform duration-300 ${sheetOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'}` : `${sideHidden ? 'hidden' : 'flex'} w-[320px] lg:w-[400px] shrink-0 rounded-2xl border border-zinc-200 bg-white flex-col overflow-hidden`}>
      {mobile && <div className="flex items-center justify-center pt-2 relative"><span className="w-10 h-1.5 rounded-full bg-zinc-300" /><button aria-label="Close menu" onClick={() => setSheetOpen(false)} className="absolute right-3 top-2 w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center"><X className="w-4 h-4 text-zinc-700" /></button></div>}
      <div className={`border-b border-zinc-100 ${mobile ? 'px-4 pt-2 pb-3' : 'px-5 pt-5 pb-4'}`}>
        <div className="flex items-center gap-2 pr-8 lg:pr-0">
          <span className="font-mono text-xs px-3 py-1.5 rounded-full border border-zinc-200 text-zinc-500 truncate max-w-[150px]">ROOM {name}</span>
          <button onClick={copyInvite} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 font-mono text-xs text-white shadow-sm hover:bg-zinc-700 transition">{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied' : 'Copy Invite'}</button>
          <span className={`ml-auto font-mono text-[10px] px-2.5 py-1 rounded-full ${isHost ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-700'}`}>{isHost ? 'HOST' : 'GUEST'}</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-1 p-1 rounded-2xl bg-zinc-100 font-mono text-[11px] max-w-full overflow-x-auto">
            {pills.map((t) => (
              <button key={t.k} onClick={() => setTab(t.k as any)} className={`relative flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl transition ${tab === t.k ? 'bg-zinc-900 text-white shadow' : 'text-zinc-500 hover:text-zinc-900'}`}>
                {t.k === 'money' ? <DollarSign className="w-3.5 h-3.5" /> : t.k === 'rules' ? <Sliders className="w-3.5 h-3.5" /> : t.k === 'chat' ? <><MessageSquare className="w-3.5 h-3.5" />{t.label}</> : t.k === 'shop' ? <><ShopIcon className="w-3.5 h-3.5" />{t.label}</> : t.k === 'journal' ? <><PenLine className="w-3.5 h-3.5" />{t.label}</> : <><FileText className="w-3.5 h-3.5" />{t.label}</>}
                {t.k === 'chat' && unread > 0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">{unread}</span>}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-1.5">
            {REACTIONS.map((r) => (
              <button key={r.k} aria-label={`React ${r.k}`} onClick={() => react(r)} className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:scale-110 hover:border-zinc-300 transition"><r.i className={`w-4 h-4 ${r.c}`} /></button>
            ))}
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto space-y-3 ${mobile ? 'px-4 py-4' : 'px-5 py-5'}`}>
        <div className={tab === 'chat' ? 'h-full' : 'hidden'}>
          {token ? <LiveChat room={name} onCount={setChatCount} onSent={(t) => saveLiveLog(name, 'chat', displayName, t, user?.id)} /> : <LocalChat room={name} onCount={setChatCount} />}
        </div>
        {tab === 'text' && <TranscriptPanel room={name} lines={txLines} on={txOn} onToggle={toggleTx} />}
        {tab === 'journal' && (
          <div className="space-y-3">
            <div className="rounded-3xl overflow-hidden border border-amber-200 shadow-sm">
              <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border-b border-amber-100">
                <span className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center shrink-0"><PenLine className="w-4 h-4 text-amber-900" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 leading-tight">Journal</p>
                  <p className="font-mono text-[10px] text-zinc-500">Session notes • saved to your Genius bubble</p>
                </div>
              </div>
              <div style={{ backgroundColor: '#fffdf4', backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(120,90,0,0.10) 28px)' }}>
                <textarea value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="Write your notes for this session…" className="w-full min-h-[240px] bg-transparent resize-y px-4 py-1 text-[15px] leading-[28px] text-zinc-800 outline-none placeholder:text-zinc-400" />
              </div>
              <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
                <button onClick={saveNoteToGenius} disabled={!journal.trim()} className="w-full py-2.5 rounded-full bg-zinc-900 text-white text-sm disabled:opacity-40">Save note to Genius</button>
              </div>
            </div>
            {savedNotes.length > 0 && (
              <div className="space-y-2">
                <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-500">SAVED THIS SESSION</p>
                {savedNotes.map((n) => (
                  <div key={n.ts} className="border-l-2 border-amber-400 bg-white rounded-r-2xl border border-zinc-100 px-3 py-2">
                    <p className="font-mono text-[10px] text-zinc-400">{new Date(n.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-sm text-zinc-700 line-clamp-3">{n.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
    <div className={`w-full h-[100dvh] overflow-hidden ${mobile ? 'bg-zinc-950 flex flex-col' : 'bg-zinc-100 p-3 flex gap-3'}`}>
      {stage}
      {mobile && sheetOpen && <div className="fixed inset-0 z-[55] bg-black/50" onClick={() => setSheetOpen(false)} />}
      {sidebar}
    </div>
  );

  if (!token) return body;
  return (
    <LiveKitRoom serverUrl={serverUrl} token={token} connect video={false} audio={false} data-lk-theme="default"
      onConnected={() => { hadConnectedRef.current = true; }}
      onDisconnected={() => {
        /* AUTO-REJOIN (founder report 2026-10-26): a dropped connection
         * — token expiry at the old 2h TTL, a network blip, a server
         * restart — used to end the meeting for that participant. If
         * they were connected and did NOT press Leave, mint a fresh
         * token and reconnect automatically (max 5 times an hour,
         * then surface the error instead of looping). */
        if (leftRef.current || !hadConnectedRef.current) return;
        hadConnectedRef.current = false;
        const now = Date.now();
        rejoinLogRef.current = rejoinLogRef.current.filter((t) => now - t < 3600_000);
        if (rejoinLogRef.current.length >= 5) { setConnError('Connection lost — please rejoin the meeting.'); return; }
        rejoinLogRef.current.push(now);
        setNotice('Connection dropped — rejoining…');
        setToken('');
        setMintNonce((n) => n + 1);
      }}
      onError={(e) => setConnError(e.message)} style={{ height: '100dvh' }}>
      <ShopSync onSend={setSend} onMessage={onShopMessage} />
      <LocalPublisher cam={cam} mic={mic} />
      <ScreenPublisher on={shareOn} onStream={onShareStream} onEnd={stopShare} onFail={setNotice} />
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
