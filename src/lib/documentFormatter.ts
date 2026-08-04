/**
 * Converts Genius AI markdown into properly structured document HTML.
 *
 * The previous converter emitted bare <h1>/<p>/<li> tags with no typographic
 * rules, so generated documents looked like a raw chat answer instead of a
 * formatted document. This module produces block-level, print-ready HTML with
 * document typography: chapter headings, justified body copy, real lists,
 * header-row tables, blockquotes and callouts.
 */

const STYLES = {
  h1: "font-size:22pt;font-weight:700;line-height:1.25;margin:0 0 14pt;padding-bottom:6pt;border-bottom:1px solid rgba(0,0,0,.18);letter-spacing:-.2px;",
  h2: "font-size:16pt;font-weight:700;line-height:1.3;margin:18pt 0 8pt;",
  h3: "font-size:13pt;font-weight:600;line-height:1.35;margin:14pt 0 6pt;",
  h4: "font-size:11.5pt;font-weight:600;line-height:1.35;margin:12pt 0 4pt;text-transform:uppercase;letter-spacing:.6px;",
  p: "font-size:11pt;line-height:1.6;margin:0 0 10pt;text-align:justify;hyphens:auto;",
  ul: "margin:0 0 10pt 0;padding-left:20pt;",
  ol: "margin:0 0 10pt 0;padding-left:20pt;",
  li: "font-size:11pt;line-height:1.55;margin:0 0 4pt;",
  table: "width:100%;border-collapse:collapse;margin:12pt 0;font-size:10pt;",
  th: "border:1px solid rgba(0,0,0,.25);padding:6pt 8pt;text-align:left;font-weight:700;background:rgba(0,0,0,.05);",
  td: "border:1px solid rgba(0,0,0,.2);padding:6pt 8pt;vertical-align:top;",
  quote:
    "margin:12pt 0;padding:8pt 12pt;border-left:3px solid rgba(0,0,0,.35);font-style:italic;line-height:1.55;font-size:10.5pt;",
  hr: "border:none;border-top:1px solid rgba(0,0,0,.2);margin:14pt 0;",
  code: "font-family:'Courier New',monospace;font-size:9.5pt;background:rgba(0,0,0,.05);padding:8pt;white-space:pre-wrap;margin:10pt 0;border-radius:4px;",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Inline markdown: bold, italics, code, links. */
function inline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code style="font-family:\'Courier New\',monospace;font-size:.92em;">$1</code>')
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)([^*]+?)\*/g, "$1<em>$2</em>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>');
}

function isTableRow(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line);
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

/**
 * Block-level markdown -> document HTML.
 */
export function markdownToDocumentHtml(md: string): string {
  if (!md) return "";
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = inline(paragraph.join(" ").trim());
    if (text) out.push(`<p style="${STYLES.p}">${text}</p>`);
    paragraph = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line -> paragraph break
    if (!trimmed) {
      flushParagraph();
      i++;
      continue;
    }

    // Fenced code block
    if (/^```/.test(trimmed)) {
      flushParagraph();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      out.push(`<pre style="${STYLES.code}">${escapeHtml(buf.join("\n"))}</pre>`);
      continue;
    }

    // Horizontal rule
    if (/^(\*\s*){3,}$|^(-\s*){3,}$|^(_\s*){3,}$/.test(trimmed)) {
      flushParagraph();
      out.push(`<hr style="${STYLES.hr}"/>`);
      i++;
      continue;
    }

    // Headings
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      const level = Math.min(heading[1].length, 4);
      const style = (STYLES as any)[`h${level}`] || STYLES.h4;
      // Chapter-level headings start a fresh block of the document.
      const pageBreak = level === 1 ? "page-break-before:auto;break-inside:avoid;" : "break-after:avoid;";
      out.push(`<h${level} style="${style}${pageBreak}">${inline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(trimmed)) {
      flushParagraph();
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        buf.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote style="${STYLES.quote}">${inline(buf.join(" "))}</blockquote>`);
      continue;
    }

    // Tables
    if (isTableRow(trimmed)) {
      flushParagraph();
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const isSeparator = (cells: string[]) => cells.every((c) => /^:?-{2,}:?$/.test(c));
      let head: string[] | null = null;
      let bodyRows = rows;
      if (rows.length >= 2 && isSeparator(rows[1])) {
        head = rows[0];
        bodyRows = rows.slice(2);
      }
      const thead = head
        ? `<thead><tr>${head.map((c) => `<th style="${STYLES.th}">${inline(c)}</th>`).join("")}</tr></thead>`
        : "";
      const tbody = `<tbody>${bodyRows
        .filter((r) => !isSeparator(r))
        .map((r) => `<tr>${r.map((c) => `<td style="${STYLES.td}">${inline(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
      out.push(`<table style="${STYLES.table}">${thead}${tbody}</table>`);
      continue;
    }

    // Lists (ordered / unordered, with one nesting level)
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      flushParagraph();
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
        const raw = lines[i];
        const indent = (raw.match(/^\s*/)?.[0].length || 0) >= 2;
        const text = raw.replace(/^\s*([-*+]|\d+[.)])\s+/, "");
        items.push(
          indent
            ? `<li style="${STYLES.li}margin-left:16pt;list-style-type:circle;">${inline(text)}</li>`
            : `<li style="${STYLES.li}">${inline(text)}</li>`
        );
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag} style="${ordered ? STYLES.ol : STYLES.ul}">${items.join("")}</${tag}>`);
      continue;
    }

    // Image placeholder
    const imagePlaceholder = /^\[IMAGE:\s*(.+?)\]$/i.exec(trimmed);
    if (imagePlaceholder) {
      flushParagraph();
      out.push(
        `<div style="border:1px dashed rgba(0,0,0,.3);padding:18pt;margin:12pt 0;text-align:center;font-style:italic;font-size:10pt;">${inline(
          imagePlaceholder[1]
        )}</div>`
      );
      i++;
      continue;
    }

    paragraph.push(trimmed);
    i++;
  }

  flushParagraph();
  return out.join("");
}

/**
 * Streaming helper: accumulates raw markdown tokens and only emits HTML for
 * blocks that are definitively complete (terminated by a blank line), so the
 * document never shows half-parsed markdown syntax while Genius writes.
 */
export class MarkdownStreamFormatter {
  private buffer = "";

  push(token: string): string {
    this.buffer += token;
    let html = "";
    // A block is complete once a blank line follows it.
    let idx = this.buffer.indexOf("\n\n");
    while (idx !== -1) {
      const block = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 2);
      const rendered = markdownToDocumentHtml(block);
      if (rendered) html += rendered;
      idx = this.buffer.indexOf("\n\n");
    }
    return html;
  }

  flush(): string {
    const rest = this.buffer;
    this.buffer = "";
    return rest.trim() ? markdownToDocumentHtml(rest) : "";
  }
}
