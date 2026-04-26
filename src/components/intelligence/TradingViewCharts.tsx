import SFHMarketOverview from './widgets/SFHMarketOverview';
import SFHTopMovers from './widgets/SFHTopMovers';
import SFHEconomicCalendar from './widgets/SFHEconomicCalendar';
import SFHMarketQuotes from './widgets/SFHMarketQuotes';
import { FlowCard, FlowSectionTitle } from './FlowPanel';

const Footer = ({ label }: { label: string }) => (
  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50 mt-3 text-center">
    {label}
  </p>
);

export const TradingViewCharts = () => {
  return (
    <div className="space-y-4 font-mono">
      <FlowSectionTitle>flow:~$ markets.live</FlowSectionTitle>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FlowCard className="p-5 overflow-hidden">
          <SFHMarketOverview />
          <Footer label="data · gold arrow · refresh 30s" />
        </FlowCard>

        <FlowCard className="p-5 overflow-hidden">
          <SFHTopMovers />
          <Footer label="data · gold arrow · refresh 30s" />
        </FlowCard>

        <FlowCard className="p-5 overflow-hidden lg:col-span-2">
          <SFHMarketQuotes />
          <Footer label="data · gold arrow · refresh 30s" />
        </FlowCard>

        <FlowCard className="p-5 overflow-hidden lg:col-span-2">
          <SFHEconomicCalendar />
          <Footer label="deterministic calendar · refresh 5m" />
        </FlowCard>
      </div>
    </div>
  );
};

export default TradingViewCharts;
