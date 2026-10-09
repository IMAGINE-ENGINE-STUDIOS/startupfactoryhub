# Live Video on phones

## Why it breaks today
The call screen puts the video and the side menu (Chat, Shop, Text, Rules) side by side. The side menu is always 400px wide, which is wider than most phones, so it pushes the video off the screen and you only see half of the menu.

## How it will look on phones (under 768px wide)

```text
+---------------------------+
| [logo]  12:04  23   HOST  |  slim top bar (one line)
+---------------------------+
|                           |
|     VIDEO fills screen    |  speaker / pinned / shared screen
|                           |
|  [you]  small self view   |
|  ‹ swipe row of people ›  |  others in a sideways slider
|   captions over video     |
+---------------------------+
| mic cam share bg cc  ...  |  round buttons, scroll sideways
|  [Chat] [Shop] [Text] [Leave] |
+---------------------------+
```

- **Video first**: the video takes the whole screen. No side menu sitting beside it.
- **Menu becomes a bottom sheet**: tapping Chat, Shop, Text or Rules slides a panel up from the bottom (about 75% of the screen). Drag down or tap X to close. Red dot on Chat for new messages.
- **People layout**:
  - 1 person: full screen.
  - 2 people: stacked top/bottom (phone is tall).
  - 3+ people: one big speaker on top, everyone else in a sideways swipe row under it — tiles never shrink smaller.
  - Pinned person or shared screen: big on top, others in the swipe row.
- **Top bar**: logo smaller, only time, people count and Host/Guest badge. "Claim host" and Copy invite move into the menu sheet.
- **Bottom bar**: big touch-friendly buttons (44px). Less-used ones (Present, Record, Background, Raise hand) go under a "More" button.
- **Pop-ups** (host requests, "asks to join again", live product drop, speaker suggestion): full-width cards at the top, never cut off.
- **Host controls on tiles**: on phones there is no mouse hover, so tapping a person's tile opens a small menu: Pin, Mute, Ask mic on, Camera, Audience, Remove.
- **Check-in and name screens**: full-width, keyboard doesn't cover the Join button.
- Works with the phone's real screen height (address bar / notch safe areas), portrait and landscape. In landscape the layout uses the desktop style with a narrower menu.

## Tablets and small laptops (768-1100px)
Side menu narrows to 320px and can be hidden with a button so the video gets the full width.

## Desktop
Unchanged.

## Testing
Check at phone (390x844), small phone (360x740), tablet and desktop sizes: no sideways scroll, video visible, every button reachable, menu sheet opens/closes, chat typing works.

## Technical details
- `LiveVideoRoom.tsx`: use `useIsMobile()`; wrapper becomes `flex-col` with `h-[100dvh]` on mobile; sidebar rendered inside a shadcn `Drawer` (bottom sheet) on mobile, `w-[320px] lg:w-[400px]` + collapse toggle on tablet; header compacts; bottom bar splits into primary row + "More" popover; overlays use `inset-x-2` and safe-area padding.
- `LiveStage.tsx`: `mobile` prop — 2 tiles `grid-rows-2`, 3+ hero + horizontal `overflow-x-auto snap-x` strip (`w-32 aspect-[3/4]`); tile tap opens action menu instead of hover buttons.
- LiveKitRoom style height `100dvh`.
