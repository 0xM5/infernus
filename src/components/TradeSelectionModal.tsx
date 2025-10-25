import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Trade } from "@/pages/Index";

interface TradeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  onTradeSelect: (trade: Trade) => void;
}

export const TradeSelectionModal = ({
  isOpen,
  onClose,
  trades,
  onTradeSelect,
}: TradeSelectionModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card" aria-describedby="trade-selection-desc">
        <DialogTitle className="sr-only">Select Entry</DialogTitle>
        <DialogDescription id="trade-selection-desc" className="sr-only">Choose between scratchpad notes or a trade entry.</DialogDescription>
        <div className="space-y-4">
          <h2 className="text-xl text-white font-bold">
            Select What to View
          </h2>
          <div className="text-sm text-muted-foreground">
            This day has multiple entries. What would you like to view?
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {trades.map((trade, index) => (
              <Button
                key={index}
                variant="outline"
                className={`w-full justify-between h-auto py-3 px-4 hover:bg-muted ${
                  trade.symbol === "SCRATCHPAD" ? "border-warning" : ""
                }`}
                onClick={() => {
                  onTradeSelect(trade);
                  onClose();
                }}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className={`font-semibold ${
                    trade.symbol === "SCRATCHPAD" ? "text-warning" : "text-white"
                  }`}>
                    {trade.symbol === "SCRATCHPAD" ? "Scratchpad Notes" : `Trade #${index + 1} - ${trade.symbol}`}
                  </span>
                  {trade.entryTime && trade.symbol !== "SCRATCHPAD" && (
                    <span className="text-xs text-muted-foreground">
                      Entry: {trade.entryTime}
                    </span>
                  )}
                </div>
                {trade.symbol !== "SCRATCHPAD" && (
                  <span
                    className={`text-lg font-bold ${
                      trade.profit >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {trade.profit >= 0 ? "+" : ""}${trade.profit.toFixed(2)}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
