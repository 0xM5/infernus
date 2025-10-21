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

  // Calculate cumulative P&L
  let cumulativePnL = 0;
  const chartData = sortedTrades.map((trade) => {
    cumulativePnL += trade.profit;
    return {
      date: format(new Date(trade.date), isYearlyView ? "MMM dd" : "MMM dd"),
      pnl: parseFloat(cumulativePnL.toFixed(2)),
      profit: trade.profit,
    };
  });

  // Find min and max for chart domain
  const minPnL = Math.min(0, ...chartData.map((d) => d.pnl));
  const maxPnL = Math.max(0, ...chartData.map((d) => d.pnl));
  
  // Calculate range and 25% increments
  const range = maxPnL - minPnL;
  const increment = range * 0.25;
  const yAxisMin = Math.floor(minPnL / increment) * increment;
  const yAxisMax = Math.ceil(maxPnL / increment) * increment;
  
  // Generate ticks at 25% increments
  const ticks = [];
  for (let i = yAxisMin; i <= yAxisMax; i += increment) {
    ticks.push(Math.round(i * 100) / 100);
  }

  // Split data into positive and negative for coloring
  const chartDataWithSplit = chartData.map((d) => ({
    ...d,
    positivePnl: d.pnl > 0 ? d.pnl : null,
    negativePnl: d.pnl < 0 ? d.pnl : null,
  }));

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
              <AreaChart data={chartDataWithSplit}>
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
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                  domain={[yAxisMin, yAxisMax]}
                  ticks={ticks}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Reference line at $0 */}
                <ReferenceLine 
                  y={0} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ value: '$0', fill: 'hsl(var(--muted-foreground))', fontSize: 12, position: 'left' }}
                />
                
                {/* Green area for positive values */}
                <Area
                  type="monotone"
                  dataKey="positivePnl"
                  stroke="#4ade80"
                  strokeWidth={3}
                  fill="url(#colorPositive)"
                  fillOpacity={1}
                  connectNulls={false}
                />
                
                {/* Red area for negative values */}
                <Area
                  type="monotone"
                  dataKey="negativePnl"
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
