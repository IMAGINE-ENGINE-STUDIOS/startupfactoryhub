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
  async start(opts: { autoStopSilenceMs?: number; maxMs?: number; onLevel?: (rms: number) => void; onAutoStop?: () => void } = {}): Promise<void> {
    if (this.recording) return;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    this.chunks = [];
    const mimeType = this.mime();
    this.rec = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
    this.rec.ondataavailable = (e) => { if (e.data?.size) this.chunks.push(e.data); };
    /* The flag MUST be set before the metering loop starts: the loop's
     * first tick checks it and returns without rescheduling when false.
     * It used to be set only at the very end of start() — AFTER tick()
     * had already run once and died — so silence endpointing never ran
     * at all and Talk mode recorded forever ("stays listening and
     * that's it", founder report 2026-10-25). */
    this.recording = true;
    // Level metering + silence endpointing.
    try {
      const AC: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AC();
      // Created after async getUserMedia, the context can start
      // suspended — then the analyser reads pure silence and Talk
      // mode would auto-stop mid-sentence. Resume it explicitly.
      if (this.audioCtx.state === "suspended") void this.audioCtx.resume().catch(() => {});
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
        // Failsafe: never record without end, whatever the meter says.
        if (opts.maxMs && now - startedAt > opts.maxMs) {
          opts.onAutoStop?.();
          return;
        }
        this.timer = window.setTimeout(tick, 110);
      };
      tick();
    } catch { /* metering is decorative — recording continues without it */ }
    this.rec.start(250);
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
