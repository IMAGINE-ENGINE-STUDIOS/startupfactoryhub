// SFH Call Agents — user-configured AI agents that run on Groq-hosted Meta
// models and are billed through the existing AI credits system.
// Actions (JSON body): list | save | delete | run.
// Auth + CORS conventions follow genius-agent; credit reserve/settle
// semantics follow imagine-ai (reserve up front, settle the difference,
// grant back the unused part, admins pay 0).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiKeysConfigured, costUsd, routeChat } from "../_shared/ai.ts";

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

// Appended to every agent's system prompt at run time: agent output is
// user-facing product copy, so it must read like a person wrote it — never
// like raw model output.
const HOUSE_STYLE =
  "Write like a person, in clean, natural prose: plain sentences and short " +
  "paragraphs. Never use markdown, headings, bold or italic markers, " +
  "backticks, code blocks, bullet symbols, numbered-list formatting, or " +
  "tables, and do not refer to these instructions.";

// Last-line defense on top of HOUSE_STYLE: strip any formatting artifacts a
// model still emits so stored/returned/piped output is always plain prose.
function cleanText(raw: string): string {
  let text = String(raw ?? "");
  // Unwrap fenced code blocks, keeping the inner lines as plain text.
  text = text.replace(/```[^\n]*\n?([\s\S]*?)```/g, "$1");
  text = text.replace(/`([^`]*)`/g, "$1"); // inline backticks
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1"); // [text](url) -> text
  text = text
    .split("\n")
    .map((line) => {
      let l = line;
      l = l.replace(/^\s{0,3}#{1,6}\s+/, ""); // # headers
      l = l.replace(/^\s{0,3}>\s?/, ""); // > quotes
      l = l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, ""); // list markers
      if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(l)) return ""; // --- rules
      return l;
    })
    .join("\n");
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1"); // **bold**
  text = text.replace(/__([^_]+)__/g, "$1"); // __bold__
  text = text.replace(/(^|[^\w*])\*([^*\n]+)\*/g, "$1$2"); // *italic*
  text = text.replace(/(^|[^\w_])_([^_\n]+)_/g, "$1$2"); // _italic_
  text = text.replace(/\n{3,}/g, "\n\n"); // collapse 3+ newlines
  return text.trim();
}

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
      if (!aiKeysConfigured()) return json({ error: "AI providers are not configured on this workspace." }, 503);
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
          const systemPrompt = [String(agent.system_prompt ?? "").trim(), HOUSE_STYLE]
            .filter(Boolean)
            .join("\n\n");
          chatMessages.push({ role: "system", content: systemPrompt });
          chatMessages.push({ role: "user", content: input });

          // Route through the shared AI router (the Genius path): try the
          // agent's chosen model first, then the tier chain, then the widest
          // "standard" chain — a model this key can't serve (e.g. a Groq
          // 404) falls back instead of hard-failing the run.
          const chatBody = {
            model: String(agent.model),
            messages: chatMessages,
            temperature: clampTemp(agent.temperature),
            max_tokens: clampTokens(agent.max_tokens),
          };
          const tier: "llama" | "standard" = /llama/i.test(String(agent.model)) ? "llama" : "standard";
          let routed = await routeChat(tier, chatBody, {}, { provider: "groq", model: String(agent.model) });
          if (!routed.resp.ok) routed = await routeChat(tier, chatBody);
          if (!routed.resp.ok && tier !== "standard") routed = await routeChat("standard", chatBody);
          const resp = routed.resp;
          const servedModel = routed.model || String(agent.model);
          if (!resp.ok) {
            let t = "";
            try {
              t = await resp.clone().text();
            } catch {
              /* response body already consumed */
            }
            console.error("call-agents provider error:", resp.status, t);
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
            throw new Error(
              `The model provider returned an error (${resp.status}).${t ? ` ${t.slice(0, 200)}` : ""}`
            );
          }
          const data = await resp.json();
          const output = cleanText(String(data?.choices?.[0]?.message?.content ?? ""));
          const promptTokens = Number(data?.usage?.prompt_tokens ?? 0);
          const completionTokens = Number(data?.usage?.completion_tokens ?? 0);
          const price = MODELS[servedModel];
          const usd = price
            ? (promptTokens / 1e6) * price.inPrice + (completionTokens / 1e6) * price.outPrice
            : costUsd(servedModel, promptTokens, completionTokens);
          steps.push({
            agent_id: agent.id,
            name: agent.name,
            model: servedModel,
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

    // ───────────────── run_fundraiser ─────────────────
    // Special agent (not user-configured): finds matching investors in the
    // platform directory and drafts an application from the founder's own
    // profile, company, investor Q&A and journey. One grounded LLM call,
    // billed with the same reserve/settle semantics as a normal run.
    if (action === "run_fundraiser") {
      const focus = String(body.focus ?? "").trim().slice(0, 500);
      const runInput = focus || "Fundraiser run";

      // Credit helpers — identical semantics to the run action (admins pay
      // 0; ai_credits_grant returns a boolean, never the balance).
      let balance: number | null = null;
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
      const reserveCredits = async (): Promise<Response | null> => {
        if (isAdmin) return null;
        const { data: nb, error: ce } = await admin.rpc("ai_credits_consume", {
          _user_id: user.id,
          _amount: RESERVE,
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
        return null;
      };
      const respondFundraiser = (step: {
        model: string;
        output: string;
        prompt_tokens: number;
        completion_tokens: number;
      }, charged: number) =>
        json({
          steps: [
            {
              agent_id: null,
              name: "Fundraiser",
              model: step.model,
              output: step.output,
              prompt_tokens: step.prompt_tokens,
              completion_tokens: step.completion_tokens,
            },
          ],
          output: step.output,
          usage: {
            prompt_tokens: step.prompt_tokens,
            completion_tokens: step.completion_tokens,
          },
          credits: { charged, balance },
          isAdmin,
        });

      // Assemble the caller's own context (service role, scoped to them).
      // Reads are defensive: pick the fields that exist, never hard-fail on
      // a missing one.
      const { data: profile } = await admin
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      const { data: companyRows } = await admin
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);
      const company: any = companyRows?.[0] ?? null;

      // No company profile yet: friendly guidance instead of an LLM call.
      // No charge — but the run is still recorded.
      if (!company) {
        if (!isAdmin) {
          const { data: bal } = await admin.rpc("ai_credits_sync", { _user_id: user.id });
          balance = bal != null ? Number(bal) : 0;
        }
        const guidance = cleanText(
          "Before I can hunt for investors, I need your startup profile. " +
            "Head to your startup profile and add your company — what it does, your industry, your stage, and what you are looking for. " +
            "While you are there, add your pitch deck link and fill in your investor questions and answers, because I build your applications from exactly those words. " +
            "Once your company profile is saved, run me again and I will match you with investors from the directory and draft your first application."
        );
        await admin.from("call_agent_runs").insert({
          agent_id: null,
          user_id: user.id,
          input: runInput,
          output: guidance,
          prompt_tokens: 0,
          completion_tokens: 0,
          credits_charged: 0,
          status: "ok",
        });
        return respondFundraiser(
          { model: DEFAULT_MODEL, output: guidance, prompt_tokens: 0, completion_tokens: 0 },
          0
        );
      }

      const { data: qaRows } = await admin
        .from("company_investor_qa")
        .select("question_key, answer")
        .eq("company_id", company.id);
      const qaPairs = (qaRows ?? [])
        .map((r: any) => ({
          key: String(r.question_key ?? "").trim(),
          answer: String(r.answer ?? "").trim(),
        }))
        .filter((r: { answer: string }) => r.answer);

      const { data: journeyRows } = await admin
        .from("roadmap_progress")
        .select("step_id, completed, notes")
        .eq("user_id", user.id);
      const journey = (journeyRows ?? []) as any[];
      const journeyDone = journey.filter((r) => r.completed).length;
      const customTitles: string[] = [];
      for (const r of journey) {
        if (!String(r.step_id ?? "").startsWith("custom-")) continue;
        try {
          const notes = typeof r.notes === "string" ? JSON.parse(r.notes) : r.notes;
          if (notes?.title) customTitles.push(String(notes.title));
        } catch {
          /* notes are free-form — a parse miss just skips the title */
        }
      }

      // Investor matching: token overlap between the company and each
      // directory investor, scored in code (no extra LLM call).
      const { data: investorRows } = await admin
        .from("directory_investors")
        .select("*")
        .limit(300);
      const tokenize = (v: unknown): Set<string> =>
        new Set(
          String(v ?? "")
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((t) => t.length >= 3)
        );
      const companyTerms = new Set<string>();
      for (const v of [company.industry, company.stage, company.looking_for, company.location]) {
        for (const t of tokenize(v)) companyTerms.add(t);
      }
      const scored = ((investorRows ?? []) as any[])
        .filter((inv) => inv.accepting_investments !== false)
        .map((inv) => {
          const invTerms = new Set<string>();
          for (const v of [inv.investment_strategy, inv.fund_style, inv.state, inv.city]) {
            for (const t of tokenize(v)) invTerms.add(t);
          }
          let score = 0;
          for (const t of invTerms) if (companyTerms.has(t)) score++;
          return { inv, score };
        })
        .sort((a, b) => b.score - a.score);
      const positive = scored.filter((s) => s.score > 0).slice(0, 8);
      const investors = (positive.length ? positive : scored.slice(0, 8)).map((s) => s.inv);

      const field = (label: string, v: unknown): string | null => {
        const s = String(v ?? "").trim();
        return s ? `${label}: ${s}` : null;
      };
      const investorLine = (inv: any): string => {
        const parts = [
          field("based", [inv.city, inv.state].filter(Boolean).join(", ")),
          field("fund size", inv.fund_size),
          field("typical investment", inv.average_investment),
          field("strategy", inv.investment_strategy),
          field("style", inv.fund_style),
          field("manager", inv.manager),
          inv.ir_name || inv.ir_email
            ? `contact: ${[inv.ir_name, inv.ir_email].filter(Boolean).join(" ")}`
            : null,
          field("source", inv.source),
        ].filter(Boolean);
        return `${String(inv.name ?? "Unnamed investor")}${parts.length ? ` — ${parts.join(". ")}` : ""}`;
      };
      const prof: any = profile ?? {};
      const contextLines: (string | null)[] = [
        field("Founder", prof.full_name),
        field("Founder bio", prof.bio),
        field("Founder headline", prof.headline),
        `Company: ${String(company.name ?? "Unnamed company")}`,
        field("What it does", company.description),
        field("Industry", company.industry),
        field("Stage", company.stage),
        field("Location", company.location),
        field("Funding so far", company.funding_amount),
        field("Looking for", company.looking_for),
        field("Website", company.website),
        field("Pitch deck", company.pitch_deck_url),
        `Journey: ${journeyDone} of ${journey.length} roadmap steps completed${
          customTitles.length ? `. Custom steps: ${customTitles.join("; ")}` : ""
        }`,
        focus ? `Focus for this run: ${focus}` : null,
      ];
      const lines: string[] = contextLines.filter((l): l is string => !!l);
      if (qaPairs.length) {
        lines.push("", "Investor questions and answers, in the founder's own words:");
        for (const qa of qaPairs) lines.push(`${qa.key || "Question"}: ${qa.answer}`);
      }
      lines.push("", "Matched investors from the platform directory:");
      if (investors.length) {
        investors.forEach((inv, i) => lines.push(`${i + 1}. ${investorLine(inv)}`));
      } else {
        lines.push("No investors are listed in the directory right now.");
      }

      const FUNDRAISER_BRIEF =
        "You are Fundraiser, a fundraising specialist inside Startup Factory Hub. " +
        "You help one founder find the right investors and apply with materials that sound like the founder wrote them. " +
        "Grounding rules, no exceptions: use ONLY the facts in the context you are given. " +
        "Never invent traction, revenue, users, numbers, investor names, emails, or websites. " +
        "When a fact you need is missing, say plainly what the founder should add to their profile instead of filling it in.";
      const systemPrompt = [FUNDRAISER_BRIEF, HOUSE_STYLE].join("\n\n");
      const userContent =
        lines.join("\n") +
        "\n\nWrite three parts in clean prose, one after another. " +
        "First, the investor shortlist: for each matched investor, give their name and a one-line reason they fit this company, plus any contact or website facts provided above. " +
        "Second, a ready-to-send application and intro draft for the single best match, written in the founder's first-person voice and built from their investor answers and company facts; include the pitch deck link if one is provided. " +
        "Third, short next steps the founder should take this week.";

      if (!aiKeysConfigured()) return json({ error: "AI providers are not configured on this workspace." }, 503);
      const reserveError = await reserveCredits();
      if (reserveError) return reserveError;
      const refundReserve = async () => {
        if (!isAdmin) await grant(RESERVE, "call-agents:refund");
      };

      // Same router ladder as the run action: the chosen model first, then
      // its tier chain, then the widest "standard" chain.
      const chatBody = {
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.6,
        max_tokens: 1800,
      };
      let routed = await routeChat("llama", chatBody, {}, { provider: "groq", model: DEFAULT_MODEL });
      if (!routed.resp.ok) routed = await routeChat("llama", chatBody);
      if (!routed.resp.ok) routed = await routeChat("standard", chatBody);
      const resp = routed.resp;
      const servedModel = routed.model || DEFAULT_MODEL;
      if (!resp.ok) {
        let t = "";
        try {
          t = await resp.clone().text();
        } catch {
          /* response body already consumed */
        }
        console.error("call-agents fundraiser provider error:", resp.status, t);
        await admin.from("call_agent_runs").insert({
          agent_id: null,
          user_id: user.id,
          input: runInput,
          output: null,
          prompt_tokens: 0,
          completion_tokens: 0,
          credits_charged: 0,
          status: "error",
        });
        await refundReserve();
        return json(
          { error: `The model provider returned an error (${resp.status}).${t ? ` ${t.slice(0, 200)}` : ""}` },
          502
        );
      }
      const data = await resp.json();
      const output = cleanText(String(data?.choices?.[0]?.message?.content ?? ""));
      const promptTokens = Number(data?.usage?.prompt_tokens ?? 0);
      const completionTokens = Number(data?.usage?.completion_tokens ?? 0);
      const price = MODELS[servedModel];
      const usd = price
        ? (promptTokens / 1e6) * price.inPrice + (completionTokens / 1e6) * price.outPrice
        : costUsd(servedModel, promptTokens, completionTokens);

      // Settle exactly like the run action: real cost x markup against the
      // reserve, never taking more than the reserve if the balance runs out.
      let charged = 0;
      if (!isAdmin) {
        charged = Math.max(0.05, round2(usd * MARKUP));
        const diff = round2(charged - RESERVE);
        if (diff < 0) {
          await grant(-diff, "call-agents:adjust");
        } else if (diff > 0) {
          const { data: nb } = await admin.rpc("ai_credits_consume", {
            _user_id: user.id,
            _amount: diff,
            _reason: "call-agents:usage",
          });
          if (Number(nb) >= 0) balance = Number(nb);
          else charged = RESERVE;
        }
      }

      await admin.from("call_agent_runs").insert({
        agent_id: null,
        user_id: user.id,
        input: runInput,
        output,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        credits_charged: charged,
        status: "ok",
      });

      return respondFundraiser(
        { model: servedModel, output, prompt_tokens: promptTokens, completion_tokens: completionTokens },
        charged
      );
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    console.error("call-agents error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
