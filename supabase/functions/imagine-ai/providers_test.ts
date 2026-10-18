// Credits: Imagine Engine Studios Corp.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { configuredChat, validCustom, validateSelection, validEndpoint } from "./providers.ts";
import { CHAINS } from "../_shared/ai.ts";
Deno.test("Groq text chains include Llama 3.3 70B", () => {
  for (const tier of ["fast", "standard", "free"] as const) assertEquals(CHAINS[tier].some(([p, m]) => p === "groq" && m === "llama-3.3-70b-versatile"), true);
});
Deno.test("Router and explicit Llama selections are valid", () => {
  assertEquals(validateSelection({ provider: "router", model: "smart-router", custom_providers: [] }), null);
  assertEquals(validateSelection({ provider: "groq", model: "llama-3.3-70b-versatile", custom_providers: [] }), null);
  assertEquals(validateSelection({ provider: "groq", model: "", custom_providers: [] }), "Select a model for this provider");
});
Deno.test("Remote HTTPS Ollama accepted, local and credentialed addresses rejected", () => {
  assertEquals(validCustom([{ id: "my_ollama", name: "Ollama", base_url: "https://models.example.com", kind: "ollama", models: ["llama3.3"] }]), true);
  for (const url of ["http://localhost:11434", "https://127.0.0.1", "https://user:pass@example.com", "https://[::1]", "https://models.local"]) assertEquals(validEndpoint(url), false);
});
Deno.test("Saved model choice determines outbound Groq request", async () => {
  const oldFetch = globalThis.fetch;
  const oldKey = Deno.env.get("GROQ_API_KEY");
  Deno.env.set("GROQ_API_KEY", "test-only-key");
  let sent = "";
  globalThis.fetch = async (_url, init) => {
    sent = JSON.parse(String(init && "body" in init ? init.body : "{}")).model;
    return new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }));
  };
  try {
    const result = await configuredChat("standard", { messages: [{ role: "user", content: "hi" }] }, { provider: "groq", model: "llama-3.3-70b-versatile", custom_providers: [] }, {});
    assertEquals(sent, "llama-3.3-70b-versatile"); assertEquals(result.model, sent); assertEquals(result.resp.status, 200);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) Deno.env.delete("GROQ_API_KEY"); else Deno.env.set("GROQ_API_KEY", oldKey);
  }
});
Deno.test("Ollama translates token limits and response usage", async () => {
  const oldFetch = globalThis.fetch;
  const oldDns = Deno.resolveDns;
  let endpoint = "";
  let payload: Record<string, unknown> = {};
  Deno.resolveDns = (() => Promise.resolve(["93.184.216.34"])) as unknown as typeof Deno.resolveDns;
  globalThis.fetch = async (url, init) => {
    endpoint = String(url);
    payload = JSON.parse(String(init && "body" in init ? init.body : "{}"));
    return new Response(JSON.stringify({ message: { content: "Generated" }, prompt_eval_count: 12, eval_count: 8 }));
  };
  try {
    const result = await configuredChat("standard", { messages: [{ role: "user", content: "hi" }], max_tokens: 8000 }, {
      provider: "ollama_server", model: "llama3.3", custom_providers: [{ id: "ollama_server", name: "Ollama", base_url: "https://models.example.com", kind: "ollama", models: ["llama3.3"] }],
    }, { ollama_server: "test-only-key" });
    assertEquals(endpoint, "https://models.example.com/api/chat");
    assertEquals(payload.options, { num_predict: 8000 });
    assertEquals(payload.stream, false);
    const data = await result.resp.json();
    assertEquals(data.choices[0].message.content, "Generated");
    assertEquals(data.usage, { prompt_tokens: 12, completion_tokens: 8 });
  } finally { globalThis.fetch = oldFetch; Deno.resolveDns = oldDns; }
});
Deno.test("Custom provider private DNS resolution blocks outbound calls", async () => {
  const oldDns = Deno.resolveDns;
  const oldFetch = globalThis.fetch;
  let calls = 0;
  Deno.resolveDns = (() => Promise.resolve(["10.0.0.1"])) as unknown as typeof Deno.resolveDns;
  globalThis.fetch = async () => { calls++; return new Response("{}"); };
  try {
    let blocked = false;
    try {
      await configuredChat("standard", { messages: [] }, { provider: "custom", model: "llama", custom_providers: [{ id: "custom", name: "custom", base_url: "https://models.example.com", kind: "openai", models: ["llama"] }] }, { custom: "test-only-key" });
    } catch { blocked = true; }
    assertEquals(blocked, true); assertEquals(calls, 0);
  } finally { globalThis.fetch = oldFetch; Deno.resolveDns = oldDns; }
});