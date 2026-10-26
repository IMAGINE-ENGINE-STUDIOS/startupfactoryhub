// @ts-nocheck -- background document building for conversational actions.
/**
 * Founder directive 2026-10-26: when a user asks any agent (Chairman,
 * CEO, Manager, a desk agent, Genius) for a report or document, the
 * WRITER — the reports/documents specialist — builds it in LightPaper
 * in the background; when ready it is delivered through the chat and
 * filed in the executives' Reports tab.
 *
 * This module is the shared builder every surface executor calls:
 * author (Writer run, or the LightPaper document engine as fallback)
 * -> markdown to HTML -> save as a LightPaper project -> register in
 * the org reports store when a floor context exists.
 */
import { supabase } from "@/integrations/supabase/client";
import { getAIHeaders } from "@/lib/aiAuth";
import { registerReport } from "@/imagine-studio/lib/org";

export const DOC_TASK = (title: string, brief: string) =>
  `You are the Writer — the reports and documents specialist. Write the COMPLETE document requested below, in markdown, full length and properly structured with headings, sections and specifics. No preamble, no questions, no placeholders — the finished document only.\n\nTitle: ${title}\n\nBrief: ${brief}`;

const DOC_WRITER_SYSTEM =
  "You are the Writer — the reports and documents specialist inside LightPaper. When asked for a document, write the COMPLETE document immediately in markdown: full length, properly structured with headings, sections and specifics. Never ask clarifying questions, never use placeholders, never add preamble about what you are about to do — output the finished document only.";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Compact markdown -> HTML for the LightPaper editor (headings,
 * paragraphs, lists, bold/italic, rules). Dependency-free on purpose. */
export function mdToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;
  const inline = (t: string) =>
    escapeHtml(t)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  const closeList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeList();
      const lvl = Math.min(h[1].length + 1, 5);
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      continue;
    }
    const li = line.match(/^\s*[-*]\s+(.*)$/) || line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (li) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inline(li[1])}</li>`);
      continue;
    }
    closeList();
    if (!line.trim()) continue;
    if (/^---+$/.test(line.trim())) { out.push("<hr/>"); continue; }
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join("\n");
}

/** Fallback author: the LightPaper document engine itself, collected
 * from its stream. Used where no Writer agent is on hand. */
export async function authorViaLightPaper(title: string, brief: string): Promise<string> {
  const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lightpaper-genius`, {
    method: "POST",
    headers: await getAIHeaders(),
    body: JSON.stringify({
      messages: [{ role: "user", content: `Write this document now.\n\nTitle: ${title}\n\nBrief: ${brief}` }],
      systemOverride: DOC_WRITER_SYSTEM,
      language: "en",
    }),
  });
  if (!resp.ok || !resp.body) throw new Error(`The document engine could not start (status ${resp.status}).`);
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  const handle = (rawLine: string) => {
    let line = rawLine;
    if (line.endsWith("\r")) line = line.slice(0, -1);
    if (!line.startsWith("data: ")) return;
    const j = line.slice(6).trim();
    if (!j || j === "[DONE]") return;
    try {
      const c = JSON.parse(j).choices?.[0]?.delta?.content;
      if (c) full += c;
    } catch { /* partial line stays buffered */ }
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      handle(buffer.slice(0, idx));
      buffer = buffer.slice(idx + 1);
    }
  }
  for (const raw of buffer.split("\n")) handle(raw);
  return full.trim();
}

export interface BuiltDocument {
  id: string;
  title: string;
  summary: string;
  url: string;
}

/** Build + file a document. Throws with a human message on failure. */
export async function buildDocument(opts: {
  title: string;
  brief: string;
  authorRun: () => Promise<string>;
  floor?: { floorKey: string; floorId: number; company: string } | null;
}): Promise<BuiltDocument> {
  const title = (opts.title || "Untitled document").slice(0, 120);
  const markdown = (await opts.authorRun()).trim();
  if (!markdown) throw new Error("The Writer came back empty — no document was built.");
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) throw new Error("Sign in to build documents.");
  const html = mdToHtml(markdown);
  const { data, error } = await supabase
    .from("lightpaper_projects")
    .insert({
      user_id: userId,
      project_type: "document",
      title,
      content: { html, pages: [], font: "Georgia", size: 14, darkMode: false, currentPage: 1 },
    })
    .select("id")
    .single();
  if (error) throw new Error(`Saving to LightPaper failed: ${error.message}`);
  if (opts.floor) {
    try {
      registerReport(
        { floorKey: opts.floor.floorKey, floorId: opts.floor.floorId, company: opts.floor.company, goal: opts.brief.slice(0, 200), report: markdown },
        [],
      );
    } catch { /* the reports filing is a bonus; the document itself is saved */ }
  }
  const plain = markdown.replace(/[#>*`_-]/g, "").replace(/\s+/g, " ").trim();
  return {
    id: String(data.id),
    title,
    summary: plain.slice(0, 220),
    url: `/lightpaper?project=${data.id}`,
  };
}

/** The chat delivery line for a finished document (markdown). */
export function documentDelivery(doc: BuiltDocument): string {
  return `📄 **${doc.title}** — ready.\n\n${doc.summary}…\n\n[Open in LightPaper](${doc.url})`;
}
