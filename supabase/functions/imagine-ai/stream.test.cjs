// Credits: Imagine Engine Studios Corp.
// Gate-style unit tests (node --test, same as build-protocol.test.cjs) for
// the imagine-ai build-completeness gate in stream.ts. stream.ts is a
// self-contained TS module, so it is bundled to CJS with the repo's own
// esbuild and exercised directly.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

function loadStream() {
  let dir = __dirname;
  for (;;) {
    const bin = path.join(dir, "node_modules", ".bin", "esbuild");
    if (fs.existsSync(bin)) {
      const out = path.join(os.tmpdir(), `ie-stream-test-${process.pid}.cjs`);
      execFileSync(bin, [path.join(__dirname, "stream.ts"), "--bundle", "--format=cjs", "--platform=node", `--outfile=${out}`], { stdio: "pipe" });
      return require(out);
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("esbuild not found (run from the repo with dependencies installed)");
    dir = parent;
  }
}
const { buildComplete, continuation, missingParts, missingMessages, readCompletion, STREAM_IDLE_MS } = loadStream();

const file = (p, content) => JSON.stringify({ type: "file", path: p, content });
const action = (a) => JSON.stringify({ type: "action", action: a });
const DONE = JSON.stringify({ type: "done" });
const build = (...records) => records.join("\n");

const TYPES = "export interface Invoice { id: number; total: number }";
const STORE = 'import type { Invoice } from "./types";\nexport const store = { invoices: [] as Invoice[] };';
const LIST = 'import { store } from "../store";\nexport default function InvoiceList() { return null; }';
const APP = 'import { store } from "./store";\nimport InvoiceList from "./components/InvoiceList";\nexport default function App() { return null; }';

test("complete folder app passes the gate", () => {
  const text = build(
    file("apps/InvoicePro/types.ts", TYPES),
    file("apps/InvoicePro/store.ts", STORE),
    file("apps/InvoicePro/components/InvoiceList.tsx", LIST),
    file("apps/InvoicePro/App.tsx", APP),
    DONE,
  );
  assert.deepEqual(missingParts(text, []), []);
});

test("missing root file is flagged", () => {
  const text = build(
    file("apps/InvoicePro/types.ts", TYPES),
    file("apps/InvoicePro/store.ts", STORE),
    file("apps/InvoicePro/components/InvoiceList.tsx", LIST),
    DONE,
  );
  assert.deepEqual(missingParts(text, []), ["root:apps/InvoicePro/App.tsx"]);
});

test("missing relative import is flagged", () => {
  const storeWithSeed = 'import { invoices } from "./seed";\nimport type { Invoice } from "./types";\nexport const store = { invoices };';
  const text = build(
    file("apps/InvoicePro/types.ts", TYPES),
    file("apps/InvoicePro/store.ts", storeWithSeed),
    file("apps/InvoicePro/App.tsx", 'import { store } from "./store";\nexport default function App() { return null; }'),
    DONE,
  );
  assert.deepEqual(missingParts(text, []), ["import:apps/InvoicePro/store.ts -> ./seed"]);
});

test("root present in knownPaths passes (existing app, new module turn)", () => {
  const text = build(
    file("apps/InvoicePro/types.ts", TYPES),
    file("apps/InvoicePro/store.ts", STORE),
    DONE,
  );
  assert.deepEqual(missingParts(text, ["apps/InvoicePro/App.tsx"]), []);
  // Single-file root in knownPaths also establishes the app.
  const text2 = build(file("apps/Shop/components/Badge.tsx", "export default function Badge() { return null; }"), DONE);
  assert.deepEqual(missingParts(text2, ["apps/Shop.tsx"]), []);
});

test("single-file app passes (file record and addLiveApp forms)", () => {
  const text = build(file("apps/Store.tsx", "export default function Store() { return null; }"), DONE);
  assert.deepEqual(missingParts(text, []), []);
  const text2 = build(action({ type: "addLiveApp", name: "Store", kind: "react", code: "export default function Store() { return null; }" }), DONE);
  assert.deepEqual(missingParts(text2, []), []);
  // addFile action form also counts as a created root.
  const text3 = build(
    action({ type: "addFile", name: "apps/InvoicePro/App.tsx", content: 'import { store } from "./store";\nexport default function App() { return null; }' }),
    action({ type: "addFile", name: "apps/InvoicePro/store.ts", content: "export const store = {};" }),
    DONE,
  );
  assert.deepEqual(missingParts(text3, []), []);
});

test("engine-provided lib/ie import is not flagged", () => {
  const storeWithIe = 'import { IE } from "../lib/ie";\nimport type { Invoice } from "./types";\nexport const store = { db: IE.db };';
  const text = build(
    file("apps/InvoicePro/types.ts", TYPES),
    file("apps/InvoicePro/store.ts", storeWithIe),
    file("apps/InvoicePro/App.tsx", 'import { store } from "./store";\nexport default function App() { return null; }'),
    DONE,
  );
  assert.deepEqual(missingParts(text, []), []);
});

test("UI-kit-served relative imports are not flagged", () => {
  const list = 'import { Button } from "../../components/ui/button";\nimport { store } from "../store";\nexport default function InvoiceList() { return null; }';
  const app = 'import { cn } from "../lib/utils";\nimport InvoiceList from "./components/InvoiceList";\nexport default function App() { return null; }';
  const text = build(
    file("apps/InvoicePro/store.ts", "export const store = {};"),
    file("apps/InvoicePro/components/InvoiceList.tsx", list),
    file("apps/InvoicePro/App.tsx", app),
    DONE,
  );
  assert.deepEqual(missingParts(text, []), []);
});

test("tweak turn on an existing app is not gated", () => {
  const known = [
    "apps/TaskMaster/App.tsx",
    "apps/TaskMaster/store.ts",
    "apps/TaskMaster/components/TaskList.tsx",
  ];
  const text = build(
    action({ type: "patchFile", name: "apps/TaskMaster/store.ts", edits: [{ find: "a", replace: "b" }] }),
    JSON.stringify({ type: "file", path: "apps/TaskMaster/components/TaskList.tsx", content: 'import { helper } from "./Helper";\nexport default function TaskList() { return null; }' }),
    DONE,
  );
  // Even though ./Helper does not exist, the folder is established in
  // knownPaths, so this is a tweak turn and the gate stays out of the way.
  assert.deepEqual(missingParts(text, known), []);
});

test("gate stays bounded: structural gate unchanged, missing list empties once files arrive", () => {
  // A truncated pass is still governed by continuation()/buildComplete(),
  // never by the completeness gate.
  assert.equal(continuation("partial", "length"), true);
  assert.equal(buildComplete("partial", "length"), false);
  // No created files (chat / prose) => nothing to gate.
  assert.deepEqual(missingParts("", []), []);
  assert.deepEqual(missingParts("just a summary, no records", []), []);
  // Simulated bounded loop: while the root is missing the gate holds the
  // build open; once the missing file is emitted it opens — the caller's
  // BUILD_MAX_PARTS / BUILD_OUTPUT_BUDGET checks remain the hard bound.
  const partial = build(file("apps/InvoicePro/store.ts", STORE), file("apps/InvoicePro/types.ts", TYPES));
  assert.deepEqual(missingParts(partial, []), ["root:apps/InvoicePro/App.tsx"]);
  const completed = partial + "\n" + file("apps/InvoicePro/App.tsx", 'import { store } from "./store";\nexport default function App() { return null; }') + "\n" + DONE;
  assert.deepEqual(missingParts(completed, []), []);
  assert.equal(buildComplete(completed, "stop"), true);
});

// ---- readCompletion: idle timeout + unchanged healthy behavior ----
// Fake SSE response: enqueues the given chunks immediately; closes the
// stream unless close:false (the stalled-provider shape).
function sseResponse(chunks, { close = true } = {}) {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(enc.encode(c));
      if (close) controller.close();
    },
  });
  return new Response(body, { headers: { "content-type": "text/event-stream" } });
}
const sseFrame = (obj) => `data: ${JSON.stringify(obj)}\n\n`;

test("readCompletion: healthy stream returns text/finish/usage exactly as before", async () => {
  const deltas = [];
  const resp = sseResponse([
    sseFrame({ choices: [{ delta: { content: "Hello " }, finish_reason: null }], usage: { prompt_tokens: 10, completion_tokens: 3 } }),
    sseFrame({ choices: [{ delta: { content: "world" }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 5 } }),
    "data: [DONE]\n\n",
  ]);
  const out = await readCompletion(resp, (d) => deltas.push(d));
  assert.equal(out.text, "Hello world");
  assert.equal(out.finish, "stop");
  assert.equal(out.input, 10);
  assert.equal(out.output, 5);
  assert.deepEqual(deltas, ["Hello ", "world"]);
});

test("readCompletion: a stream that goes silent mid-pass rejects as stalled", async () => {
  assert.equal(STREAM_IDLE_MS, 90000);
  const deltas = [];
  // One real delta (the file record reaches the client), then silence
  // forever — the exact 2026-11-14 hang shape.
  const resp = sseResponse([
    sseFrame({ choices: [{ delta: { content: "{\"type\":\"file\"}" }, finish_reason: null }] }),
  ], { close: false });
  await assert.rejects(readCompletion(resp, (d) => deltas.push(d), 60), /stalled/);
  assert.deepEqual(deltas, ["{\"type\":\"file\"}"]);
});

test("missingMessages names the exact missing files and asks for only those", () => {
  const missing = ["root:apps/InvoicePro/App.tsx", "import:apps/InvoicePro/store.ts -> ./seed"];
  const msgs = missingMessages([{ role: "system", content: "sys" }], "PARTIAL TEXT", missing);
  assert.equal(msgs.length, 3);
  assert.equal(msgs[1].role, "assistant");
  assert.equal(msgs[1].content, "PARTIAL TEXT");
  assert.equal(msgs[2].role, "user");
  assert.match(msgs[2].content, /root file: apps\/InvoicePro\/App\.tsx/);
  assert.match(msgs[2].content, /apps\/InvoicePro\/store\.ts imports "\.\/seed"/);
  assert.match(msgs[2].content, /Emit ONLY those missing files/);
});
