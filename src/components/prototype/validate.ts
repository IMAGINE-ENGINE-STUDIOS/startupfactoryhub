/*
 * Prototype Studio — compatibility + validity rules (Jobs 2–3).
 *
 * The promise: a member never holds a silently broken design. Wiring
 * mistakes are refused at the moment of connection with the reason,
 * and validateDesign() grades the whole document — an invalid design
 * can be saved as a draft, never as valid, and cannot reach the BOM
 * or a manufacture quote until it passes.
 */
import {
  Connection,
  DesignDoc,
  PlacedComponent,
  specById,
} from "./registry";

export interface Issue {
  level: "error" | "warning";
  message: string;
  uid?: string;
}

const placed = (d: DesignDoc, uid: string): PlacedComponent | undefined =>
  d.components.find((c) => c.uid === uid);

const portOf = (d: DesignDoc, uid: string, portId: string) => {
  const p = placed(d, uid);
  const spec = p ? specById(p.specId) : undefined;
  return spec?.ports.find((x) => x.id === portId);
};

const BUS_KINDS = new Set(["i2c"]); // buses may host several connections

/** Would connecting fromPort → toPort break a rule? Checked live in
 *  the canvas before the wire is allowed to exist. */
export function canConnect(
  d: DesignDoc,
  fromUid: string,
  fromPortId: string,
  toUid: string,
  toPortId: string
): { ok: boolean; reason?: string } {
  if (fromUid === toUid) return { ok: false, reason: "A component can't connect to itself." };
  const a = portOf(d, fromUid, fromPortId);
  const b = portOf(d, toUid, toPortId);
  const specA = specById(placed(d, fromUid)?.specId ?? "");
  const specB = specById(placed(d, toUid)?.specId ?? "");
  if (!a || !b || !specA || !specB) return { ok: false, reason: "Unknown port." };

  const isPower = (k: string) => k === "power-in" || k === "power-out";
  if (isPower(a.kind) || isPower(b.kind)) {
    if (!(a.kind === "power-out" && b.kind === "power-in")) {
      return { ok: false, reason: "Power flows from a supply's OUT to a component's power IN." };
    }
    const v = a.voltage ?? 0;
    if (v < specB.voltageMin - 0.01 || v > specB.voltageMax + 0.01) {
      return {
        ok: false,
        reason: `${specB.name} needs ${specB.voltageMin}–${specB.voltageMax} V — this supply gives ${v} V.`,
      };
    }
  } else {
    if (a.kind !== b.kind) {
      return { ok: false, reason: `A ${a.kind.toUpperCase()} port can't drive a ${b.kind.toUpperCase()} port — match the signal type.` };
    }
    // Signal level: whichever side outputs a voltage must not exceed
    // the other component's logic tolerance.
    const pairs: Array<[number | undefined, number, string, string]> = [
      [a.voltage, specB.logicVoltage, specA.name, specB.name],
      [b.voltage, specA.logicVoltage, specB.name, specA.name],
    ];
    for (const [outV, tol, fromName, toName] of pairs) {
      if (outV !== undefined && outV > tol + 0.3) {
        return {
          ok: false,
          reason: `${fromName} outputs ${outV} V but ${toName} tolerates ${tol} V logic — add a level shifter or divider.`,
        };
      }
    }
  }

  // Pin conflicts: a non-bus port hosts one connection. A supply's
  // OUT is a rail, not a pin — it feeds as many components as its
  // current budget allows (the budget itself is checked in
  // validateDesign).
  const busy = (uid: string, portId: string, kind: string) =>
    kind !== "power-out" &&
    !BUS_KINDS.has(kind) &&
    d.connections.some(
      (c) => (c.fromUid === uid && c.fromPort === portId) || (c.toUid === uid && c.toPort === portId)
    );
  if (busy(fromUid, fromPortId, a.kind)) return { ok: false, reason: `${a.label} is already connected.` };
  if (busy(toUid, toPortId, b.kind)) return { ok: false, reason: `${b.label} is already connected.` };

  return { ok: true };
}

export function validateDesign(d: DesignDoc): { valid: boolean; errors: Issue[]; warnings: Issue[] } {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  if (d.components.length === 0) {
    return { valid: false, errors: [{ level: "error", message: "The design is empty — add a controller to begin." }], warnings };
  }
  const specs = new Map(d.components.map((c) => [c.uid, specById(c.specId)]));
  const hasController = d.components.some((c) => specs.get(c.uid)?.category === "controller");
  if (!hasController) {
    errors.push({ level: "error", message: "No controller — add one (ESP32, Uno, Pico). It runs everything else." });
  }

  // Power: every non-source component with a power-in port must be fed.
  const fedBy = new Map<string, Connection[]>();
  for (const c of d.connections) {
    const arr = fedBy.get(c.toUid) ?? [];
    arr.push(c);
    fedBy.set(c.toUid, arr);
  }
  for (const comp of d.components) {
    const spec = specs.get(comp.uid);
    if (!spec || spec.category === "power") continue;
    const inPort = spec.ports.find((p) => p.kind === "power-in");
    if (!inPort) continue;
    const feed = d.connections.find(
      (c) => (c.toUid === comp.uid && c.toPort === inPort.id) || (c.fromUid === comp.uid && c.fromPort === inPort.id)
    );
    if (!feed) {
      errors.push({ level: "error", uid: comp.uid, message: `${spec.name} has no power — connect its ${inPort.label} to a supply.` });
    }
  }

  // Power budget per supply.
  for (const comp of d.components) {
    const spec = specs.get(comp.uid);
    if (!spec || spec.category !== "power") continue;
    const outPort = spec.ports.find((p) => p.kind === "power-out");
    if (!outPort) continue;
    let load = 0;
    for (const c of d.connections) {
      const otherUid = c.fromUid === comp.uid && c.fromPort === outPort.id ? c.toUid
        : c.toUid === comp.uid && c.toPort === outPort.id ? c.fromUid : null;
      if (otherUid) load += specs.get(otherUid)?.currentMa ?? 0;
    }
    if (load > spec.currentMa) {
      errors.push({
        level: "error", uid: comp.uid,
        message: `${spec.name} is overloaded: the design draws ~${load} mA but it supplies ${spec.currentMa} mA. Add a stronger or second supply.`,
      });
    } else if (load > spec.currentMa * 0.8) {
      warnings.push({
        level: "warning", uid: comp.uid,
        message: `${spec.name} runs at ${Math.round((load / spec.currentMa) * 100)}% of its capacity — close to the edge.`,
      });
    }
  }

  // Marginal signal levels (e.g. WS2812B data minimum).
  for (const c of d.connections) {
    const check = (uid: string, portId: string, otherUid: string) => {
      const port = portOf(d, uid, portId);
      const otherSpec = specs.get(otherUid);
      if (port?.minVoltage !== undefined && otherSpec && otherSpec.logicVoltage < port.minVoltage) {
        warnings.push({
          level: "warning", uid,
          message: `${specs.get(uid)?.name}: its data input wants ≥${port.minVoltage} V but ${otherSpec.name} speaks ${otherSpec.logicVoltage} V — usually works, not guaranteed. A level shifter makes it certain.`,
        });
      }
    };
    check(c.toUid, c.toPort, c.fromUid);
    check(c.fromUid, c.fromPort, c.toUid);
  }

  return { valid: errors.length === 0, errors, warnings };
}
