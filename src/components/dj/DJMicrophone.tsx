import { useRef, useState, useCallback, useEffect } from "react";
import { Mic, MicOff, Circle, Save, Trash2, Radio, Volume2 } from "lucide-react";
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
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [saving, setSaving] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micGainValue, setMicGainValue] = useState(100);

  const streamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingBlobRef = useRef<Blob | null>(null);
  const announcementChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const broadcastMicState = useCallback((active: boolean, announcement = false) => {
    if (!isAdmin) return;
    const channel = announcementChannelRef.current || supabase.channel('hot-deals-dj-control');
    announcementChannelRef.current = channel;
    channel.send({
      type: 'broadcast',
      event: 'mic-state',
      payload: { micActive: active, announcementLive: announcement, userName: user?.email },
    });
  }, [isAdmin, user?.email]);

  const startMic = useCallback(async () => {
    if (!audioContext || !destination || disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        }
      });
      streamRef.current = stream;

      const source = audioContext.createMediaStreamSource(stream);
      micSourceRef.current = source;

      const gain = audioContext.createGain();
      gain.gain.value = micGainValue / 100;
      micGainRef.current = gain;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      micAnalyserRef.current = analyser;

      source.connect(gain).connect(analyser).connect(destination);

      setMicActive(true);
      broadcastMicState(true);

      // Auto-start recording when mic activates
      setTimeout(() => {
        if (stream.active) {
          recChunksRef.current = [];
          recordingBlobRef.current = null;
          setHasRecording(false);
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
  }, [audioContext, destination, disabled, broadcastMicState, micGainValue]);

  // Update gain in real time
  useEffect(() => {
    if (micGainRef.current) {
      micGainRef.current.gain.value = micGainValue / 100;
    }
  }, [micGainValue]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    setIsRecording(false);
    setIsAnnouncement(false);
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    broadcastMicState(true, false);
  }, [broadcastMicState]);

  const stopMic = useCallback(() => {
    if (isRecording) stopRecording();
    micSourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    micSourceRef.current = null;
    if (levelTimerRef.current) clearInterval(levelTimerRef.current);
    setMicActive(false);
    setMicLevel(0);
    broadcastMicState(false, false);
  }, [isRecording, broadcastMicState, stopRecording]);

  const startRecording = useCallback((announcementMode = false) => {
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

      // Auto-save announcements
      if (announcementMode && user?.id) {
        autoSaveAnnouncement(blob);
      }
    };
    // Record in 250ms chunks to prevent audio cutting
    recorder.start(250);
    recorderRef.current = recorder;
    setIsRecording(true);
    setIsAnnouncement(announcementMode);
    setRecTime(0);
    recTimerRef.current = setInterval(() => setRecTime(p => p + 1), 1000);

    if (announcementMode) {
      broadcastMicState(true, true);
    }
  }, [broadcastMicState, user?.id]);

  const autoSaveAnnouncement = useCallback(async (blob: Blob) => {
    if (!user?.id) return;
    try {
      const filename = `${user.id}/${Date.now()}-announcement.webm`;
      const { error: uploadErr } = await supabase.storage
        .from('dj-recordings')
        .upload(filename, blob, { contentType: 'audio/webm', upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('dj-recordings').getPublicUrl(filename);
      await supabase.from('dj_recordings' as any).insert({
        user_id: user.id,
        title: `Announcement ${new Date().toLocaleString()}`,
        file_url: urlData.publicUrl,
        storage_path: filename,
        duration_seconds: recTime,
        file_size: blob.size,
        recording_type: 'announcement',
      } as any);
      onSaved?.();
    } catch (err) {
      console.error('Auto-save announcement failed:', err);
    }
  }, [user?.id, recTime, onSaved]);

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
        {micActive && !isAnnouncement && (
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
              {isRecording ? formatTime(recTime) : 'REC'}
            </span>
          </button>
        )}
      </div>

      {/* Gain slider + Announcement button */}
      {micActive && (
        <div className="flex items-center gap-2">
          <Volume2 className="w-3 h-3 text-gray-600" />
          <input type="range" min={0} max={200} value={micGainValue}
            onChange={e => setMicGainValue(Number(e.target.value))}
            className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(90deg, #22c55e 0%, #22c55e ${micGainValue / 2}%, #2a2a2a ${micGainValue / 2}%, #2a2a2a 100%)`,
            }}
          />
          <span className="text-[8px] font-mono text-green-400 tabular-nums w-8">{micGainValue}%</span>

          {/* Announcement toggle */}
          {!isRecording && (
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
                {isAnnouncement ? 'END' : 'ANNOUNCE'}
              </span>
            </button>
          )}
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
