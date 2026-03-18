import { useRef, useCallback, useState } from 'react';

interface UseVideoRecorderOptions {
  onRecordingComplete: (blob: Blob, durationMs: number) => void;
}

/**
 * Records a live video stream from an HTMLVideoElement using MediaRecorder API.
 * Produces a WebM video blob for proper video playback.
 */
export const useVideoRecorder = ({ onRecordingComplete }: UseVideoRecorderOptions) => {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback((videoElement: HTMLVideoElement) => {
    if (recorderRef.current?.state === 'recording') return;

    try {
      // captureStream() captures the video element's rendered frames
      const stream = (videoElement as any).captureStream?.() || (videoElement as any).mozCaptureStream?.();
      if (!stream) {
        console.warn('captureStream not supported on this video element');
        return false;
      }

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2_500_000, // 2.5 Mbps
      });

      chunksRef.current = [];
      startTimeRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const duration = Date.now() - startTimeRef.current;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        onRecordingComplete(blob, duration);
        setIsRecording(false);
      };

      recorder.start(1000); // collect data every second
      recorderRef.current = recorder;
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error('Failed to start video recording:', err);
      return false;
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  }, []);

  return { startRecording, stopRecording, isRecording };
};
