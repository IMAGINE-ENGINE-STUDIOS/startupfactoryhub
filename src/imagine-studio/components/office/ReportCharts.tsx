// @ts-nocheck -- Imagine Studio v2
/**
 * Wall Street report furniture (founder directive 2026-10-25): the
 * accuracy chart and the standalone HTML edition of a shift report.
 * Every number rendered here comes from the org ledger's computed
 * ratings (EvalRow) — charts visualize the ledger, never agent text.
 */
import { SURVIVAL_THRESHOLD, type EvalRow } from "@/imagine-studio/lib/org";

/** Horizontal accuracy bars with the 94% survival line drawn in. */
export function AccuracyChart({ rows, height }: { rows: EvalRow[]; height?: number }) {
  const scored = rows.filter((r) => r.accuracy !== null);
  if (!scored.length) return null;
  const rowH = 21;
  const w = 640;
  const h = height ?? scored.length * rowH + 18;
  const labelW = 168;
  const barW = w - labelW - 64;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Accuracy by person">
      {scored.map((r, i) => {
        const y = i * rowH + 4;
        const acc = r.accuracy as number;
        const bw = Math.max(2, (acc / 100) * barW);
        const color = acc >= SURVIVAL_THRESHOLD ? "#10b981" : "#ef4444";
        return (
          <g key={r.scope}>
            <text x={0} y={y + 11} fontSize={10.5} fill="currentColor" opacity={0.85}>{r.label.length > 24 ? `${r.label.slice(0, 23)}…` : r.label}</text>
            <rect x={labelW} y={y + 1} width={barW} height={11} rx={3} fill="currentColor" opacity={0.12} />
            <rect x={labelW} y={y + 1} width={bw} height={11} rx={3} fill={color} />
            <text x={labelW + bw + 6} y={y + 11} fontSize={10.5} fontWeight={600} fill={color}>{acc}%</text>
          </g>
        );
      })}
      <line x1={labelW + (SURVIVAL_THRESHOLD / 100) * barW} y1={0} x2={labelW + (SURVIVAL_THRESHOLD / 100) * barW} y2={h - 14} stroke="#f59e0b" strokeWidth={1.4} strokeDasharray="4 3" />
      <text x={labelW + (SURVIVAL_THRESHOLD / 100) * barW} y={h - 2} fontSize={9.5} fill="#f59e0b" textAnchor="middle">{SURVIVAL_THRESHOLD}% survival line</text>
    </svg>
  );
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Minimal, safe markdown → HTML for the report edition: headings,
 * tables, bullets, paragraphs. Enough for the Archivist's documents
 * and the computed appendix (which is mostly tables). */
export function markdownToHtml(md: string): string {
  const lines = md.split(/\n/);
  const out: string[] = [];
  let i = 0;
  const isTableLine = (l: string) => /^\s*\|.*\|\s*$/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (isTableLine(l)) {
      const block: string[] = [];
      while (i < lines.length && isTableLine(lines[i])) { block.push(lines[i]); i++; }
      const rows = block.filter((r) => !/^\s*\|[\s\-|]+\|\s*$/.test(r)).map((r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
      if (rows.length) {
        const [head, ...body] = rows;
        out.push(`<table><thead><tr>${head.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      }
      continue;
    }
    if (/^#{1,3}\s/.test(l)) { const lvl = l.match(/^#+/)![0].length; out.push(`<h${lvl}>${esc(l.replace(/^#+\s*/, ""))}</h${lvl}>`); i++; continue; }
    if (/^---+$/.test(l.trim())) { out.push("<hr/>"); i++; continue; }
    if (/^\s*[-*]\s/.test(l)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s*/, "")); i++; }
      out.push(`<ul>${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`);
      continue;
    }
    if (!l.trim()) { i++; continue; }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !isTableLine(lines[i]) && !/^#{1,3}\s/.test(lines[i]) && !/^\s*[-*]\s/.test(lines[i]) && !/^---+$/.test(lines[i].trim())) { para.push(lines[i]); i++; }
    out.push(`<p>${esc(para.join(" ")).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")}</p>`);
  }
  return out.join("\n");
}

/** The standalone Wall Street edition: title block, KPI band, the full
 * report (Archivist text + computed appendix) with real tables. */
export function reportToHtml(opts: { company: string; floorId: number; goal: string; at: number; reportMd: string; rows: EvalRow[] }): string {
  const scored = opts.rows.filter((r) => r.accuracy !== null);
  const atRisk = scored.filter((r) => r.judged >= 4 && (r.accuracy as number) < SURVIVAL_THRESHOLD).length;
  const avg = scored.length ? Math.round((scored.reduce((a, r) => a + (r.accuracy as number), 0) / scored.length) * 10) / 10 : null;
  const judged = opts.rows.reduce((a, r) => a + r.judged, 0);
  const kpi = (label: string, value: string) => `<div class="kpi"><div class="kpi-v">${esc(value)}</div><div class="kpi-l">${esc(label)}</div></div>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>${esc(opts.company)} — Floor ${opts.floorId} Shift Report</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #14202e; margin: 0; background: #f4f1ea; }
  .page { max-width: 880px; margin: 0 auto; background: #fff; padding: 48px 56px 64px; box-shadow: 0 2px 24px rgba(20,32,46,.12); }
  .firm { font-family: Helvetica, Arial, sans-serif; letter-spacing: .28em; font-size: 11px; text-transform: uppercase; color: #8a6d3b; border-bottom: 3px double #14202e; padding-bottom: 10px; display: flex; justify-content: space-between; }
  h1 { font-size: 30px; margin: 26px 0 4px; } h2 { font-size: 20px; margin: 30px 0 8px; border-bottom: 1px solid #ddd5c3; padding-bottom: 5px; } h3 { font-size: 16px; margin: 20px 0 6px; }
  .meta { color: #5c6a78; font-size: 13.5px; } .goal { font-style: italic; color: #33475c; margin: 14px 0 0; }
  .kpis { display: flex; gap: 14px; margin: 26px 0 6px; flex-wrap: wrap; }
  .kpi { flex: 1 1 120px; border: 1px solid #ddd5c3; border-top: 3px solid #14202e; padding: 12px 14px; background: #fbf9f4; }
  .kpi-v { font-family: Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; } .kpi-l { font-family: Helvetica, Arial, sans-serif; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: #5c6a78; margin-top: 3px; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0 18px; font-family: Helvetica, Arial, sans-serif; font-size: 12.5px; }
  th { background: #14202e; color: #fff; text-align: left; padding: 7px 9px; font-weight: 600; } td { border-bottom: 1px solid #e3ddcd; padding: 6px 9px; }
  tr:nth-child(even) td { background: #fbf9f4; } p { line-height: 1.62; font-size: 15px; } li { line-height: 1.55; font-size: 15px; }
  hr { border: none; border-top: 1px solid #ddd5c3; margin: 26px 0; }
  .foot { margin-top: 44px; border-top: 3px double #14202e; padding-top: 10px; font-family: Helvetica, Arial, sans-serif; font-size: 11px; color: #5c6a78; letter-spacing: .08em; text-transform: uppercase; }
</style></head><body><div class="page">
  <div class="firm"><span>${esc(opts.company)}</span><span>Shift Report</span></div>
  <h1>Floor ${opts.floorId} — Shift Report</h1>
  <div class="meta">${new Date(opts.at).toLocaleString([], { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</div>
  <p class="goal">Goal: “${esc(opts.goal)}”</p>
  <div class="kpis">
    ${kpi("Building accuracy (avg)", avg === null ? "—" : `${avg}%`)}
    ${kpi("Tasks judged", String(judged))}
    ${kpi("People scored", String(scored.length))}
    ${kpi("At risk (< 94%)", String(atRisk))}
  </div>
  ${markdownToHtml(opts.reportMd)}
  <div class="foot">Performance figures are computed from the building's review ledger — first-pass approvals, Manager send-backs and failures — and cannot be edited by any agent.</div>
</div></body></html>`;
}

export function downloadHtml(name: string, html: string) {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
