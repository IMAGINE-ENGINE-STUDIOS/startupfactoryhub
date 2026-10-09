/**
 * Genius 3D bridge between the 3D Studio (owns the scene) and the Genius
 * bubble (renders the conversation). Same pattern as districtChatBus.
 */
export type Studio3DMsg = { role: 'user' | 'assistant'; text: string; at: number; error?: boolean };
export type Studio3DState = {
  levelId: string;
  levelName: string;
  selected: string | null; // selected object name
  objectCount: number;
  busy: boolean;
  msgs: Studio3DMsg[];
} | null;

const STATE = 'studio3d:state';
const OPEN = 'studio3d:open';
const SEND = 'studio3d:send';
let current: Studio3DState = null;

export const studio3d = {
  get: () => current,
  publish(state: Studio3DState) { current = state; window.dispatchEvent(new CustomEvent(STATE, { detail: state })); },
  open() { window.dispatchEvent(new CustomEvent(OPEN)); },
  send(text: string) { window.dispatchEvent(new CustomEvent(SEND, { detail: text })); },
  onState(fn: (s: Studio3DState) => void) {
    const h = (e: Event) => fn((e as CustomEvent).detail);
    window.addEventListener(STATE, h); return () => window.removeEventListener(STATE, h);
  },
  onOpen(fn: () => void) { window.addEventListener(OPEN, fn); return () => window.removeEventListener(OPEN, fn); },
  onSend(fn: (t: string) => void) {
    const h = (e: Event) => fn(String((e as CustomEvent).detail || ''));
    window.addEventListener(SEND, h); return () => window.removeEventListener(SEND, h);
  },
};
