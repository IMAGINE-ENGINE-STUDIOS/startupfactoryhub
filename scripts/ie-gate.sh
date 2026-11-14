#!/bin/bash
# Imagine Engine regression gate — runs in CI on every push/PR that touches
# the engine runtime (public/imagine-engine/*.js), the imagine-ai brain or
# the shared AI router, and locally via `npm run gate:ie`.
# Fails loud on the first broken layer; a green run means every runtime
# file parses, the build protocol's test suite passes, and the edge
# functions still compile.
set -u
# Repo root = this script's parent directory (an explicit path may still be
# passed as $1, as the original out-of-repo copy allowed).
ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT" || { echo "GATE FAIL: repo not found at $ROOT"; exit 1; }
fail=0
ERR="$(mktemp)"

echo "== 1/3 runtime JS parse (node --check) =="
for f in public/imagine-engine/*.js; do
  if node --check "$f" 2>"$ERR"; then echo "  ok  $f"; else echo "  FAIL $f"; cat "$ERR"; fail=1; fi
done

echo "== 2/3 build protocol tests =="
if node --test public/imagine-engine/build-protocol.test.cjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"; then :; else echo "  FAIL protocol tests"; fail=1; fi
node --test public/imagine-engine/build-protocol.test.cjs >/dev/null 2>&1 || fail=1

echo "== 3/3 edge function parse (esbuild) =="
for f in supabase/functions/imagine-ai/index.ts supabase/functions/imagine-ai/providers.ts supabase/functions/imagine-ai/stream.ts supabase/functions/_shared/ai.ts supabase/functions/call-agents/index.ts; do
  if ./node_modules/.bin/esbuild "$f" --loader:.ts=ts --outfile=/dev/null 2>"$ERR"; then echo "  ok  $f"; else echo "  FAIL $f"; cat "$ERR"; fail=1; fi
done

rm -f "$ERR"
if [ "$fail" = "0" ]; then echo "GATE PASS"; else echo "GATE FAIL"; exit 1; fi
