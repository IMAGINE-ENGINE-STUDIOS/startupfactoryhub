// @ts-nocheck -- voice core: which voice model the user picked.
/**
 * Voice model choice (founder directive 2026-10-25): the mic button
 * carries a dropdown with three models, mapped to the plan tiers of
 * tomorrow — Tiny (Free), Base (Plus), Neural (Premium). While voice is
 * in testing EVERY model is open to everyone; the tier labels are
 * display-only today, and gating, when it comes, will read this same
 * setting. The choice is per-device (localStorage) and applies to every
 * Genius surface, including the Imagine Engine chat (its host-page
 * bridge runs these same engines).
 *
 *   tiny   — ears: Whisper tiny.en (~41 MB) · voice: the device's voices
 *   base   — ears: Whisper base.en (~77 MB) · voice: the device's voices
 *   neural — ears: Whisper base.en · voice: Kokoro-82M neural speech
 *            (~92 MB more) with a distinct voice per agent role
 */
export type VoiceModelId = "tiny" | "base" | "neural";

export interface VoiceModelInfo {
  id: VoiceModelId;
  name: string;
  tagline: string;
  size: string;
  tier: string;
}

export const VOICE_MODELS: VoiceModelInfo[] = [
  { id: "tiny", name: "Tiny", tagline: "Fastest download, good ears", size: "~41 MB", tier: "Free" },
  { id: "base", name: "Base", tagline: "Sharper ears for names and details", size: "~77 MB", tier: "Plus" },
  { id: "neural", name: "Neural", tagline: "Base ears + a real neural voice that talks back", size: "~170 MB", tier: "Premium" },
];

const KEY = "sfh:voice-model:v1";
const EVENT = "sfh:voice-model-changed";

function readStored(): VoiceModelId {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "tiny" || v === "base" || v === "neural") return v;
  } catch { /* private mode — default applies */ }
  /* Neural is the default while testing (founder, 2026-10-25: the device
   * voice "is very computerized" — the realistic neural talk-back is the
   * experience being evaluated). Devices that already picked a model in
   * the dropdown keep their choice; Tiny/Base stay one tap away for a
   * lighter first download. */
  return "neural";
}

let current: VoiceModelId = readStored();

export function getVoiceModel(): VoiceModelId {
  return current;
}

export function setVoiceModel(id: VoiceModelId) {
  current = id;
  try { localStorage.setItem(KEY, id); } catch { /* session only */ }
  try { window.dispatchEvent(new CustomEvent(EVENT, { detail: id })); } catch { /* noop */ }
}

/** Subscribe to changes (same tab via event, other tabs via storage). */
export function onVoiceModelChange(fn: (id: VoiceModelId) => void): () => void {
  const onEvent = (e: any) => fn((e?.detail as VoiceModelId) || readStored());
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { current = readStored(); fn(current); } };
  window.addEventListener(EVENT, onEvent);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onEvent);
    window.removeEventListener("storage", onStorage);
  };
}

/** Which hosted Whisper folder a voice model listens with. */
export function whisperModelId(id: VoiceModelId = current): string {
  return id === "tiny" ? "whisper-tiny.en" : "whisper-base.en";
}

/** Which speech engine a voice model talks back with. */
export function speechEngine(id: VoiceModelId = current): "device" | "kokoro" {
  return id === "neural" ? "kokoro" : "device";
}
