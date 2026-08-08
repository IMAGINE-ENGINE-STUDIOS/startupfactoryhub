# Make brochure pages less flip-sensitive

Right now a single click or small drag anywhere on a brochure page turns the page. That makes form fields impossible to fill in and makes profile/team cards flip the book instead of opening.

## What changes

1. **No page turn on click.** Pages only turn via the arrow buttons, keyboard arrows, the page corners, or a deliberate swipe/drag. A plain click never flips.
2. **Bigger swipe threshold.** A drag must travel clearly further before it counts as a page turn, so small pointer movements while typing or tapping are ignored.
3. **Interactive safe zones.** Form cards, inputs, buttons, profile/team cards, maps and 3D panels get a wrapper that stops pointer events from reaching the book, so interacting with them never flips the page.
4. **Keyboard arrows ignored while typing.** Left/Right arrow keys inside an input or textarea move the text cursor instead of turning the page.

Applied to the Accelerator brochure first, then the same treatment to the other brochure pages (BDV, WTC, Brochure, Brochure ES, Academia) so behavior is consistent.

## Technical details

- In each brochure's `HTMLFlipBook` config: `disableFlipByClick={true}`, `useMouseEvents={true}` kept for drag, `clickEventForward={true}` kept so buttons/links inside pages still receive clicks, `swipeDistance` raised (desktop spread ~120, single/mobile ~90).
- Add a small shared `NoFlipZone` wrapper component that calls `stopPropagation()` on `pointerdown`, `mousedown`, `touchstart` and `touchmove`; wrap the batch-request form, profile/team card grids, and interactive visual panels with it.
- Update the `keydown` handler to bail when `document.activeElement` is an `input`, `textarea`, or `[contenteditable]`.
