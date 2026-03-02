import { useCryptoTrending, useCryptoData } from '@/hooks/useCryptoData';
import { Flame, Sparkles } from 'lucide-react';
import LivePulse from './LivePulse';
import { useState } from 'react';

type View = 'trending' | 'volume' | 'market_cap';

const STABLECOINS = ['usdt', 'usdc', 'dai', 'busd', 'tusd', 'fdusd'];

const SFHTopMovers = () => {
  const { data: trending, isLoading: loadingTrending } = useCryptoTrending();
  const { data: crypto, isLoading: loadingCrypto } = useCryptoData(30);
  const [view, setView] = useState<View>('trending');

  const isLoading = loadingTrending || loadingCrypto;

  const qualified = (crypto ?? []).filter(c => c.market_cap > 1e9 && !STABLECOINS.includes(c.symbol));
  const byVolume = [...qualified].sort((a, b) => b.total_volume - a.total_volume).slice(0, 10);
  const byMarketCap = [...qualified].sort((a, b) => b.market_cap - a.market_cap).slice(0, 10);

  const tabs: { key: View; label: string }[] = [
    { key: 'trending', label: 'Trending' },
    { key: 'volume', label: 'Volume' },
    { key: 'market_cap', label: 'Mkt Cap' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flame className="w-5 h-5 text-emerald-500" />
          <h3 className="font-semibold text-foreground">Top Movers</h3>
          <LivePulse label="LIVE" />
        </div>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={`px-2.5 py-1 text-[10px] tracking-wider rounded transition-all ${
                view === t.key
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      ) : view === 'trending' ? (
        <div className="space-y-1.5">
          {trending?.slice(0, 10).map((t, i) => (
            <div key={t.item.id} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/20 transition-colors">
              <span className="text-[10px] text-muted-foreground w-5 text-right font-mono">{i + 1}</span>
              <img src={t.item.thumb} alt={t.item.name} className="w-6 h-6 rounded-full" />
              <div className="flex-1">
                <span className="text-xs text-foreground">{t.item.name}</span>
                <span className="text-[10px] text-muted-foreground ml-2">{t.item.symbol}</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-emerald-500/50" />
              <span className="text-[10px] text-muted-foreground">Score: {t.item.score + 1}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {(view === 'volume' ? byVolume : byMarketCap).map((c, i) => {
            const change = c.price_change_percentage_24h ?? 0;
            const metric = view === 'volume' ? c.total_volume : c.market_cap;
            return (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/20 transition-colors">
                <span className="text-[10px] text-muted-foreground w-5 text-right font-mono">{i + 1}</span>
                <img src={c.image} alt={c.name} className="w-6 h-6 rounded-full" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-foreground">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">{c.symbol.toUpperCase()}</span>
                </div>
                <span className="text-sm text-foreground font-medium">
                  ${c.current_price < 1 ? c.current_price.toFixed(4) : c.current_price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
                <span className={`text-[10px] font-medium w-14 text-right ${change >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
                <span className="text-[10px] text-muted-foreground font-mono w-20 text-right">
                  ${(metric / 1e9).toFixed(1)}B
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SFHTopMovers;
