

# Email Template Color Fix + Donation Commission to 20%

## Changes

### 1. Update Hot Deals invitation email colors
**File: `supabase/functions/send-hot-deals-invite/index.ts`**

The current email is fully orange-themed (`#f97316`, `#ea580c`, `#c2410c`) on dark backgrounds, making text hard to read. Other platform emails use a green theme (`#0ea270`, `#059669`) with white backgrounds for content areas.

Changes:
- Header gradient: switch from orange to green (`#0ea270` to `#059669`) matching platform branding
- Keep "HOT DEALS" accent elements in orange for the event identity, but use green as the primary color
- Content area: switch from dark background (`#0a0a0a`) to white (`#ffffff`) with dark text (`#333`) for readability
- Section borders and labels: use green (`#0ea270`) instead of orange
- CTA buttons: green gradient instead of orange
- Body text: dark gray (`#333333`) on white background instead of light gray on dark
- Container border: green tint instead of orange
- Keep the overall structure and content unchanged

### 2. Update donation commission from 10% to 20%
**File: `supabase/functions/create-hot-deals-donation/index.ts`**

- Line 68: Change `amount_cents * 0.10` to `amount_cents * 0.20`

### 3. Deploy both edge functions
- Deploy `send-hot-deals-invite` and `create-hot-deals-donation`

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/send-hot-deals-invite/index.ts` | Restyle email: green primary + white content background + readable dark text |
| `supabase/functions/create-hot-deals-donation/index.ts` | Change platform fee from 10% to 20% |

