import { Card } from '@/components/ui/card';
import SFHMarketOverview from './widgets/SFHMarketOverview';
import SFHTopMovers from './widgets/SFHTopMovers';
import SFHEconomicCalendar from './widgets/SFHEconomicCalendar';
import SFHMarketQuotes from './widgets/SFHMarketQuotes';

export const TradingViewCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="tech-card border-0 p-5 overflow-hidden">
        <SFHMarketOverview />
        <p className="text-[10px] text-muted-foreground/50 mt-3 text-center">
          Data by CoinGecko · Auto-refreshes every 30s
        </p>
      </Card>

      <Card className="tech-card border-0 p-5 overflow-hidden">
        <SFHTopMovers />
        <p className="text-[10px] text-muted-foreground/50 mt-3 text-center">
          Data by CoinGecko · Auto-refreshes every 30s
        </p>
      </Card>

      <Card className="tech-card border-0 p-5 overflow-hidden lg:col-span-2">
        <SFHMarketQuotes />
        <p className="text-[10px] text-muted-foreground/50 mt-3 text-center">
          Data by CoinGecko · Auto-refreshes every 30s
        </p>
      </Card>

      <Card className="tech-card border-0 p-5 overflow-hidden lg:col-span-2">
        <SFHEconomicCalendar />
        <p className="text-[10px] text-muted-foreground/50 mt-3 text-center">
          Deterministic calendar · Refreshes every 5 min
        </p>
      </Card>
    </div>
  );
};

export default TradingViewCharts;
