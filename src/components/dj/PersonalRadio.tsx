import { useState, useRef, useEffect } from "react";
import { Radio, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight, Minimize2 } from "lucide-react";
import { PLAYLISTS } from "@/hooks/useDJBroadcast";

/**
 * Personal Radio — individual radio player for each user.
 * Plays only for the local user. Doesn't affect broadcast.
 * Floating mini-player in bottom corner.
 */
const PersonalRadio = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(60);
  const [playlistIdx, setPlaylistIdx] = useState(0);
  const [trackIdx, setTrackIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    return () => { audioRef.current?.pause(); };
  }, []);

  const playlist = PLAYLISTS[playlistIdx];
  const track = playlist?.tracks[trackIdx];

  useEffect(() => {
    if (!audioRef.current || !track) return;
    const needsNewSrc = audioRef.current.src !== track.url;
    if (needsNewSrc) audioRef.current.src = track.url;
    audioRef.current.volume = muted ? 0 : volume / 100;
    if (isPlaying) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isPlaying, track, volume, muted]);

  const nextTrack = () => {
    const pl = PLAYLISTS[playlistIdx];
    if (trackIdx < pl.tracks.length - 1) setTrackIdx(trackIdx + 1);
    else {
      const nextPl = (playlistIdx + 1) % PLAYLISTS.length;
      setPlaylistIdx(nextPl);
      setTrackIdx(0);
    }
  };

  const prevTrack = () => {
    if (trackIdx > 0) setTrackIdx(trackIdx - 1);
    else {
      const prevPl = (playlistIdx - 1 + PLAYLISTS.length) % PLAYLISTS.length;
      setPlaylistIdx(prevPl);
      setTrackIdx(PLAYLISTS[prevPl].tracks.length - 1);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #f97316, #c2410c)',
          boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
        }}
        title="My Radio"
      >
        <Radio className="w-5 h-5 text-white" />
        {isPlaying && (
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 animate-pulse border-2 border-black" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-72 rounded-xl overflow-hidden shadow-2xl" style={{
      background: '#111', border: '2px solid #333',
      boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{
        background: 'linear-gradient(90deg, #1a1a1a, #222)',
        borderBottom: '1px solid #333',
      }}>
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-orange-400" />
          <span className="text-[10px] font-futuristic font-black tracking-[0.2em] text-orange-400">MY RADIO</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-white/10 transition-colors">
            <Minimize2 className="w-3 h-3 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Station selector */}
      <div className="flex gap-1 px-2 py-1.5 overflow-x-auto" style={{ borderBottom: '1px solid #222' }}>
        {PLAYLISTS.map((pl, i) => (
          <button key={i} onClick={() => { setPlaylistIdx(i); setTrackIdx(0); }}
            className="px-2 py-0.5 rounded whitespace-nowrap text-[8px] font-futuristic font-bold tracking-wider transition-all"
            style={{
              background: playlistIdx === i ? '#f97316' : '#1a1a1a',
              color: playlistIdx === i ? '#fff' : '#666',
              border: `1px solid ${playlistIdx === i ? '#f97316' : '#333'}`,
            }}>{pl.name}</button>
        ))}
      </div>

      {/* Now playing */}
      <div className="px-3 py-2">
        <p className="text-[8px] text-gray-600 font-futuristic tracking-wider mb-0.5">NOW PLAYING</p>
        <p className="text-sm font-futuristic font-bold text-white truncate">{track?.name || '—'}</p>
        <p className="text-[9px] text-gray-500 font-futuristic">{track?.genre} · {track?.bpm} BPM</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-3 py-2">
        <button onClick={prevTrack} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
        <button onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{
            background: isPlaying ? 'radial-gradient(circle, #ef4444, #991b1b)' : 'radial-gradient(circle, #22c55e, #15803d)',
            boxShadow: isPlaying ? '0 0 12px rgba(239,68,68,0.4)' : '0 0 12px rgba(34,197,94,0.4)',
          }}>
          {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
        </button>
        <button onClick={nextTrack} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: '1px solid #222' }}>
        <button onClick={() => setMuted(!muted)} className="p-1 rounded hover:bg-white/10">
          {muted ? <VolumeX className="w-3.5 h-3.5 text-gray-500" /> : <Volume2 className="w-3.5 h-3.5 text-orange-400" />}
        </button>
        <input type="range" min={0} max={100} value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(90deg, #f97316 0%, #f97316 ${volume}%, #2a2a2a ${volume}%, #2a2a2a 100%)` }}
        />
        <span className="text-[9px] font-mono text-gray-500 w-6 text-right">{volume}</span>
      </div>

      {/* Track list */}
      <div className="max-h-32 overflow-y-auto" style={{ borderTop: '1px solid #222' }}>
        {playlist?.tracks.map((t, i) => (
          <button key={i} onClick={() => setTrackIdx(i)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-all hover:bg-white/5"
            style={{ background: trackIdx === i ? 'rgba(249,115,22,0.1)' : 'transparent', borderBottom: '1px solid #1a1a1a' }}>
            {trackIdx === i && isPlaying ? (
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            ) : (
              <span className="text-[8px] font-mono text-gray-600 w-2 text-center">{i + 1}</span>
            )}
            <span className="text-[10px] font-futuristic truncate flex-1" style={{ color: trackIdx === i ? '#f97316' : '#888' }}>{t.name}</span>
            <span className="text-[8px] font-mono text-gray-600">{t.bpm}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PersonalRadio;
