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
    sent = JSON.parse(String(init?.body)).model;
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