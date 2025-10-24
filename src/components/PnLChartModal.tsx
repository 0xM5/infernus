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

  // Sort trades by date and time
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    const timeCompare = dateA.getTime() - dateB.getTime();
    
    // If same day, sort by entry time if available
    if (timeCompare === 0 && a.entryTime && b.entryTime) {
      return a.entryTime.localeCompare(b.entryTime);
    }
    return timeCompare;
  });

  // Build chart data with each individual trade
  let cumulativePnL = 0;
  const chartData = sortedTrades.map((trade, index) => {
    cumulativePnL += trade.profit;
    const tradeDate = new Date(trade.date);
    
    return {
      date: format(tradeDate, isYearlyView ? "MMM dd" : "MMM dd"),
      pnl: parseFloat(cumulativePnL.toFixed(2)),
      profit: trade.profit,
      timestamp: tradeDate.getTime(),
      tradeNumber: index + 1,
      symbol: trade.symbol,
    };
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

  // Get X-axis ticks - show first and last trade dates
  const xAxisTicks = chartData.length > 0 
    ? [chartData[0].date, chartData[chartData.length - 1].date]
    : [];

  // Find min and max for chart domain with 25% padding (zoomed out)
  const minPnL = Math.min(...interpolatedData.map((d) => d.pnl), 0);
  const maxPnL = Math.max(...interpolatedData.map((d) => d.pnl), 0);
  
  const range = maxPnL - minPnL;
  const padding = range * 0.25;
  const yMin = minPnL - padding;
  const yMax = maxPnL + padding;

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
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">
            {data.symbol ? `${data.symbol} - ` : ""}{data.date}
          </p>
          <p className={`text-lg font-bold ${payload[0].value >= 0 ? "text-green-400" : "text-red-400"}`}>
            Cumulative: {payload[0].value >= 0 ? "+" : ""}${payload[0].value.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This Trade: {data.profit >= 0 ? "+" : ""}${data.profit.toFixed(2)}
          </p>
          {data.tradeNumber && (
            <p className="text-xs text-muted-foreground">Trade #{data.tradeNumber}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[85vh] bg-[#1a1a1a] border-none">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">
            {isYearlyView ? "Yearly" : "Monthly"} P&L Chart
          </h2>
          <div className="h-[65vh] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={interpolatedData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#166534" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="colorRed" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#7f1d1d" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#555"
                  tick={{ fill: "#888", fontSize: 11 }}
                  ticks={xAxisTicks}
                  interval="preserveStartEnd"
                  axisLine={{ stroke: "#555" }}
                />
                <YAxis
                  stroke="#555"
                  tick={{ fill: "#888", fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                  domain={[yMin, yMax]}
                  axisLine={{ stroke: "#555" }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Dashed horizontal line at $0 */}
                <ReferenceLine 
                  y={0} 
                  stroke="#666" 
                  strokeWidth={1.5}
                  strokeDasharray="6 6"
                />
                
                {/* Single continuous line with color-filled areas */}
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  fill="url(#colorGreen)"
                  fillOpacity={1}
                  isAnimationActive={false}
                />
                
                {/* Overlay red area for negative values */}
                <Area
                  type="monotone"
                  dataKey={(d) => d.pnl < 0 ? d.pnl : null}
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  fill="url(#colorRed)"
                  fillOpacity={1}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
