## Problem

Text across brochure slides is too small — content doesn't fill its container squares, leaving cards looking sparse and hard to read. The user wants:

1. Bigger fonts that properly fill each card/square
2. Overall design refinement so containers look balanced (not empty)

## Investigation needed

Need to view current `Brochure.tsx` to identify exact font size classes used (e.g. `text-[10px]`, `text-[11px]`, `text-xs`) on titles, body, and bullet points across each slide, then scale them up while keeping content within A4 page bounds.

## Plan

### 1. Audit current font sizes per slide

Open `src/pages/Brochure.tsx` and catalog the font-size classes used on:

- Card titles (currently ~`text-[11px]`/`text-[20px]`)
- Body text / descriptions (currently ~`text-[10px]`/`text-xs`)
- Bullet list items (currently ~`text-[9px]`/`text-[12px]`)
- Section dividers and headers
- Slide H2 headings

### 2. Apply a uniform font scale-up

Increase font sizes across all content slides using a consistent scale:


| Element                  | Current                     | New                                   |
| ------------------------ | --------------------------- | ------------------------------------- |
| Slide H2 (section title) | `text-3xl` / `text-4xl`     | `text-4xl` / `text-5xl`               |
| Card title               | `text-[11px]`–`text-[22px]` | `text-sm` (14px) / `text-base` (16px) |
| Body / description       | `text-[10px]`–`text-xs`     | `text-[13px]` / `text-sm`             |
| Bullet items             | `text-[9px]`–`text-[20px]`  | `text-[12px]` / `text-[22px]`         |
| Footer / labels          | `text-[9px]`                | `text-[11px]`                         |


### 3. Adjust card padding & spacing to match

With bigger text, slightly increase:

- Card inner padding: `p-2.5` → `p-3` / `p-3.5`
- Icon sizes: `w-3.5 h-3.5` → `w-4 h-4` / `w-5 h-5`
- Gap between cards: `gap-2` → `gap-2.5` / `gap-3`
- Line-height on bullet lists for breathing room

### 4. Reduce content density where needed

Some cards have long bullet lists that won't fit at larger sizes. For those slides (Strategic Benefits, Partner Mapping, Solution), shorten bullet text by 10–20% (trim filler words) while keeping meaning intact — never delete points.

### 5. Verify A4 fit

After changes, each slide must still fit within the `A4Wrapper` (no overflow, no clipped content). Iterate font/padding values per slide if any overflow is detected.

### Slides affected

All content slides in `src/pages/Brochure.tsx`:

- Cover, Overview, Problem, Solution, Features by Role, Strategic Partner Mapping, How to Partner, Strategic Benefits, and any closing slides.

### Files touched

- `src/pages/Brochure.tsx` — font-size, padding, icon-size, and gap classes only. No content removed, no images added, no structural changes.

### Result

- Text fills each card properly — no more sparse-looking squares
- Improved readability at A4 print size
- Consistent typographic hierarchy across all slides
- Layout remains within A4 bounds with no clipping