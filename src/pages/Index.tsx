import { useState } from "react";
import { JournalButton } from "@/components/JournalButton";
import { TradeCalendar } from "@/components/TradeCalendar";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { parseSierraChartLog } from "@/utils/tradeParser";
import { toast } from "sonner";

interface Trade {
  date: Date;
  profit: number;
  symbol: string;
}

const Index = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);

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
        <div className="absolute inset-0 bg-gradient-purple blur-3xl opacity-30 rounded-3xl" />
        
        {/* Main container */}
        <div
          className={`relative bg-card border border-border rounded-3xl transition-all duration-500 ${
            isExpanded ? "w-[90vw] h-[85vh] p-8" : "w-[600px] h-[400px] p-12"
          } flex ${isExpanded ? "flex-col" : "items-center justify-start"}`}
        >
          {!isExpanded ? (
            <div className="flex items-center">
              <JournalButton onClick={() => setIsExpanded(true)} />
            </div>
          ) : (
            <div className="space-y-6 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-foreground">Day Trading Journal</h1>
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

              <div className="flex-1 overflow-auto">
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
