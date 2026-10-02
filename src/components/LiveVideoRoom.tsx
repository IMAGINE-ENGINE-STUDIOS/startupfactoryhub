import { useEffect, useMemo, useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { supabase } from '@/integrations/supabase/client';

interface LiveVideoRoomProps {
  roomName?: string;
  room?: string;
  identity?: string;
  onLeave?: () => void;
}

export default function LiveVideoRoom({ roomName, room, identity, onLeave }: LiveVideoRoomProps) {
  const name = roomName || room || 'live-commerce-room';
  const id = useMemo(() => identity || `user-${Math.floor(Math.random() * 10000)}`, [identity]);
  const [token, setToken] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('livekit-token', {
          body: { roomName: name, identity: id }
        });
        if (error) throw error;
        if (!data?.token) throw new Error(data?.error || 'No token returned');
        const url = data.url || import.meta.env.VITE_LIVEKIT_URL;
        if (!url) throw new Error('LiveKit server address is missing');
        if (cancelled) return;
        setServerUrl(url);
        setToken(data.token);
      } catch (err: any) {
        console.error('LiveKit token error:', err);
        if (!cancelled) setError(err.message || 'Failed to join room');
      }
    };
    fetchToken();
    return () => { cancelled = true; };
  }, [name, id]);

  if (error) {
    return (
      <div className="w-full h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-xl p-10 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400 font-bold">!</div>
          <p className="text-white font-medium">Connection failed</p>
          <p className="text-zinc-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="w-full h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="absolute w-72 h-72 bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="relative bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-[2.5rem] p-12 max-w-md w-full text-center shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)]">
          <div className="relative w-16 h-16 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
            <div className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center animate-bounce">
              <div className="w-3 h-3 rounded-full bg-zinc-900 animate-pulse" />
            </div>
          </div>
          <h2 className="text-white text-xl tracking-[0.02em] font-medium">Joining {name}</h2>
          <p className="text-zinc-400 text-sm mt-2 tracking-wide">Video + Voice • Securing connection</p>
          <div className="mt-8 flex justify-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-white/40 animate-[bounce_1s_infinite_0ms]" />
            <span className="w-1 h-1 rounded-full bg-white/40 animate-[bounce_1s_infinite_150ms]" />
            <span className="w-1 h-1 rounded-full bg-white/40 animate-[bounce_1s_infinite_300ms]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-zinc-950 flex flex-col">
      <LiveKitRoom
        video={true}
        audio={true}
        serverUrl={serverUrl}
        token={token}
        connect={true}
        onDisconnected={onLeave}
        data-lk-theme="default"
        className="w-full h-full flex flex-col"
        style={{ height: '100dvh' }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
