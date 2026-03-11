import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CameraSnapshot {
  url: string;
  timestamp: number;
  blob?: Blob;
  persisted?: boolean; // true if saved to Supabase Storage
}

interface UseCameraTimelineOptions {
  imageUrl: string;
  proxyUrl: string | null;
  refreshRate: number;
  isStream: boolean;
  cameraId?: string;
  maxSnapshots?: number;
}

/**
 * Records camera snapshots over time for timeline playback.
 * Persists snapshots to Supabase Storage for historical access.
 */
export const useCameraTimeline = ({
  imageUrl,
  proxyUrl,
  refreshRate,
  isStream,
  cameraId,
  maxSnapshots = 600,
}: UseCameraTimelineOptions) => {
  const [snapshots, setSnapshots] = useState<CameraSnapshot[]>([]);
  const [isRecording, setIsRecording] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const snapshotsRef = useRef<CameraSnapshot[]>([]);
  const recordingRef = useRef(true);
  const persistQueueRef = useRef<CameraSnapshot[]>([]);
  const persistingRef = useRef(false);
  const persistCountRef = useRef(0);
  const cameraIdRef = useRef(cameraId);

  // Keep cameraIdRef in sync
  cameraIdRef.current = cameraId;

  // Persist a snapshot to Supabase Storage (runs in background)
  const persistSnapshot = useCallback(async (snap: CameraSnapshot) => {
    if (!cameraId || !snap.blob) return;

    try {
      const date = new Date(snap.timestamp);
      const dateStr = date.toISOString().split('T')[0];
      const path = `${cameraId}/${dateStr}/${snap.timestamp}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('camera-snapshots')
        .upload(path, snap.blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) return;

      // Record metadata
      await supabase.from('camera_snapshots' as any).insert({
        camera_id: cameraId,
        captured_at: date.toISOString(),
        storage_path: path,
        file_size: snap.blob.size,
      });

      snap.persisted = true;
    } catch {
      // Silently fail persistence — in-memory still works
    }
  }, [cameraId]);

  // Background persist queue processor — saves every 3rd snapshot (every ~45s at 15s refresh)
  const processPersistQueue = useCallback(async () => {
    if (persistingRef.current || persistQueueRef.current.length === 0) return;
    persistingRef.current = true;

    while (persistQueueRef.current.length > 0) {
      const snap = persistQueueRef.current.shift();
      if (snap) await persistSnapshot(snap);
    }

    persistingRef.current = false;
  }, [persistSnapshot]);

  // Capture a snapshot
  const captureSnapshot = useCallback(async () => {
    if (!proxyUrl || isStream || !recordingRef.current) return;

    const ts = Date.now();
    const url = `${proxyUrl}?url=${encodeURIComponent(imageUrl)}&_t=${ts}`;

    try {
      const resp = await fetch(url);
      if (!resp.ok) return;
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);

      const snap: CameraSnapshot = { url: objectUrl, timestamp: ts, blob };
      const updated = [...snapshotsRef.current, snap];

      if (updated.length > maxSnapshots) {
        const removed = updated.shift();
        if (removed) URL.revokeObjectURL(removed.url);
      }

      snapshotsRef.current = updated;
      setSnapshots([...updated]);

      // Queue for persistence every 3rd capture
      persistCountRef.current++;
      if (cameraId && persistCountRef.current % 3 === 0) {
        persistQueueRef.current.push(snap);
        processPersistQueue();
      }
    } catch {
      // Silently skip failed captures
    }
  }, [imageUrl, proxyUrl, isStream, maxSnapshots, cameraId, processPersistQueue]);

  // Load historical snapshots from Supabase Storage
  const loadHistory = useCallback(async (fromTime: Date, toTime: Date): Promise<CameraSnapshot[]> => {
    if (!cameraId) return [];
    setIsLoadingHistory(true);

    try {
      const { data: records, error } = await supabase
        .from('camera_snapshots' as any)
        .select('*')
        .eq('camera_id', cameraId)
        .gte('captured_at', fromTime.toISOString())
        .lte('captured_at', toTime.toISOString())
        .order('captured_at', { ascending: true })
        .limit(500);

      if (error || !records || records.length === 0) {
        setIsLoadingHistory(false);
        return [];
      }

      const historicalSnaps: CameraSnapshot[] = [];

      for (const record of records as any[]) {
        const { data: urlData } = supabase.storage
          .from('camera-snapshots')
          .getPublicUrl(record.storage_path);

        if (urlData?.publicUrl) {
          historicalSnaps.push({
            url: urlData.publicUrl,
            timestamp: new Date(record.captured_at).getTime(),
            persisted: true,
          });
        }
      }

      setIsLoadingHistory(false);
      return historicalSnaps;
    } catch {
      setIsLoadingHistory(false);
      return [];
    }
  }, [cameraId]);

  // Load history and merge with current snapshots
  const loadHistoryRange = useCallback(async (fromTime: Date, toTime: Date) => {
    const historicalSnaps = await loadHistory(fromTime, toTime);
    if (historicalSnaps.length === 0) return 0;

    // Merge historical + current, dedupe by timestamp
    const existingTs = new Set(snapshotsRef.current.map(s => s.timestamp));
    const newSnaps = historicalSnaps.filter(s => !existingTs.has(s.timestamp));
    const merged = [...newSnaps, ...snapshotsRef.current].sort((a, b) => a.timestamp - b.timestamp);

    // Trim to max
    while (merged.length > maxSnapshots * 2) {
      const removed = merged.shift();
      if (removed && !removed.persisted) URL.revokeObjectURL(removed.url);
    }

    snapshotsRef.current = merged;
    setSnapshots([...merged]);
    return newSnaps.length;
  }, [loadHistory, maxSnapshots]);

  // Get count of stored snapshots for time ranges
  const getHistoryStats = useCallback(async (): Promise<{ total: number; oldestAt: string | null }> => {
    if (!cameraId) return { total: 0, oldestAt: null };

    try {
      const { data, error } = await supabase
        .from('camera_snapshots' as any)
        .select('captured_at')
        .eq('camera_id', cameraId)
        .order('captured_at', { ascending: true })
        .limit(1);

      const { count } = await supabase
        .from('camera_snapshots' as any)
        .select('*', { count: 'exact', head: true })
        .eq('camera_id', cameraId);

      return {
        total: count || 0,
        oldestAt: (data && data.length > 0) ? (data[0] as any).captured_at : null,
      };
    } catch {
      return { total: 0, oldestAt: null };
    }
  }, [cameraId]);

  // Reset snapshots when camera changes
  useEffect(() => {
    snapshotsRef.current.forEach(s => {
      if (!s.persisted) URL.revokeObjectURL(s.url);
    });
    snapshotsRef.current = [];
    persistQueueRef.current = [];
    persistCountRef.current = 0;
    setSnapshots([]);
  }, [cameraId]);

  // Auto-record at refresh rate
  useEffect(() => {
    if (isStream) return;
    captureSnapshot();
    const interval = setInterval(captureSnapshot, refreshRate * 1000);
    return () => clearInterval(interval);
  }, [captureSnapshot, refreshRate, isStream]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      snapshotsRef.current.forEach(s => {
        if (!s.persisted) URL.revokeObjectURL(s.url);
      });
      snapshotsRef.current = [];
    };
  }, []);

  const toggleRecording = useCallback(() => {
    recordingRef.current = !recordingRef.current;
    setIsRecording(recordingRef.current);
  }, []);

  const clearHistory = useCallback(() => {
    snapshotsRef.current.forEach(s => {
      if (!s.persisted) URL.revokeObjectURL(s.url);
    });
    snapshotsRef.current = [];
    setSnapshots([]);
  }, []);

  return {
    snapshots,
    isRecording,
    isLoadingHistory,
    toggleRecording,
    clearHistory,
    snapshotCount: snapshots.length,
    loadHistoryRange,
    getHistoryStats,
  };
};
