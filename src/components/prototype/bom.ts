/*
 * Prototype Studio — bill of materials + design package (Job 4).
 * Everything is derived from the design document itself, so the
 * export can never disagree with what's on the canvas: same parts,
 * same wires, same behaviours.
 *
 * Prices: NOT included in v1 — no sourced price list exists yet
 * (named gap). The BOM carries the datasheet source for every part
 * instead, so a manufacturer can price it exactly.
 */
import { Connection, DesignDoc, specById } from "./registry";
import type { BehaviorRule } from "./rules";

export interface BomRow {
  name: string;
  category: string;
  qty: number;
  supply: string;
  drawMa: number;
  source: string;
}

export type PackageDesign = DesignDoc & { rules?: BehaviorRule[] };

export function buildBom(design: PackageDesign): BomRow[] {
  const counts = new Map<string, number>();
  for (const c of design.components) counts.set(c.specId, (counts.get(c.specId) ?? 0) + 1);
  const rows: BomRow[] = [];
  for (const [specId, qty] of counts) {
    const spec = specById(specId);
    if (!spec) continue;
    rows.push({
      name: spec.name,
      category: spec.category,
      qty,
      supply: `${spec.voltageMin}–${spec.voltageMax} V`,
      drawMa: spec.currentMa,
      source: spec.source,
    });
  }
  return rows.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export function wiringSummary(design: PackageDesign): string[] {
  const nameOf = (uid: string) =>
    specById(design.components.find((c) => c.uid === uid)?.specId ?? "")?.name ?? "?";
  const portLabel = (uid: string, portId: string) =>
    specById(design.components.find((c) => c.uid === uid)?.specId ?? "")?.ports.find((p) => p.id === portId)?.label ?? portId;
  return design.connections.map(
    (c: Connection) => `${nameOf(c.fromUid)} · ${portLabel(c.fromUid, c.fromPort)} → ${nameOf(c.toUid)} · ${portLabel(c.toUid, c.toPort)}`
  );
}

export function behaviourSummary(design: PackageDesign): string[] {
  const nameOf = (uid: string) =>
    specById(design.components.find((c) => c.uid === uid)?.specId ?? "")?.name ?? "?";
  return (design.rules ?? []).map((r) => {
    const when =
      r.condition === "detected" ? "detects something"
      : r.condition === "clear" ? "is clear"
      : `${r.condition} ${r.threshold}`;
    const then = r.action === "angle" ? `moves to ${r.value}°` : `turns ${r.action}`;
    return `WHEN ${nameOf(r.whenUid)} ${when} THEN ${nameOf(r.thenUid)} ${then}`;
  });
}

export function bomCsv(projectName: string, design: PackageDesign): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = [
    ["Prototype Studio — Bill of Materials", projectName].map(esc).join(","),
    ["Part", "Category", "Qty", "Supply range", "Typical draw (mA)", "Spec source"].join(","),
    ...buildBom(design).map((r) =>
      [r.name, r.category, String(r.qty), r.supply, String(r.drawMa), r.source].map(esc).join(",")
    ),
    "",
    ["Wiring"].map(esc).join(","),
    ...wiringSummary(design).map((w) => esc(w)),
    "",
    ["Behaviours"].map(esc).join(","),
    ...behaviourSummary(design).map((b) => esc(b)),
  ];
  return lines.join("\r\n");
}

export function downloadCsv(projectName: string, design: PackageDesign) {
  const blob = new Blob([bomCsv(projectName, design)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "prototype"}-bom.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Print-ready package view — the member saves it as PDF from the
 *  print dialog, exactly as laid out here. */
export function openPackagePrintView(projectName: string, design: PackageDesign) {
  const bom = buildBom(design);
  const wiring = wiringSummary(design);
  const behaviours = behaviourSummary(design);
  const rows = bom
    .map(
      (r) => `<tr><td>${r.name}</td><td>${r.category}</td><td>${r.qty}</td><td>${r.supply}</td><td>${r.drawMa}</td><td>${r.source}</td></tr>`
    )
    .join("");
  const html = `<!doctype html><html><head><title>${projectName} — Prototype Package</title>
<style>body{font-family:Georgia,serif;color:#111;margin:40px}h1{font-size:22px}h2{font-size:15px;margin-top:28px;border-bottom:1px solid #999;padding-bottom:4px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #bbb;padding:5px 7px;text-align:left}li{font-size:12px;margin:3px 0}.meta{color:#555;font-size:12px}</style>
</head><body>
<h1>${projectName} — Prototype Package</h1>
<p class="meta">Startup Factory Hub · Prototype Studio · ${new Date().toLocaleDateString()}</p>
<h2>Bill of Materials</h2>
<table><tr><th>Part</th><th>Category</th><th>Qty</th><th>Supply range</th><th>Typical draw (mA)</th><th>Spec source</th></tr>${rows}</table>
<h2>Wiring</h2><ul>${wiring.map((w) => `<li>${w}</li>`).join("") || "<li>No connections yet.</li>"}</ul>
<h2>Behaviours</h2><ul>${behaviours.map((b) => `<li>${b}</li>`).join("") || "<li>No behaviour rules yet.</li>"}</ul>
<p class="meta">Prices are quoted by the manufacturer against this package — every part above carries its datasheet source so it can be priced exactly.</p>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  return true;
}
