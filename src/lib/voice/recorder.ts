// @ts-nocheck -- voice core: microphone capture with silence endpointing.
/**
 * One small recorder used by both the mic button (tap to start, tap to
 * stop) and the realtime Talk loop (auto-stop after a silence gap, so a
 * spoken message "sends itself" the way a phone call works).
 */
/** Turn a getUserMedia failure into a message that names the actual
 * cause — permission, missing device, or a busy mic read very
 * differently to the person holding the phone. */
export function micErrorMessage(e: any): string {
  const name = e?.name || "";
  if (name === "NotAllowedError" || /denied|permission/i.test(e?.message || "")) {
    return "Microphone permission was denied — allow the mic for this site, then try again.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No microphone was found on this device.";
  if (name === "NotReadableError" || name === "AbortError") return "The microphone could not be opened — it may be in use by another app or call.";
  return e?.message ? `Microphone error: ${e.message}` : `Could not open the microphone${name ? ` (${name})` : ""}.`;
}

export class MicRecorder {
  private stream: MediaStream | null = null;
  private ownStream = true;

  /** Open the microphone NOW. Callers on mobile must do this inside
   * the tap, before any long await: iOS Safari can refuse getUserMedia
   * once a multi-minute model download has sat between the user's tap
   * and the request ("could not open the microphone", 2026-10-25). */
  static async acquire(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  }

  static release(stream: MediaStream | null | undefined) {
    try { stream?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
  }
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
  async start(opts: { autoStopSilenceMs?: number; noSpeechMs?: number; maxMs?: number; stream?: MediaStream; onLevel?: (rms: number) => void; onAutoStop?: (reason: "silence" | "no-speech" | "max") => void } = {}): Promise<void> {
    if (this.recording) return;
    /* A pre-acquired stream (see acquire()) is borrowed, never stopped
     * by teardown — its owner manages its lifetime. */
    this.ownStream = !opts.stream;
    this.stream = opts.stream ?? (await MicRecorder.acquire());
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
      let heardSpeech = false;
      let loudTicks = 0;
      const tick = () => {
        if (!this.recording || !this.analyser) return;
        this.analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / data.length);
        opts.onLevel?.(rms);
        /* Speech = two consecutive loud ticks (debounces clicks and
         * coughs). BEFORE any speech, silence must NOT end the turn:
         * the old logic stopped at ~1.6s whether or not the user had
         * said a word — Talk "transcribed before I even speak", and
         * the user's real reply landed while the mic was closed for
         * that empty transcription (founder report 2026-10-25). */
        if (rms > 0.025) { loudTicks++; if (loudTicks >= 2) heardSpeech = true; lastSoundAt = performance.now(); }
        else loudTicks = 0;
        const now = performance.now();
        if (
          opts.autoStopSilenceMs &&
          heardSpeech &&
          now - lastSoundAt > opts.autoStopSilenceMs
        ) {
          opts.onAutoStop?.("silence");
          return;
        }
        // No speech at all for a long while: recycle quietly (the
        // caller re-listens; nothing is transcribed from dead air
        // unless the caller chooses to).
        if (!heardSpeech && opts.noSpeechMs && now - startedAt > opts.noSpeechMs) {
          opts.onAutoStop?.("no-speech");
          return;
        }
        // Failsafe: never record without end, whatever the meter says.
        if (opts.maxMs && now - startedAt > opts.maxMs) {
          opts.onAutoStop?.("max");
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
    if (this.ownStream) this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.rec = null;
    this.analyser = null;
    if (this.audioCtx) { void this.audioCtx.close().catch(() => {}); this.audioCtx = null; }
  }
}

export function micSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
}
