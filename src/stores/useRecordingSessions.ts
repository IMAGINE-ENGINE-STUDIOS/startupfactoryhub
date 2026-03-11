import { create } from 'zustand';
import { CameraSnapshot } from '@/hooks/useCameraTimeline';

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
}

interface RecordingSessionsState {
  sessions: RecordingSession[];
  activeIntervals: Record<string, ReturnType<typeof setInterval>>;
  
  startSession: (params: {
    cameraId: string;
    cameraName: string;
    proxyUrl: string;
    imageUrl: string;
    refreshRate: number;
  }) => string;
  
  stopSession: (sessionId: string) => void;
  removeSession: (sessionId: string) => void;
  getActiveSessions: () => RecordingSession[];
  getClosedSessions: () => RecordingSession[];
  addSnapshot: (sessionId: string, snap: CameraSnapshot) => void;
  hasActiveSessionForCamera: (cameraId: string) => boolean;
  getActiveSessionForCamera: (cameraId: string) => RecordingSession | undefined;
}

export const useRecordingSessions = create<RecordingSessionsState>((set, get) => ({
  sessions: [],
  activeIntervals: {},

  startSession: ({ cameraId, cameraName, proxyUrl, imageUrl, refreshRate }) => {
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
    };

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

        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === id
              ? { ...s, snapshots: [...s.snapshots, snap].slice(-1200) } // max 1200 frames (~5h at 15s)
              : s
          ),
        }));
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

    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === sessionId ? { ...s, stoppedAt: Date.now() } : s
      ),
      activeIntervals: Object.fromEntries(
        Object.entries(state.activeIntervals).filter(([k]) => k !== sessionId)
      ),
    }));
  },

  removeSession: (sessionId: string) => {
    const state = get();
    const session = state.sessions.find(s => s.id === sessionId);
    if (session) {
      // Clean up object URLs
      session.snapshots.forEach(s => {
        if (!s.persisted) URL.revokeObjectURL(s.url);
      });
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
          ? { ...s, snapshots: [...s.snapshots, snap].slice(-1200) }
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
