// Credits: Imagine Engine Studios Corp.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { authenticatedUser } from "./auth.ts";
Deno.test("Anonymous 3D requests cannot reach identity work", async () => {
  let calls = 0;
  const id = await authenticatedUser(new Request("https://example.com"), async () => { calls++; return { data: { user: { id: "user" } }, error: null }; });
  assertEquals(id, null); assertEquals(calls, 0);
});
Deno.test("Invalid bearer tokens are rejected", async () => {
  assertEquals(await authenticatedUser(new Request("https://example.com", { headers: { Authorization: "Bearer invalid" } }), async () => ({ data: { user: null }, error: new Error("invalid") })), null);
});
Deno.test("Verified 3D users retain access", async () => {
  assertEquals(await authenticatedUser(new Request("https://example.com", { headers: { Authorization: "Bearer verified" } }), async () => ({ data: { user: { id: "real-user" } }, error: null })), "real-user");
});