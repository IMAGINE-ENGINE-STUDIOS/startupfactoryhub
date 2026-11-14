import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Plus, Trash2, Zap } from "lucide-react";
import { DesignDoc, specById } from "./registry";
import {
  BehaviorRule,
  OUTPUT_KINDS,
  SENSOR_TRAITS,
  evaluateTwin,
} from "./rules";

/*
 * Prototype Studio — digital twin (Job 3). The twin reads the SAME
 * design document as the canvas: place parts there, then play with
 * the simulated world here — drag a temperature, trip the motion
 * sensor — and watch the outputs obey the behaviour rules instantly.
 */

const rid = () => Math.random().toString(36).slice(2, 9);
const CARD_W = 176;

interface Props {
  design: DesignDoc;
  rules: BehaviorRule[];
  onRulesChange: (r: BehaviorRule[]) => void;
}

export default function Twin({ design, rules, onRulesChange }: Props) {
  const sensors = design.components.filter((c) => SENSOR_TRAITS[c.specId]);
  const outputs = design.components.filter((c) => OUTPUT_KINDS[c.specId]);
  const nameOf = (uid: string) =>
    specById(design.components.find((c) => c.uid === uid)?.specId ?? "")?.name ?? "Part";

  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const s of sensors) init[s.uid] = SENSOR_TRAITS[s.specId].def;
    return init;
  });
  // Keep values in sync when parts are added while the twin is open.
  const merged = useMemo(() => {
    const m = { ...values };
    for (const s of sensors) if (m[s.uid] === undefined) m[s.uid] = SENSOR_TRAITS[s.specId].def;
    return m;
  }, [values, sensors]);

  const { states, fired } = useMemo(
    () => evaluateTwin(rules, merged, nameOf),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rules, merged, design]
  );

  const [draft, setDraft] = useState<{ whenUid: string; condition: BehaviorRule["condition"]; threshold: number; thenUid: string; action: BehaviorRule["action"]; value: number }>({
    whenUid: "", condition: "above", threshold: 30, thenUid: "", action: "on", value: 90,
  });
  const draftSensorTrait = draft.whenUid
    ? SENSOR_TRAITS[design.components.find((c) => c.uid === draft.whenUid)?.specId ?? ""]
    : undefined;
  const draftOutputKind = draft.thenUid
    ? OUTPUT_KINDS[design.components.find((c) => c.uid === draft.thenUid)?.specId ?? ""]
    : undefined;

  const addRule = () => {
    if (!draft.whenUid || !draft.thenUid) return;
    onRulesChange([
      ...rules,
      {
        id: rid(),
        whenUid: draft.whenUid,
        condition: draftSensorTrait?.kind === "motion" ? draft.condition === "above" || draft.condition === "below" ? "detected" : draft.condition : draft.condition,
        threshold: draft.threshold,
        thenUid: draft.thenUid,
        action: draftOutputKind === "servo" ? "angle" : draft.action,
        value: draft.value,
      },
    ]);
  };

  const describeRule = (r: BehaviorRule) => {
    const trait = SENSOR_TRAITS[design.components.find((c) => c.uid === r.whenUid)?.specId ?? ""];
    const when =
      r.condition === "detected" ? "detects something"
      : r.condition === "clear" ? "is clear"
      : `${r.condition} ${r.threshold}${trait?.unit ?? ""}`;
    const then = r.action === "angle" ? `moves to ${r.value}°` : `turns ${r.action}`;
    return `When ${nameOf(r.whenUid)} ${when} → ${nameOf(r.thenUid)} ${then}`;
  };

  if (design.components.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground max-w-sm">
          The twin mirrors your design. Add a controller, a sensor and an output on the Design tab first — then come back and play with the living version here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      {/* ── Twin stage ─────────────────────────────────────── */}
      <div
        className="flex-1 min-h-0 relative rounded-2xl border border-border overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(52,211,153,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(52,211,153,0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] px-2.5 py-1">
          <Play className="h-3 w-3" /> LIVE TWIN — same design, simulated world
        </div>
        {design.components.map((comp) => {
          const spec = specById(comp.specId);
          if (!spec) return null;
          const st = states[comp.uid];
          const kind = OUTPUT_KINDS[comp.specId];
          const isSensor = !!SENSOR_TRAITS[comp.specId];
          return (
            <div
              key={comp.uid}
              className="absolute rounded-xl border bg-card shadow-md px-2.5 py-2"
              style={{
                left: comp.x, top: comp.y, width: CARD_W,
                borderColor: st?.on ? "rgba(52,211,153,0.8)" : undefined,
                boxShadow: st?.on && kind === "light" ? "0 0 26px rgba(250,204,21,0.55)" : undefined,
              }}
            >
              <p className="text-[11px] font-semibold leading-tight">{spec.name}</p>
              {isSensor && (
                <p className="text-[11px] text-sky-300 mt-0.5">
                  {SENSOR_TRAITS[comp.specId].label}: {merged[comp.uid]}{SENSOR_TRAITS[comp.specId].unit}
                </p>
              )}
              {kind && (
                <p className={`text-[11px] mt-0.5 font-medium ${st?.on ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {kind === "servo"
                    ? `Angle: ${st?.angle ?? 0}°`
                    : kind === "display"
                      ? st?.on ? "Display: ALERT" : "Display: all clear"
                      : st?.on ? "● ON" : "○ OFF"}
                </p>
              )}
              {spec.category === "controller" && <p className="text-[11px] text-muted-foreground mt-0.5">Running {rules.length} rule{rules.length === 1 ? "" : "s"}</p>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 shrink-0">
        {/* ── Simulated world controls ─────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Simulated world — play with the inputs</p>
          {sensors.length === 0 && <p className="text-xs text-muted-foreground">No sensors in this design yet.</p>}
          <div className="space-y-2.5">
            {sensors.map((s) => {
              const trait = SENSOR_TRAITS[s.specId];
              const isMotion = trait.kind === "motion";
              return (
                <div key={s.uid} className="flex items-center gap-3">
                  <span className="text-xs w-36 shrink-0">{specById(s.specId)?.name}</span>
                  {isMotion ? (
                    <Button
                      size="sm"
                      variant={merged[s.uid] >= 1 ? "default" : "outline"}
                      className="h-8 text-xs"
                      onClick={() => setValues((v) => ({ ...v, [s.uid]: merged[s.uid] >= 1 ? 0 : 1 }))}
                    >
                      {merged[s.uid] >= 1 ? "Motion detected!" : "Trip the sensor"}
                    </Button>
                  ) : (
                    <>
                      <input
                        type="range"
                        min={trait.min} max={trait.max} step={trait.step}
                        value={merged[s.uid]}
                        onChange={(e) => setValues((v) => ({ ...v, [s.uid]: Number(e.target.value) }))}
                        className="flex-1 accent-sky-500"
                      />
                      <span className="text-xs w-16 text-right">{merged[s.uid]}{trait.unit}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {fired.length > 0 && (
            <div className="mt-3 space-y-1">
              {fired.map((f, i) => (
                <p key={i} className="text-[11px] text-emerald-400 flex items-center gap-1"><Zap className="h-3 w-3" /> {f}</p>
              ))}
            </div>
          )}
        </div>

        {/* ── Behaviour rules ──────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Behaviour — when this, then that</p>
          <div className="space-y-1.5 mb-3">
            {rules.length === 0 && <p className="text-xs text-muted-foreground">No behaviours yet. Add one below — e.g. when the PIR detects motion, the relay turns on.</p>}
            {rules.map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-xs rounded-lg border border-border px-2 py-1.5">
                <span className="flex-1">{describeRule(r)}</span>
                <button aria-label="Delete rule" onClick={() => onRulesChange(rules.filter((x) => x.id !== r.id))}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">When</span>
            <select
              className="h-8 rounded-md border border-input bg-background px-1.5"
              value={draft.whenUid}
              onChange={(e) => setDraft({ ...draft, whenUid: e.target.value })}
            >
              <option value="">a sensor…</option>
              {sensors.map((s) => <option key={s.uid} value={s.uid}>{specById(s.specId)?.name}</option>)}
            </select>
            {draftSensorTrait?.kind === "motion" ? (
              <select
                className="h-8 rounded-md border border-input bg-background px-1.5"
                value={draft.condition === "detected" || draft.condition === "clear" ? draft.condition : "detected"}
                onChange={(e) => setDraft({ ...draft, condition: e.target.value as BehaviorRule["condition"] })}
              >
                <option value="detected">detects motion</option>
                <option value="clear">is clear</option>
              </select>
            ) : (
              <>
                <select
                  className="h-8 rounded-md border border-input bg-background px-1.5"
                  value={draft.condition === "above" || draft.condition === "below" ? draft.condition : "above"}
                  onChange={(e) => setDraft({ ...draft, condition: e.target.value as BehaviorRule["condition"] })}
                >
                  <option value="above">goes above</option>
                  <option value="below">drops below</option>
                </select>
                <Input
                  type="number"
                  className="h-8 w-20"
                  value={draft.threshold}
                  onChange={(e) => setDraft({ ...draft, threshold: Number(e.target.value) })}
                />
                <span className="text-muted-foreground">{draftSensorTrait?.unit}</span>
              </>
            )}
            <span className="text-muted-foreground">then</span>
            <select
              className="h-8 rounded-md border border-input bg-background px-1.5"
              value={draft.thenUid}
              onChange={(e) => setDraft({ ...draft, thenUid: e.target.value })}
            >
              <option value="">an output…</option>
              {outputs.map((o) => <option key={o.uid} value={o.uid}>{specById(o.specId)?.name}</option>)}
            </select>
            {draftOutputKind === "servo" ? (
              <>
                <span className="text-muted-foreground">moves to</span>
                <Input
                  type="number" min={0} max={180}
                  className="h-8 w-20"
                  value={draft.value}
                  onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })}
                />
                <span className="text-muted-foreground">°</span>
              </>
            ) : (
              <select
                className="h-8 rounded-md border border-input bg-background px-1.5"
                value={draft.action}
                onChange={(e) => setDraft({ ...draft, action: e.target.value as BehaviorRule["action"] })}
              >
                <option value="on">turns on</option>
                <option value="off">turns off</option>
              </select>
            )}
            <Button size="sm" className="h-8 gap-1" onClick={addRule} disabled={!draft.whenUid || !draft.thenUid}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
