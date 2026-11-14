/*
 * Prototype Studio — behaviour rules + simulation traits (Job 3).
 *
 * A behaviour is one sentence a founder understands:
 * WHEN <sensor> <condition> THEN <output> <action>.
 * The twin evaluates every rule against the simulated sensor values
 * on each change — the twin and the design share one state, so an
 * edit re-simulates immediately (the "synchronous" property).
 */

export interface BehaviorRule {
  id: string;
  whenUid: string; // a placed sensor (or input) component
  condition: "above" | "below" | "detected" | "clear";
  threshold?: number;
  thenUid: string; // a placed output component
  action: "on" | "off" | "angle";
  value?: number; // for action "angle": 0–180
}

export interface SensorTrait {
  kind: "temperature" | "distance" | "motion" | "light" | "humidity";
  label: string;
  unit: string;
  min: number;
  max: number;
  def: number;
  step: number;
}

/** Simulated inputs per component spec — what the founder can play
 *  with in the twin. Keyed by registry spec id. */
export const SENSOR_TRAITS: Record<string, SensorTrait> = {
  dht22: { kind: "temperature", label: "Temperature", unit: "°C", min: -10, max: 50, def: 24, step: 0.5 },
  hcsr04: { kind: "distance", label: "Distance", unit: "cm", min: 2, max: 400, def: 120, step: 1 },
  pir: { kind: "motion", label: "Motion", unit: "", min: 0, max: 1, def: 0, step: 1 },
  ldr: { kind: "light", label: "Light level", unit: "%", min: 0, max: 100, def: 60, step: 1 },
  bme280: { kind: "temperature", label: "Temperature", unit: "°C", min: -10, max: 50, def: 22, step: 0.5 },
};

export type OutputKind = "light" | "servo" | "switch" | "display";

export const OUTPUT_KINDS: Record<string, OutputKind> = {
  neopixel: "light",
  sg90: "servo",
  relay1: "switch",
  oled: "display",
};

export interface OutputState {
  on: boolean;
  angle?: number;
  note?: string;
}

/** Pure simulation step: sensor values + rules → output states +
 *  a human-readable event log line for each rule that fired. */
export function evaluateTwin(
  rules: BehaviorRule[],
  sensorValues: Record<string, number>,
  nameOf: (uid: string) => string
): { states: Record<string, OutputState>; fired: string[] } {
  const states: Record<string, OutputState> = {};
  const fired: string[] = [];
  for (const r of rules) {
    const v = sensorValues[r.whenUid];
    if (v === undefined) continue;
    let hit = false;
    if (r.condition === "above") hit = (r.threshold ?? 0) < v;
    else if (r.condition === "below") hit = v < (r.threshold ?? 0);
    else if (r.condition === "detected") hit = v >= 1;
    else if (r.condition === "clear") hit = v < 1;
    if (!hit) continue;
    if (r.action === "angle") {
      states[r.thenUid] = { on: true, angle: Math.max(0, Math.min(180, r.value ?? 90)) };
      fired.push(`${nameOf(r.whenUid)} → ${nameOf(r.thenUid)} moves to ${r.value ?? 90}°`);
    } else {
      states[r.thenUid] = { on: r.action === "on" };
      fired.push(`${nameOf(r.whenUid)} → ${nameOf(r.thenUid)} turns ${r.action.toUpperCase()}`);
    }
  }
  return { states, fired };
}
