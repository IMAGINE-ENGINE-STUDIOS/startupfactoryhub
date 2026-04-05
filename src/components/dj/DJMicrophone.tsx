import { useRef, useState, useCallback, useEffect } from "react";
import { Mic, MicOff, Circle, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDJBroadcast } from "@/hooks/useDJBroadcast";

interface DJMicrophoneProps {
  audioContext: AudioContext | null;
  destination: AudioNode | null;
  disabled: boolean;
  onSaved?: () => void;
}

const DJMicrophone = ({ audioContext, destination, disabled, onSaved }: DJMicrophoneProps) => {
  const { user } = useAuth();
  const { isAdmin } = useDJBroadcast(user?.email);

  const [micActive, setMicActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [saving, setSaving] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingBlobRef = useRef<Blob | null>(null);

  // Broadcast mic state to all users
  const broadcastMicState = useCallback((active: boolean) => {
    if (!isAdmin) return;
    // Use the existing broadcast channel to notify all users
    const channel = supabase.channel('hot-deals-dj-control');
    channel.send({
      type: 'broadcast',
      event: 'mic-state',
      payload: { micActive: active, userName: user?.email },
    });
  }, [isAdmin, user?.email]);

  const startMic = useCallback(async () => {
    if (!audioContext || !destination || disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;

      const source = audioContext.createMediaElementSource
        ? audioContext.createMediaStreamSource(stream)
        : audioContext.createMediaStreamSource(stream);
      micSourceRef.current = source;

      const gain = audioContext.createGain();
      gain.gain.value = 1.0;
      micGainRef.current = gain;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      micAnalyserRef.current = analyser;

      source.connect(gain).connect(analyser).connect(destination);

      setMicActive(true);
      broadcastMicState(true);

      // Level meter
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      levelTimerRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setMicLevel(Math.round((avg / 255) * 100));
      }, 100);
    } catch (err) {
      console.error('Mic access denied:', err);
    }
  }, [audioContext, destination, disabled, broadcastMicState]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    setIsRecording(false);
    if (recTimerRef.current) clearInterval(recTimerRef.current);
  }, []);

  const stopMic = useCallback(() => {
    if (isRecording) stopRecording();
    micSourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    micSourceRef.current = null;
    if (levelTimerRef.current) clearInterval(levelTimerRef.current);
    setMicActive(false);
    setMicLevel(0);
    broadcastMicState(false);
  }, [isRecording, broadcastMicState, stopRecording]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    recChunksRef.current = [];
    recordingBlobRef.current = null;
    setHasRecording(false);

    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) recChunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(recChunksRef.current, { type: 'audio/webm' });
      recordingBlobRef.current = blob;
      setHasRecording(true);
    };
    recorder.start();
    recorderRef.current = recorder;
    setIsRecording(true);
    setRecTime(0);
    recTimerRef.current = setInterval(() => setRecTime(p => p + 1), 1000);
  }, []);

  const saveRecording = useCallback(async () => {
    const blob = recordingBlobRef.current;
    if (!blob || !user?.id) return;
    setSaving(true);
    try {
      const filename = `${user.id}/${Date.now()}-mic-recording.webm`;
      const { error: uploadErr } = await supabase.storage
        .from('dj-recordings')
        .upload(filename, blob, { contentType: 'audio/webm', upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('dj-recordings').getPublicUrl(filename);

      await supabase.from('dj_recordings' as any).insert({
        user_id: user.id,
        title: `Mic Recording ${new Date().toLocaleString()}`,
        file_url: urlData.publicUrl,
        storage_path: filename,
        duration_seconds: recTime,
        file_size: blob.size,
        recording_type: 'mic',
      } as any);

      recordingBlobRef.current = null;
      setHasRecording(false);
      setRecTime(0);
      onSaved?.();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [user?.id, recTime, onSaved]);

  const discardRecording = useCallback(() => {
    recordingBlobRef.current = null;
    setHasRecording(false);
    setRecTime(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (levelTimerRef.current) clearInterval(levelTimerRef.current);
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

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

      <div className="flex items-center gap-2">
        {/* Mic toggle */}
        <button
          onClick={micActive ? stopMic : startMic}
          disabled={disabled}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
          style={{
            background: micActive
              ? 'radial-gradient(circle at 40% 35%, #ef4444, #991b1b)'
              : 'radial-gradient(circle at 40% 35%, #22c55e, #15803d)',
            border: '3px solid #444',
            boxShadow: micActive ? '0 0 20px rgba(239,68,68,0.4)' : '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {micActive ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
        </button>

        {/* Level meter */}
        {micActive && (
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-3 rounded-full overflow-hidden" style={{ background: '#0a0a0a', border: '1px solid #2a2a2a' }}>
              <div className="h-full rounded-full transition-all duration-100" style={{
                width: `${micLevel}%`,
                background: micLevel > 80 ? 'linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)' :
                  micLevel > 50 ? 'linear-gradient(90deg, #22c55e, #f59e0b)' : '#22c55e',
              }} />
            </div>
            <span className="text-[7px] font-mono text-gray-500 tabular-nums">{micLevel}%</span>
          </div>
        )}

        {/* Record button */}
        {micActive && (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded transition-all"
            style={{
              background: isRecording ? 'rgba(220,38,38,0.2)' : '#1a1a1a',
              border: `2px solid ${isRecording ? '#ef4444' : '#333'}`,
            }}
          >
            <Circle className="w-3 h-3" style={{ color: isRecording ? '#ef4444' : '#666', fill: isRecording ? '#ef4444' : 'none' }} />
            <span className="text-[9px] font-futuristic tracking-wider font-bold" style={{ color: isRecording ? '#ef4444' : '#666' }}>
              {isRecording ? formatTime(recTime) : 'REC'}
            </span>
          </button>
        )}
      </div>

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
