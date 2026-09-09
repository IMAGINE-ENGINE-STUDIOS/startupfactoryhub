import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { sanitizeHTML } from "@/utils/sanitize";

/**
 * LightPaper-style paginated document view.
 *
 * Renders arbitrary document HTML the way LightPaper (and Word) would: real
 * paper sheets with the selected page format, printable margins, and every
 * page rendered, numbered and counted.
 *
 * Pagination is measured in the DOM, so the page count grows with content
 * without any hard limit.
 */

export type PaperFormat = "letter" | "legal" | "a4" | "a5";

/** Page size in CSS pixels at 96 dpi. */
export const PAPER_SIZES: Record<PaperFormat, { w: number; h: number; label: string }> = {
  letter: { w: 816, h: 1056, label: 'Letter (8.5" × 11")' },
  legal: { w: 816, h: 1344, label: 'Legal (8.5" × 14")' },
  a4: { w: 794, h: 1123, label: "A4 (210 × 297 mm)" },
  a5: { w: 559, h: 794, label: "A5 (148 × 210 mm)" },
};

interface PaperDocumentViewProps {
  html: string;
  format?: PaperFormat;
  /** Page margin in inches. */
  margin?: number;
  /** Extra class for the outer scroll area. */
  className?: string;
  /** Called whenever the page count changes. */
  onPageCount?: (count: number) => void;
  /** Ref to the rendered pages wrapper (useful for click handling / signing). */
  contentRef?: (el: HTMLDivElement | null) => void;
}

const BASE_STYLE = `
  .sfh-paper { background:#ffffff; color:#111827; font-family: Georgia, 'Times New Roman', serif; font-size:12pt; line-height:1.6; }
  .sfh-paper *, .sfh-paper p, .sfh-paper span, .sfh-paper div, .sfh-paper li, .sfh-paper td,
  .sfh-paper th, .sfh-paper strong, .sfh-paper em, .sfh-paper h1, .sfh-paper h2, .sfh-paper h3,
  .sfh-paper h4, .sfh-paper h5, .sfh-paper h6 { color:#111827 !important; }
  .sfh-paper a { color:#1d4ed8 !important; }
  .sfh-paper h1 { font-size:20pt; margin:0 0 12pt; }
  .sfh-paper h2 { font-size:15pt; margin:16pt 0 8pt; }
  .sfh-paper h3 { font-size:13pt; margin:14pt 0 6pt; }
  .sfh-paper p { margin:0 0 10pt; }
  .sfh-paper ul, .sfh-paper ol { margin:0 0 10pt 20pt; padding-left:18pt; }
  .sfh-paper ul { list-style: disc outside; }
  .sfh-paper ol { list-style: decimal outside; }
  .sfh-paper li { display:list-item; }

  .sfh-paper img, .sfh-paper svg { max-width:100%; height:auto; }
  .sfh-paper table { width:100%; border-collapse:collapse; }
  .sfh-paper .sfh-sign-field { color:#1d4ed8 !important; }
`;

export default function PaperDocumentView({
  html,
  format = "letter",
  margin = 1,
  className = "",
  onPageCount,
  contentRef,
}: PaperDocumentViewProps) {
  const size = PAPER_SIZES[format];
  const marginPx = Math.round(margin * 96);
  const contentWidth = size.w - marginPx * 2;
  const contentHeight = size.h - marginPx * 2;

  const measureRef = useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const clean = useMemo(() => sanitizeHTML(html || ""), [html]);

  // ---- Pagination: fill sheets node by node until each one overflows -------
  useLayoutEffect(() => {
    const host = measureRef.current;
    if (!host) return;

    const source = document.createElement("div");
    source.innerHTML = clean;

    const sheet = document.createElement("div");
    sheet.className = "sfh-paper";
    sheet.style.cssText = `position:absolute;visibility:hidden;width:${contentWidth}px;`;
    host.appendChild(sheet);

    const result: string[] = [];

    /** Split a block that is taller than a page into word-sized chunks. */
    const splitOversized = (node: HTMLElement): HTMLElement[] => {
      const words = (node.textContent || "").split(/\s+/).filter(Boolean);
      if (words.length < 2) return [node];
      const parts: HTMLElement[] = [];
      let chunk = node.cloneNode(false) as HTMLElement;
      chunk.textContent = "";
      sheet.appendChild(chunk);
      for (const word of words) {
        const prev = chunk.textContent || "";
        chunk.textContent = prev ? `${prev} ${word}` : word;
        if (chunk.scrollHeight > contentHeight && prev) {
          chunk.textContent = prev;
          parts.push(chunk.cloneNode(true) as HTMLElement);
          chunk.textContent = word;
        }
      }
      if ((chunk.textContent || "").trim()) parts.push(chunk.cloneNode(true) as HTMLElement);
      sheet.removeChild(chunk);
      return parts;
    };

    const queue: ChildNode[] = Array.from(source.childNodes);
    let current = document.createElement("div");

    const flush = () => {
      if (current.innerHTML.trim()) result.push(current.innerHTML);
      current = document.createElement("div");
      sheet.innerHTML = "";
    };

    while (queue.length) {
      const node = queue.shift()!;
      if (node.nodeType === Node.TEXT_NODE && !(node.textContent || "").trim()) continue;

      const probe = node.cloneNode(true);
      sheet.appendChild(probe);

      if (sheet.scrollHeight > contentHeight) {
        sheet.removeChild(probe);

        if (!current.innerHTML.trim() && node.nodeType === Node.ELEMENT_NODE) {
          // Single element taller than a whole page: break it down.
          const el = node as HTMLElement;
          const children = Array.from(el.childNodes);
          if (children.length > 1) {
            // Re-queue its children wrapped in the same tag so styling survives.
            const wrapped = children.map((c) => {
              const holder = el.cloneNode(false) as HTMLElement;
              holder.appendChild(c.cloneNode(true));
              return holder as ChildNode;
            });
            queue.unshift(...wrapped);
            continue;
          }
          const parts = splitOversized(el);
          if (parts.length > 1) {
            queue.unshift(...(parts as ChildNode[]));
            continue;
          }
          // Cannot split further — give it its own page.
          current.appendChild(node.cloneNode(true));
          flush();
          continue;
        }

        flush();
        queue.unshift(node);
        continue;
      }

      current.appendChild(node.cloneNode(true));
    }

    if (current.innerHTML.trim()) result.push(current.innerHTML);
    host.removeChild(sheet);

    const finalPages = result.length ? result : [""];
    setPages(finalPages);
    onPageCount?.(finalPages.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clean, contentWidth, contentHeight]);

  // ---- Fit the sheet inside narrow screens --------------------------------
  useEffect(() => {
    const fit = () => {
      const available = wrapRef.current?.clientWidth ?? size.w;
      setZoom(Math.min(1, (available - 16) / size.w));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [size.w]);

  return (
    <div ref={wrapRef} className={className}>
      <style>{BASE_STYLE}</style>
      <div ref={measureRef} style={{ position: "absolute", left: -99999, top: 0, height: 0, overflow: "hidden" }} />

      <div
        ref={contentRef}
        className="flex flex-col items-center gap-6"
        style={{ zoom: zoom !== 1 ? zoom : undefined }}
      >
        {pages.map((pageHtml, i) => (
          <div
            key={i}
            data-page-index={i}
            className="sfh-paper relative shadow-lg rounded-sm"
            style={{
              width: size.w,
              minHeight: size.h,
              padding: marginPx,
              boxSizing: "border-box",
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: pageHtml }} />
            <span
              className="absolute text-[10px] tracking-wide"
              style={{ bottom: marginPx / 2.5, right: marginPx, color: "#6b7280" }}
            >
              Page {i + 1} of {pages.length}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
