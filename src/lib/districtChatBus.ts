/**
 * District chat bridge between a district view (e.g. the Plaza) and the
 * Genius bubble. The district owns the live connection; the bubble only
 * renders the messages and sends text back through window events.
 */
export type DistrictChatMsg = { from: string; text: string; at: number; me?: boolean };
export type DistrictChatState = { id: string; title: string; msgs: DistrictChatMsg[]; online: number } | null;

const STATE = 'district-chat:state';
const OPEN = 'district-chat:open';
const SEND = 'district-chat:send';

let current: DistrictChatState = null;

export const districtChat = {
  get: () => current,
  /** District side: publish the latest chat state (null when leaving). */
  publish(state: DistrictChatState) {
    current = state;
    window.dispatchEvent(new CustomEvent(STATE, { detail: state }));
  },
  /** District side: ask the Genius bubble to open on the district tab. */
  open() { window.dispatchEvent(new CustomEvent(OPEN)); },
  /** Bubble side: send a message into the district. */
  send(text: string) { window.dispatchEvent(new CustomEvent(SEND, { detail: text })); },
  onState(fn: (s: DistrictChatState) => void) {
    const h = (e: Event) => fn((e as CustomEvent).detail);
    window.addEventListener(STATE, h); return () => window.removeEventListener(STATE, h);
  },
  onOpen(fn: () => void) { window.addEventListener(OPEN, fn); return () => window.removeEventListener(OPEN, fn); },
  onSend(fn: (t: string) => void) {
    const h = (e: Event) => fn(String((e as CustomEvent).detail || ''));
    window.addEventListener(SEND, h); return () => window.removeEventListener(SEND, h);
  },
};
