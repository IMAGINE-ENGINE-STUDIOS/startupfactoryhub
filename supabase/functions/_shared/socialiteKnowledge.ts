// SOCIALITE Genius Knowledge — each user's saved memories (faces, scenarios,
// wording, prohibited words/imagery, pitches, logic, pipelines). Active items
// are turned into rules for every Genius call; pictures go as short-lived
// signed links (private bucket "socialite-knowledge", path <owner>/<file>).
import { admin } from "./socialiteVault.ts";

export const KINDS = ["face", "scenario", "wording", "prohibited_words", "prohibited_imagery", "pitch", "logic", "pipeline", "note"] as const;
const LABEL: Record<string, string> = {
  face: "Person to recognise (use their look/name consistently)", scenario: "Scenario / setting to reuse",
  wording: "Preferred wording / tone", prohibited_words: "NEVER use these words or phrases",
  prohibited_imagery: "NEVER show this imagery", pitch: "Pitch to remember", logic: "Business logic / rule",
  pipeline: "Execution pipeline (follow these steps)", note: "Note",
};

export async function loadKnowledge(owner: string, maxImages = 4) {
  const db = admin();
  const { data } = await db.from("socialite_knowledge").select("kind,title,content,image_path").eq("owner_id", owner).eq("active", true).order("created_at").limit(200);
  const rows = data ?? [];
  if (!rows.length) return { text: "", images: [] as string[] };
  let text = "USER KNOWLEDGE — always obey, prohibitions override everything else:\n" +
    rows.map((r: any) => `- [${LABEL[r.kind] ?? r.kind}] ${r.title}${r.content ? `: ${r.content}` : ""}${r.image_path ? " (reference picture attached)" : ""}`).join("\n");
  if (text.length > 12000) text = text.slice(0, 12000);
  const images: string[] = [];
  for (const r of rows.filter((x: any) => x.image_path).slice(0, maxImages)) {
    const s = await db.storage.from("socialite-knowledge").createSignedUrl(r.image_path, 600);
    if (s.data?.signedUrl) images.push(s.data.signedUrl);
  }
  return { text, images };
}
