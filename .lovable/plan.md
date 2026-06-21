# Per-User Integrations Framework

Goal: let each signed-in user connect their own external accounts from the Tools section, store tokens securely, and expose a typed client for feature code.

## 1. Feature → Provider Map

| App in Tools UI | Auth Type | Scopes / Notes |
|---|---|---|
| Google Calendar | OAuth 2.0 (per-user) | `calendar.events`, `calendar.readonly` |
| Google Drive | OAuth 2.0 (per-user) | `drive.file`, `drive.readonly` |
| Slack | OAuth 2.0 (per-user) | `chat:write`, `channels:read`, `users:read` |
| Notion | OAuth 2.0 (per-user) | workspace-level page select at consent |
| Canva | OAuth 2.0 (per-user, PKCE) | `design:content:read`, `asset:read` |
| ChatGPT (OpenAI) | API key (per-user) | user pastes their `sk-...` key; no OAuth flow |

Google Calendar + Drive share one Google OAuth app (single client_id/secret), two scope bundles, one row per scope-set in the connections table.

## 2. Database (one migration)

`integration_providers` (seed data, public read):
- `id` (text PK: `google_calendar`, `google_drive`, `slack`, `notion`, `canva`, `openai`)
- `name`, `auth_type` (`oauth2` | `api_key`), `icon_url`, `default_scopes` (text[]), `docs_url`, `enabled` (bool)

`user_integrations` (per-user, RLS scoped to `auth.uid()`):
- `id` uuid PK
- `user_id` uuid (not null, FK to auth.users via trigger, never cascade)
- `provider_id` text → integration_providers
- `account_label` text (e.g. email/workspace name)
- `access_token` text (encrypted column; see §3)
- `refresh_token` text (encrypted)
- `expires_at` timestamptz
- `scopes` text[]
- `metadata` jsonb (workspace_id, team_id, etc.)
- `status` text (`active` | `revoked` | `error`)
- `created_at`, `updated_at`
- unique (`user_id`, `provider_id`, `account_label`)

`integration_oauth_states` (CSRF for OAuth flow, short-lived):
- `state` text PK, `user_id`, `provider_id`, `redirect_to`, `pkce_verifier`, `created_at`
- Deleted on callback; cron purge >15min.

RLS: users can only see/insert/delete their own `user_integrations`. service_role full. `integration_providers` is anon+authenticated read.

## 3. Token Storage Security

Tokens are encrypted **before** insert in the edge function using `ENCRYPTION_KEY` (32-byte secret) + AES-GCM. The frontend never receives raw tokens — it only sees `status`, `account_label`, `expires_at`, `scopes`. All provider API calls go through edge functions that decrypt server-side.

## 4. Edge Functions

1. `integrations-start` — input `{provider_id}`, returns OAuth URL with state cookie + PKCE if needed.
2. `integrations-callback` — handles `?code&state`, exchanges for tokens, encrypts, upserts row, redirects to `/tools?connected=<provider>`.
3. `integrations-disconnect` — revokes upstream when possible, marks row revoked + clears tokens.
4. `integrations-proxy` — generic authenticated proxy: input `{provider_id, method, path, body}`. Refreshes token if expired, signs request, returns provider response. This is what feature code calls.
5. `integrations-set-api-key` — for OpenAI: validates key with a `/models` call, then encrypts + stores.

## 5. Required Secrets (per provider OAuth app — user creates in provider console)

- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`
- `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`
- `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`
- `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`
- `INTEGRATIONS_ENCRYPTION_KEY` (auto-generated, 32 bytes base64)

Callback URL for all: `https://<project>.supabase.co/functions/v1/integrations-callback?provider=<id>`

## 6. Frontend

New `src/features/integrations/`:
- `useIntegrations()` hook — list providers + user's connections, mutations to connect/disconnect.
- `IntegrationCard` — logo, name, status pill, Connect/Disconnect button, scope list.
- `ApiKeyDialog` — for OpenAI.
- `OAuthCallbackPage` (route `/tools/connected`) — handles toast on return.

Update the existing Tools section to render an "Integrations" subsection with the grid. No other Tools content changes.

## 7. Build Order

1. Migration (tables + seed providers + RLS + grants).
2. Generate + store `INTEGRATIONS_ENCRYPTION_KEY`.
3. Edge functions (start, callback, disconnect, proxy, set-api-key) with shared `_lib/crypto.ts` and `_lib/providers.ts`.
4. Request provider OAuth secrets from user (one prompt with all 8).
5. Frontend hook + UI in Tools section.
6. Smoke test: connect OpenAI (no OAuth setup needed), then one OAuth provider once the user supplies a client_id/secret.

## Open question before build

For Canva and Notion, do you already have OAuth apps registered, or should I include step-by-step setup links in the connect dialog so each user-of-your-app understands they're connecting their *own* account? (This is per-user OAuth — every end user authorizes individually.)
