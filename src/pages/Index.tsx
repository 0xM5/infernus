import { useState } from "react";
import { JournalButton } from "@/components/JournalButton";
import { TradeCalendar } from "@/components/TradeCalendar";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { parseSierraChartLog } from "@/utils/tradeParser";
import { toast } from "sonner";

export interface Trade {
  date: Date;
  profit: number;
  symbol: string;
  quantity?: number;
  entryPrice?: number;
  exitPrice?: number;
  entryTime?: string;
  exitTime?: string;
}

const Index = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  
  const getMonthlyStats = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthlyTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear;
    });
    
    const totalPnL = monthlyTrades.reduce((sum, trade) => sum + trade.profit, 0);
    const winners = monthlyTrades.filter(trade => trade.profit > 0).length;
    const losers = monthlyTrades.filter(trade => trade.profit < 0).length;
    const total = winners + losers;
    const winnerPercentage = total > 0 ? (winners / total) * 100 : 50;
    
    return { totalPnL, winners, losers, winnerPercentage };
  };
  
  const monthlyStats = getMonthlyStats();

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      toast.error("Please select a .txt file");
      return;
    }

    try {
      const text = await file.text();
      const parsedTrades = parseSierraChartLog(text);
      
      const formattedTrades: Trade[] = parsedTrades.map(trade => ({
        date: trade.date,
        profit: trade.profit,
        symbol: trade.symbol,
        quantity: trade.quantity,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        entryTime: trade.date.toLocaleTimeString(),
        exitTime: trade.date.toLocaleTimeString(),
      }));

      setTrades(formattedTrades);
      toast.success(`Successfully imported ${parsedTrades.length} trades`);
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Error parsing trade file");
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-8">
      <div className="relative">
        {/* Purple gradient glow */}
        <div className="absolute inset-0 bg-gradient-purple blur-3xl opacity-70 rounded-3xl" />
        
        {/* Main container */}
        <div
          className={`relative bg-card border border-border rounded-3xl transition-all duration-500 ${
            isExpanded ? "w-[90vw] h-[85vh] p-8" : "w-[600px] h-[400px] p-12"
          } flex ${isExpanded ? "flex-col" : "items-center justify-center"}`}
        >
          {!isExpanded ? (
            <JournalButton onClick={() => setIsExpanded(true)} />
          ) : (
            <div className="space-y-6 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold text-foreground" style={{ fontWeight: 700 }}>
                    FindYourEdge
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">.</span>
                    com
                  </h1>
                  
                  <div className="flex gap-4 items-center">
                    {/* Monthly PnL Box */}
                    <div className="bg-card border border-border rounded-lg px-6 py-3">
                      <div className="text-sm text-muted-foreground mb-1" style={{ fontWeight: 600 }}>Monthly PnL</div>
                      <div className={`text-2xl font-bold ${monthlyStats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} style={{ fontWeight: 800 }}>
                        {monthlyStats.totalPnL >= 0 ? '$' : '-$'}{Math.abs(monthlyStats.totalPnL).toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Winners/Losers Box */}
                    <div className="bg-card border border-border rounded-lg px-4 py-2">
                      <div className="flex gap-6 items-center">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1" style={{ fontWeight: 600 }}>Winners</div>
                          <div className="text-lg font-bold text-green-400 border border-green-500/30 rounded px-2 py-0.5 inline-block" style={{ fontWeight: 700 }}>
                            {monthlyStats.winners}
                          </div>
                        </div>
                        
                        <div className="relative w-32 h-3 bg-red-500 rounded-full overflow-hidden">
                          <div 
                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${monthlyStats.winnerPercentage}%` }}
                          />
                        </div>
                        
                        <div>
                          <div className="text-xs text-muted-foreground mb-1" style={{ fontWeight: 600 }}>Losers</div>
                          <div className="text-lg font-bold text-red-400 border border-red-500/30 rounded px-2 py-0.5 inline-block" style={{ fontWeight: 700 }}>
                            {monthlyStats.losers}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <label htmlFor="file-upload">
                    <Button
                      variant="default"
                      className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
                      asChild
                    >
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Import Trades
                      </div>
                    </Button>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setIsExpanded(false)}
                    className="border-border"
                  >
                    Collapse
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <TradeCalendar trades={trades} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
