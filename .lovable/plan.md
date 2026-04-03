

# Live Chat + Speakers: Side-by-Side Layout

## Change

In `src/pages/HotDealsPortal.tsx`, wrap the Live Chat and Speakers sections in a 2-column grid so they sit next to each other horizontally, saving vertical space.

**Current order (vertical stack):**
- Agenda Ticker
- Live Chat (full width)
- Speakers (full width)

**New layout:**
- Agenda Ticker
- **2-column grid**: Live Chat (left) | Speakers (right)

## File Modified

### `src/pages/HotDealsPortal.tsx`
Replace the separate `<HotDealsLiveChat />` and `<HotDealsSpeakers />` blocks with:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <HotDealsLiveChat />
  <HotDealsSpeakers />
</div>
```

Both components already render their own `tech-card` wrapper, so no additional styling needed.

