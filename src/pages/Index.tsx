import { useState } from "react";
import { JournalButton } from "@/components/JournalButton";
import { TradeCalendar } from "@/components/TradeCalendar";
import { TradeProviderModal } from "@/components/TradeProviderModal";
import { Button } from "@/components/ui/button";
import { Upload, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { parseTradeFile } from "@/utils/tradeParser";
import { toast } from "sonner";

export interface Trade {
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

const Index = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showProviderModal, setShowProviderModal] = useState(false);
  
  const getMonthlyStats = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthlyTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear;
    });
    
    const totalPnL = monthlyTrades.reduce((sum, trade) => sum + trade.profit, 0);
    const winningTrades = monthlyTrades.filter(trade => trade.profit > 0);
    const losingTrades = monthlyTrades.filter(trade => trade.profit < 0);
    const winners = winningTrades.length;
    const losers = losingTrades.length;
    const total = winners + losers;
    const winnerPercentage = total > 0 ? (winners / total) * 100 : 50;
    
    // Calculate average winners and losers
    const avgWinner = winners > 0 ? winningTrades.reduce((sum, trade) => sum + trade.profit, 0) / winners : 0;
    const avgLoser = losers > 0 ? losingTrades.reduce((sum, trade) => sum + trade.profit, 0) / losers : 0;
    const profitRatio = avgLoser !== 0 ? Math.abs(avgWinner / avgLoser) : 0;
    
    return { totalPnL, winners, losers, winnerPercentage, avgWinner, avgLoser, profitRatio };
  };
  
  const monthlyStats = getMonthlyStats();

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.csv')) {
      toast.error("Please select a .txt or .csv file");
      return;
    }

    try {
      const text = await file.text();
      const parsedTrades = parseTradeFile(text);
      
      if (parsedTrades.length === 0) {
        toast.error("No trades found in the file. Please check the format.");
        return;
      }
      
      const formattedTrades: Trade[] = parsedTrades.map(trade => ({
        date: trade.date,
        profit: trade.profit,
        symbol: trade.symbol,
        side: trade.side,
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

                    {/* Profit Ratio Box */}
                    <div className="bg-card border border-border rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Win/Loss Ratio</div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-3.5 h-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Any ratio over 2 is a profitable system</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl font-bold text-foreground" style={{ fontWeight: 800 }}>
                          {monthlyStats.profitRatio.toFixed(2)}
                        </div>
                        {/* Semi-circle visualization */}
                        <div className="relative w-12 h-6 overflow-hidden">
                          <div 
                            className="w-12 h-12 rounded-full"
                            style={{
                              background: `conic-gradient(from 180deg, #f87171 0deg ${((monthlyStats.avgWinner / (monthlyStats.avgWinner + Math.abs(monthlyStats.avgLoser))) * 180)}deg, #4ade80 ${((monthlyStats.avgWinner / (monthlyStats.avgWinner + Math.abs(monthlyStats.avgLoser))) * 180)}deg 180deg)`
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm font-semibold text-green-400">
                          ${monthlyStats.avgWinner.toFixed(1)}
                        </div>
                        <div className="text-sm font-semibold text-red-400">
                          -${Math.abs(monthlyStats.avgLoser).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button
                    variant="default"
                    className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => setShowProviderModal(true)}
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Import Trades
                    </div>
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt,.csv"
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
      
      <TradeProviderModal
        open={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        onProviderSelect={(provider) => {
          setShowProviderModal(false);
          document.getElementById("file-upload")?.click();
        }}
      />
    </div>
  );
};

export default Index;
