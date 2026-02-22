

## Genius AI Improvements Plan

This plan covers 6 interconnected improvements to the Genius AI system in LightPaper and the global FloatingChat bubble.

---

### 1. Task Registry Log (new UI in LightPaper toolbar)

Add a small "AI Log" button to the LightPaper toolbar area that opens a panel showing all Genius AI tasks:
- Each entry shows: task title, status (in-progress / done / failed), timestamp, page count, preset used
- Tasks persist in `localStorage` (keyed per user) so they survive reload/logout
- Completed tasks show download buttons for the generated content
- New file: `src/components/lightpaper/GeniusTaskRegistry.tsx`
- State management via a shared store or context that GeniusAIBubble writes to

### 2. Animated Progress Bar with Page Count

During chapter generation (`generating-chapters` phase), replace the simple progress bar in GeniusAIBubble with:
- A more prominent animated progress bar (gradient with shimmer animation)
- Show "Chapter X of Y" with estimated page count from `chapterOutlines[i].estimatedPages`
- Show total pages targeted: sum of all `estimatedPages`
- Progress bar also visible in the Task Registry panel

### 3. Real-time Word-by-Word Streaming into Document

Currently, Genius AI buffers the entire chapter response then calls `onInsertText(chapterHtml)` all at once. Change to:
- Use `onStreamingChunk` prop (already defined but unused) during chapter generation
- Modify `callAI` to accept an `onChunk` callback
- Each SSE token gets converted to HTML and appended to the document in real-time via `onStreamingChunk`
- User sees words appearing one-by-one as the AI writes
- Final flush still calls `onInsertText` with the complete chapter for state consistency

### 4. Clickable Selection Buttons for AI Questions

When Genius AI asks clarifying questions with options like "A) Academic B) Casual C) Business":
- Parse the AI response to detect option patterns (A/B/C or numbered options)
- Render them as clickable buttons instead of plain text
- Clicking a button auto-sends that selection as the user's reply
- Larger, better-looking typography for the question text (bump from `text-xs` to `text-sm`/`text-base`)
- File: `src/components/lightpaper/GeniusAIBubble.tsx` -- modify the conversation rendering section

### 5. Replace FloatingChat Bubble with Genius AI Logo + Integrate AI Tab

**FloatingChat changes** (`src/components/FloatingChat.tsx`):
- Replace the `MessageSquare` icon in the toggle button with the Genius AI logo image (`genius-ai-logo.png`)
- Rename the "AI" tab to "Genius AI" and use the Genius AI logo instead of `Brain` icon
- Replace the `ai-chatbot` edge function call with `lightpaper-genius` edge function for consistency
- Use streaming responses (same SSE approach as GeniusAIBubble) instead of the current non-streaming `invoke`
- Render AI responses with markdown support using `react-markdown`
- This makes the floating chat bubble serve as a unified Genius AI interface across the entire app

### 6. AI Notifications for Document Completion

When a Genius AI task finishes (all chapters written or single document done):
- Send a notification via the Message Center (`addLightPaperMessage`)
- Also push a toast notification (`sonner`) with "Document ready" message
- If the FloatingChat is open on the AI tab, show a notification badge on the messages tab indicating "Document ready in LightPaper"
- Store completion status in the Task Registry so user can see it even after page reload

---

### Technical Details

**Files to create:**
- `src/components/lightpaper/GeniusTaskRegistry.tsx` -- Task log panel component with registry button

**Files to modify:**
- `src/components/lightpaper/GeniusAIBubble.tsx`:
  - Add task registry integration (write task entries on start/progress/completion)
  - Enhanced progress bar with shimmer animation and page count
  - Word-by-word streaming: modify `callAI` to stream chunks, call `onStreamingChunk` per token during generation
  - Parse clarification responses to render clickable option buttons
  - Bump typography sizes in conversation view
- `src/components/lightpaper/LightPaperDocument.tsx`:
  - Add GeniusTaskRegistry button in toolbar
  - Wire up `onStreamingChunk` to append HTML tokens to the editor in real-time
- `src/components/FloatingChat.tsx`:
  - Replace bubble icon with Genius AI logo
  - Replace AI tab icon and label
  - Switch AI backend from `ai-chatbot` to `lightpaper-genius`
  - Add streaming SSE support for AI responses
  - Add markdown rendering for AI messages
  - Add notification badge for document completion events

**Task Registry data structure (localStorage):**
```text
{
  id: string,
  title: string,
  preset: string,
  status: "in-progress" | "done" | "failed",
  progress: { current: number, total: number },
  targetPages: number,
  createdAt: string,
  completedAt?: string,
  content?: string  // stored HTML for re-loading
}
```

**Streaming changes in callAI:**
- Add optional `onChunk?: (token: string) => void` parameter
- Call `onChunk(c)` inside the SSE parse loop alongside `fullText += c`
- In `generateChaptersFrom`, pass a chunk handler that calls `onStreamingChunk` with incremental HTML conversion

