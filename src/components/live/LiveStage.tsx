import { ReactNode, useEffect, useMemo, useState } from 'react';
import { VideoTrack, useTracks, useSpeakingParticipants, isTrackReference } from '@livekit/components-react';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Pin, PinOff, Mic, MicOff, VideoOff, Crown, Megaphone, UserX, X } from 'lucide-react';

const initials = (n: string) => n.split(/[\s@._-]+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

type Props = {
  isHost: boolean;
  hostId: string | null;
  pinned: string | null;
  onPin: (identity: string | null) => void;
  autoFollow: boolean;
  audience: boolean;
  allowed: string[];
  onMod: (to: string, action: 'mute' | 'cam' | 'allow' | 'revoke') => void;
  hero: ReactNode | null;
  localAvatar?: string;
};

// Auto-sizing columns so tiles always fill the stage: 1 = full, 2 = halves, 4 = quarters, and so on.
const colsFor = (n: number) => (n <= 1 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : 4);

export default function LiveStage(p: Props) {
  const cams = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], { onlySubscribed: false });
  const shares = useTracks([Track.Source.ScreenShare], { onlySubscribed: true }).filter((t) => !t.participant.isLocal);
  const speaking = useSpeakingParticipants();
  const speakingIds = useMemo(() => new Set(speaking.map((s) => s.identity)), [speaking]);

  const tiles = useMemo(() => {
    const seen = new Map<string, TrackReferenceOrPlaceholder>();
    cams.forEach((t) => { const k = t.participant.identity; if (!seen.has(k) || isTrackReference(t)) seen.set(k, t); });
    // Local first, then host, then everyone else
    return [...seen.values()].sort((a, b) => Number(b.participant.isLocal) - Number(a.participant.isLocal) || Number(b.participant.identity === p.hostId) - Number(a.participant.identity === p.hostId));
  }, [cams, p.hostId]);

  // Speaker suggestion: someone other than the pinned person talks for 1.5s.
  const topSpeaker = speaking.find((s) => s.identity !== p.pinned)?.identity || null;
  const [suggest, setSuggest] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  useEffect(() => {
    if (!topSpeaker || tiles.length < 2) { setSuggest(null); return; }
    const t = setTimeout(() => {
      if (p.autoFollow && p.isHost) p.onPin(topSpeaker);
      else if (topSpeaker !== dismissed) setSuggest(topSpeaker);
    }, 1500);
    return () => clearTimeout(t);
  }, [topSpeaker, tiles.length, p.autoFollow, p.isHost, dismissed]); // eslint-disable-line

  const pinnedTile = p.pinned ? tiles.find((t) => t.participant.identity === p.pinned) : undefined;
  const share = shares[0];
  const heroNode = p.hero
    ? p.hero
    : share ? <VideoTrack trackRef={share as any} className="w-full h-full object-contain bg-black" />
    : pinnedTile ? <Tile t={pinnedTile} {...p} speaking={speakingIds.has(pinnedTile.participant.identity)} big />
    : null;

  const suggestName = suggest ? (tiles.find((t) => t.participant.identity === suggest)?.participant.name || 'Someone') : '';

  return (
    <div className="relative w-full h-full min-h-0">
      {suggest && suggest !== p.pinned && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-white/95 shadow-2xl text-sm text-zinc-900">
          <Mic className="w-3.5 h-3.5 text-emerald-600" />
          <span className="max-w-[180px] truncate">{suggestName} is speaking</span>
          <button onClick={() => { p.onPin(suggest); setSuggest(null); }} className="flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-900 text-white text-xs"><Pin className="w-3 h-3" />{p.isHost ? 'Pin for everyone' : 'Pin'}</button>
          <button aria-label="Dismiss" onClick={() => { setDismissed(suggest); setSuggest(null); }} className="w-6 h-6 rounded-full hover:bg-zinc-100 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {heroNode ? (
        <div className="flex h-full gap-3">
          <div className="relative flex-1 min-w-0 h-full rounded-2xl overflow-hidden bg-zinc-900">{heroNode}</div>
          <div className="w-56 shrink-0 h-full overflow-y-auto flex flex-col gap-2 pr-1">
            {tiles.filter((t) => p.hero || share || t.participant.identity !== p.pinned).map((t) => (
              <div key={t.participant.identity} className="aspect-video shrink-0">
                <Tile t={t} {...p} speaking={speakingIds.has(t.participant.identity)} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid h-full gap-3" style={{ gridTemplateColumns: `repeat(${colsFor(tiles.length)}, minmax(0, 1fr))`, gridAutoRows: '1fr', gridTemplateRows: `repeat(${Math.ceil(Math.max(1, tiles.length) / colsFor(tiles.length))}, minmax(0, 1fr))` }}>
          {tiles.map((t) => <Tile key={t.participant.identity} t={t} {...p} speaking={speakingIds.has(t.participant.identity)} />)}
        </div>
      )}
    </div>
  );
}

function Tile({ t, speaking, big, isHost, hostId, pinned, onPin, audience, allowed, onMod, localAvatar }: Props & { t: TrackReferenceOrPlaceholder; speaking: boolean; big?: boolean }) {
  const pt = t.participant;
  const id = pt.identity;
  const local = pt.isLocal;
  const name = pt.name || id;
  const live = isTrackReference(t) && !!t.publication?.track && !t.publication.isMuted;
  const micOn = pt.isMicrophoneEnabled;
  const isPinned = pinned === id;
  const onStage = !audience || id === hostId || allowed.includes(id);
  return (
    <div onDoubleClick={() => onPin(isPinned ? null : id)}
      className={`group relative w-full h-full min-h-0 rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-800 to-zinc-900 border transition-shadow ${speaking ? 'border-emerald-400 ring-2 ring-emerald-400/60' : 'border-white/[0.06]'}`}>
      {live
        ? <VideoTrack trackRef={t as any} className={`absolute inset-0 w-full h-full object-cover ${local ? '-scale-x-100' : ''}`} />
        : <div className="absolute inset-0 flex items-center justify-center">
            {local && localAvatar ? <img src={localAvatar} alt="" className={`${big ? 'w-28 h-28' : 'w-14 h-14'} rounded-full object-cover`} />
              : <span className={`${big ? 'w-28 h-28 text-3xl' : 'w-14 h-14'} rounded-full bg-white/10 text-zinc-200 flex items-center justify-center`}>{initials(name)}</span>}
          </div>}

      <div className="absolute inset-x-0 bottom-0 p-2.5 flex items-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent">
        <span className="font-mono text-xs text-white truncate">{name}{local ? ' (You)' : ''}</span>
        {id === hostId && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
        {isPinned && <Pin className="w-3 h-3 text-white shrink-0" />}
        <span className={`ml-auto w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${micOn ? 'bg-white/15' : 'bg-red-500'}`}>{micOn ? <Mic className="w-3 h-3 text-white" /> : <MicOff className="w-3 h-3 text-white" />}</span>
      </div>

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <TileBtn label={isPinned ? 'Unpin' : isHost ? 'Pin for everyone' : 'Pin'} onClick={() => onPin(isPinned ? null : id)}>{isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}</TileBtn>
        {isHost && !local && <>
          <TileBtn label="Mute microphone" onClick={() => onMod(id, 'mute')}><MicOff className="w-3.5 h-3.5" /></TileBtn>
          <TileBtn label="Turn camera off" onClick={() => onMod(id, 'cam')}><VideoOff className="w-3.5 h-3.5" /></TileBtn>
          {audience && (onStage
            ? <TileBtn label="Move to audience" onClick={() => onMod(id, 'revoke')}><UserX className="w-3.5 h-3.5" /></TileBtn>
            : <TileBtn label="Invite to speak" onClick={() => onMod(id, 'allow')}><Megaphone className="w-3.5 h-3.5" /></TileBtn>)}
        </>}
      </div>
    </div>
  );
}

function TileBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return <button aria-label={label} title={label} onClick={(e) => { e.stopPropagation(); onClick(); }} className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">{children}</button>;
}
