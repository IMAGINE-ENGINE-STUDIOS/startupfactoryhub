import { useCryptoData } from '@/hooks/useCryptoData';
import { BarChart3 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import LivePulse from './LivePulse';

const SFHMarketQuotes = () => {
  const { data: crypto, isLoading } = useCryptoData(20);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-5 h-5 text-emerald-500" />
        <h3 className="font-semibold text-foreground">Market Quotes</h3>
        <LivePulse label="LIVE" />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-2 px-2 text-left text-[10px] text-muted-foreground tracking-wide">Asset</th>
                <th className="py-2 px-2 text-right text-[10px] text-muted-foreground tracking-wide">Price</th>
                <th className="py-2 px-2 text-right text-[10px] text-muted-foreground tracking-wide">24H</th>
                <th className="py-2 px-2 text-right text-[10px] text-muted-foreground tracking-wide">7D</th>
                <th className="py-2 px-2 text-right text-[10px] text-muted-foreground tracking-wide hidden md:table-cell">Volume</th>
                <th className="py-2 px-2 text-center text-[10px] text-muted-foreground tracking-wide hidden lg:table-cell">7D Chart</th>
              </tr>
            </thead>
            <tbody>
              {crypto?.slice(0, 15).map((c) => {
                const change24 = c.price_change_percentage_24h ?? 0;
                const change7d = c.price_change_percentage_7d_in_currency ?? 0;
                const sparkData = (c.sparkline_in_7d?.price ?? []).slice(-48).map((v) => ({ v }));
                const sparkColor = change7d >= 0 ? 'hsl(145, 70%, 45%)' : 'hsl(0, 70%, 55%)';

                return (
                  <tr key={c.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <img src={c.image} alt={c.name} className="w-5 h-5 rounded-full" />
                        <span className="text-xs text-foreground">{c.symbol.toUpperCase()}</span>
                        <span className="text-[10px] text-muted-foreground">#{c.market_cap_rank}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right text-foreground font-medium">
                      ${c.current_price < 1 ? c.current_price.toFixed(4) : c.current_price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </td>
                    <td className={`py-2.5 px-2 text-right text-xs font-medium ${change24 >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                      {change24 >= 0 ? '+' : ''}{change24.toFixed(2)}%
                    </td>
                    <td className={`py-2.5 px-2 text-right text-xs font-medium ${change7d >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                      {change7d >= 0 ? '+' : ''}{change7d.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-2 text-right text-xs text-muted-foreground hidden md:table-cell">
                      ${(c.total_volume / 1e9).toFixed(1)}B
                    </td>
                    <td className="py-2.5 px-2 hidden lg:table-cell">
                      {sparkData.length > 0 && (
                        <div className="h-6 w-20 mx-auto">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparkData}>
                              <defs>
                                <linearGradient id={`sfh-q-${c.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.4} />
                                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} fill={`url(#sfh-q-${c.id})`} dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SFHMarketQuotes;
