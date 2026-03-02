import { useCryptoData, useCryptoGlobal } from '@/hooks/useCryptoData';
import { Globe, TrendingUp, TrendingDown } from 'lucide-react';
import LivePulse from './LivePulse';
import AnimatedNumber from './AnimatedNumber';

const SFHMarketOverview = () => {
  const { data: global, isLoading: loadingGlobal } = useCryptoGlobal();
  const { data: crypto, isLoading: loadingCrypto } = useCryptoData(20);

  const isLoading = loadingGlobal || loadingCrypto;

  const gainers = (crypto ?? [])
    .filter((c) => (c.price_change_percentage_24h ?? 0) > 0)
    .sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0))
    .slice(0, 5);
  const losers = (crypto ?? [])
    .filter((c) => (c.price_change_percentage_24h ?? 0) < 0)
    .sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Globe className="w-5 h-5 text-emerald-500" />
        <h3 className="font-semibold text-foreground">Global Market Overview</h3>
        <LivePulse label="LIVE" />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Market Cap', value: (global?.total_market_cap?.usd ?? 0) / 1e12, suffix: 'T', prefix: '$' },
              { label: '24H Volume', value: (global?.total_volume?.usd ?? 0) / 1e9, suffix: 'B', prefix: '$' },
              { label: 'BTC Dominance', value: global?.market_cap_percentage?.btc ?? 0, suffix: '%', prefix: '' },
              { label: 'Active Coins', value: global?.active_cryptocurrencies ?? 0, suffix: '', prefix: '' },
            ].map((stat) => (
              <div key={stat.label} className="bg-muted/20 border border-border/50 rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground tracking-wide mb-1.5">{stat.label}</div>
                <div className="text-lg font-semibold text-foreground">
                  {stat.prefix}
                  <AnimatedNumber value={stat.value} decimals={stat.suffix === '%' ? 1 : 2} />
                  {stat.suffix}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-[10px] tracking-widest text-emerald-500/70 mb-2 flex items-center gap-2 font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> TOP GAINERS (24H)
              </h4>
              <div className="space-y-1">
                {gainers.map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted/20 transition-colors">
                    <img src={c.image} alt={c.name} className="w-5 h-5 rounded-full" />
                    <span className="text-xs text-muted-foreground flex-1">{c.symbol.toUpperCase()}</span>
                    <span className="text-sm text-foreground font-medium">
                      ${c.current_price < 1 ? c.current_price.toFixed(4) : c.current_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-emerald-500 font-medium w-16 text-right">
                      +{(c.price_change_percentage_24h ?? 0).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] tracking-widest text-red-400/70 mb-2 flex items-center gap-2 font-medium">
                <TrendingDown className="w-3.5 h-3.5" /> TOP LOSERS (24H)
              </h4>
              <div className="space-y-1">
                {losers.map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted/20 transition-colors">
                    <img src={c.image} alt={c.name} className="w-5 h-5 rounded-full" />
                    <span className="text-xs text-muted-foreground flex-1">{c.symbol.toUpperCase()}</span>
                    <span className="text-sm text-foreground font-medium">
                      ${c.current_price < 1 ? c.current_price.toFixed(4) : c.current_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-red-400 font-medium w-16 text-right">
                      {(c.price_change_percentage_24h ?? 0).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SFHMarketOverview;
