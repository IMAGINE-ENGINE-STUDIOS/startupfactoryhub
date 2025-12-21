import React, { useEffect, useRef, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  BarChart2, 
  Bitcoin, 
  Calendar,
  Plus
} from 'lucide-react';

const TradingViewMarketOverview = memo(() => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    // Clear any existing content
    container.current.innerHTML = '';
    
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    container.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      dateRange: "12M",
      locale: "en",
      largeChartUrl: "",
      isTransparent: true,
      showFloatingTooltip: false,
      plotLineColorGrowing: "rgba(8, 153, 129, 1)",
      plotLineColorFalling: "rgba(8, 153, 129, 1)",
      gridLineColor: "rgba(8, 153, 129, 0.9)",
      scaleFontColor: "#DBDBDB",
      belowLineFillColorGrowing: "rgba(41, 98, 255, 0.12)",
      belowLineFillColorFalling: "rgba(41, 98, 255, 0.12)",
      belowLineFillColorGrowingBottom: "rgba(41, 98, 255, 0)",
      belowLineFillColorFallingBottom: "rgba(41, 98, 255, 0)",
      symbolActiveColor: "rgba(41, 98, 255, 0.12)",
      tabs: [
        {
          title: "Indices",
          symbols: [
            { s: "FOREXCOM:SPXUSD", d: "S&P 500 Index" },
            { s: "FOREXCOM:NSXUSD", d: "US 100 Cash CFD" },
            { s: "FOREXCOM:DJI", d: "Dow Jones Industrial Average Index" },
            { s: "INDEX:NKY", d: "Japan 225" },
            { s: "INDEX:DEU40", d: "DAX Index" },
            { s: "FOREXCOM:UKXGBP", d: "FTSE 100 Index" }
          ],
          originalTitle: "Indices"
        },
        {
          title: "Futures",
          symbols: [
            { s: "BMFBOVESPA:ISP1!", d: "S&P 500" },
            { s: "BMFBOVESPA:EUR1!", d: "Euro" },
            { s: "CMCMARKETS:GOLD", d: "Gold" },
            { s: "PYTH:WTI3!", d: "WTI Crude Oil" },
            { s: "BMFBOVESPA:CCM1!", d: "Corn" }
          ],
          originalTitle: "Futures"
        },
        {
          title: "Bonds",
          symbols: [
            { s: "EUREX:FGBL1!", d: "Euro Bund" },
            { s: "EUREX:FBTP1!", d: "Euro BTP" },
            { s: "EUREX:FGBM1!", d: "Euro BOBL" }
          ],
          originalTitle: "Bonds"
        },
        {
          title: "Forex",
          symbols: [
            { s: "FX:EURUSD", d: "EUR to USD" },
            { s: "FX:GBPUSD", d: "GBP to USD" },
            { s: "FX:USDJPY", d: "USD to JPY" },
            { s: "FX:USDCHF", d: "USD to CHF" },
            { s: "FX:AUDUSD", d: "AUD to USD" },
            { s: "FX:USDCAD", d: "USD to CAD" }
          ],
          originalTitle: "Forex"
        }
      ],
      support_host: "https://www.tradingview.com",
      backgroundColor: "rgba(0, 0, 0, 0)",
      width: "100%",
      height: "500",
      showSymbolLogo: true,
      showChart: true
    });
    
    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
});

TradingViewMarketOverview.displayName = 'TradingViewMarketOverview';

const TradingViewHotlists = memo(() => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    container.current.innerHTML = '';
    
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    container.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      exchange: "US",
      colorTheme: "dark",
      dateRange: "12M",
      showChart: true,
      locale: "en",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      plotLineColorGrowing: "rgba(8, 153, 129, 1)",
      plotLineColorFalling: "rgba(8, 153, 129, 1)",
      gridLineColor: "rgba(240, 243, 250, 0)",
      scaleFontColor: "#DBDBDB",
      belowLineFillColorGrowing: "rgba(41, 98, 255, 0.12)",
      belowLineFillColorFalling: "rgba(41, 98, 255, 0.12)",
      belowLineFillColorGrowingBottom: "rgba(41, 98, 255, 0)",
      belowLineFillColorFallingBottom: "rgba(41, 98, 255, 0)",
      symbolActiveColor: "rgba(41, 98, 255, 0.12)",
      width: "100%",
      height: "500"
    });
    
    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
});

TradingViewHotlists.displayName = 'TradingViewHotlists';
interface PlaceholderChartProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

const PlaceholderChart = ({ title, description, icon, gradient }: PlaceholderChartProps) => (
  <Card className="tech-card border-0 p-6 flex flex-col items-center justify-center min-h-[200px] group hover:scale-[1.02] transition-transform cursor-pointer">
    <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} text-white mb-4 opacity-50 group-hover:opacity-100 transition-opacity`}>
      {icon}
    </div>
    <h3 className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{title}</h3>
    <p className="text-xs text-muted-foreground/70 text-center mt-1">{description}</p>
    <Badge variant="outline" className="mt-3 text-[10px] opacity-50">
      <Plus className="w-3 h-3 mr-1" />
      Coming Soon
    </Badge>
  </Card>
);

const upcomingCharts = [
  {
    title: "Symbol Ticker",
    description: "Real-time scrolling ticker with top movers",
    icon: <TrendingUp className="w-6 h-6" />,
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    title: "Technical Analysis",
    description: "Advanced charts with indicators & signals",
    icon: <BarChart2 className="w-6 h-6" />,
    gradient: "from-purple-500 to-pink-500"
  },
  {
    title: "Crypto Markets",
    description: "Bitcoin, Ethereum & altcoin tracking",
    icon: <Bitcoin className="w-6 h-6" />,
    gradient: "from-orange-500 to-yellow-500"
  },
  {
    title: "Economic Calendar",
    description: "Upcoming events & earnings reports",
    icon: <Calendar className="w-6 h-6" />,
    gradient: "from-emerald-500 to-teal-500"
  }
];

export const TradingViewCharts = () => {
  return (
    <div className="space-y-6">
      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Overview Widget */}
        <Card className="tech-card border-0 p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Market Overview</h3>
              <p className="text-xs text-muted-foreground">Indices, Futures, Bonds & Forex</p>
            </div>
            <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Live
            </Badge>
          </div>
          <TradingViewMarketOverview />
          <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
            Data by TradingView
          </p>
        </Card>

        {/* US Stocks Hotlists Widget */}
        <Card className="tech-card border-0 p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">US Stocks Today</h3>
              <p className="text-xs text-muted-foreground">Top movers & trending stocks</p>
            </div>
            <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Live
            </Badge>
          </div>
          <TradingViewHotlists />
          <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
            Data by TradingView
          </p>
        </Card>
      </div>

      {/* Placeholder Grid for Future Charts */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">More Charts Coming Soon</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingCharts.map((chart) => (
            <PlaceholderChart
              key={chart.title}
              title={chart.title}
              description={chart.description}
              icon={chart.icon}
              gradient={chart.gradient}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TradingViewCharts;
