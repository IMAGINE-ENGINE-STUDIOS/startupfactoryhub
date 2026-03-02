

## Plan: Replace TradingView Embeds with SFH Proprietary Widgets

### What We're Replacing
The current `TradingViewCharts.tsx` embeds three third-party TradingView widgets (Market Overview, US Stocks Hotlists, Economic Calendar) via injected `<script>` tags. These will be fully replaced with custom-built, SFH-branded widgets using real-time data from free public APIs (CoinGecko) and deterministic economic calendar generation -- ported and adapted from the [Gold Arrow](/projects/b134be66-1c67-4b17-bdd9-e3f2dea9bef0) project.

### New Files to Create

1. **`src/hooks/useCryptoData.ts`** -- Ported from Gold Arrow. Uses CoinGecko's free public API (`/coins/markets`, `/global`, `/search/trending`) with 30s auto-refresh. Includes hardcoded fallback data when rate-limited. No API key needed.

2. **`src/hooks/useInView.ts`** -- Lightweight IntersectionObserver hook for animated entry (from Gold Arrow).

3. **`src/components/intelligence/widgets/AnimatedNumber.tsx`** -- Smooth count-up number animation component (from Gold Arrow).

4. **`src/components/intelligence/widgets/LivePulse.tsx`** -- Pulsing green dot "LIVE" indicator (from Gold Arrow).

5. **`src/components/intelligence/widgets/SFHMarketOverview.tsx`** -- Replaces TradingView Market Overview. Shows: global market cap, 24h volume, BTC dominance, active coins as stat cards, plus top gainers/losers tables with real prices.

6. **`src/components/intelligence/widgets/SFHTopMovers.tsx`** -- Replaces TradingView Hotlists. Tabbed view: Trending / Volume / Market Cap with ranked coin lists, prices, and 24h change.

7. **`src/components/intelligence/widgets/SFHEconomicCalendar.tsx`** -- Replaces TradingView Economic Calendar. Deterministic per-day event generation for 14-day lookahead across US/EU/UK/JP/CN/AU/CA/CH with impact filtering. No API key needed.

8. **`src/components/intelligence/widgets/SFHMarketQuotes.tsx`** -- New addition (no TradingView equivalent). Full quotes table with asset name, price, 24h/7d change, volume, and inline 7-day sparkline mini-charts using Recharts.

### File to Modify

- **`src/components/intelligence/TradingViewCharts.tsx`** -- Gut the entire file. Replace the three TradingView embed components with the four new SFH widgets in a 2-column grid layout. Remove all TradingView script injection code. Keep the same export signature so `IntelligenceHub.tsx` needs no changes.

### Styling Adaptation
Gold Arrow uses a navy/gold luxury theme. All widgets will be restyled to use SFH's existing design system:
- `tech-card border-0` card wrappers
- `text-foreground`, `text-muted-foreground` color tokens
- `bg-muted/20`, `bg-background` backgrounds
- Emerald/red for gain/loss indicators (already matching)
- Standard `Badge` component for Live indicators

### Data Flow
- CoinGecko free tier (no key): markets, global stats, trending -- 30s refresh with fallback
- Economic Calendar: deterministic generation from date seed (same approach as Gold Arrow)
- Metal prices: excluded (Gold Arrow fetches from its own Supabase `price_feeds` table which doesn't exist here)

### No Changes To
- `IntelligenceHub.tsx` -- the import and usage of `TradingViewCharts` remains identical
- Any other existing components or UI

