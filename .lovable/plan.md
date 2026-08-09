# Accelerator brochure: hard cover + new Events slide

## 1. Slide 00 becomes a real hard cover

The brochure currently opens as a two-page spread with the cover already flat on the left. Change it so the deck starts closed on the cover, and the first flip opens the book to reveal the About / Introduction slide on the inside.

- Turn on the flipbook's cover mode so page 1 renders as a stiff cover that swings open on its own.
- Keep the cover artwork exactly as it is today (logo, ACCELERATOR AS A SERVICE title, HUD strips, orbit rings).
- Add a matching closing cover behavior at the end so the last page also acts as a back cover, keeping the spread pairing correct.
- Adjust the page counter and the "start page" logic so the cover counts as page 00 and the numbering of the following slides stays aligned.

## 2. New Events slide (magazine style)

Add a dedicated slide showcasing Startup Factory Hub events, using the same content shown on the main brochure page (featured Artemis 2 Watch Party AR Experience, Voyager at Ohio State, Launching Party Orlando, Lake County / UCF, Plug and Play Selection Day, plus the upcoming Times Square XR activation) — but restyled to the Accelerator brochure's light magazine aesthetic instead of the dark slate cards.

Layout:

```text
+--------------------------------------------------+
| KICKER · EVENTS & ACTIVATIONS                     |
| Where the ecosystem meets.                        |
+--------------------------------------------------+
| [ FEATURED — full-bleed photo, headline overlay ] |
+---------------------+----------------------------+
| [ photo card ]      | [ photo card ]             |
| [ photo card ]      | [ photo card ]             |
+---------------------+----------------------------+
| UPCOMING · one-line strip with date + location    |
+--------------------------------------------------+
```

- Same `PageFrame` + `PageTitle` chrome as the other slides, neon accent (magenta) for consistency.
- Cards use the existing event photos with light glass panels, thin neon rules, mono kickers, and readable body type sized like the rest of the brochure.
- Placed after the AR / Immersive slide and before the Nasdaq / Global Visibility slide; all following slide codes and page numbers renumber accordingly.

## Technical details

- `src/pages/AcceleratorBrochure.tsx`: set `showCover={true}` on `HTMLFlipBook`, clamp `startPage`, and update the `totalPages` / page-counter display and `PageFrame` `code`/`pageNum` props for every slide after the insertion point.
- New slide built as another `BookPage` + `A4Wrapper` + `PageFrame` block in the same file, reusing `MatrixLayer`, `Scanlines`, `NeonEmeraldFrame`.
- Event imagery imported from the existing `src/assets/event-*.jpg|png` files already used by `src/pages/Brochure.tsx` — no new assets, no invented event data.
