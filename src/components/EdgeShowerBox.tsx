import { Button } from "@/components/ui/button";
import type { Trade } from "@/pages/Index";

interface EdgeShowerBoxProps {
  trades: Trade[];
  onStudyClick: (edge: string, winCount: number, lossCount: number) => void;
}

export const EdgeShowerBox = ({ trades, onStudyClick }: EdgeShowerBoxProps) => {
  // Get all edges from trades
  const getEdgeStats = () => {
    const edgeMap: { [key: string]: { wins: number; losses: number } } = {};
    
    trades.forEach(trade => {
      const tradeData = localStorage.getItem(`trade_${trade.date.toISOString()}_${trade.symbol}`);
      if (tradeData) {
        const parsedData = JSON.parse(tradeData);
        if (parsedData.edges && Array.isArray(parsedData.edges)) {
          parsedData.edges.forEach((edge: string) => {
            if (!edgeMap[edge]) {
              edgeMap[edge] = { wins: 0, losses: 0 };
            }
            if (trade.profit > 0) {
              edgeMap[edge].wins++;
            } else {
              edgeMap[edge].losses++;
            }
          });
        }
      }
    });
    
    return edgeMap;
  };
  
  const edgeStats = getEdgeStats();
  
  // Find the edge(s) with most wins
  const bestEdges = Object.entries(edgeStats)
    .sort((a, b) => b[1].wins - a[1].wins)
    .filter(([_, stats]) => stats.wins > 0);
  
  if (bestEdges.length === 0) {
    return (
      <div 
        className="w-[1370px] h-[80px] bg-card border border-border rounded-lg flex items-center justify-center"
      >
        <p className="text-muted-foreground text-sm">No edges tracked yet. Start adding edges to your trades!</p>
      </div>
    );
  }
  
  const topWinCount = bestEdges[0][1].wins;
  const bestEdgesList = bestEdges.filter(([_, stats]) => stats.wins === topWinCount);
  
  return (
    <div className="w-[1370px] h-[80px] bg-card border border-border rounded-lg flex items-center px-6 gap-6">
      <div className="flex items-center gap-4 flex-1">
        {bestEdgesList.map(([edge, stats]) => (
          <div key={edge} className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-full bg-purple-500 text-white font-semibold text-lg">
              {edge}
            </div>
            <div className="bg-background border border-border rounded-lg px-4 py-2 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Wins:</span>
                <span className="text-sm font-bold text-green-400">{stats.wins}</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Losses:</span>
                <span className="text-sm font-bold text-red-400">{stats.losses}</span>
              </div>
            </div>
            <Button
              onClick={() => onStudyClick(edge, stats.wins, stats.losses)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Study The Trades
            </Button>
          </div>
        ))}
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-foreground">Your Best Edge</h3>
      </div>
    </div>
  );
};
