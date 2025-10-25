import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check } from "lucide-react";
import type { Trade } from "@/types/trade";

interface StudyTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  edge: string;
  trades: Trade[];
  winCount: number;
  lossCount: number;
}

export const StudyTradesModal = ({ 
  isOpen, 
  onClose, 
  edge, 
  trades,
  winCount,
  lossCount 
}: StudyTradesModalProps) => {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [studiedTrades, setStudiedTrades] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(`studied_trades_${edge}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
  };

  const handleBack = () => {
    if (selectedTrade) {
      const tradeKey = `${selectedTrade.date.toISOString()}_${selectedTrade.symbol}`;
      const newStudiedTrades = new Set(studiedTrades);
      newStudiedTrades.add(tradeKey);
      setStudiedTrades(newStudiedTrades);
      localStorage.setItem(`studied_trades_${edge}`, JSON.stringify(Array.from(newStudiedTrades)));
      setSelectedTrade(null);
    }
  };

  const getTradeData = (trade: Trade) => {
    const tradeData = localStorage.getItem(`trade_${trade.date.toISOString()}_${trade.symbol}`);
    return tradeData ? JSON.parse(tradeData) : null;
  };

  const isStudied = (trade: Trade) => {
    const tradeKey = `${trade.date.toISOString()}_${trade.symbol}`;
    return studiedTrades.has(tradeKey);
  };

  if (!isOpen) return null;

  if (selectedTrade) {
    const tradeData = getTradeData(selectedTrade);
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto animate-scale-in bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="hover:bg-muted"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <DialogTitle className="text-2xl font-bold text-foreground">
                Trade Details - {selectedTrade.symbol}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Date</div>
                <div className="text-lg font-semibold text-foreground">
                  {selectedTrade.date.toLocaleDateString()}
                </div>
              </div>
              <div className="bg-background border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">P&L</div>
                <div className={`text-lg font-bold ${selectedTrade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedTrade.profit >= 0 ? '+' : ''}${selectedTrade.profit.toFixed(2)}
                </div>
              </div>
            </div>

            {tradeData && (
              <div className="space-y-4">
                {tradeData.freeJournal && (
                  <div className="bg-background border border-border rounded-lg p-4">
                    <div className="text-sm font-semibold text-foreground mb-2">Journal Notes</div>
                    <Textarea
                      value={tradeData.freeJournal.replace(/<[^>]*>/g, '')}
                      readOnly
                      className="bg-transparent border-none text-sm text-muted-foreground resize-none min-h-[150px]"
                    />
                  </div>
                )}

                {tradeData.customAnswers && Object.keys(tradeData.customAnswers).length > 0 && (
                  <div className="bg-background border border-border rounded-lg p-4">
                    <div className="text-sm font-semibold text-foreground mb-3">Questions & Answers</div>
                    <div className="space-y-3">
                      {Object.entries(tradeData.customAnswers).map(([question, answer]) => (
                        <div key={question}>
                          <div className="text-xs text-muted-foreground mb-1">{question}</div>
                          <div className="text-sm text-foreground">{answer as string}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto animate-scale-in bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Study Trades - {edge}
          </DialogTitle>
          <div className="flex gap-4 mt-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Wins: </span>
              <span className="font-semibold text-green-400">{winCount}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Losses: </span>
              <span className="font-semibold text-red-400">{lossCount}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {trades.map((trade) => {
            const studied = isStudied(trade);
            return (
              <div
                key={`${trade.date.toISOString()}_${trade.symbol}`}
                onClick={() => handleTradeClick(trade)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  studied 
                    ? 'bg-muted/50 border-muted-foreground/20 opacity-60' 
                    : 'bg-background border-border hover:bg-accent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-semibold text-foreground">{trade.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {trade.date.toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`font-bold ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                    </div>
                  </div>
                  {studied && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Check className="w-5 h-5" />
                      <span className="text-sm">Studied</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
