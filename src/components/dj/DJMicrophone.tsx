import { useRef, useState, useCallback, useEffect } from "react";
import { Mic, MicOff, Circle, Save, Trash2, Radio, Volume2, Sliders } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDJBroadcast } from "@/hooks/useDJBroadcast";

interface DJMicrophoneProps {
  audioContext: AudioContext | null;
  destination: AudioNode | null;
  disabled: boolean;
  onSaved?: () => void;
}

const PRESETS: Record<string, { echo: number; reverb: number; pitch: number; low: number; mid: number; high: number; distortion: number }> = {
  Clean: { echo: 0, reverb: 0, pitch: 0, low: 0, mid: 0, high: 0, distortion: 0 },
  'Auto-Tune': { echo: 0.15, reverb: 0.3, pitch: 5, low: 0, mid: 4, high: 6, distortion: 0 },
  'Deep Voice': { echo: 0.1, reverb: 0.2, pitch: -8, low: 8, mid: -2, high: -4, distortion: 0 },
  'Robot': { echo: 0.4, reverb: 0.1, pitch: 3, low: -4, mid: 8, high: 6, distortion: 40 },
  'Hall Echo': { echo: 0.6, reverb: 0.8, pitch: 0, low: 2, mid: 0, high: 2, distortion: 0 },
  'Radio': { echo: 0, reverb: 0.1, pitch: 0, low: -6, mid: 6, high: 8, distortion: 10 },
  'Cathedral': { echo: 0.8, reverb: 1, pitch: 0, low: 4, mid: 2, high: -2, distortion: 0 },
  'Megaphone': { echo: 0, reverb: 0, pitch: 2, low: -12, mid: 12, high: 8, distortion: 30 },
};

const DJMicrophone = ({ audioContext: externalCtx, destination: externalDest, disabled, onSaved }: DJMicrophoneProps) => {
  const { user } = useAuth();
  const { isAdmin } = useDJBroadcast(user?.email);

  const [micActive, setMicActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [saving, setSaving] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micGainValue, setMicGainValue] = useState(100);
  const [showEffects, setShowEffects] = useState(false);
  const [activePreset, setActivePreset] = useState('Clean');

  // Voice effect states
  const [echoAmount, setEchoAmount] = useState(0);
  const [reverbAmount, setReverbAmount] = useState(0);
  const [pitchShift, setPitchShift] = useState(0);
  const [eqLow, setEqLow] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqHigh, setEqHigh] = useState(0);
  const [distortionAmount, setDistortionAmount] = useState(0);

  // Own audio context for mic (so it works even if external is null)
  const ownCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingBlobRef = useRef<Blob | null>(null);


  // Effect nodes
  const echoDelayRef = useRef<DelayNode | null>(null);
  const echoGainRef = useRef<GainNode | null>(null);
  const reverbGainRef = useRef<GainNode | null>(null);
  const reverbConvolverRef = useRef<ConvolverNode | null>(null);
  const eqLowRef = useRef<BiquadFilterNode | null>(null);
  const eqMidRef = useRef<BiquadFilterNode | null>(null);
  const eqHighRef = useRef<BiquadFilterNode | null>(null);
  const distortionRef = useRef<WaveShaperNode | null>(null);
  const dryGainRef = useRef<GainNode | null>(null);

  const getCtx = useCallback(() => {
    if (externalCtx) return externalCtx;
    if (!ownCtxRef.current) ownCtxRef.current = new AudioContext();
    return ownCtxRef.current;
  }, [externalCtx]);

  const getDest = useCallback(() => {
    const ctx = getCtx();
    return externalDest || ctx.destination;
  }, [externalDest, getCtx]);

  // Generate impulse response for reverb
  const createReverbIR = useCallback((ctx: AudioContext, duration = 2, decay = 2) => {
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }, []);

  // Distortion curve
  const makeDistortionCurve = useCallback((amount: number) => {
    const k = amount;
    const samples = 44100;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }, []);

  // Audio streaming refs for live announcements
  const streamRecorderRef = useRef<MediaRecorder | null>(null);
  const announceChannelSendRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const getAnnounceChannel = useCallback(() => {
    if (!announceChannelSendRef.current) {
      const ch = supabase.channel('hot-deals-dj-announce', { config: { broadcast: { self: false } } });
      ch.subscribe();
      announceChannelSendRef.current = ch;
    }
    return announceChannelSendRef.current;
  }, []);

  const broadcastMicState = useCallback((active: boolean, announcement = false) => {
    if (!isAdmin) return;
    const channel = getAnnounceChannel();
    channel.send({
      type: 'broadcast',
      event: 'mic-state',
      payload: { micActive: active, announcementLive: announcement, userName: user?.email },
    });
  }, [isAdmin, user?.email, getAnnounceChannel]);

  // Start streaming mic audio chunks for live announcement
  const startAudioStream = useCallback(() => {
    if (!streamRef.current) return;
    const channel = getAnnounceChannel();
    try {
      const sr = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm;codecs=opus' });
      sr.ondataavailable = async (e) => {
        if (e.data.size > 0 && e.data.size < 60000) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            channel.send({
              type: 'broadcast',
              event: 'mic-audio',
              payload: { chunk: base64 },
            });
          };
          reader.readAsDataURL(e.data);
        }
      };
      sr.start(200); // 200ms chunks
      streamRecorderRef.current = sr;
    } catch (err) {
      console.warn('Live stream recorder failed:', err);
    }
  }, [getAnnounceChannel]);

  const stopAudioStream = useCallback(() => {
    if (streamRecorderRef.current?.state === 'recording') {
      streamRecorderRef.current.stop();
    }
    streamRecorderRef.current = null;
  }, []);

  const startMic = useCallback(async () => {
    if (disabled) return;
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') await ctx.resume();
      const dest = getDest();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 }
      });
      streamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);
      micSourceRef.current = source;

      // Build chain: source -> gain -> eqLow -> eqMid -> eqHigh -> distortion -> dryGain -> dest
      //                                                                        -> echoDelay -> echoGain -> dest
      //                                                                        -> reverbConvolver -> reverbGain -> dest
      const gain = ctx.createGain();
      gain.gain.value = micGainValue / 100;
      micGainRef.current = gain;

      const low = ctx.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 200; low.gain.value = eqLow;
      eqLowRef.current = low;
      const mid = ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = 1; mid.gain.value = eqMid;
      eqMidRef.current = mid;
      const high = ctx.createBiquadFilter(); high.type = 'highshelf'; high.frequency.value = 4000; high.gain.value = eqHigh;
      eqHighRef.current = high;

      const dist = ctx.createWaveShaper();
      dist.curve = distortionAmount > 0 ? makeDistortionCurve(distortionAmount) : null;
      dist.oversample = '4x';
      distortionRef.current = dist;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      micAnalyserRef.current = analyser;

      const dryGain = ctx.createGain();
      dryGain.gain.value = 1;
      dryGainRef.current = dryGain;

      // Echo (delay feedback)
      const echoDelay = ctx.createDelay(2.0);
      echoDelay.delayTime.value = 0.3;
      echoDelayRef.current = echoDelay;
      const echoGain = ctx.createGain();
      echoGain.gain.value = echoAmount;
      echoGainRef.current = echoGain;

      // Reverb (convolver)
      const convolver = ctx.createConvolver();
      convolver.buffer = createReverbIR(ctx);
      reverbConvolverRef.current = convolver;
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = reverbAmount;
      reverbGainRef.current = reverbGain;

      // Wire chain
      source.connect(gain);
      gain.connect(low).connect(mid).connect(high).connect(dist).connect(analyser);
      
      // Dry path
      analyser.connect(dryGain).connect(dest);

      // Echo path
      analyser.connect(echoDelay);
      echoDelay.connect(echoGain);
      echoGain.connect(dest);
      echoGain.connect(echoDelay); // feedback

      // Reverb path
      analyser.connect(convolver);
      convolver.connect(reverbGain);
      reverbGain.connect(dest);

      setMicActive(true);
      broadcastMicState(true);

      // Auto-start recording
      setTimeout(() => {
        if (stream.active) {
          recChunksRef.current = [];
          recordingBlobRef.current = null;
          setHasRecording(false);
          try {
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            recorder.ondataavailable = (ev) => { if (ev.data.size > 0) recChunksRef.current.push(ev.data); };
            recorder.onstop = () => {
              const blob = new Blob(recChunksRef.current, { type: 'audio/webm' });
              recordingBlobRef.current = blob;
              setHasRecording(true);
            };
            recorder.start(250);
            recorderRef.current = recorder;
            setIsRecording(true);
            setRecTime(0);
            recTimerRef.current = setInterval(() => setRecTime(p => p + 1), 1000);
          } catch (e) {
            console.warn('MediaRecorder init failed:', e);
          }
        }
      }, 100);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      levelTimerRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setMicLevel(Math.round((avg / 255) * 100));
      }, 100);
    } catch (err) {
      console.error('Mic access denied:', err);
    }
  }, [disabled, getCtx, getDest, micGainValue, eqLow, eqMid, eqHigh, echoAmount, reverbAmount, distortionAmount, broadcastMicState, createReverbIR, makeDistortionCurve]);

  // Live-update effect parameters
  useEffect(() => {
    if (micGainRef.current) micGainRef.current.gain.value = micGainValue / 100;
  }, [micGainValue]);

  useEffect(() => {
    if (echoGainRef.current) echoGainRef.current.gain.value = echoAmount;
  }, [echoAmount]);

  useEffect(() => {
    if (reverbGainRef.current) reverbGainRef.current.gain.value = reverbAmount;
  }, [reverbAmount]);

  useEffect(() => {
    if (eqLowRef.current) eqLowRef.current.gain.value = eqLow;
  }, [eqLow]);

  useEffect(() => {
    if (eqMidRef.current) eqMidRef.current.gain.value = eqMid;
  }, [eqMid]);

  useEffect(() => {
    if (eqHighRef.current) eqHighRef.current.gain.value = eqHigh;
  }, [eqHigh]);

  useEffect(() => {
    if (distortionRef.current) {
      distortionRef.current.curve = distortionAmount > 0 ? makeDistortionCurve(distortionAmount) : null;
    }
  }, [distortionAmount, makeDistortionCurve]);

  const applyPreset = useCallback((name: string) => {
    const p = PRESETS[name];
    if (!p) return;
    setActivePreset(name);
    setEchoAmount(p.echo);
    setReverbAmount(p.reverb);
    setPitchShift(p.pitch);
    setEqLow(p.low);
    setEqMid(p.mid);
    setEqHigh(p.high);
    setDistortionAmount(p.distortion);
  }, []);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    stopAudioStream();
    setIsRecording(false);
    setIsAnnouncement(false);
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    broadcastMicState(true, false);
  }, [broadcastMicState, stopAudioStream]);

  const stopMic = useCallback(() => {
    if (isRecording) stopRecording();
    stopAudioStream();
    micSourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    micSourceRef.current = null;
    if (levelTimerRef.current) clearInterval(levelTimerRef.current);
    setMicActive(false);
    setMicLevel(0);
    broadcastMicState(false, false);
  }, [isRecording, broadcastMicState, stopRecording, stopAudioStream]);

  const startRecording = useCallback((announcementMode = false) => {
    if (!streamRef.current) return;
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    recChunksRef.current = [];
    recordingBlobRef.current = null;
    setHasRecording(false);

    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(recChunksRef.current, { type: 'audio/webm' });
        recordingBlobRef.current = blob;
        setHasRecording(true);
        if (announcementMode && user?.id) autoSaveAnnouncement(blob);
      };
      recorder.start(250);
      recorderRef.current = recorder;
      setIsRecording(true);
      setIsAnnouncement(announcementMode);
      setRecTime(0);
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      recTimerRef.current = setInterval(() => setRecTime(p => p + 1), 1000);
      if (announcementMode) {
        broadcastMicState(true, true);
        startAudioStream();
      }
    } catch (e) {
      console.warn('MediaRecorder failed:', e);
    }
  }, [broadcastMicState, user?.id]);

  const autoSaveAnnouncement = useCallback(async (blob: Blob) => {
    if (!user?.id) { console.error('Cannot save announcement: user not authenticated'); return; }
    try {
      const filename = `${user.id}/${Date.now()}-announcement.webm`;
      const { error: uploadErr } = await supabase.storage.from('dj-recordings').upload(filename, blob, { contentType: 'audio/webm', upsert: true });
      if (uploadErr) { console.error('Upload error:', uploadErr); throw uploadErr; }
      const { data: urlData } = supabase.storage.from('dj-recordings').getPublicUrl(filename);
      const { error: insertErr } = await supabase.from('dj_recordings' as any).insert({
        user_id: user.id, title: `Announcement ${new Date().toLocaleString()}`,
        file_url: urlData.publicUrl, storage_path: filename,
        duration_seconds: recTime, file_size: blob.size, recording_type: 'announcement',
      } as any);
      if (insertErr) console.error('DB insert error:', insertErr);
      else console.log('Announcement saved successfully');
      onSaved?.();
    } catch (err) { console.error('Auto-save announcement failed:', err); }
  }, [user?.id, recTime, onSaved]);

  const saveRecording = useCallback(async () => {
    const blob = recordingBlobRef.current;
    if (!blob || !user?.id) { console.error('Cannot save: no blob or user not authenticated'); return; }
    setSaving(true);
    try {
      const filename = `${user.id}/${Date.now()}-mic-recording.webm`;
      const { error: uploadErr } = await supabase.storage.from('dj-recordings').upload(filename, blob, { contentType: 'audio/webm', upsert: true });
      if (uploadErr) { console.error('Upload error:', uploadErr); throw uploadErr; }
      const { data: urlData } = supabase.storage.from('dj-recordings').getPublicUrl(filename);
      const { error: insertErr } = await supabase.from('dj_recordings' as any).insert({
        user_id: user.id, title: `Mic Recording ${new Date().toLocaleString()}`,
        file_url: urlData.publicUrl, storage_path: filename,
        duration_seconds: recTime, file_size: blob.size, recording_type: 'mic',
      } as any);
      if (insertErr) console.error('DB insert error:', insertErr);
      else console.log('Recording saved successfully');
      recordingBlobRef.current = null;
      setHasRecording(false);
      setRecTime(0);
      onSaved?.();
    } catch (err) { console.error('Save failed:', err); }
    finally { setSaving(false); }
  }, [user?.id, recTime, onSaved]);

  const discardRecording = useCallback(() => {
    recordingBlobRef.current = null;
    setHasRecording(false);
    setRecTime(0);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (levelTimerRef.current) clearInterval(levelTimerRef.current);
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const EffectSlider = ({ label, value, onChange, min = -12, max = 12, unit = 'dB', color = '#f97316' }: {
    label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string; color?: string;
  }) => (
    <div className="flex items-center gap-2">
      <span className="text-[7px] font-futuristic tracking-wider text-gray-500 w-14 text-right">{label}</span>
      <input type="range" min={min} max={max} step={0.1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(90deg, ${color} 0%, ${color} ${((value - min) / (max - min)) * 100}%, #2a2a2a ${((value - min) / (max - min)) * 100}%, #2a2a2a 100%)`,
        }}
      />
      <span className="text-[7px] font-mono tabular-nums w-10 text-right" style={{ color }}>{value.toFixed(1)}{unit}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <Mic className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[8px] font-futuristic tracking-[0.3em] text-gray-500">MICROPHONE</span>
        {micActive && (
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[7px] font-futuristic text-red-400 tracking-wider">LIVE</span>
          </div>
        )}
      </div>

      {/* Announcement banner */}
      {isAnnouncement && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md animate-pulse" style={{
          background: 'linear-gradient(90deg, rgba(239,68,68,0.2), rgba(249,115,22,0.2))',
          border: '2px solid #ef4444',
        }}>
          <Radio className="w-4 h-4 text-red-400" />
          <span className="text-[10px] font-futuristic font-bold tracking-[0.2em] text-red-400">
            LIVE ANNOUNCEMENT — ALL USERS CAN HEAR
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Mic toggle */}
        <button
          onClick={micActive ? stopMic : startMic}
          disabled={disabled}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all disabled:opacity-30 shrink-0"
          style={{
            background: micActive
              ? 'radial-gradient(circle at 40% 35%, #ef4444, #991b1b)'
              : 'radial-gradient(circle at 40% 35%, #22c55e, #15803d)',
            border: '3px solid #444',
            boxShadow: micActive ? '0 0 20px rgba(239,68,68,0.4)' : '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {micActive ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
        </button>

        {/* Level meter */}
        {micActive && (
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-4 rounded-full overflow-hidden" style={{ background: '#0a0a0a', border: '1px solid #2a2a2a' }}>
              <div className="h-full rounded-full transition-all duration-100" style={{
                width: `${micLevel}%`,
                background: micLevel > 80 ? 'linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)' :
                  micLevel > 50 ? 'linear-gradient(90deg, #22c55e, #f59e0b)' : '#22c55e',
              }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[7px] font-mono text-gray-500 tabular-nums">{micLevel}%</span>
              {isRecording && (
                <span className="text-[8px] font-futuristic font-bold text-red-400 animate-pulse tracking-wider">
                  ● REC {formatTime(recTime)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Effects toggle */}
        {micActive && (
          <button
            onClick={() => setShowEffects(!showEffects)}
            className="p-2 rounded-lg transition-all shrink-0"
            style={{
              background: showEffects ? 'rgba(249,115,22,0.2)' : '#1a1a1a',
              border: `2px solid ${showEffects ? '#f97316' : '#333'}`,
            }}
          >
            <Sliders className="w-4 h-4" style={{ color: showEffects ? '#f97316' : '#666' }} />
          </button>
        )}
      </div>

      {/* Gain + controls row */}
      {micActive && (
        <div className="flex items-center gap-2 flex-wrap">
          <Volume2 className="w-3 h-3 text-gray-600 shrink-0" />
          <input type="range" min={0} max={200} value={micGainValue}
            onChange={e => setMicGainValue(Number(e.target.value))}
            className="flex-1 h-1 rounded-full appearance-none cursor-pointer min-w-[60px]"
            style={{
              background: `linear-gradient(90deg, #22c55e 0%, #22c55e ${micGainValue / 2}%, #2a2a2a ${micGainValue / 2}%, #2a2a2a 100%)`,
            }}
          />
          <span className="text-[8px] font-mono text-green-400 tabular-nums w-8">{micGainValue}%</span>

          {/* Record button */}
          <button
            onClick={isRecording ? stopRecording : () => startRecording(false)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded transition-all"
            style={{
              background: isRecording ? 'rgba(220,38,38,0.2)' : '#1a1a1a',
              border: `2px solid ${isRecording ? '#ef4444' : '#333'}`,
            }}
          >
            <Circle className="w-3 h-3" style={{ color: isRecording ? '#ef4444' : '#666', fill: isRecording ? '#ef4444' : 'none' }} />
            <span className="text-[9px] font-futuristic tracking-wider font-bold" style={{ color: isRecording ? '#ef4444' : '#666' }}>
              {isRecording ? 'STOP' : 'REC'}
            </span>
          </button>

          {/* Announcement toggle */}
          <button
            onClick={isAnnouncement ? stopRecording : () => startRecording(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded transition-all"
            style={{
              background: isAnnouncement ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.1)',
              border: `2px solid ${isAnnouncement ? '#ef4444' : '#f97316'}`,
            }}
          >
            <Radio className="w-3 h-3" style={{ color: isAnnouncement ? '#ef4444' : '#f97316' }} />
            <span className="text-[8px] font-futuristic tracking-wider font-bold" style={{ color: isAnnouncement ? '#ef4444' : '#f97316' }}>
              {isAnnouncement ? 'END LIVE' : 'ANNOUNCE'}
            </span>
          </button>
        </div>
      )}

      {/* Voice Effects Panel */}
      {micActive && showEffects && (
        <div className="p-3 rounded-lg space-y-3" style={{ background: '#0d0d0d', border: '2px solid #2a2a2a' }}>
          <div className="flex items-center gap-2 mb-2">
            <Sliders className="w-3 h-3 text-orange-400" />
            <span className="text-[8px] font-futuristic tracking-[0.3em] text-orange-400 font-bold">VOICE EFFECTS</span>
          </div>

          {/* Presets */}
          <div className="flex gap-1 flex-wrap">
            {Object.keys(PRESETS).map(name => (
              <button key={name} onClick={() => applyPreset(name)}
                className="px-2 py-0.5 rounded text-[7px] font-futuristic font-bold tracking-wider transition-all"
                style={{
                  background: activePreset === name ? '#f97316' : '#1a1a1a',
                  color: activePreset === name ? '#fff' : '#666',
                  border: `1px solid ${activePreset === name ? '#f97316' : '#333'}`,
                }}
              >{name}</button>
            ))}
          </div>

          {/* Echo */}
          <EffectSlider label="ECHO" value={echoAmount} onChange={v => { setEchoAmount(v); setActivePreset(''); }} min={0} max={1} unit="" color="#3b82f6" />

          {/* Reverb */}
          <EffectSlider label="REVERB" value={reverbAmount} onChange={v => { setReverbAmount(v); setActivePreset(''); }} min={0} max={1} unit="" color="#8b5cf6" />

          {/* Pitch (visual indicator - actual pitch shifting requires more complex DSP) */}
          <EffectSlider label="PITCH" value={pitchShift} onChange={v => { setPitchShift(v); setActivePreset(''); }} min={-12} max={12} unit="st" color="#ec4899" />

          {/* EQ */}
          <div className="pt-1" style={{ borderTop: '1px solid #1a1a1a' }}>
            <span className="text-[6px] font-futuristic tracking-[0.3em] text-gray-600 mb-1 block">VOICE EQ</span>
            <EffectSlider label="LOW" value={eqLow} onChange={v => { setEqLow(v); setActivePreset(''); }} color="#ef4444" />
            <EffectSlider label="MID" value={eqMid} onChange={v => { setEqMid(v); setActivePreset(''); }} color="#f59e0b" />
            <EffectSlider label="HIGH" value={eqHigh} onChange={v => { setEqHigh(v); setActivePreset(''); }} color="#22c55e" />
          </div>

          {/* Distortion */}
          <EffectSlider label="DISTORT" value={distortionAmount} onChange={v => { setDistortionAmount(v); setActivePreset(''); }} min={0} max={100} unit="" color="#f43f5e" />
        </div>
      )}

      {/* Save/discard recording */}
      {hasRecording && !isRecording && (
        <div className="flex items-center gap-2 p-2 rounded-md" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
          <span className="text-[9px] font-futuristic text-gray-400 flex-1">
            Recording ready · {formatTime(recTime)} · {((recordingBlobRef.current?.size || 0) / 1024).toFixed(0)}KB
          </span>
          <button onClick={saveRecording} disabled={saving}
            className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-futuristic font-bold tracking-wider transition-all disabled:opacity-50"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e', color: '#22c55e' }}>
            <Save className="w-3 h-3" />
            {saving ? 'SAVING...' : 'SAVE'}
          </button>
          <button onClick={discardRecording}
            className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-futuristic font-bold tracking-wider"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444' }}>
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DJMicrophone;
