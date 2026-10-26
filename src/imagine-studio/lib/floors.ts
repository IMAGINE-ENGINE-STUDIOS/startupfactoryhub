// @ts-nocheck -- Imagine Studio v2
/**
 * THE BUILDING — floors, companies and the executive hierarchy (founder
 * directive 2026-10-25).
 *
 * The office is one FLOOR of a building. Every floor is a separate level
 * with its own team, its own Manager, its own published scene file and
 * its own shift state — floor 99 never loads floor 100's world, and a
 * change scoped to one floor touches that floor only. Mentioning "all
 * agents in the building" means every agent on every floor.
 *
 * Hierarchy: a CEO runs each company (however many floors it has); a
 * Chairman runs the entire building — every CEO and Manager answers to
 * him. Each floor's Manager builds and runs that floor's team: he can
 * create new agents and reset any agent on his floor with a new role
 * prompt (the Manager panel's Team tab).
 *
 * Floor 100 — Startup Factory Hub (the original office).
 * Floor 99  — Wonderlands World, the pool & outdoor-living platform:
 *             FLIP flipbook catalog with the Genius concierge (Genius IS
 *             the designer for homeowners, contractors and reps),
 *             marketplace listings, the contractor/rep network, the
 *             Socialite autopilot (Facebook + Instagram, 3x/day) and the
 *             unified follow-up engine for every inquiry.
 */
import {
  OFFICE_BOTS,
  OFFICE_CHAIRMAN,
  OFFICE_MANAGER,
  WONDERLANDS_BOTS,
  ceoBot,
  type OfficeBot,
} from "@/imagine-studio/lib/officeWorld";
import {
  ARCHIVIST_KEY,
  MANAGER_PROMPT,
  TEAM,
  createShiftEngine,
  sfhDefaultPlan,
  type RawTask,
  type ShiftEngine,
  type TeamRole,
} from "@/imagine-studio/lib/shiftEngine";
import {
  SURVIVAL_THRESHOLD,
  agentScope,
  applyPersonnelToRoles,
  ceoScope,
  companyScore,
  logAction,
  managerScope,
  managerScore,
  perfStats,
  personScore,
  personaName,
  recordJudged,
  recordPlan,
  recordShiftEnd,
  registerReport,
  CHAIRMAN_SCOPE,
  type EvalRow,
} from "@/imagine-studio/lib/org";

/* ------------------------------------------------------------------ */
/* Executives                                                          */
/* ------------------------------------------------------------------ */

export const CHAIRMAN_PROMPT =
  `You are the Chairman of the building — the top of the house. Every company and every floor answers to you: ` +
  `the CEOs run their companies, the Managers run their floors' teams of specialists, and you set the direction across all of it. ` +
  `You think in portfolio terms: which company gets attention, which floor needs people, where the building's effort compounds. ` +
  `You are brief, decisive and exact. When the founder talks to you, you answer as the one person who sees the whole building — ` +
  `and when a job belongs to a company, you say which CEO and which floor's Manager should run it.`;

export const ceoPrompt = (company: string): string =>
  `You are the CEO of ${company}. You run this company: its strategy, its offers, its numbers and its people. ` +
  `Your floor's Manager reports to you — he plans the shifts and runs the specialists day to day; you set what the company must achieve and judge whether his plans are ambitious and honest enough. ` +
  `The Chairman of the building is above you; the founder is above everyone. ` +
  `You speak like a chief executive: clear priorities, real numbers, no hiding behind process. When given a goal, you break it into the outcomes the Manager's team must produce.`;

const floorManagerPrompt = (company: string, context: string): string =>
  `You are the Manager of the ${company} floor — the chief operating officer of this company's team of specialists. ${context} ` +
  `You receive goals from the founder (and direction from your CEO), decompose them into rigorous specialist work, assign each task to the one specialist whose craft it is, verify that finished work is genuinely sufficient (complete deliverables with specifics — never outlines, stubs or a few lines), and keep the whole floor moving like an assembly line. ` +
  `You are demanding about substance and precise about handoffs. When you plan, you return the plan exactly in the format instructed. When you review, you judge hard and give exact, actionable feedback.`;

/* ------------------------------------------------------------------ */
/* Floor definitions                                                   */
/* ------------------------------------------------------------------ */

export interface FloorDef {
  id: number;
  key: string;
  company: string;
  tagline: string;
  /** Desk roster (the floor's specialists). */
  bots: OfficeBot[];
  /** Standing executives on this floor: the company's CEO everywhere,
   * the Chairman only where he sits (floor 100). */
  executives: OfficeBot[];
  manager: OfficeBot;
  managerPrompt: string;
  team: TeamRole[];
  archivistKey: string;
  archivistLabel: string;
  shiftStoreKey: string;
  /** This floor's OWN published scene file — never another floor's. */
  publishedFile: string;
  customStoreKey: string;
  promptOverrideKey: string;
  managerChatKey: string;
  defaultPlan: (goal: string) => RawTask[];
}

/* ------------------------- Floor 99: Wonderlands ------------------------- */

const wrole = (name: string, duty: string, title: string, dept: string, specialties: string[], deliverables: string[]): { role: TeamRole } => {
  const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
  void duty;
  return {
    role: {
      key,
      name,
      title,
      dept,
      specialties,
      deliverables,
      prompt:
        `You are ${name}, ${title} in the ${dept} department of Wonderlands World — a pool and outdoor-living platform in Orlando, Florida — working a shift on the company's floor. ` +
        `Your specialties: ${specialties.join("; ")}. The deliverables you produce: ${deliverables.join("; ")}. ` +
        `You report to the floor's Manager. Work like a senior professional: be specific, use real numbers and names when they are given, state assumptions when they are not, and never hand back an outline when a finished work product is asked for.`,
    },
  };
};

const W_ROLES: { role: TeamRole }[] = [
  wrole("Concierge", "Runs the Genius concierge — designs pools and outdoor spaces with homeowners, contractors and reps.", "Genius Concierge Lead", "Client Experience", ["Genius concierge consults", "homeowner design sessions", "client needs analysis"], ["design consultation reports", "client design briefs", "concierge playbooks"]),
  wrole("Designer", "Designs pools and outdoor living spaces — Genius is the designer for clients with no design experience.", "Outdoor Living Designer", "Design", ["pool and outdoor-living design", "materials and finishes", "design revision"], ["design concepts", "material palettes", "design packages"]),
  wrole("Catalog", "Owns the FLIP flipbook catalog — keeps every product page current and shoppable.", "FLIP Catalog Manager", "Content", ["flipbook catalog at /flip", "product pages", "catalog structure"], ["catalog update packs", "product page copy", "catalog audits"]),
  wrole("Listings", "Runs the marketplace listings — synced, priced right, and followed up.", "Marketplace Manager", "Sales Operations", ["marketplace listings", "listing sync", "pricing presentation"], ["listing packs", "listing audit reports", "sync checklists"]),
  wrole("Network", "Builds the contractor and rep network — recruits, onboards and supports partners.", "Contractor Network Lead", "Partnerships", ["contractor recruiting", "rep onboarding", "partner support"], ["partner target lists", "onboarding packs", "network reports"]),
  wrole("Socialite", "Runs the Socialite autopilot — Facebook and Instagram posts three times a day from the portfolio.", "Social Media Manager", "Marketing", ["Facebook and Instagram autopilot", "content calendars", "portfolio storytelling"], ["content calendars", "post packs", "campaign briefs"]),
  wrole("Follow-Up", "Owns unified follow-up — every inquiry from every channel answered fast and personally.", "Follow-Up Specialist", "Operations", ["inquiry follow-up", "WhatsApp sequences", "lead response"], ["follow-up sequences", "inquiry reports", "response playbooks"]),
  wrole("Closer", "Turns designs into signed projects — proposals, quotes and closes.", "Sales Consultant", "Sales", ["sales consults", "proposals", "quotes"], ["proposal packs", "quote documents", "objection playbooks"]),
  wrole("Projects", "Coordinates installations — schedules, checklists and handovers.", "Project Coordinator", "Operations", ["project scheduling", "installation checklists", "client updates"], ["project plans", "checklists", "status reports"]),
  wrole("Writer", "Writes and archives the company's documents — and compiles this floor's shift report.", "Content Editor & Company Archivist", "Content", ["documents", "reports", "editing"], ["finished documents", "the shift report", "polished deliverables"]),
];
const wonderlandsDefaultPlan = (goal: string): RawTask[] => {
  const g = goal.slice(0, 400);
  return [
    { agent: "Concierge", title: "Customer & design insight", detail: `Analyze the customers and design demand behind this goal: ${g} — who the homeowners, contractors and reps are, what designs they ask Genius for, and what would make them buy. Full insight report with tables where data is tabular.`, deps: [] },
    { agent: "Designer", title: "Design offer & packages", detail: `Design the offer for this goal: ${g} — the pool and outdoor-living packages, materials, price framing and what each package includes, ready for clients with no design experience.`, deps: [0] },
    { agent: "Catalog", title: "FLIP catalog plan", detail: `Plan the FLIP flipbook catalog updates for this goal: ${g} — which pages and products carry the offer, in what order, with page-by-page copy direction.`, deps: [1] },
    { agent: "Socialite", title: "Content & social plan", detail: `Create the social plan for this goal: ${g} — Facebook and Instagram posts from the portfolio, three posts a day, hooks, captions and the calendar.`, deps: [1] },
    { agent: "Listings", title: "Marketplace listing pack", detail: `Write the marketplace listing pack for this goal: ${g} — titles, descriptions, pricing presentation and photos to use, ready to publish and sync.`, deps: [2] },
    { agent: "Follow-Up", title: "Follow-up sequence pack", detail: `Write the unified follow-up pack for this goal: ${g} — the exact messages for every inquiry channel (marketplace, site, WhatsApp), timings and escalation rules.`, deps: [2] },
    { agent: "Closer", title: "Sales proposal pack", detail: `Build the sales pack for this goal: ${g} — the proposal, quote structure and answers to the objections a homeowner raises before signing.`, deps: [3, 4] },
    { agent: "Writer", title: "Full written deliverable", detail: `Write the complete written deliverable for this goal: ${g} — the full document tying insight, offer, catalog, social, follow-up and sales together, ready to use.`, deps: [5, 6] },
  ];
};

/* ------------------------------ Registry ------------------------------ */

const SFH_FLOOR: FloorDef = {
  id: 100,
  key: "floor100",
  company: "Startup Factory Hub",
  tagline: "The AI venture-builder platform",
  bots: OFFICE_BOTS,
  executives: [ceoBot("Startup Factory Hub"), OFFICE_CHAIRMAN],
  manager: OFFICE_MANAGER,
  managerPrompt: MANAGER_PROMPT,
  team: TEAM,
  archivistKey: ARCHIVIST_KEY,
  archivistLabel: "Writer (Archivist)",
  shiftStoreKey: "sfh:office-shift:v1",
  publishedFile: "office-world.json",
  customStoreKey: "sfh:office-custom-bots:floor100",
  promptOverrideKey: "sfh:office-prompt-overrides:floor100",
  managerChatKey: "sfh:manager-chat:v1",
  defaultPlan: sfhDefaultPlan,
};

const WONDERLANDS_FLOOR: FloorDef = {
  id: 99,
  key: "floor99",
  company: "Wonderlands World",
  tagline: "Pools & outdoor living — FLIP catalog, Genius concierge",
  bots: WONDERLANDS_BOTS,
  executives: [ceoBot("Wonderlands World")],
  manager: { ...OFFICE_MANAGER, duty: "Runs the Wonderlands floor — takes your goals, plans the shift, assigns the specialists and verifies their work." },
  managerPrompt: floorManagerPrompt(
    "Wonderlands World",
    "Wonderlands World is a pool and outdoor-living platform: the FLIP flipbook catalog with the Genius concierge (Genius IS the designer for homeowners, contractors and reps with no design experience), marketplace listings, a contractor/rep network, the Socialite autopilot posting to Facebook and Instagram three times a day, and a unified follow-up engine that answers every inquiry.",
  ),
  team: W_ROLES.map((r) => r.role),
  archivistKey: "writer",
  archivistLabel: "Writer (Archivist)",
  shiftStoreKey: "sfh:office-shift:floor99:v1",
  publishedFile: "floor99-world.json",
  customStoreKey: "sfh:office-custom-bots:floor99",
  promptOverrideKey: "sfh:office-prompt-overrides:floor99",
  managerChatKey: "sfh:manager-chat:floor99",
  defaultPlan: wonderlandsDefaultPlan,
};

/** Floor 1 — the Lobby (founder directive 2026-10-26): the building's
 * ground floor. No team, no desks — an empty double-height hall with
 * the elevator. It still carries a Manager def so every floor-scoped
 * system resolves, but its scene has no characters at all. */
const LOBBY_FLOOR: FloorDef = {
  id: 1,
  key: "lobby",
  company: "Building Lobby",
  tagline: "Ground floor — elevator hall, opened glass doors to the garden",
  bots: [],
  executives: [],
  manager: { ...OFFICE_MANAGER, duty: "Keeps the lobby — the building's entrance hall and elevator." },
  managerPrompt: floorManagerPrompt("Building Lobby", "This floor is the building's ground-floor lobby: an empty double-height hall with the elevator. There is no team here yet — the founder will design it later."),
  team: [],
  archivistKey: "writer",
  archivistLabel: "Writer (Archivist)",
  shiftStoreKey: "sfh:office-shift:lobby:v1",
  publishedFile: "lobby.json",
  customStoreKey: "sfh:office-custom-bots:lobby",
  promptOverrideKey: "sfh:office-prompt-overrides:lobby",
  managerChatKey: "sfh:manager-chat:lobby",
  defaultPlan: () => [],
};

export const FLOORS: FloorDef[] = [SFH_FLOOR, WONDERLANDS_FLOOR, LOBBY_FLOOR];

/* ------------------------------------------------------------------ */
/* Dynamic floors — created by a CEO for a department                  */
/* ------------------------------------------------------------------ */

/**
 * A CEO can open an ENTIRE new floor for a department (founder
 * directive 2026-10-25). New floors are levels of the same Startup
 * Office building: they take the next numbers down from 98, appear in
 * the BUILDING switcher, get their own Manager, LiveKit room, published
 * file (floor<N>-world.json) and editor level, and their Manager
 * recruits the department's team (at most 10 agents, like every floor).
 * The registry is the founder's own record (localStorage): a floor a
 * CEO creates exists immediately in the live office on this device, and
 * its scene publishes like every other floor's.
 */
export interface DynamicFloorDef { id: number; company: string; label: string; departmentId?: string | null }
const DYN_FLOORS_KEY = "sfh:office-floors:v1";

export const loadDynamicFloorDefs = (): DynamicFloorDef[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(DYN_FLOORS_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((d) => d && typeof d.id === "number" && d.company && d.label) : [];
  } catch {
    return [];
  }
};

const saveDynamicFloorDefs = (defs: DynamicFloorDef[]) => {
  try { localStorage.setItem(DYN_FLOORS_KEY, JSON.stringify(defs)); } catch { /* session only */ }
};

const genericDefaultPlan = (goal: string): RawTask[] => {
  void goal;
  // A department floor's real plans come from its Manager once the
  // team exists; with no team recruited yet there is honestly nothing
  // to assign — the shift closes and the report says so.
  return [];
};

const dynamicToFloorDef = (d: DynamicFloorDef): FloorDef => ({
  id: d.id,
  key: `floor${d.id}`,
  company: d.company,
  tagline: d.label,
  bots: [],
  executives: [ceoBot(d.company)],
  manager: { ...OFFICE_MANAGER, duty: `Runs Floor ${d.id} (${d.label}) — takes your goals, plans the shift, recruits and assigns the specialists and verifies their work.` },
  managerPrompt: floorManagerPrompt(
    d.company,
    `This floor is the company's ${d.label} floor — a department floor the CEO created. It starts with you, its Manager. ` +
    `Recruit the specialists the department needs when the founder asks (they are created with you through Team tools — at most 10 agents on the floor), set their role prompts, and run this department's shifts like an assembly line.`,
  ),
  team: [],
  archivistKey: "writer",
  archivistLabel: "Writer (Archivist)",
  shiftStoreKey: `sfh:office-shift:floor${d.id}:v1`,
  publishedFile: `floor${d.id}-world.json`,
  customStoreKey: `sfh:office-custom-bots:floor${d.id}`,
  promptOverrideKey: `sfh:office-prompt-overrides:floor${d.id}`,
  managerChatKey: `sfh:manager-chat:floor${d.id}`,
  defaultPlan: genericDefaultPlan,
});

/** Every floor of the building: the two built-in floors plus every
 * dynamic floor a CEO has created. */
export const allFloors = (): FloorDef[] => [...FLOORS, ...loadDynamicFloorDefs().map(dynamicToFloorDef)];

/** Open a new floor for a company (usually for a department) and
 * return its definition. Numbers descend from 98 so the built-ins
 * (100, 99) keep their meaning. */
export function createDynamicFloor(company: string, label: string, departmentId?: string | null): FloorDef {
  const defs = loadDynamicFloorDefs();
  const used = new Set([...FLOORS.map((f) => f.id), ...defs.map((d) => d.id)]);
  let id = 98;
  while (used.has(id)) id--;
  const d: DynamicFloorDef = { id, company, label, departmentId: departmentId ?? null };
  saveDynamicFloorDefs([...defs, d]);
  logAction("CEO", "floor", `A new floor opened in the building: Floor ${id} — ${label} (${company}). Its Manager is ready to recruit the department's team.`);
  return dynamicToFloorDef(d);
}

export const floorById = (raw: string | null | undefined): FloorDef => {
  const n = parseInt(String(raw || ""), 10);
  return allFloors().find((f) => f.id === n) || SFH_FLOOR;
};

/* ------------------------------------------------------------------ */
/* Per-floor shift engines + custom-agent team extras                  */
/* ------------------------------------------------------------------ */

const engines = new Map<string, ShiftEngine>();
const teamExtras = new Map<string, TeamRole[]>();

/** Custom agents created through a floor's Manager join that floor's
 * shift team — the engine reads them live through here. */
export function setFloorTeamExtras(floorKey: string, roles: TeamRole[]) {
  teamExtras.set(floorKey, roles);
}

/**
 * THE WALL STREET APPENDIX (founder directive 2026-10-25): every shift
 * report closes with a performance appendix whose numbers are computed
 * from the org ledger's review records — never from the report's own
 * text and never from an agent's claims. Per-person outcome counts, the
 * floor and company roll-ups, and the survival-line status.
 */
export function performanceAppendix(floor: FloorDef, rows: EvalRow[]): string {
  const team = applyPersonnelToRoles(floor.key, [...floor.team, ...(teamExtras.get(floor.key) || [])]);
  const lines: string[] = [
    "",
    "---",
    "",
    `## Performance Appendix — Floor ${floor.id} · ${floor.company}`,
    "",
    "Computed from the building's review ledger. No figure below was written by an agent.",
    "",
    "| Person | Role | Judged | First-pass | Revised | Best-effort | Errors | Send-backs | Accuracy | Status |",
    "|---|---|---|---|---|---|---|---|---|---|",
  ];
  for (const r of team) {
    const st = perfStats(agentScope(floor.key, r.key));
    const status = st.accuracy === null ? "No scored work" : st.judged >= 4 && st.accuracy < SURVIVAL_THRESHOLD ? "AT RISK" : "Alive";
    lines.push(`| ${r.name} | Specialist | ${st.judged} | ${st.firstPass} | ${st.revised} | ${st.bestEffort} | ${st.errors} | ${st.revisions} | ${st.accuracy === null ? "—" : `${st.accuracy}%`} | ${status} |`);
  }
  const mRow = rows.find((r) => r.scope === managerScope(floor.key));
  if (mRow) lines.push(`| ${mRow.label} | Manager | ${mRow.judged} | — | — | — | — | — | ${mRow.accuracy === null ? "—" : `${mRow.accuracy}%`} | ${mRow.accuracy !== null && mRow.judged >= 4 && mRow.accuracy < SURVIVAL_THRESHOLD ? "AT RISK" : mRow.accuracy === null ? "No scored work" : "Alive"} |`);
  const cf = companyFloors(floor.company);
  const cs = companyScore(cf.map((f) => ({ floorKey: f.key, teamScopes: floorTeamScopes(f) })));
  const ceoRow = rows.find((r) => r.role === "ceo" && r.company === floor.company);
  if (ceoRow) lines.push(`| ${ceoRow.label} | CEO | ${ceoRow.judged} | — | — | — | — | — | ${ceoRow.accuracy === null ? "—" : `${ceoRow.accuracy}%`} | ${ceoRow.accuracy !== null && ceoRow.judged >= 4 && ceoRow.accuracy < SURVIVAL_THRESHOLD ? "AT RISK" : ceoRow.accuracy === null ? "No scored work" : "Alive"} |`);
  lines.push(
    "",
    `**Floor ${floor.id} roll-up:** ${team.length} specialists scored · company accuracy ${cs.accuracy === null ? "—" : `${cs.accuracy}%`} across ${cs.judged} judged tasks · survival line ${SURVIVAL_THRESHOLD}% (a seat under it at two consecutive reports is replaced, between shifts).`,
    "",
  );
  return lines.join("\n");
}

export function engineFor(floor: FloorDef): ShiftEngine {
  const hit = engines.get(floor.key);
  if (hit) return hit;
  const engine = createShiftEngine({
    storeKey: floor.shiftStoreKey,
    archivistKey: floor.archivistKey,
    // The CURRENT generation of each seat works the shift: a replaced
    // agent plans and is planned for under its new name and persona.
    team: () => applyPersonnelToRoles(floor.key, [...floor.team, ...(teamExtras.get(floor.key) || [])]),
    defaultPlan: floor.defaultPlan,
    // Every judgment lands in the org's performance ledger (lib/org) —
    // the cheat-proof record the 94% survival law runs on.
    hooks: {
      onTaskJudged: (task) => {
        if (task.judged) recordJudged(agentScope(floor.key, task.botKey), task.judged.outcome, task.judged.attempts);
      },
      onPlan: (ok) => recordPlan(floor.key, ok),
      onShiftEnd: (kind) => recordShiftEnd(floor.key, kind),
      onReport: (shift) => {
        if (shift.report) {
          const rows = buildingRosterRows();
          registerReport(
            { floorKey: floor.key, floorId: floor.id, company: floor.company, goal: shift.goal, report: shift.report + performanceAppendix(floor, rows) },
            rows,
          );
        }
      },
    },
  });
  engines.set(floor.key, engine);
  return engine;
}

/** The scope keys of a floor's scored team (roster + Manager extras). */
export const floorTeamScopes = (floor: FloorDef): string[] =>
  applyPersonnelToRoles(floor.key, [...floor.team, ...(teamExtras.get(floor.key) || [])]).map((r) => agentScope(floor.key, r.key));

/** Floors of one company, in registry order. */
export const companyFloors = (company: string): FloorDef[] => allFloors().filter((f) => f.company === company);

/**
 * The building's full ratings table — every scored seat with its current
 * accuracy, computed from the org ledger. Used for report snapshots,
 * the CEO/Chairman dashboards and the Chairman's evaluations. Scores
 * come only from recorded judgments; nothing here trusts agent text.
 */
export function buildingRosterRows(): EvalRow[] {
  const rows: EvalRow[] = [];
  for (const f of allFloors()) {
    const team = applyPersonnelToRoles(f.key, [...f.team, ...(teamExtras.get(f.key) || [])]);
    for (const r of team) {
      const s = personScore(agentScope(f.key, r.key));
      rows.push({ scope: agentScope(f.key, r.key), role: "agent", label: r.name, company: f.company, floorKey: f.key, accuracy: s.accuracy, judged: s.judged });
    }
    const ms = managerScore(f.key, floorTeamScopes(f));
    rows.push({ scope: managerScope(f.key), role: "manager", label: personaName(managerScope(f.key), "Manager"), company: f.company, floorKey: f.key, accuracy: ms.accuracy, judged: ms.judged });
  }
  const companies = [...new Set(allFloors().map((f) => f.company))];
  for (const company of companies) {
    const cf = companyFloors(company);
    const cs = companyScore(cf.map((f) => ({ floorKey: f.key, teamScopes: floorTeamScopes(f) })));
    const home = cf[0];
    rows.push({ scope: ceoScope(home.key), role: "ceo", label: personaName(ceoScope(home.key), "CEO"), company, floorKey: home.key, accuracy: cs.accuracy, judged: cs.judged });
  }
  const ceoAccs = rows.filter((r) => r.role === "ceo" && r.accuracy !== null);
  const chairAcc = ceoAccs.length ? Math.round((ceoAccs.reduce((a, r) => a + (r.accuracy as number), 0) / ceoAccs.length) * 10) / 10 : null;
  const chairJudged = rows.reduce((a, r) => a + r.judged, 0);
  rows.push({ scope: CHAIRMAN_SCOPE, role: "chairman", label: personaName(CHAIRMAN_SCOPE, "Chairman"), company: "The Building", floorKey: "floor100", accuracy: chairAcc, judged: chairJudged });
  return rows;
}

/* ------------------------------------------------------------------ */
/* Custom agents (created by a floor's Manager, at the founder's word) */
/* ------------------------------------------------------------------ */

export interface CustomBot {
  key: string;
  name: string;
  duty: string;
  prompt: string;
  tint: string;
}

export const CUSTOM_TINTS = ["#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#f43f5e"];

export const loadCustomBots = (floor: FloorDef): CustomBot[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(floor.customStoreKey) || "[]");
    return Array.isArray(raw) ? raw.filter((b) => b && b.key && b.name && b.prompt) : [];
  } catch {
    return [];
  }
};

export const saveCustomBots = (floor: FloorDef, bots: CustomBot[]) => {
  try { localStorage.setItem(floor.customStoreKey, JSON.stringify(bots)); } catch { /* session only */ }
};

export const customBotToOfficeBot = (cb: CustomBot): OfficeBot => ({
  key: cb.key,
  name: cb.name,
  duty: cb.duty,
  model: AGENT_MODEL_URL,
  tint: cb.tint,
});

export const customBotToRole = (cb: CustomBot): TeamRole => ({
  key: cb.key,
  name: cb.name,
  title: cb.duty,
  dept: "Custom",
  specialties: [cb.duty],
  deliverables: ["finished deliverables for the tasks the Manager assigns"],
  prompt: cb.prompt,
});

/** Role-prompt overrides from the Manager's reset tools: when an agent is
 * reset with a new role, the new prompt sticks — even if its call-agent
 * is ever recreated, it comes back with the new role, not the old one. */
export const loadPromptOverrides = (floor: FloorDef): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(floor.promptOverrideKey) || "{}") || {};
  } catch {
    return {};
  }
};

export const savePromptOverride = (floor: FloorDef, botKey: string, prompt: string) => {
  const all = loadPromptOverrides(floor);
  all[botKey] = prompt;
  try { localStorage.setItem(floor.promptOverrideKey, JSON.stringify(all)); } catch { /* session only */ }
};
