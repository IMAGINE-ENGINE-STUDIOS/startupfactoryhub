import React, { useEffect, useRef, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';

interface WidgetProps {
  theme: 'light' | 'dark';
}

const TradingViewMarketOverview = memo(({ theme }: WidgetProps) => {
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
      colorTheme: theme,
      dateRange: "12M",
      locale: "en",
      largeChartUrl: "",
      isTransparent: true,
      showFloatingTooltip: false,
      plotLineColorGrowing: "rgba(8, 153, 129, 1)",
      plotLineColorFalling: "rgba(8, 153, 129, 1)",
      gridLineColor: "rgba(8, 153, 129, 0.9)",
      scaleFontColor: theme === 'dark' ? "#DBDBDB" : "#333333",
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
  }, [theme]);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
});

TradingViewMarketOverview.displayName = 'TradingViewMarketOverview';

const TradingViewHotlists = memo(({ theme }: WidgetProps) => {
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
      colorTheme: theme,
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
      scaleFontColor: theme === 'dark' ? "#DBDBDB" : "#333333",
      belowLineFillColorGrowing: "rgba(41, 98, 255, 0.12)",
      belowLineFillColorFalling: "rgba(41, 98, 255, 0.12)",
      belowLineFillColorGrowingBottom: "rgba(41, 98, 255, 0)",
      belowLineFillColorFallingBottom: "rgba(41, 98, 255, 0)",
      symbolActiveColor: "rgba(41, 98, 255, 0.12)",
      backgroundColor: "rgba(0, 0, 0, 0)",
      width: "100%",
      height: "500"
    });
    
    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [theme]);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
});

TradingViewHotlists.displayName = 'TradingViewHotlists';

const TradingViewEconomicCalendar = memo(({ theme }: WidgetProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    container.current.innerHTML = '';
    
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    container.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: theme,
      isTransparent: true,
      locale: "en",
      countryFilter: "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
      importanceFilter: "-1,0,1",
      width: "100%",
      height: 550
    });
    
    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [theme]);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
});

TradingViewEconomicCalendar.displayName = 'TradingViewEconomicCalendar';


export const TradingViewCharts = () => {
  const { resolvedTheme } = useTheme();
  const currentTheme = (resolvedTheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';

  return (
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
        <div className="tradingview-widget-wrapper rounded-lg overflow-hidden">
          <TradingViewMarketOverview key={`overview-${currentTheme}`} theme={currentTheme} />
        </div>
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
        <div className="tradingview-widget-wrapper rounded-lg overflow-hidden">
          <TradingViewHotlists key={`hotlists-${currentTheme}`} theme={currentTheme} />
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
          Data by TradingView
        </p>
      </Card>

      {/* Economic Calendar Widget */}
      <Card className="tech-card border-0 p-4 overflow-hidden lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Economic Calendar</h3>
            <p className="text-xs text-muted-foreground">Upcoming events & earnings reports</p>
          </div>
          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Live
          </Badge>
        </div>
        <div className="tradingview-widget-wrapper rounded-lg overflow-hidden">
          <TradingViewEconomicCalendar key={`calendar-${currentTheme}`} theme={currentTheme} />
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
          Data by TradingView
        </p>
      </Card>
    </div>
  );
};

export default TradingViewCharts;
