

## Redesign: AI Tool Menu in FloatingChat

The current `+` dropdown menu (lines 1186-1314) is a cramped, hard-to-scan popup with tiny text, nested collapsible sections, and too many items packed into a small area. Here's the plan to make it clean and usable while preserving every tool.

### Problems
- Everything crammed into one scrollable 264px-wide dropdown
- Chat history and memory mixed in with tools
- 10px font sizes, hard to read
- No visual hierarchy between categories
- Collapsible sections within a dropdown = confusing

### New Design: Full-panel overlay with tabs

Replace the dropdown with a **full-width panel** that slides up from the bottom of the chat window (inside the existing chat container), using 3 horizontal tabs:

```text
┌─────────────────────────────────┐
│  [Tools]  [History]  [Memory]   │  ← 3 tabs
├─────────────────────────────────┤
│  ⚡ Quick                       │
│                                 │
│  📄 DOCUMENTS                   │
│  ┌────────┐ ┌────────┐         │
│  │🔬Research│ │📊Summary│ ...    │  ← 2-col grid, bigger touch targets
│  └────────┘ └────────┘         │
│                                 │
│  🧠 AI TOOLS                    │
│  ┌────────┐ ┌────────┐         │
│  │📈Analytics│ │🧠Market│        │
│  └────────┘ └────────┘         │
│                                 │
│  🚀 ACTIONS                     │
│  ┌────────┐ ┌────────┐         │
│  │📢 Post │ │📅Meeting│ ...     │
│  └────────┘ └────────┘         │
│                                 │
│  [+ New Chat]                   │
└─────────────────────────────────┘
```

### Key Changes

1. **Replace dropdown with overlay panel** — Uses full width of the chat window (~384px), overlays the message area, not a tiny popover
2. **3 tabs at top**: Tools | History (count) | Memory (count) — separates concerns
3. **Tools tab**: 2-column grid with larger buttons (icon + label), grouped by category with clear section headers. Quick Answer gets a highlighted full-width button at top
4. **History tab**: Clean list of past conversations with timestamps and delete buttons, proper spacing
5. **Memory tab**: Clean list of saved items with content preview and delete
6. **"New conversation" button** at bottom of Tools tab
7. **Larger font sizes** (12px body, 11px labels instead of 9-10px)
8. **Better touch targets** — minimum 40px height per item

### Implementation

Single file change: `src/components/FloatingChat.tsx`
- Replace the tool menu div (lines 1186-1314) with the new panel component
- Keep all state variables and handlers unchanged
- Keep `showToolMenu` toggle but render a panel instead of dropdown
- Remove `showChatHistory` and `showMemoryPanel` states, replace with a local `menuTab` state (`'tools' | 'history' | 'memory'`)
- All tool IDs, categories, click handlers remain identical

