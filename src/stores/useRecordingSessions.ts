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
  dbId?: string; // uuid from recording_sessions table
  totalSizeBytes?: number;
  snapshotCount?: number;
  storagePath?: string;
  thumbnailPath?: string;
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
  }) => string;
  
  stopSession: (sessionId: string) => void;
  removeSession: (sessionId: string) => void;
  getActiveSessions: () => RecordingSession[];
  getClosedSessions: () => RecordingSession[];
  addSnapshot: (sessionId: string, snap: CameraSnapshot) => void;
  hasActiveSessionForCamera: (cameraId: string) => boolean;
  getActiveSessionForCamera: (cameraId: string) => RecordingSession | undefined;
  loadDbSessions: (userId: string) => Promise<void>;
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

  startSession: ({ cameraId, cameraName, proxyUrl, imageUrl, refreshRate, userId }) => {
    // Don't create duplicate active sessions for same camera
    const existing = get().sessions.find(s => s.cameraId === cameraId && !s.stoppedAt);
    if (existing) return existing.id;

    const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const session: RecordingSession = {
      id,
      cameraId,
      cameraName,
      startedAt: Date.now(),
      stoppedAt: null,
      snapshots: [],
      proxyUrl,
      imageUrl,
      refreshRate,
      totalSizeBytes: 0,
      snapshotCount: 0,
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

        // Update DB stats
        const currentSession = get().sessions.find(s => s.id === id);
        if (currentSession?.dbId) {
          supabase.rpc('increment_session_stats', {
            p_session_id: currentSession.dbId,
            p_size_bytes: fileSize,
          }).then(() => {});

          // Also increment user storage usage
          if (userId) {
            supabase.rpc('increment_storage_usage', {
              p_user_id: userId,
              p_bytes: fileSize,
            }).then(() => {});
          }
        }
      } catch {
        // skip failed frame
      }
    };

    // Capture first frame immediately, then at interval
    captureFrame();
    const interval = setInterval(captureFrame, refreshRate * 1000);

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

  getActiveSessions: () => get().sessions.filter(s => !s.stoppedAt),
  getClosedSessions: () => get().sessions.filter(s => s.stoppedAt !== null),

  hasActiveSessionForCamera: (cameraId: string) =>
    get().sessions.some(s => s.cameraId === cameraId && !s.stoppedAt),

  getActiveSessionForCamera: (cameraId: string) =>
    get().sessions.find(s => s.cameraId === cameraId && !s.stoppedAt),
}));
