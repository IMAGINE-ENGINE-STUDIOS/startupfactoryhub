# Switch all AI to your own keys (OpenAI, Groq, Gemini) + Smart Model Router

## What changes for you
- Every AI feature on the site (chats, Genius, Flow investigations, LightPaper, translator, summaries, market tools, image tools, business card scanner, Imagine Engine) stops using the built-in Lovable AI and runs on your own OpenAI, Groq and Gemini accounts.
- Imagine Engine picks the cheapest capable model first: Groq, then Gemini, and the heavy OpenAI models only for paying users.
- Credits charged per request are calculated from the real cost of the model used, with at least 2x and up to 50x markup.
- No UI changes besides the credit numbers already shown.

## Scope (24 files found)
Edge functions: ai-chatbot, ai-sentiment-analyzer, ai-task-automation, ai-text-summarizer, ai-translator, ai-vision-analyzer, bayesforge-analyze, edit-sfh-image, emergency-ai-tips, flow-investigate, generate-recommendations, generate-sfh-image, genius-agent, imagine-ai, lightpaper-genius, market-intelligence, market-predictions, post-mvp-program, post-partners-campaign, scan-business-card, translate-document, plus shared helpers funding-news and web-research. Frontend: admin settings provider list.

## Step 1 — One shared AI client
New shared helper used by every function:
- `chat({ tier, messages, stream, json, images })` where tier is `fast`, `standard`, `vision`, or `heavy`.
- Fallback chain per tier: Groq -> Gemini -> OpenAI. If a provider key is missing or returns 429/5xx, try the next one once. 400/401/403 stop and report.
- All three providers are called through their OpenAI-compatible chat endpoints, so existing streaming code in the frontend keeps working unchanged.
- Returns the provider/model used and token usage so cost can be computed.

Default models (confirmed against each provider's live model list before wiring):
- fast: Groq `llama-3.1-8b-instant`, fallback Gemini `gemini-2.5-flash-lite`
- standard: Groq `llama-3.3-70b-versatile`, fallback Gemini `gemini-2.5-flash`
- vision (images, business cards, image analysis): Gemini `gemini-2.5-flash`, fallback OpenAI `gpt-4o-mini`
- heavy (paid only): OpenAI `gpt-4.1` / `gpt-5`, fallback Gemini `gemini-2.5-pro`
- image generation/editing: Gemini image model, fallback OpenAI `gpt-image-1`

## Step 2 — Migrate every function
Replace each Lovable call with the shared client, keeping prompts, outputs, auth checks and error messages identical. Remove all `LOVABLE_API_KEY` references; the admin settings provider list drops the Lovable option and adds Groq and Gemini.

## Step 3 — Smart Model Router in imagine-ai
- Micro edits / chat / text tweaks -> fast tier (Groq).
- Section builds, databases, flows -> standard tier (Groq 70B, Gemini fallback).
- Complex code, games, 3D, long apps -> heavy tier only if the user has an active paid plan (Starter/Pro/Studio or legacy). Free users get standard tier with a note to upgrade.
- The model picker in the chat respects the same rule.

## Step 4 — Cost-based credit pricing
- Price table per model (input/output price per million tokens, from provider pricing pages).
- After each successful response: real cost = tokens x price; credits = max(real cost x markup / $0.05, minimum).
- Markup per tier: fast 50x, standard 10x, vision 5x, heavy 2x (never below 2x). Minimum charge 0.05 credits.
- Credits are reserved before the call, then adjusted to the real amount after; on provider failure the reservation is returned automatically (no manual refund flow involved). Admins stay free.
- Every charge is written to the credit ledger with model, tokens and real cost, so margins can be audited.

## Step 5 — Verify
- Confirm the three secrets exist, call each provider's model list.
- Live test: one fast, one standard, one vision request, one stream (LightPaper) and one Imagine build; check ledger entries show correct cost and markup.
- Report any feature that could not be tested.

## Technical notes
- Groq: `https://api.groq.com/openai/v1/chat/completions`; Gemini: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`; OpenAI: `https://api.openai.com/v1/chat/completions`.
- Shared helper lives in `supabase/functions/_shared/ai.ts`; AGENTS.md rule updated (direct provider keys, no gateway).
- Functions deploy to the external Supabase project after edits.
