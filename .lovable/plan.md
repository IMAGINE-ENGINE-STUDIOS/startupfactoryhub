

# Fix Email + Banner: WIN Name, Remove Emojis, Add Green to Banner

## Changes

### 1. Email template fixes (`supabase/functions/send-hot-deals-invite/index.ts`)
- **Fix WIN name**: Line 88 — Change "Washington Innovation Network" to "World Innovation Network"
- **Remove all emojis**, replace with HTML entity symbols or plain text:
  - Line 42: `🔥 HOT DEALS` → remove emoji, use `&#9670;` (diamond) or just bold text
  - Line 72: `&#128197;` (calendar emoji) → remove, use plain "EVENT AGENDA"
  - Line 92: `&#127942;` (trophy emoji) → remove
  - Line 99: `&#127908;` (mic emoji) → remove
  - Line 113: `&#128293;` (fire emoji) → remove
  - Line 117-121: Remove all emoji HTML entities (`&#128293;`, `&#128176;`, `&#128200;`, `&#127942;`, `&#128196;`)
  - Line 126: `&#9989;` (checkmark emoji) → remove
  - Replace with simple bullet markers like `&#9656;` (right-pointing triangle) or `&#8250;` (angle bracket)

### 2. Banner changes (`src/components/HotDealsRocketBanner.tsx`)
- **Remove Rocket icon**: Delete lines 49-52 (Rocket silhouette) and line 1 Rocket import
- **Remove flame trail**: Delete lines 54-58
- **Add more green, keep some orange**: 
  - Border: change from `border-orange-500/40` to `border-emerald-500/40` with orange shadow kept lighter
  - Rivet lines: mix green (`emerald-700/40`) with orange accents
  - Welding seam: use green tones
  - Speed lines: change to emerald-based gradients
  - Stars: change to `bg-emerald-300/40`
  - Panel lines: use `emerald-700/15`
  - Background gradients: shift hues from orange (hsl 15-25) toward teal/green (hsl 155-165) with some warm accents
  - Subtitle text: keep `text-orange-400` for "HOT DEALS" gradient but shift Flag icon color to emerald
  - Date line: change from `text-orange-400/60` to `text-emerald-400/60`
  - Vignette: adjust to green-dark tones

### 3. Deploy email edge function

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/send-hot-deals-invite/index.ts` | Fix WIN to "World Innovation Network"; replace all emojis with plain markers |
| `src/components/HotDealsRocketBanner.tsx` | Remove Rocket icon + flame trail; shift color palette to green-primary with orange accents |

