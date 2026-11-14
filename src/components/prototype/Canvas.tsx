import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MousePointer2, Plus, Trash2, X } from "lucide-react";
import {
  CATEGORY_LABELS,
  COMPONENTS,
  ComponentSpec,
  DesignDoc,
  PlacedComponent,
  ProtoCategory,
  specById,
} from "./registry";
import { canConnect } from "./validate";

/*
 * Prototype Studio canvas (Job 2): component carousel at the bottom,
 * the design stage on top, spec inspector for the selected part.
 * Adding works by tap (phone) or drag (desktop). Wiring is tap-to-
 * connect: tap a port, tap its partner — canConnect() refuses bad
 * wires at the moment of the tap, with the reason.
 */

const CARD_W = 176;
const uid = () => Math.random().toString(36).slice(2, 9);

interface Props {
  design: DesignDoc;
  onChange: (d: DesignDoc) => void;
}

export default function Canvas({ design, onChange }: Props) {
  const { toast } = useToast();
  const stageRef = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState<ProtoCategory | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<{ uid: string; port: string } | null>(null);
  const dragRef = useRef<{ uid: string; dx: number; dy: number } | null>(null);

  const palette = useMemo(
    () => COMPONENTS.filter((c) => category === "all" || c.category === category),
    [category]
  );
  const selectedSpec = selected ? specById(design.components.find((c) => c.uid === selected)?.specId ?? "") : undefined;
  const selectedPlaced = design.components.find((c) => c.uid === selected);

  const addComponent = (spec: ComponentSpec, x?: number, y?: number) => {
    const n = design.components.length;
    const placed: PlacedComponent = {
      uid: uid(),
      specId: spec.id,
      x: x ?? 24 + (n % 4) * 48,
      y: y ?? 24 + (n % 4) * 40,
    };
    onChange({ ...design, components: [...design.components, placed] });
    setSelected(placed.uid);
  };

  const removeComponent = (id: string) => {
    onChange({
      components: design.components.filter((c) => c.uid !== id),
      connections: design.connections.filter((c) => c.fromUid !== id && c.toUid !== id),
    });
    if (selected === id) setSelected(null);
    if (pending?.uid === id) setPending(null);
  };

  const tapPort = (compUid: string, portId: string) => {
    if (!pending) {
      setPending({ uid: compUid, port: portId });
      return;
    }
    if (pending.uid === compUid && pending.port === portId) {
      setPending(null);
      return;
    }
    const check = canConnect(design, pending.uid, pending.port, compUid, portId);
    if (!check.ok) {
      toast({ title: "That connection isn't safe", description: check.reason, variant: "destructive" });
      setPending(null);
      return;
    }
    onChange({
      ...design,
      connections: [
        ...design.connections,
        { id: uid(), fromUid: pending.uid, fromPort: pending.port, toUid: compUid, toPort: portId },
      ],
    });
    setPending(null);
  };

  const onStageDrop = (e: React.DragEvent) => {
    const specId = e.dataTransfer.getData("text/proto-spec");
    if (!specId) return;
    e.preventDefault();
    const spec = specById(specId);
    const rect = stageRef.current?.getBoundingClientRect();
    if (!spec || !rect) return;
    addComponent(spec, Math.max(0, e.clientX - rect.left - CARD_W / 2), Math.max(0, e.clientY - rect.top - 20));
  };

  const startMove = (e: React.PointerEvent, comp: PlacedComponent) => {
    if ((e.target as HTMLElement).closest("[data-port]")) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { uid: comp.uid, dx: e.clientX - rect.left - comp.x, dy: e.clientY - rect.top - comp.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const x = Math.max(0, e.clientX - rect.left - drag.dx);
    const y = Math.max(0, e.clientY - rect.top - drag.dy);
    onChange({
      ...design,
      components: design.components.map((c) => (c.uid === drag.uid ? { ...c, x, y } : c)),
    });
  };

  const center = (id: string) => {
    const c = design.components.find((x) => x.uid === id);
    return c ? { x: c.x + CARD_W / 2, y: c.y + 30 } : { x: 0, y: 0 };
  };
  const wireColor = (kind: string) =>
    kind.startsWith("power") ? "#f59e0b" : kind === "i2c" || kind === "spi" || kind === "uart" ? "#38bdf8" : "#a78bfa";

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      {/* ── Stage ─────────────────────────────────────────── */}
      <div
        ref={stageRef}
        className="flex-1 min-h-0 relative rounded-2xl border border-border overflow-hidden touch-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.09) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onStageDrop}
        onPointerMove={onMove}
        onPointerUp={() => (dragRef.current = null)}
        onClick={() => { setSelected(null); }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {design.connections.map((c) => {
            const a = center(c.fromUid);
            const b = center(c.toUid);
            const fromPort = specById(design.components.find((x) => x.uid === c.fromUid)?.specId ?? "")?.ports.find((p) => p.id === c.fromPort);
            return (
              <line key={c.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={wireColor(fromPort?.kind ?? "")} strokeWidth={2} strokeOpacity={0.75} />
            );
          })}
        </svg>

        {design.components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Add a controller from the library below, then sensors, outputs and a power source — tap a port, then its partner, to wire them.
            </p>
          </div>
        )}

        {design.components.map((comp) => {
          const spec = specById(comp.specId);
          if (!spec) return null;
          const isSel = selected === comp.uid;
          return (
            <div
              key={comp.uid}
              className={`absolute rounded-xl border bg-card shadow-md select-none ${isSel ? "border-sky-400 ring-1 ring-sky-400/50" : "border-border"}`}
              style={{ left: comp.x, top: comp.y, width: CARD_W }}
              onPointerDown={(e) => { startMove(e, comp); setSelected(comp.uid); e.stopPropagation(); }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2.5 py-2 cursor-grab active:cursor-grabbing">
                <p className="text-[11px] font-semibold leading-tight">{spec.name}</p>
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{CATEGORY_LABELS[spec.category]} · {spec.logicVoltage}V logic</p>
              </div>
              <div className="px-2 pb-2 grid grid-cols-2 gap-1">
                {spec.ports.map((p) => {
                  const isPending = pending?.uid === comp.uid && pending?.port === p.id;
                  const connected = design.connections.some(
                    (c) => (c.fromUid === comp.uid && c.fromPort === p.id) || (c.toUid === comp.uid && c.toPort === p.id)
                  );
                  return (
                    <button
                      key={p.id}
                      data-port
                      onClick={(e) => { e.stopPropagation(); tapPort(comp.uid, p.id); }}
                      className={`flex items-center gap-1 rounded-md px-1 py-0.5 text-[9px] font-medium border transition ${
                        isPending ? "bg-sky-500/25 border-sky-400 text-sky-200"
                        : connected ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                        : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: wireColor(p.kind) }} />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {pending && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-sky-500/90 text-white text-[11px] px-3 py-1 flex items-center gap-2 shadow">
            <MousePointer2 className="h-3 w-3" /> Now tap the port to connect to
            <button onClick={(e) => { e.stopPropagation(); setPending(null); }} aria-label="Cancel connection"><X className="h-3 w-3" /></button>
          </div>
        )}
      </div>

      {/* ── Inspector ─────────────────────────────────────── */}
      {selectedSpec && selectedPlaced && (
        <div className="rounded-xl border border-border bg-card px-3 py-2 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{selectedSpec.name}</p>
            <p className="text-xs text-muted-foreground leading-snug">{selectedSpec.summary}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Supply {selectedSpec.voltageMin}–{selectedSpec.voltageMax} V · draws ~{selectedSpec.currentMa} mA · Source: {selectedSpec.source}
            </p>
            {design.connections.filter((c) => c.fromUid === selectedPlaced.uid || c.toUid === selectedPlaced.uid).length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {design.connections
                  .filter((c) => c.fromUid === selectedPlaced.uid || c.toUid === selectedPlaced.uid)
                  .map((c) => {
                    const other = design.components.find((x) => x.uid === (c.fromUid === selectedPlaced.uid ? c.toUid : c.fromUid));
                    return (
                      <span key={c.id} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px]">
                        ↔ {specById(other?.specId ?? "")?.name ?? "?"}
                        <button
                          aria-label="Remove connection"
                          onClick={() => onChange({ ...design, connections: design.connections.filter((x) => x.id !== c.id) })}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
              </div>
            )}
          </div>
          <Button size="sm" variant="destructive" className="gap-1 shrink-0" onClick={() => removeComponent(selectedPlaced.uid)}>
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </Button>
        </div>
      )}

      {/* ── Library carousel ──────────────────────────────── */}
      <div className="shrink-0">
        <div className="flex gap-1.5 mb-1.5 flex-wrap">
          {(["all", "controller", "sensor", "output", "power", "comms"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
                category === cat ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat === "all" ? "All parts" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {palette.map((spec) => (
            <div
              key={spec.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/proto-spec", spec.id)}
              className="shrink-0 w-44 rounded-xl border border-border bg-card p-2.5 cursor-grab"
            >
              <p className="text-[11px] font-semibold leading-tight">{spec.name}</p>
              <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{spec.summary}</p>
              <Button size="sm" className="h-7 mt-2 w-full gap-1 text-[11px]" onClick={() => addComponent(spec)}>
                <Plus className="h-3 w-3" /> Add to design
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
