import { useState, useEffect, useRef, useCallback } from 'react';

export interface CameraSnapshot {
  url: string;
  timestamp: number;
  blob?: Blob;
}

interface UseCameraTimelineOptions {
  imageUrl: string;
  proxyUrl: string | null;
  refreshRate: number;
  isStream: boolean;
  maxSnapshots?: number;
}

/**
 * Records camera snapshots over time for timeline playback.
 * Each snapshot = proxied image + timestamp.
 */
export const useCameraTimeline = ({
  imageUrl,
  proxyUrl,
  refreshRate,
  isStream,
  maxSnapshots = 600, // ~10 minutes at 1s refresh
}: UseCameraTimelineOptions) => {
  const [snapshots, setSnapshots] = useState<CameraSnapshot[]>([]);
  const [isRecording, setIsRecording] = useState(true);
  const snapshotsRef = useRef<CameraSnapshot[]>([]);
  const recordingRef = useRef(true);

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
      
      // Trim to max
      if (updated.length > maxSnapshots) {
        const removed = updated.shift();
        if (removed) URL.revokeObjectURL(removed.url);
      }

      snapshotsRef.current = updated;
      setSnapshots([...updated]);
    } catch {
      // Silently skip failed captures
    }
  }, [imageUrl, proxyUrl, isStream, maxSnapshots]);

  // Auto-record at refresh rate
  useEffect(() => {
    if (isStream) return;
    
    // Capture immediately
    captureSnapshot();

    const interval = setInterval(captureSnapshot, refreshRate * 1000);
    return () => clearInterval(interval);
  }, [captureSnapshot, refreshRate, isStream]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      snapshotsRef.current.forEach(s => URL.revokeObjectURL(s.url));
      snapshotsRef.current = [];
    };
  }, []);

  const toggleRecording = useCallback(() => {
    recordingRef.current = !recordingRef.current;
    setIsRecording(recordingRef.current);
  }, []);

  const clearHistory = useCallback(() => {
    snapshotsRef.current.forEach(s => URL.revokeObjectURL(s.url));
    snapshotsRef.current = [];
    setSnapshots([]);
  }, []);

  return {
    snapshots,
    isRecording,
    toggleRecording,
    clearHistory,
    snapshotCount: snapshots.length,
  };
};
