import { create } from 'zustand';
import { CameraSnapshot } from '@/hooks/useCameraTimeline';
import { supabase } from '@/integrations/supabase/client';

export interface RecordingSession {
  id: string;
  cameraId: string;
  cameraName: string;
  startedAt: number;
  stoppedAt: number | null;
  snapshots: CameraSnapshot[];
  proxyUrl: string;
  imageUrl: string;
  refreshRate: number;
  // DB fields
  dbId?: string;
  totalSizeBytes?: number;
  snapshotCount?: number;
  storagePath?: string;
  thumbnailPath?: string;
  // Video recording fields (for stream cameras)
  isVideoRecording?: boolean;
  isStream?: boolean;
  videoBlob?: Blob;
  videoUrl?: string;
  videoDurationMs?: number;
}

interface RecordingSessionsState {
  sessions: RecordingSession[];
  activeIntervals: Record<string, ReturnType<typeof setInterval>>;
  dbSessionsLoaded: boolean;
  
  startSession: (params: {
    cameraId: string;
    cameraName: string;
    proxyUrl: string;
    imageUrl: string;
    refreshRate: number;
    userId?: string;
    isStream?: boolean;
    existingSnapshots?: import('@/hooks/useCameraTimeline').CameraSnapshot[];
  }) => string;
  
  stopSession: (sessionId: string) => void;
  removeSession: (sessionId: string) => void;
  getActiveSessions: () => RecordingSession[];
  getClosedSessions: () => RecordingSession[];
  addSnapshot: (sessionId: string, snap: CameraSnapshot) => void;
  setSessionVideo: (sessionId: string, blob: Blob, durationMs: number) => void;
  hasActiveSessionForCamera: (cameraId: string) => boolean;
  getActiveSessionForCamera: (cameraId: string) => RecordingSession | undefined;
  loadDbSessions: (userId: string) => Promise<void>;
  loadSessionSnapshots: (sessionId: string) => Promise<void>;
}

export const useRecordingSessions = create<RecordingSessionsState>((set, get) => ({
  sessions: [],
  activeIntervals: {},
  dbSessionsLoaded: false,

  loadDbSessions: async (userId: string) => {
    if (get().dbSessionsLoaded) return;
    try {
      const { data, error } = await supabase
        .from('recording_sessions' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !data) return;

      const dbSessions: RecordingSession[] = (data as any[]).map(d => ({
        id: `db-${d.id}`,
        dbId: d.id,
        cameraId: d.camera_id,
        cameraName: d.camera_name,
        startedAt: new Date(d.started_at).getTime(),
        stoppedAt: d.stopped_at ? new Date(d.stopped_at).getTime() : null,
        snapshots: [],
        proxyUrl: '',
        imageUrl: '',
        refreshRate: 15,
        totalSizeBytes: d.total_size_bytes || 0,
        snapshotCount: d.snapshot_count || 0,
        storagePath: d.storage_path,
        thumbnailPath: d.thumbnail_path,
      }));

      // Merge with existing in-memory sessions (don't duplicate)
      const existing = get().sessions;
      const existingDbIds = new Set(existing.filter(s => s.dbId).map(s => s.dbId));
      const newDbSessions = dbSessions.filter(s => !existingDbIds.has(s.dbId));

      set({ sessions: [...existing, ...newDbSessions], dbSessionsLoaded: true });
    } catch {
      // silent
    }
  },

  loadSessionSnapshots: async (sessionId: string) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session?.dbId || !session.cameraId) return;
    // Don't reload if we already have in-memory snapshots
    if (session.snapshots.length > 0) return;

    try {
      const { data: records, error } = await supabase
        .from('camera_snapshots' as any)
        .select('*')
        .eq('camera_id', session.cameraId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .gte('captured_at', new Date(session.startedAt).toISOString())
        .lte('captured_at', session.stoppedAt ? new Date(session.stoppedAt).toISOString() : new Date().toISOString())
        .order('captured_at', { ascending: true })
        .limit(5000);

      if (error || !records || records.length === 0) return;

      const snaps: CameraSnapshot[] = [];
      for (const record of records as any[]) {
        const { data: urlData } = supabase.storage
          .from('camera-snapshots')
          .getPublicUrl(record.storage_path);

        if (urlData?.publicUrl) {
          snaps.push({
            url: urlData.publicUrl,
            timestamp: new Date(record.captured_at).getTime(),
            persisted: true,
          });
        }
      }

      if (snaps.length > 0) {
        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === sessionId ? { ...s, snapshots: snaps, snapshotCount: snaps.length } : s
          ),
        }));
      }
    } catch {
      // silent
    }
  },

  startSession: ({ cameraId, cameraName, proxyUrl, imageUrl, refreshRate, userId, isStream, existingSnapshots }) => {
    // Don't create duplicate active sessions for same camera
    const existing = get().sessions.find(s => s.cameraId === cameraId && !s.stoppedAt);
    if (existing) return existing.id;

    const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    
    // Seed with existing timeline snapshots if provided
    const seedSnapshots = existingSnapshots ? [...existingSnapshots] : [];
    const seedSize = seedSnapshots.reduce((acc, s) => acc + (s.blob?.size || 0), 0);
    
    const session: RecordingSession = {
      id,
      cameraId,
      cameraName,
      startedAt: seedSnapshots.length > 0 ? seedSnapshots[0].timestamp : Date.now(),
      stoppedAt: null,
      snapshots: seedSnapshots,
      proxyUrl,
      imageUrl,
      refreshRate,
      isStream: isStream || false,
      totalSizeBytes: seedSize,
      snapshotCount: seedSnapshots.length,
    };

    // Persist to DB
    if (userId) {
      supabase
        .from('recording_sessions' as any)
        .insert({
          user_id: userId,
          camera_id: cameraId,
          camera_name: cameraName,
          started_at: new Date(session.startedAt).toISOString(),
          storage_path: `${cameraId}/${new Date().toISOString().split('T')[0]}`,
          status: 'recording',
        } as any)
        .select()
        .single()
        .then(({ data }) => {
          if (data) {
            set(state => ({
              sessions: state.sessions.map(s =>
                s.id === id ? { ...s, dbId: (data as any).id, storagePath: (data as any).storage_path } : s
              ),
            }));

            // Persist seed snapshots to Storage in background
            const dbId = (data as any).id;
            for (const snap of seedSnapshots) {
              if (!snap.blob) continue;
              const date = new Date(snap.timestamp);
              const dateStr = date.toISOString().split('T')[0];
              const storagePath = `${cameraId}/${dateStr}/${snap.timestamp}.jpg`;
              const snapBlob = snap.blob;
              const snapSize = snapBlob.size;

              supabase.storage
                .from('camera-snapshots')
                .upload(storagePath, snapBlob, { contentType: 'image/jpeg', upsert: true })
                .then(({ error: uploadErr }) => {
                  if (!uploadErr) {
                    supabase.from('camera_snapshots' as any).insert({
                      camera_id: cameraId,
                      user_id: userId,
                      captured_at: date.toISOString(),
                      storage_path: storagePath,
                      file_size: snapSize,
                    } as any).then(() => {});
                  }
                });
            }
          }
        });
    }

    // Start background capture interval
    const captureFrame = async () => {
      const state = get();
      const sess = state.sessions.find(s => s.id === id);
      if (!sess || sess.stoppedAt) return;

      try {
        const ts = Date.now();
        const url = `${proxyUrl}?url=${encodeURIComponent(imageUrl)}&_t=${ts}`;
        const resp = await fetch(url);
        if (!resp.ok) return;
        const blob = await resp.blob();
        const objectUrl = URL.createObjectURL(blob);
        const snap: CameraSnapshot = { url: objectUrl, timestamp: ts, blob };
        const fileSize = blob.size;

        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === id
              ? {
                  ...s,
                  snapshots: [...s.snapshots, snap],
                  totalSizeBytes: (s.totalSizeBytes || 0) + fileSize,
                  snapshotCount: (s.snapshotCount || 0) + 1,
                }
              : s
          ),
        }));

        // Persist snapshot to Supabase Storage + DB
        const currentSession = get().sessions.find(s => s.id === id);
        if (currentSession?.dbId && userId) {
          const date = new Date(ts);
          const dateStr = date.toISOString().split('T')[0];
          const storagePath = `${cameraId}/${dateStr}/${ts}.jpg`;

          supabase.storage
            .from('camera-snapshots')
            .upload(storagePath, blob, { contentType: 'image/jpeg', upsert: true })
            .then(({ error: uploadErr }) => {
              if (!uploadErr) {
                supabase.from('camera_snapshots' as any).insert({
                  camera_id: cameraId,
                  user_id: userId,
                  captured_at: date.toISOString(),
                  storage_path: storagePath,
                  file_size: fileSize,
                } as any).then(() => {});
              }
            });

          supabase.rpc('increment_session_stats', {
            p_session_id: currentSession.dbId,
            p_size_bytes: fileSize,
          }).then(() => {});

          supabase.rpc('increment_storage_usage', {
            p_user_id: userId,
            p_bytes: fileSize,
          }).then(() => {});
        }
      } catch {
        // skip failed frame
      }
    };

    // Only capture frames for non-stream cameras; streams use MediaRecorder via useVideoRecorder
    let interval: ReturnType<typeof setInterval> | null = null;
    if (!isStream) {
      captureFrame();
      interval = setInterval(captureFrame, refreshRate * 1000);
    }

    set(state => ({
      sessions: [...state.sessions, session],
      activeIntervals: { ...state.activeIntervals, [id]: interval },
    }));

    return id;
  },

  stopSession: (sessionId: string) => {
    const interval = get().activeIntervals[sessionId];
    if (interval) clearInterval(interval);

    const session = get().sessions.find(s => s.id === sessionId);

    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === sessionId ? { ...s, stoppedAt: Date.now() } : s
      ),
      activeIntervals: Object.fromEntries(
        Object.entries(state.activeIntervals).filter(([k]) => k !== sessionId)
      ),
    }));

    // Update DB
    if (session?.dbId) {
      supabase
        .from('recording_sessions' as any)
        .update({ stopped_at: new Date().toISOString(), status: 'stopped' } as any)
        .eq('id', session.dbId)
        .then(() => {});
    }
  },

  removeSession: (sessionId: string) => {
    const state = get();
    const session = state.sessions.find(s => s.id === sessionId);
    if (session) {
      // Clean up object URLs
      session.snapshots.forEach(s => {
        if (!s.persisted) URL.revokeObjectURL(s.url);
      });
      // Clean up video URL
      if (session.videoUrl) URL.revokeObjectURL(session.videoUrl);
      // Delete from DB
      if (session.dbId) {
        supabase
          .from('recording_sessions' as any)
          .delete()
          .eq('id', session.dbId)
          .then(() => {});
      }
    }
    const interval = state.activeIntervals[sessionId];
    if (interval) clearInterval(interval);

    set(state => ({
      sessions: state.sessions.filter(s => s.id !== sessionId),
      activeIntervals: Object.fromEntries(
        Object.entries(state.activeIntervals).filter(([k]) => k !== sessionId)
      ),
    }));
  },

  addSnapshot: (sessionId: string, snap: CameraSnapshot) => {
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === sessionId
          ? { ...s, snapshots: [...s.snapshots, snap] }
          : s
      ),
    }));
  },

  setSessionVideo: (sessionId: string, blob: Blob, durationMs: number) => {
    const videoUrl = URL.createObjectURL(blob);
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === sessionId
          ? { ...s, videoBlob: blob, videoUrl, videoDurationMs: durationMs, isVideoRecording: true, totalSizeBytes: blob.size }
          : s
      ),
    }));
  },

  getActiveSessions: () => get().sessions.filter(s => !s.stoppedAt),
  getClosedSessions: () => get().sessions.filter(s => s.stoppedAt !== null),

  hasActiveSessionForCamera: (cameraId: string) =>
    get().sessions.some(s => s.cameraId === cameraId && !s.stoppedAt),

  getActiveSessionForCamera: (cameraId: string) =>
    get().sessions.find(s => s.cameraId === cameraId && !s.stoppedAt),
}));
