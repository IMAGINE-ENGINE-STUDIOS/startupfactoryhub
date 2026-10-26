// @ts-nocheck
/**
 * AGENT MEMORY — the prompt-side half of the memory build (founder
 * directive 2026-10-26). The durable store (lib/durableStore) makes
 * conversation threads survive reloads; this helper makes the MODEL
 * actually use them: every typed agent surface composes its outgoing
 * message as [memory block] + [the new message], so an agent answers
 * with the conversation in view instead of treating each message as
 * the first one it has ever seen. Voice calls were already seeded
 * from the same persisted thread (AgentBrain history callback) — the
 * thread is the memory, for both paths.
 */

export interface MemoryMsg { role: "user" | "assistant"; content: string }

/**
 * A compact, bounded digest of the conversation so far, phrased as
 * the agent's own memory. Empty string when there is no history yet.
 * Bounded (last 16 turns, per-message and total caps) so a long
 * thread never blows the run's context or the user's credits.
 */
export function memoryBlock(history: MemoryMsg[] | undefined, who: string): string {
  if (!history || !history.length) return "";
  const turns = history
    .filter((m) => m && typeof m.content === "string" && m.content.trim())
    .slice(-16)
    .map((m) => `${m.role === "user" ? "The user" : who}: ${m.content.replace(/\s+/g, " ").slice(0, 700)}`)
    .join("\n");
  if (!turns) return "";
  return (
    `[YOUR MEMORY — our conversation so far, oldest first. You remember all of this: ` +
    `refer back to it naturally and never say you have no memory of it.]\n${turns.slice(-6000)}\n[END OF MEMORY]\n\n`
  );
}
