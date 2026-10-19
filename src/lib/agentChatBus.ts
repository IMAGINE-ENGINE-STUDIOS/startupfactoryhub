/**
 * SFH Agents -> Genius bubble bridge. When a Call Agents run finishes, the
 * Agents tab publishes the run here; the Genius bubble appends it to its AI
 * conversation (and badges itself when closed) so agent work shows up where
 * the user already chats. Mirrors the districtChatBus pattern.
 */
export interface AgentRunStep {
  agentName: string;
  persona: string;
  output: string;
}

export interface AgentRunPayload {
  agentName: string;
  persona: string;
  task: string;
  steps: AgentRunStep[];
  at: number;
}

const RESULT = "sfh-agents:result";

let current: AgentRunPayload | null = null;

export const agentChatBus = {
  /** The most recent published run, if any. */
  get: () => current,
  /** Agents side: publish a completed run for the Genius bubble. */
  publish(payload: AgentRunPayload) {
    current = payload;
    window.dispatchEvent(new CustomEvent(RESULT, { detail: payload }));
  },
  /** Bubble side: subscribe to completed agent runs. */
  onResult(fn: (p: AgentRunPayload) => void) {
    const h = (e: Event) => fn((e as CustomEvent).detail as AgentRunPayload);
    window.addEventListener(RESULT, h);
    return () => window.removeEventListener(RESULT, h);
  },
};
