import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";

/**
 * Native WebRTC peer-to-peer voice with Web Audio PannerNode for true
 * 3D spatial audio. Signaling rides on Supabase Realtime broadcast.
 *
 * Each peer has a Web Audio PannerNode placed at their relative position
 * (in meters east/north of the local user). Volume falls off naturally
 * with distance (HRTF panning + inverse falloff).
 */

interface PeerConnection {
  pc: RTCPeerConnection;
  audio: HTMLAudioElement;
  source: MediaStreamAudioSourceNode | null;
  panner: PannerNode | null;
  gain: GainNode | null;
  videoSender: RTCRtpSender | null;
  remoteVideoStream: MediaStream | null;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export const useSpatialVoice = (active: boolean) => {
  const { user } = useAuth();
  const [muted, setMuted] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<Set<string>>(new Set());
  const [cameraOn, setCameraOn] = useState(false);
  const [peerVideoStreams, setPeerVideoStreams] = useState<Map<string, MediaStream>>(new Map());

  const audioCtxRef = useRef<AudioContext | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Init audio context + mic
  const initVoice = useCallback(async () => {
    if (voiceReady || !user) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      // Listener defaults — facing -Z, up +Y
      if (ctx.listener.forwardX) {
        ctx.listener.forwardX.value = 0;
        ctx.listener.forwardY.value = 0;
        ctx.listener.forwardZ.value = -1;
        ctx.listener.upX.value = 0;
        ctx.listener.upY.value = 1;
        ctx.listener.upZ.value = 0;
      }
      setVoiceReady(true);
    } catch (e: any) {
      toast.error("Microphone access denied: " + (e?.message || "unknown"));
    }
  }, [voiceReady, user]);

  const stopVoice = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    peersRef.current.forEach((p) => {
      try {
        p.pc.close();
        p.audio.remove();
      } catch {}
    });
    peersRef.current.clear();
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setVoiceReady(false);
    setConnectedPeers(new Set());
  }, []);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const newMuted = !muted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !newMuted));
    setMuted(newMuted);
  }, [muted]);

  // Create peer connection
  const createPeer = useCallback(
    (peerId: string, isInitiator: boolean) => {
      if (peersRef.current.has(peerId) || !user) return;
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const audio = new Audio();
      audio.autoplay = true;
      // We route audio through Web Audio for spatialization, so mute the element
      audio.muted = true;
      document.body.appendChild(audio);

      const peer: PeerConnection = {
        pc,
        audio,
        source: null,
        panner: null,
        gain: null,
      };
      peersRef.current.set(peerId, peer);

      // Add local tracks
      localStreamRef.current?.getTracks().forEach((t) => {
        pc.addTrack(t, localStreamRef.current!);
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          channelRef.current?.send({
            type: "broadcast",
            event: "voice-signal",
            payload: {
              from: user.id,
              to: peerId,
              kind: "ice",
              data: e.candidate,
            },
          });
        }
      };

      pc.ontrack = (e) => {
        const remoteStream = e.streams[0];
        audio.srcObject = remoteStream;

        const ctx = audioCtxRef.current;
        if (ctx) {
          const source = ctx.createMediaStreamSource(remoteStream);
          const panner = ctx.createPanner();
          panner.panningModel = "HRTF";
          panner.distanceModel = "inverse";
          panner.refDistance = 1;
          panner.maxDistance = 1000;
          panner.rolloffFactor = 1.5;
          panner.coneInnerAngle = 360;
          panner.coneOuterAngle = 0;
          panner.coneOuterGain = 0;
          const gain = ctx.createGain();
          gain.gain.value = 1;
          source.connect(panner).connect(gain).connect(ctx.destination);
          peer.source = source;
          peer.panner = panner;
          peer.gain = gain;
        }
        setConnectedPeers((prev) => new Set(prev).add(peerId));
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed" ||
          pc.connectionState === "disconnected"
        ) {
          peersRef.current.delete(peerId);
          audio.remove();
          setConnectedPeers((prev) => {
            const n = new Set(prev);
            n.delete(peerId);
            return n;
          });
        }
      };

      if (isInitiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            channelRef.current?.send({
              type: "broadcast",
              event: "voice-signal",
              payload: {
                from: user.id,
                to: peerId,
                kind: "offer",
                data: pc.localDescription,
              },
            });
          });
      }
    },
    [user]
  );

  // Signaling channel
  useEffect(() => {
    if (!active || !user || !voiceReady) return;
    const channel = supabase.channel("galaxy-voice", {
      config: { broadcast: { ack: false }, presence: { key: user.id } },
    });

    channel
      .on("broadcast", { event: "voice-signal" }, async ({ payload }) => {
        if (payload.to !== user.id) return;
        const fromId = payload.from;
        let peer = peersRef.current.get(fromId);

        if (payload.kind === "offer") {
          if (!peer) {
            createPeer(fromId, false);
            peer = peersRef.current.get(fromId);
          }
          if (!peer) return;
          await peer.pc.setRemoteDescription(payload.data);
          const answer = await peer.pc.createAnswer();
          await peer.pc.setLocalDescription(answer);
          channel.send({
            type: "broadcast",
            event: "voice-signal",
            payload: {
              from: user.id,
              to: fromId,
              kind: "answer",
              data: peer.pc.localDescription,
            },
          });
        } else if (payload.kind === "answer" && peer) {
          await peer.pc.setRemoteDescription(payload.data);
        } else if (payload.kind === "ice" && peer) {
          try {
            await peer.pc.addIceCandidate(payload.data);
          } catch (e) {
            console.warn("[voice] ice err", e);
          }
        } else if (payload.kind === "hello") {
          // Larger user id initiates to avoid double-offer
          if (user.id > fromId && !peersRef.current.has(fromId)) {
            createPeer(fromId, true);
          }
        }
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (key === user.id) return;
        // Greet the new peer; deterministic initiator avoids glare
        channel.send({
          type: "broadcast",
          event: "voice-signal",
          payload: { from: user.id, to: key, kind: "hello" },
        });
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        const peer = peersRef.current.get(key);
        if (peer) {
          peer.pc.close();
          peer.audio.remove();
          peersRef.current.delete(key);
          setConnectedPeers((prev) => {
            const n = new Set(prev);
            n.delete(key);
            return n;
          });
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId: user.id });
        }
      });

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [active, user, voiceReady, createPeer]);

  // Update spatial position of a peer (east meters, north meters)
  const updatePeerPosition = useCallback(
    (peerId: string, eastMeters: number, northMeters: number) => {
      const peer = peersRef.current.get(peerId);
      if (!peer?.panner || !audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const t = ctx.currentTime;
      // Web Audio: x = east, y = up, z = -north (so "in front" means north)
      if (peer.panner.positionX) {
        peer.panner.positionX.setTargetAtTime(eastMeters, t, 0.05);
        peer.panner.positionY.setTargetAtTime(0, t, 0.05);
        peer.panner.positionZ.setTargetAtTime(-northMeters, t, 0.05);
      } else {
        peer.panner.setPosition(eastMeters, 0, -northMeters);
      }
    },
    []
  );

  // Cleanup
  useEffect(() => {
    return () => stopVoice();
  }, [stopVoice]);

  return {
    initVoice,
    stopVoice,
    voiceReady,
    muted,
    toggleMute,
    connectedPeers,
    updatePeerPosition,
  };
};
