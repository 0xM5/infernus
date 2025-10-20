import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Star, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Trade {
  date: Date;
  profit: number;
  symbol: string;
  quantity?: number;
  entryPrice?: number;
  exitPrice?: number;
  entryTime?: string;
  exitTime?: string;
}

interface TradeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  selectedDate: Date | null;
}

export const TradeDetailsModal = ({
  isOpen,
  onClose,
  trades,
  selectedDate,
}: TradeDetailsModalProps) => {
  const [rating, setRating] = useState(0);
  const [target, setTarget] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [edges, setEdges] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [newEdge, setNewEdge] = useState("");

  // Load edges from localStorage on mount
  useEffect(() => {
    const savedEdges = localStorage.getItem("tradeEdges");
    if (savedEdges) {
      setEdges(JSON.parse(savedEdges));
    }
  }, []);

  // Save edges to localStorage whenever they change
  useEffect(() => {
    if (edges.length > 0) {
      localStorage.setItem("tradeEdges", JSON.stringify(edges));
    }
  }, [edges]);

  if (!selectedDate) return null;

  const dayTrades = trades.filter((trade) => {
    const tradeDate = trade.date.toISOString().split("T")[0];
    const selectedDateStr = selectedDate.toISOString().split("T")[0];
    return tradeDate === selectedDateStr;
  });

  if (dayTrades.length === 0) return null;

  // Aggregate stats for the day
  const totalPnL = dayTrades.reduce((sum, trade) => sum + trade.profit, 0);
  const totalContracts = dayTrades.reduce(
    (sum, trade) => sum + (trade.quantity || 0),
    0
  );
  const avgEntry =
    dayTrades.reduce((sum, trade) => sum + (trade.entryPrice || 0), 0) /
    dayTrades.length;
  const avgExit =
    dayTrades.reduce((sum, trade) => sum + (trade.exitPrice || 0), 0) /
    dayTrades.length;

  // Calculate R:R ratios
  const plannedRR =
    target && stopLoss
      ? Math.abs((parseFloat(target) - avgEntry) / (avgEntry - parseFloat(stopLoss)))
      : 0;

  const actualRR =
    stopLoss
      ? Math.abs((avgExit - avgEntry) / (avgEntry - parseFloat(stopLoss)))
      : 0;

  const handleAddEdge = () => {
    if (newEdge.trim() && !edges.includes(newEdge.trim())) {
      setEdges([...edges, newEdge.trim()]);
      setNewEdge("");
    }
  };

  const toggleEdgeSelection = (edge: string) => {
    setSelectedEdges((prev) =>
      prev.includes(edge) ? prev.filter((e) => e !== edge) : [...prev, edge]
    );
  };

  const getPnLColor = () => {
    if (totalPnL > 0) return "text-green-400";
    if (totalPnL < 0) return "text-red-400";
    return "text-muted-foreground";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] h-[85vh] p-0 bg-transparent border-none shadow-none">
        <div className="flex gap-6 h-full">
          {/* Left side - Trade Details */}
          <div className="w-[300px] bg-muted rounded-lg p-6 space-y-4 overflow-y-auto">
            <h2
              className="text-xl text-white mb-6"
              style={{ fontWeight: 700, fontFamily: "Inter" }}
            >
              Trade Details
            </h2>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">PnL</div>
                <div className={`text-2xl font-bold ${getPnLColor()}`}>
                  {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Contracts Traded
                </div>
                <div className="text-lg text-white">{totalContracts}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Rate Your Trade
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 cursor-pointer transition-colors ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Average Entry
                </div>
                <div className="text-lg text-white">
                  ${avgEntry.toFixed(2)}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Average Exit
                </div>
                <div className="text-lg text-white">${avgExit.toFixed(2)}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Target</div>
                <Input
                  type="number"
                  placeholder="Enter target price"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Stop Loss
                </div>
                <Input
                  type="number"
                  placeholder="Enter stop loss"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="bg-background"
                />
              </div>

              {target && stopLoss && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Planned R:R
                  </div>
                  <div className="text-lg text-white">
                    {plannedRR.toFixed(2)}
                  </div>
                </div>
              )}

              {stopLoss && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Actual R:R
                  </div>
                  <div className="text-lg text-white">
                    {actualRR.toFixed(2)}
                  </div>
                </div>
              )}

              {dayTrades[0].entryTime && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Entry Time
                  </div>
                  <div className="text-lg text-white">
                    {dayTrades[0].entryTime}
                  </div>
                </div>
              )}

              {dayTrades[0].exitTime && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Exit Time
                  </div>
                  <div className="text-lg text-white">
                    {dayTrades[0].exitTime}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Edge Tags */}
          <div className="flex-1 bg-purple-600/20 rounded-lg p-6 border-2 border-purple-500">
            <h2
              className="text-xl text-white mb-6"
              style={{ fontWeight: 700, fontFamily: "Inter" }}
            >
              What was the edge?
            </h2>

            <div className="space-y-4">
              {edges.length > 0 && (
                <Select>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select existing edges" />
                  </SelectTrigger>
                  <SelectContent>
                    {edges.map((edge) => (
                      <SelectItem key={edge} value={edge}>
                        {edge}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Add new edge tag"
                  value={newEdge}
                  onChange={(e) => setNewEdge(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddEdge();
                    }
                  }}
                  className="bg-background"
                />
                <Button onClick={handleAddEdge} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {edges.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Select tags:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {edges.map((edge) => (
                      <button
                        key={edge}
                        onClick={() => toggleEdgeSelection(edge)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedEdges.includes(edge)
                            ? "bg-purple-500 text-white"
                            : "bg-background text-foreground hover:bg-muted"
                        }`}
                      >
                        {edge}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
