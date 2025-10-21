import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from "recharts";
import { format } from "date-fns";

interface Trade {
  date: Date;
  profit: number;
  symbol: string;
  side?: "LONG" | "SHORT";
  quantity?: number;
  entryPrice?: number;
  exitPrice?: number;
  entryTime?: string;
  exitTime?: string;
}

interface PnLChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  isYearlyView: boolean;
  currentDate: Date;
}

export const PnLChartModal = ({
  isOpen,
  onClose,
  trades,
  isYearlyView,
  currentDate,
}: PnLChartModalProps) => {
  // Filter trades based on view
  const filteredTrades = trades.filter((trade) => {
    const tradeDate = new Date(trade.date);
    if (isYearlyView) {
      return tradeDate.getFullYear() === currentDate.getFullYear();
    } else {
      return (
        tradeDate.getMonth() === currentDate.getMonth() &&
        tradeDate.getFullYear() === currentDate.getFullYear()
      );
    }
  });

  // Sort trades by date
  const sortedTrades = [...filteredTrades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Generate full month/year date range
  const generateDateRange = () => {
    const dates: Date[] = [];
    if (isYearlyView) {
      // Generate dates for the entire year (first day of each month)
      for (let month = 0; month < 12; month++) {
        dates.push(new Date(currentDate.getFullYear(), month, 1));
      }
    } else {
      // Generate dates for the entire month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        dates.push(new Date(year, month, day));
      }
    }
    return dates;
  };

  const allDates = generateDateRange();

  // Create a map of trade dates to cumulative P&L
  const tradeMap = new Map<string, { pnl: number; profit: number }>();
  let cumulativePnL = 0;
  
  sortedTrades.forEach((trade) => {
    cumulativePnL += trade.profit;
    const dateKey = format(new Date(trade.date), "yyyy-MM-dd");
    tradeMap.set(dateKey, {
      pnl: parseFloat(cumulativePnL.toFixed(2)),
      profit: trade.profit,
    });
  });

  // Build chart data with all dates
  const chartData = allDates.map((date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const tradeData = tradeMap.get(dateKey);
    
    if (tradeData) {
      return {
        date: format(date, isYearlyView ? "MMM dd" : "MMM dd"),
        pnl: tradeData.pnl,
        profit: tradeData.profit,
        timestamp: date.getTime(),
      };
    } else {
      // Find the last known cumulative P&L before this date
      let lastPnL = 0;
      for (const [key, value] of tradeMap.entries()) {
        const keyDate = new Date(key);
        if (keyDate < date) {
          lastPnL = value.pnl;
        }
      }
      return {
        date: format(date, isYearlyView ? "MMM dd" : "MMM dd"),
        pnl: lastPnL,
        profit: 0,
        timestamp: date.getTime(),
      };
    }
  });

  // Add interpolated points where line crosses $0
  const interpolatedData: any[] = [];
  for (let i = 0; i < chartData.length; i++) {
    const current = chartData[i];
    const prev = i > 0 ? chartData[i - 1] : null;
    
    if (prev && ((prev.pnl < 0 && current.pnl >= 0) || (prev.pnl >= 0 && current.pnl < 0))) {
      // Calculate interpolated point at $0
      const ratio = Math.abs(prev.pnl) / (Math.abs(prev.pnl) + Math.abs(current.pnl));
      const interpolatedTimestamp = prev.timestamp + (current.timestamp - prev.timestamp) * ratio;
      interpolatedData.push({
        date: format(new Date(interpolatedTimestamp), isYearlyView ? "MMM dd" : "MMM dd"),
        pnl: 0,
        profit: 0,
        timestamp: interpolatedTimestamp,
      });
    }
    
    interpolatedData.push(current);
  }

  // Get unique dates for X-axis to avoid duplicates
  const uniqueDates = Array.from(new Set(interpolatedData.map(d => d.date)));
  const xAxisTicks = uniqueDates.filter((_, idx) => {
    // Show fewer ticks for better readability
    const step = Math.ceil(uniqueDates.length / 10);
    return idx % step === 0;
  });

  // Find min and max for chart domain
  const minPnL = Math.min(...interpolatedData.map((d) => d.pnl), 0);
  const maxPnL = Math.max(...interpolatedData.map((d) => d.pnl), 0);
  
  // Calculate range and 25% increments
  const range = maxPnL - minPnL;
  const increment = range / 4; // Divide range into 4 equal parts (25% each)
  
  // Generate ticks at 25% increments, ensuring we include the min and max
  const ticks = [
    minPnL,
    minPnL + increment,
    minPnL + increment * 2,
    minPnL + increment * 3,
    maxPnL
  ].map(v => Math.round(v * 100) / 100);
  
  // Ensure $0 is included in ticks if it's within range
  if (minPnL < 0 && maxPnL > 0 && !ticks.includes(0)) {
    ticks.push(0);
    ticks.sort((a, b) => a - b);
  }

  // Create segments for continuous line with color changes
  const chartDataWithSegments = interpolatedData.map((d) => {
    return {
      ...d,
      // Only show green when above 0
      greenLine: d.pnl >= 0 ? d.pnl : null,
      // Only show red when below 0
      redLine: d.pnl < 0 ? d.pnl : null,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">{payload[0].payload.date}</p>
          <p className={`text-lg font-bold ${payload[0].value >= 0 ? "text-green-400" : "text-red-400"}`}>
            {payload[0].value >= 0 ? "+" : ""}${payload[0].value.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Trade: {payload[0].payload.profit >= 0 ? "+" : ""}${payload[0].payload.profit.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[85vh] bg-card border border-border">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            {isYearlyView ? "Yearly" : "Monthly"} P&L Chart
          </h2>
          <div className="h-[65vh] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataWithSegments}>
                <defs>
                  <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  ticks={xAxisTicks}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                  domain={[minPnL, maxPnL]}
                  ticks={ticks}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Reference line at $0 */}
                <ReferenceLine 
                  y={0} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                
                {/* Green area for positive values */}
                <Area
                  type="monotone"
                  dataKey="greenLine"
                  stroke="#4ade80"
                  strokeWidth={3}
                  fill="url(#colorPositive)"
                  fillOpacity={1}
                  connectNulls={false}
                />
                
                {/* Red area for negative values */}
                <Area
                  type="monotone"
                  dataKey="redLine"
                  stroke="#f87171"
                  strokeWidth={3}
                  fill="url(#colorNegative)"
                  fillOpacity={1}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
