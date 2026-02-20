# /emails Page Redesign — Icons, Geometric Patterns & Matrix Background

## What's Being Changed

The `/emails` page (`src/pages/EmailTemplates.tsx`) needs three visual upgrades to the **page shell** (not the email HTML previews themselves):

1. **Replace all emojis in the page UI** with Lucide icons
2. **Add geometric pattern overlay** (tech-grid style like the marketing banners)
3. **Add Matrix-style background animation** (reusing the existing `MatrixBackground` component at a simplified/lower opacity)

The **email HTML templates** (the content inside the iframe preview) will also have their emojis replaced with inline SVG equivalents where possible, or ASCII/text symbols where SVG is not suitable for email clients.

---

## Scope of Changes

### File: `src/pages/EmailTemplates.tsx`

#### 1. Page Shell — Emoji Replacements (React UI layer)

All emojis currently in the React JSX UI will be replaced with Lucide icons:


| Location             | Emoji | Lucide Icon     |
| -------------------- | ----- | --------------- |
| Auth warning note    | `⚠️`  | `AlertTriangle` |
| Toast (auth emails)  | `ℹ️`  | `Info`          |
| Toast (send success) | `✅`   | `CheckCircle2`  |


#### 2. Background — Matrix Animation + Geometric Pattern

The page's root `div` will become `relative overflow-hidden` and will receive:

- `**MatrixBackground**` component (already exists at `src/components/MatrixBackground.tsx`) rendered at low opacity (the component already has `opacity-20` built in, perfect for a subtle effect)
- **Geometric grid overlay** using an inline `div` with a CSS `backgroundImage` grid pattern (same technique used in `FeaturesSection.tsx` and `HeroSection.tsx`)
- A subtle radial gradient over the geometric layer for depth

The header, sidebar, and main panel will remain on top via `relative z-10`.

#### 3. Email HTML Templates — Emoji Replacements

Inside the HTML template generator functions, emojis are used as icon substitutes. Since email clients don't support SVG, these will be replaced with:

- **Styled text/symbol alternatives** using CSS-styled `<span>` elements with Unicode symbols or short text labels
- **Colored bullet indicators** using CSS `border-radius` circles
- Specific replacements:


| Template                          | Emoji              | Replacement                                     | &nbsp;     |
| --------------------------------- | ------------------ | ----------------------------------------------- | ---------- |
| Notification hero icon            | `🔔 🤝 💬 📅 ✨ ⚠️` | CSS circle with colored border + letter initial | &nbsp;     |
| Notification button               | `🚀`               | &nbsp;                                          | style icon |
| Notification tip                  | `💡`               | Styled `[TIP]` label                            | &nbsp;     |
| Invitation badge                  | `🎉`               | Styled text badge                               | &nbsp;     |
| Invitation hero                   | `🚀`               | &nbsp;                                          | style icon |
| Invitation card title             | `📋`               | `[>]` styled label                              | &nbsp;     |
| Invitation status                 | `✅`                | Colored dot                                     | &nbsp;     |
| Invitation CTA                    | `🚀`               | &nbsp;                                          | style icon |
| Invitation expiry                 | `⏰`                | `[!]` styled                                    | &nbsp;     |
| Digest preview badge              | `⚠️`               | `[!]` styled                                    | &nbsp;     |
| Digest week badge                 | `📰`               | &nbsp;                                          | style icon |
| Digest greeting                   | `👋`               | style icon                                      | &nbsp;     |
| Digest section headers            | `🚀 🎓 💰 📚 📅`   | Colored square accent                           | &nbsp;     |
| Digest CTA                        | `🔭`               | &nbsp;                                          | style icon |
| Partnership badge                 | `🤝`               | `[+]` styled                                    | &nbsp;     |
| Partnership card labels           | `🏢 🎁 🌐`         | Text label                                      | &nbsp;     |
| Partnership benefits `li::before` | `✅`                | CSS green dot                                   | &nbsp;     |
| Partnership CTA                   | `🚀`               | &nbsp;                                          | style icon |
| Auth hero icon                    | `🔐 ✨ 🔑 🚀`       | CSS circle with letter                          | &nbsp;     |
| Auth expiry                       | `⏰`                | &nbsp;                                          | style icon |
| PDF signature badge               | `📄`               | Text label                                      | &nbsp;     |
| PDF hero icon                     | `✍️ ✏️ 📄`         | CSS circle with letter                          | &nbsp;     |
| PDF card label                    | `📋`               | &nbsp;                                          | style icon |
| PDF CTA                           | `📄`               | &nbsp;                                          | style icon |


---

## Technical Approach

### Background Layers (z-index stack)

```text
z-0  MatrixBackground (canvas, opacity-20)
z-1  Geometric grid overlay (div with backgroundImage, opacity-10)
z-2  Radial gradient vignette (div, pointer-events-none)
z-10 Page content (header, sidebar, main panel)
```

### Geometric Pattern CSS

Same approach as `FeaturesSection.tsx`:

```css
backgroundImage: `linear-gradient(hsl(160 84% 39% / 0.08) 1px, transparent 1px),
                  linear-gradient(90deg, hsl(160 84% 39% / 0.08) 1px, transparent 1px)`,
backgroundSize: '40px 40px'
```

### Email HTML Icon Replacements

For the **notification hero icon**, replace the emoji `div` with a CSS-styled circle containing the type initial:

```html
<!-- Before -->
<div class="hero-icon">${icon_emoji}</div>

<!-- After -->
<div class="hero-icon" style="...css circle styles...">
  <span style="color:white; font-size:28px; font-weight:700; font-family:monospace">
    ${typeInitial}
  </span>
</div>
```

Benefits list checkmarks (`✅`) become a CSS `::before` green filled circle via inline style.

---

## Files to Modify


| File                           | Change                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/pages/EmailTemplates.tsx` | Add Matrix + geometric background, replace UI emojis with Lucide icons, replace all HTML template emojis with styled text/CSS alternatives |


No new files needed — `MatrixBackground` already exists and will be imported.