import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";

interface PeerConnection {
  pc: RTCPeerConnection;
  audio: HTMLAudioElement;
  source: MediaStreamAudioSourceNode | null;
  panner: PannerNode | null;
  gain: GainNode | null;
  audioSender: RTCRtpSender | null;
  videoSender: RTCRtpSender | null;
  remoteVideoStream: MediaStream | null;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export const useSpatialVoice = (active: boolean) => {
  const { user } = useAuth();
  const [muted, setMuted] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<Set<string>>(new Set());
  const [cameraOn, setCameraOn] = useState(false);
  const [peerVideoStreams, setPeerVideoStreams] = useState<Map<string, MediaStream>>(new Map());
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micRafRef = useRef<number | null>(null);

  const hasLiveAudioTrack = useCallback(
    () => !!localStreamRef.current?.getAudioTracks().some((track) => track.readyState === "live"),
    []
  );

  const cleanupMicMeter = useCallback(() => {
    if (micRafRef.current) cancelAnimationFrame(micRafRef.current);
    micRafRef.current = null;
    micAnalyserRef.current = null;
    if (micSourceRef.current) {
      try {
        micSourceRef.current.disconnect();
      } catch {}
    }
    micSourceRef.current = null;
    setMicLevel(0);
  }, []);

  const ensureAudioContext = useCallback(async () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") {
        try {
          await audioCtxRef.current.resume();
        } catch {}
      }
      return audioCtxRef.current;
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;

    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {}
    }

    if (ctx.listener.forwardX) {
      ctx.listener.forwardX.value = 0;
      ctx.listener.forwardY.value = 0;
      ctx.listener.forwardZ.value = -1;
      ctx.listener.upX.value = 0;
      ctx.listener.upY.value = 1;
      ctx.listener.upZ.value = 0;
    }

    return ctx;
  }, []);

  const startMicMeter = useCallback(
    async (stream: MediaStream) => {
      const ctx = await ensureAudioContext();
      cleanupMicMeter();

      try {
        const micSrc = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.7;
        micSrc.connect(analyser);
        micSourceRef.current = micSrc;
        micAnalyserRef.current = analyser;

        const data = new Uint8Array(analyser.fftSize);
        const tick = () => {
          if (!micAnalyserRef.current) return;
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          setMicLevel(Math.min(1, rms * 3));
          micRafRef.current = requestAnimationFrame(tick);
        };

        micRafRef.current = requestAnimationFrame(tick);
      } catch (error) {
        console.warn("[voice] mic meter err", error);
      }
    },
    [cleanupMicMeter, ensureAudioContext]
  );

  const syncPresenceState = useCallback(
    async (next?: { audioEnabled?: boolean; videoEnabled?: boolean }) => {
      if (!channelRef.current || !user) return;
      try {
        await channelRef.current.track({
          userId: user.id,
          audioEnabled: next?.audioEnabled ?? hasLiveAudioTrack(),
          videoEnabled: next?.videoEnabled ?? cameraOn,
        });
      } catch {}
    },
    [cameraOn, hasLiveAudioTrack, user]
  );

  const broadcastMediaState = useCallback(
    (next: { audioEnabled?: boolean; videoEnabled?: boolean }) => {
      if (!channelRef.current || !user) return;
      channelRef.current.send({
        type: "broadcast",
        event: "media-state",
        payload: {
          from: user.id,
          ...next,
        },
      });
    },
    [user]
  );

  const ensureSession = useCallback(async () => {
    if (!user) return false;
    await ensureAudioContext();
    if (!voiceReady) setVoiceReady(true);
    return true;
  }, [ensureAudioContext, user, voiceReady]);

  const renegotiateAll = useCallback(() => {
    if (!user || !channelRef.current) return;
    peersRef.current.forEach((peer, peerId) => {
      peer.pc
        .createOffer()
        .then((offer) => peer.pc.setLocalDescription(offer))
        .then(() => {
          channelRef.current?.send({
            type: "broadcast",
            event: "voice-signal",
            payload: {
              from: user.id,
              to: peerId,
              kind: "offer",
              data: peer.pc.localDescription,
            },
          });
        })
        .catch((error) => console.warn("[voice] renegotiate err", error));
    });
  }, [user]);

  const enableMic = useCallback(async () => {
    if (!user) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const track = stream.getAudioTracks()[0];
      if (!track) throw new Error("No microphone track available");

      const wasReady = voiceReady;
      const ready = await ensureSession();
      if (!ready) {
        track.stop();
        return false;
      }

      cleanupMicMeter();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = stream;
      await startMicMeter(stream);

      let needsRenegotiation = false;
      peersRef.current.forEach((peer) => {
        if (peer.audioSender) {
          peer.audioSender.replaceTrack(track).catch((error) => {
            console.warn("[voice] replace audio track err", error);
          });
        } else {
          peer.audioSender = peer.pc.addTrack(track, stream);
          needsRenegotiation = true;
        }
      });

      setMuted(false);
      broadcastMediaState({ audioEnabled: true });
      syncPresenceState({ audioEnabled: true });
      if (needsRenegotiation && wasReady) renegotiateAll();
      toast.success(wasReady ? "Mic on" : "Voice connected — say hi!");
      return true;
    } catch (error: any) {
      toast.error("Microphone access denied: " + (error?.message || "unknown"));
      return false;
    }
  }, [broadcastMediaState, cleanupMicMeter, ensureSession, renegotiateAll, startMicMeter, syncPresenceState, user, voiceReady]);

  const disableMic = useCallback(() => {
    cleanupMicMeter();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    peersRef.current.forEach((peer) => {
      if (peer.audioSender) {
        peer.audioSender.replaceTrack(null).catch((error) => {
          console.warn("[voice] disable audio track err", error);
        });
      }
    });

    setMuted(true);
    broadcastMediaState({ audioEnabled: false });
    syncPresenceState({ audioEnabled: false });
    toast.success("Mic off");
  }, [broadcastMediaState, cleanupMicMeter, syncPresenceState]);

  const initVoice = useCallback(async () => enableMic(), [enableMic]);

  const stopVoice = useCallback(() => {
    cleanupMicMeter();

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    localVideoStreamRef.current?.getTracks().forEach((track) => track.stop());
    localVideoStreamRef.current = null;
    setLocalVideoStream(null);

    peersRef.current.forEach((peer) => {
      try {
        peer.pc.close();
        peer.audio.remove();
      } catch {}
    });
    peersRef.current.clear();

    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setVoiceReady(false);
    setMuted(true);
    setCameraOn(false);
    setConnectedPeers(new Set());
    setPeerVideoStreams(new Map());
  }, [cleanupMicMeter]);

  const toggleMute = useCallback(async () => {
    if (!voiceReady || muted || !hasLiveAudioTrack()) {
      return enableMic();
    }

    disableMic();
    return true;
  }, [disableMic, enableMic, hasLiveAudioTrack, muted, voiceReady]);

  const enableCamera = useCallback(async () => {
    if (cameraOn) return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 320 },
          height: { ideal: 320 },
        },
        audio: false,
      });
      const track = stream.getVideoTracks()[0];
      if (!track) throw new Error("No front camera track available");

      const wasReady = voiceReady;
      const ready = await ensureSession();
      if (!ready) {
        track.stop();
        return false;
      }

      localVideoStreamRef.current?.getTracks().forEach((t) => t.stop());
      localVideoStreamRef.current = stream;
      setLocalVideoStream(stream);

      let needsRenegotiation = false;
      peersRef.current.forEach((peer) => {
        if (peer.videoSender) {
          peer.videoSender.replaceTrack(track).catch((error) => {
            console.warn("[voice] replace video track err", error);
          });
        } else {
          peer.videoSender = peer.pc.addTrack(track, stream);
          needsRenegotiation = true;
        }
      });

      setCameraOn(true);
      broadcastMediaState({ videoEnabled: true });
      syncPresenceState({ videoEnabled: true });
      if (needsRenegotiation && wasReady) renegotiateAll();
      toast.success("Face cam on");
      return true;
    } catch (error: any) {
      toast.error("Camera access denied: " + (error?.message || "unknown"));
      return false;
    }
  }, [broadcastMediaState, cameraOn, ensureSession, renegotiateAll, syncPresenceState, voiceReady]);

  const disableCamera = useCallback(() => {
    if (!cameraOn) return;

    localVideoStreamRef.current?.getTracks().forEach((track) => track.stop());
    localVideoStreamRef.current = null;
    setLocalVideoStream(null);

    peersRef.current.forEach((peer) => {
      if (peer.videoSender) {
        peer.videoSender.replaceTrack(null).catch((error) => {
          console.warn("[voice] disable video track err", error);
        });
      }
    });

    setCameraOn(false);
    broadcastMediaState({ videoEnabled: false });
    syncPresenceState({ videoEnabled: false });
    toast.success("Face cam off");
  }, [broadcastMediaState, cameraOn, syncPresenceState]);

  const toggleCamera = useCallback(async () => {
    if (cameraOn) {
      disableCamera();
      return true;
    }

    return enableCamera();
  }, [cameraOn, disableCamera, enableCamera]);

  const createPeer = useCallback(
    (peerId: string, isInitiator: boolean) => {
      if (peersRef.current.has(peerId) || !user) return;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const audio = new Audio();
      audio.autoplay = true;
      audio.muted = false;
      document.body.appendChild(audio);

      const peer: PeerConnection = {
        pc,
        audio,
        source: null,
        panner: null,
        gain: null,
        audioSender: null,
        videoSender: null,
        remoteVideoStream: null,
      };
      peersRef.current.set(peerId, peer);

      const localAudioTrack = localStreamRef.current?.getAudioTracks()[0];
      if (localAudioTrack && localStreamRef.current) {
        peer.audioSender = pc.addTrack(localAudioTrack, localStreamRef.current);
      }

      const localVideoTrack = localVideoStreamRef.current?.getVideoTracks()[0];
      if (localVideoTrack && localVideoStreamRef.current) {
        peer.videoSender = pc.addTrack(localVideoTrack, localVideoStreamRef.current);
      }

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        channelRef.current?.send({
          type: "broadcast",
          event: "voice-signal",
          payload: {
            from: user.id,
            to: peerId,
            kind: "ice",
            data: event.candidate,
          },
        });
      };

      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        const track = event.track;

        if (track.kind === "audio") {
          audio.srcObject = remoteStream;
          void audio.play().catch(() => {});
          const ctx = audioCtxRef.current;
          if (ctx && !peer.source) {
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
        } else if (track.kind === "video") {
          peer.remoteVideoStream = remoteStream;
          setPeerVideoStreams((prev) => {
            const next = new Map(prev);
            next.set(peerId, remoteStream);
            return next;
          });
          track.onended = () => {
            setPeerVideoStreams((prev) => {
              const next = new Map(prev);
              next.delete(peerId);
              return next;
            });
          };
        }
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
            const next = new Set(prev);
            next.delete(peerId);
            return next;
          });
          setPeerVideoStreams((prev) => {
            const next = new Map(prev);
            next.delete(peerId);
            return next;
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
          })
          .catch((error) => console.warn("[voice] offer err", error));
      }
    },
    [user]
  );

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
          } catch (error) {
            console.warn("[voice] ice err", error);
          }
        } else if (payload.kind === "hello") {
          if (user.id > fromId && !peersRef.current.has(fromId)) {
            createPeer(fromId, true);
          }
        }
      })
      .on("broadcast", { event: "media-state" }, ({ payload }) => {
        if (payload.from === user.id) return;
        const peer = peersRef.current.get(payload.from);

        if (payload.videoEnabled === false) {
          setPeerVideoStreams((prev) => {
            const next = new Map(prev);
            next.delete(payload.from);
            return next;
          });
        } else if (payload.videoEnabled === true && peer?.remoteVideoStream) {
          setPeerVideoStreams((prev) => {
            const next = new Map(prev);
            next.set(payload.from, peer.remoteVideoStream as MediaStream);
            return next;
          });
        }
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        Object.keys(state).forEach((peerId) => {
          if (peerId === user.id) return;
          channel.send({
            type: "broadcast",
            event: "voice-signal",
            payload: { from: user.id, to: peerId, kind: "hello" },
          });
        });
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (key === user.id) return;
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
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
          setPeerVideoStreams((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await syncPresenceState({
            audioEnabled: hasLiveAudioTrack(),
            videoEnabled: !!localVideoStreamRef.current?.getVideoTracks().length,
          });
        }
      });

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [active, createPeer, hasLiveAudioTrack, syncPresenceState, user, voiceReady]);

  const updatePeerPosition = useCallback((peerId: string, eastMeters: number, northMeters: number) => {
    const peer = peersRef.current.get(peerId);
    if (!peer?.panner || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const t = ctx.currentTime;
    if (peer.panner.positionX) {
      peer.panner.positionX.setTargetAtTime(eastMeters, t, 0.05);
      peer.panner.positionY.setTargetAtTime(0, t, 0.05);
      peer.panner.positionZ.setTargetAtTime(-northMeters, t, 0.05);
    } else {
      peer.panner.setPosition(eastMeters, 0, -northMeters);
    }
  }, []);

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
    cameraOn,
    toggleCamera,
    enableCamera,
    disableCamera,
    localVideoStream,
    peerVideoStreams,
    micLevel,
  };
};
