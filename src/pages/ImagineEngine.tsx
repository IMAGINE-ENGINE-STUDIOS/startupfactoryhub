import { useEffect } from "react";

export default function ImagineEngine() {
  useEffect(() => {
    document.title = "Imagine Engine | Startup Factory Hub";
    /* Voice bridge (founder directive 2026-10-25): the Imagine Engine
     * runtime (public/imagine-engine/ai.js) runs inside this iframe and
     * cannot bundle the voice core itself, so the host page exposes it as
     * window.__sfhVoice — self-hosted on-device Whisper transcription +
     * role-voiced speech, the exact same engine every other Genius
     * surface uses. ai.js only records the mic and passes blobs across. */
    let cancelled = false;
    (async () => {
      const [{ transcribeBlob }, { speak, stopSpeaking, personaFor }] = await Promise.all([
        import("@/lib/voice/whisper"),
        import("@/lib/voice/tts"),
      ]);
      if (cancelled) return;
      (window as any).__sfhVoice = {
        transcribe: (blob: Blob) => transcribeBlob(blob),
        speak: (text: string, roleText?: string) => speak(text, personaFor(roleText || "Genius")),
        stopSpeaking: () => stopSpeaking(),
      };
    })();
    return () => {
      cancelled = true;
      if ((window as any).__sfhVoice) delete (window as any).__sfhVoice;
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <iframe
        src="/imagine-engine/app.html"
        title="Imagine Engine"
        allow="microphone"
        className="w-full h-full border-0"
      />
    </div>
  );
}
