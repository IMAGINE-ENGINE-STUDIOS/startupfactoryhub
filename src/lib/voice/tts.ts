// @ts-nocheck -- voice core: talk-back (text-to-speech) with role personas.
/**
 * Talk-back (founder directive 2026-10-25): Genius and the agents speak
 * their replies out loud, with a voice matched to the agent's ROLE, so a
 * realtime conversation feels like talking to different people.
 *
 * Engine of this first ship: the voices BUILT INTO the visitor's device
 * (SpeechSynthesis) — zero download, zero hosting, zero services, works
 * on every phone and computer today. The self-hosted neural voice
 * (Kokoro) plugs in behind this same speak() interface later; nothing
 * at the call sites changes.
 */

export type VoicePersona = {
  id: string;
  pitch: number; // 0..2, 1 = natural
  rate: number; // 0.5..2, 1 = natural
  /** Voice-name fragments to prefer, best first (matched loosely). */
  prefer: string[];
};

/** Role → voice character. Matched by keyword on the agent's role/name. */
const PERSONAS: { match: RegExp; persona: VoicePersona }[] = [
  { match: /chairman/i, persona: { id: "chairman", pitch: 0.72, rate: 0.92, prefer: ["daniel", "arthur", "george", "david", "male"] } },
  { match: /\bceo\b|chief executive/i, persona: { id: "ceo", pitch: 0.85, rate: 0.97, prefer: ["samantha", "zira", "google uk english female", "female"] } },
  { match: /manager|director/i, persona: { id: "manager", pitch: 0.8, rate: 1.0, prefer: ["daniel", "david", "google us english", "male"] } },
  { match: /concierge|closer|outreach|marketer|social/i, persona: { id: "bright", pitch: 1.12, rate: 1.03, prefer: ["samantha", "zira", "aria", "female"] } },
  { match: /analyst|architect|research|engineer|builder|guardian|legal|finance/i, persona: { id: "steady", pitch: 0.95, rate: 0.98, prefer: ["george", "david", "google uk english male", "male"] } },
  { match: /writer|designer|ideator|planner/i, persona: { id: "warm", pitch: 1.05, rate: 1.0, prefer: ["samantha", "aria", "zira", "female"] } },
];

export const DEFAULT_PERSONA: VoicePersona = { id: "genius", pitch: 1.0, rate: 1.0, prefer: ["samantha", "google us english", "zira"] };

export function personaFor(roleText?: string | null): VoicePersona {
  const t = String(roleText || "");
  for (const p of PERSONAS) if (p.match.test(t)) return p.persona;
  return DEFAULT_PERSONA;
}

/* ---------------- voice list (loads async in every browser) -------- */

let voicesCache: SpeechSynthesisVoice[] = [];
function refreshVoices() {
  try { voicesCache = window.speechSynthesis?.getVoices() || []; } catch { voicesCache = []; }
}
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

function pickVoice(persona: VoicePersona): SpeechSynthesisVoice | null {
  const vs = voicesCache.length ? voicesCache : (window.speechSynthesis?.getVoices() || []);
  const en = vs.filter((v) => /^en([-_]|$)/i.test(v.lang));
  const pool = en.length ? en : vs;
  for (const hint of persona.prefer) {
    const hit = pool.find((v) => v.name.toLowerCase().includes(hint));
    if (hit) return hit;
  }
  return pool.find((v) => v.default) || pool[0] || null;
}

/* ---------------- speaking ------------------------------------------ */

let speakSeq = 0;

/** Strip markdown so replies are spoken, not spelled out. */
export function stripForSpeech(text: string): string {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " link ")
    .replace(/[#>*_~|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function chunkText(text: string, max = 190): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]*\s*/g) || [text];
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > max && cur) { chunks.push(cur.trim()); cur = s; }
    else cur += s;
    while (cur.length > max) { chunks.push(cur.slice(0, max).trim()); cur = cur.slice(max); }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter(Boolean);
}

export function stopSpeaking() {
  speakSeq++;
  try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Speak text with the persona's voice. Resolves when speech ENDS (the
 * realtime loop chains listening off this). Cancelling via stopSpeaking
 * also resolves it.
 */
export function speak(text: string, persona: VoicePersona = DEFAULT_PERSONA): Promise<void> {
  return new Promise((resolve) => {
    if (!isSpeechSupported()) { resolve(); return; }
    const clean = stripForSpeech(text);
    if (!clean) { resolve(); return; }
    const mySeq = ++speakSeq;
    const synth = window.speechSynthesis;
    synth.cancel();
    const voice = pickVoice(persona);
    const chunks = chunkText(clean);
    let idx = 0;
    const next = () => {
      if (mySeq !== speakSeq) { resolve(); return; } // superseded/cancelled
      if (idx >= chunks.length) { resolve(); return; }
      const u = new SpeechSynthesisUtterance(chunks[idx++]);
      if (voice) u.voice = voice;
      u.pitch = persona.pitch;
      u.rate = persona.rate;
      u.onend = next;
      u.onerror = next;
      synth.speak(u);
    };
    next();
  });
}
