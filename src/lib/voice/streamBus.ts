// @ts-nocheck -- voice core: direct stream tap for voice-first Talk.
/**
 * The voice-first fast lane (founder directive 2026-10-25: "talk
 * first and let the text for later — the priority is the conversation
 * to be fluid and extremely fast").
 *
 * A streaming chat host (FloatingChat) publishes its reply stream
 * HERE, delta by delta, straight from its fetch reader — before and
 * independently of any React state update. The voice hook subscribes
 * and speaks sentences the moment they exist on the wire. The chat
 * bubbles still render from state exactly as before (the "text for
 * later"); speech simply no longer queues behind the render pipeline.
 */
type Listener = (ev: { id: string; text: string; done: boolean }) => void;

const listeners = new Set<Listener>();
let currentId: string | null = null;

export function beginVoiceStream(id: string) {
  currentId = id;
  for (const fn of Array.from(listeners)) fn({ id, text: "", done: false });
}

export function publishVoiceStream(text: string, done: boolean) {
  if (!currentId) return;
  const id = currentId;
  for (const fn of Array.from(listeners)) fn({ id, text, done });
  if (done) currentId = null;
}

export function subscribeVoiceStream(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
