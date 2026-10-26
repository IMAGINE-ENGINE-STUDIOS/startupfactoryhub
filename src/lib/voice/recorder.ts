// @ts-nocheck -- voice core: microphone capture with silence endpointing.
/**
 * One small recorder used by both the mic button (tap to start, tap to
 * stop) and the realtime Talk loop (auto-stop after a silence gap, so a
 * spoken message "sends itself" the way a phone call works).
 */
export class MicRecorder {
  private stream: MediaStream | null = null;
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private analyser: AnalyserNode | null = null;
  private audioCtx: AudioContext | null = null;
  private timer: number | null = null;
  recording = false;

  private mime(): string {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4", ""];
    for (const c of candidates) {
      if (!c) return "";
      try { if (MediaRecorder.isTypeSupported(c)) return c; } catch { /* try next */ }
    }
    return "";
  }

  /**
   * Start capturing. opts.autoStopSilenceMs: stop automatically after
   * that much continuous near-silence (post-first-sound). onLevel gets
   * an RMS value ~0..1 for meters/pulses.
   */
  async start(opts: { autoStopSilenceMs?: number; onLevel?: (rms: number) => void; onAutoStop?: () => void } = {}): Promise<void> {
    if (this.recording) return;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    this.chunks = [];
    const mimeType = this.mime();
    this.rec = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
    this.rec.ondataavailable = (e) => { if (e.data?.size) this.chunks.push(e.data); };
    // Level metering + silence endpointing.
    try {
      const AC: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AC();
      const src = this.audioCtx.createMediaStreamSource(this.stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      src.connect(this.analyser);
      const data = new Uint8Array(this.analyser.fftSize);
      const startedAt = performance.now();
      let lastSoundAt = startedAt;
      const tick = () => {
        if (!this.recording || !this.analyser) return;
        this.analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / data.length);
        opts.onLevel?.(rms);
        if (rms > 0.035) lastSoundAt = performance.now();
        const now = performance.now();
        if (
          opts.autoStopSilenceMs &&
          now - startedAt > 900 &&
          now - lastSoundAt > opts.autoStopSilenceMs
        ) {
          opts.onAutoStop?.();
          return;
        }
        this.timer = window.setTimeout(tick, 110);
      };
      tick();
    } catch { /* metering is decorative — recording continues without it */ }
    this.rec.start(250);
    this.recording = true;
  }

  /** Stop and return the recorded audio blob (empty blob if nothing ran). */
  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (this.timer) { clearTimeout(this.timer); this.timer = null; }
      this.recording = false;
      const rec = this.rec;
      const type = rec?.mimeType || "audio/webm";
      const done = () => {
        this.teardown();
        resolve(new Blob(this.chunks, { type }));
      };
      if (rec && rec.state !== "inactive") {
        rec.onstop = done;
        try { rec.stop(); } catch { done(); }
      } else done();
    });
  }

  cancel() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.recording = false;
    if (this.rec && this.rec.state !== "inactive") {
      this.rec.onstop = () => this.teardown();
      try { this.rec.stop(); } catch { this.teardown(); }
    } else this.teardown();
    this.chunks = [];
  }

  private teardown() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.rec = null;
    this.analyser = null;
    if (this.audioCtx) { void this.audioCtx.close().catch(() => {}); this.audioCtx = null; }
  }
}

export function micSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
}
