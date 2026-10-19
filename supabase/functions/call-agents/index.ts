// SFH Call Agents — user-configured AI agents that run on Groq-hosted Meta
// models and are billed through the existing AI credits system.
// Actions (JSON body): list | save | delete | run.
// Auth + CORS conventions follow genius-agent; credit reserve/settle
// semantics follow imagine-ai (reserve up front, settle the difference,
// grant back the unused part, admins pay 0).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Model catalog: USD price per 1M tokens (input / output) on Groq.
// Code Llama is not hosted on Groq, so it is intentionally excluded.
const MODELS: Record<string, { inPrice: number; outPrice: number }> = {
  "llama-3.3-70b-versatile": { inPrice: 0.59, outPrice: 0.79 },
  "meta-llama/llama-4-maverick-17b-128e-instruct": { inPrice: 0.50, outPrice: 0.77 },
  "meta-llama/llama-4-scout-17b-16e-instruct": { inPrice: 0.11, outPrice: 0.34 },
  "meta/muse-spark-open": { inPrice: 0.59, outPrice: 0.79 },
  "llama-3.1-8b-instant": { inPrice: 0.05, outPrice: 0.08 },
};
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const MARKUP = 10; // credits charged = real USD cost x MARKUP
const RESERVE = 1; // credits held per run, settled against actual usage
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const round2 = (n: number) => Math.round(n * 100) / 100;
const clampTokens = (n: unknown) => {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return 1024;
  return Math.min(8000, Math.max(1, v));
};
const clampTemp = (n: unknown) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0.7;
  return Math.min(2, Math.max(0, v));
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceKey) return json({ error: "Service configuration is unavailable" }, 503);

    const authed = createClient(url, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const {
      data: { user },
    } = await authed.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!roleRow || user.email === "ceo@imagineengine.space";

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    // ───────────────── list ─────────────────
    if (action === "list") {
      const { data: agents, error } = await admin
        .from("call_agents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("call-agents list error:", error);
        return json({ error: "Could not load your agents." }, 500);
      }
      let balance: number | null = null;
      if (!isAdmin) {
        // ai_credits_sync ensures the row exists (and applies the daily grant).
        const { data: bal } = await admin.rpc("ai_credits_sync", { _user_id: user.id });
        balance = bal != null ? Number(bal) : 0;
      }
      return json({ agents: agents ?? [], balance, isAdmin });
    }

    // ───────────────── save ─────────────────
    if (action === "save") {
      const name = String(body.name ?? "").trim().slice(0, 120);
      if (!name) return json({ error: "Agent name is required." }, 400);
      const model = String(body.model ?? DEFAULT_MODEL);
      if (!MODELS[model]) return json({ error: `Unknown model: ${model}` }, 400);
      const tools = Array.isArray(body.tools)
        ? body.tools.filter((t: unknown) => typeof t === "string").slice(0, 20)
        : [];
      const coordination =
        body.coordination && typeof body.coordination === "object" && !Array.isArray(body.coordination)
          ? body.coordination
          : {};
      const row: Record<string, unknown> = {
        name,
        description: body.description == null ? null : String(body.description).slice(0, 500),
        model,
        system_prompt: String(body.system_prompt ?? "").slice(0, 20000),
        temperature: clampTemp(body.temperature),
        max_tokens: clampTokens(body.max_tokens),
        tools,
        coordination,
        is_active: body.is_active !== false,
      };

      if (body.id) {
        const { data: existing } = await admin
          .from("call_agents")
          .select("id")
          .eq("id", String(body.id))
          .eq("user_id", user.id)
          .maybeSingle();
        if (!existing) return json({ error: "Agent not found." }, 404);
        const { data: updated, error } = await admin
          .from("call_agents")
          .update(row)
          .eq("id", String(body.id))
          .eq("user_id", user.id)
          .select("*")
          .single();
        if (error) {
          console.error("call-agents update error:", error);
          return json({ error: "Could not save the agent." }, 500);
        }
        return json({ agent: updated });
      }

      const { data: inserted, error } = await admin
        .from("call_agents")
        .insert({ ...row, user_id: user.id })
        .select("*")
        .single();
      if (error) {
        console.error("call-agents insert error:", error);
        return json({ error: "Could not save the agent." }, 500);
      }
      return json({ agent: inserted });
    }

    // ───────────────── delete ─────────────────
    if (action === "delete") {
      const id = String(body.id ?? "");
      if (!id) return json({ error: "Agent id is required." }, 400);
      const { error } = await admin.from("call_agents").delete().eq("id", id).eq("user_id", user.id);
      if (error) {
        console.error("call-agents delete error:", error);
        return json({ error: "Could not delete the agent." }, 500);
      }
      return json({ ok: true });
    }

    // ───────────────── run ─────────────────
    if (action === "run") {
      const groqKey = Deno.env.get("GROQ_API_KEY");
      if (!groqKey) return json({ error: "Groq is not configured on this workspace." }, 503);
      const message = String(body.message ?? "").trim();
      if (!message) return json({ error: "A message is required to run an agent." }, 400);

      const ids: string[] = Array.isArray(body.pipeline)
        ? body.pipeline.map((x: unknown) => String(x)).filter(Boolean).slice(0, 10)
        : body.agent_id
        ? [String(body.agent_id)]
        : [];
      if (!ids.length) return json({ error: "Select at least one agent to run." }, 400);

      const { data: found, error: fetchErr } = await admin
        .from("call_agents")
        .select("*")
        .eq("user_id", user.id)
        .in("id", ids);
      if (fetchErr) {
        console.error("call-agents run fetch error:", fetchErr);
        return json({ error: "Could not load the selected agents." }, 500);
      }
      const byId = new Map((found ?? []).map((a: any) => [a.id, a]));
      const agents = ids.map((id) => byId.get(id)).filter(Boolean);
      if (agents.length !== ids.length) return json({ error: "One or more selected agents were not found." }, 404);

      // Reserve credits up front (admins pay 0, mirroring imagine-ai).
      const reserve = isAdmin ? 0 : RESERVE;
      let balance: number | null = null;
      if (reserve > 0) {
        const { data: nb, error: ce } = await admin.rpc("ai_credits_consume", {
          _user_id: user.id,
          _amount: reserve,
          _reason: "call-agents:reserve",
        });
        if (ce) {
          console.error("call-agents credit consume failed", ce);
          return json({ error: "Could not check your credits. Please try again." }, 500);
        }
        if (Number(nb) < 0) {
          return json(
            {
              error: "You're out of credits. You get 5 free credits every day, or upgrade to a monthly plan for more.",
              code: "no_credits",
            },
            402
          );
        }
        balance = Number(nb);
      }
      // ai_credits_grant returns a boolean (applied or not), never the balance.
      const grant = async (amt: number, reason: string) => {
        const { data: ok } = await admin.rpc("ai_credits_grant", {
          _user_id: user.id,
          _amount: amt,
          _reason: reason,
          _ref: reason + ":" + crypto.randomUUID(),
        });
        if (ok !== true) return;
        if (balance != null) balance = round2(balance + amt);
      };
      const refundReserve = async () => {
        if (reserve > 0) await grant(reserve, "call-agents:refund");
      };

      interface StepResult {
        agent_id: string;
        name: string;
        model: string;
        input: string;
        output: string;
        prompt_tokens: number;
        completion_tokens: number;
        usd: number;
      }
      const steps: StepResult[] = [];
      let previousOutput = "";
      let previousName = "";

      try {
        for (const agent of agents as any[]) {
          const input =
            steps.length === 0
              ? message
              : `Context from the previous agent (${previousName}):\n${previousOutput}\n\nTask: ${message}`;
          const chatMessages: { role: string; content: string }[] = [];
          if (String(agent.system_prompt ?? "").trim()) {
            chatMessages.push({ role: "system", content: String(agent.system_prompt) });
          }
          chatMessages.push({ role: "user", content: input });

          const resp = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${groqKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: agent.model,
              messages: chatMessages,
              temperature: clampTemp(agent.temperature),
              max_tokens: clampTokens(agent.max_tokens),
            }),
          });
          if (!resp.ok) {
            const t = await resp.text();
            console.error("call-agents Groq error:", resp.status, t);
            await admin.from("call_agent_runs").insert({
              agent_id: agent.id,
              user_id: user.id,
              input,
              output: null,
              prompt_tokens: 0,
              completion_tokens: 0,
              credits_charged: 0,
              status: "error",
            });
            throw new Error(`The model provider returned an error (${resp.status}).`);
          }
          const data = await resp.json();
          const output = String(data?.choices?.[0]?.message?.content ?? "");
          const promptTokens = Number(data?.usage?.prompt_tokens ?? 0);
          const completionTokens = Number(data?.usage?.completion_tokens ?? 0);
          const price = MODELS[String(agent.model)] ?? MODELS[DEFAULT_MODEL];
          const usd = (promptTokens / 1e6) * price.inPrice + (completionTokens / 1e6) * price.outPrice;
          steps.push({
            agent_id: agent.id,
            name: agent.name,
            model: agent.model,
            input,
            output,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            usd,
          });
          previousOutput = output;
          previousName = agent.name;
        }
      } catch (e) {
        // Any Groq failure refunds the reserve in full; completed steps are
        // still logged (uncharged).
        for (const s of steps) {
          await admin.from("call_agent_runs").insert({
            agent_id: s.agent_id,
            user_id: user.id,
            input: s.input,
            output: s.output,
            prompt_tokens: s.prompt_tokens,
            completion_tokens: s.completion_tokens,
            credits_charged: 0,
            status: "refunded",
          });
        }
        await refundReserve();
        return json({ error: e instanceof Error ? e.message : "The run failed." }, 502);
      }

      // Settle: charge the real cost x markup, adjusting against the reserve
      // exactly like imagine-ai (grant back the unused part, consume the
      // extra, never take more than the reserve if the balance runs out).
      const totalUsd = steps.reduce((sum, s) => sum + s.usd, 0);
      let charged = 0;
      if (!isAdmin) {
        charged = Math.max(0.05, round2(totalUsd * MARKUP));
        const diff = round2(charged - reserve);
        if (diff < 0) {
          await grant(-diff, "call-agents:adjust");
        } else if (diff > 0) {
          const { data: nb } = await admin.rpc("ai_credits_consume", {
            _user_id: user.id,
            _amount: diff,
            _reason: "call-agents:usage",
          });
          if (Number(nb) >= 0) balance = Number(nb);
          else charged = reserve;
        }
      }

      // Log one run row per agent, with that step's share of the charge.
      for (const s of steps) {
        const share = isAdmin || totalUsd <= 0 ? 0 : round2((s.usd / totalUsd) * charged);
        await admin.from("call_agent_runs").insert({
          agent_id: s.agent_id,
          user_id: user.id,
          input: s.input,
          output: s.output,
          prompt_tokens: s.prompt_tokens,
          completion_tokens: s.completion_tokens,
          credits_charged: share,
          status: "ok",
        });
      }

      return json({
        steps: steps.map((s) => ({
          agent_id: s.agent_id,
          name: s.name,
          model: s.model,
          output: s.output,
          prompt_tokens: s.prompt_tokens,
          completion_tokens: s.completion_tokens,
        })),
        output: steps.length ? steps[steps.length - 1].output : "",
        usage: {
          prompt_tokens: steps.reduce((sum, s) => sum + s.prompt_tokens, 0),
          completion_tokens: steps.reduce((sum, s) => sum + s.completion_tokens, 0),
        },
        credits: { charged, balance },
        isAdmin,
      });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    console.error("call-agents error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
