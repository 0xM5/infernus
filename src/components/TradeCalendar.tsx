import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TradeDetailsModal } from "./TradeDetailsModal";
import { TradeSelectionModal } from "./TradeSelectionModal";
import type { Trade } from "@/pages/Index";


interface TradeCalendarProps {
  trades: Trade[];
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  selectedProfile: string;
}

export const TradeCalendar = ({ trades, currentDate, setCurrentDate, selectedProfile }: TradeCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const handleDayClick = (day: number, dayStats: { profit: number; count: number } | null) => {
    if (!dayStats) return;
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    
    const dayTrades = getTradesForDay(day);
    if (dayTrades.length > 1) {
      setIsSelectionModalOpen(true);
    } else if (dayTrades.length === 1) {
      setSelectedTrade(dayTrades[0]);
      setIsModalOpen(true);
    }
  };

  const handleTradeSelect = (trade: Trade) => {
    setSelectedTrade(trade);
    setIsModalOpen(true);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getTradesForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return trades.filter(trade => {
      const tradeDate = trade.date.toISOString().split('T')[0];
      return tradeDate === dateStr;
    });
  };

  const getDayStats = (day: number) => {
    const dayTrades = getTradesForDay(day);
    if (dayTrades.length === 0) return null;
    
    const totalProfit = dayTrades.reduce((sum, trade) => sum + trade.profit, 0);
    return {
      profit: totalProfit,
      count: dayTrades.length
    };
  };

  const getWeeklyPnL = (weekStartDay: number) => {
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const day = weekStartDay + i;
      if (day <= daysInMonth) {
        const dayStats = getDayStats(day);
        if (dayStats) {
          total += dayStats.profit;
        }
      }
    }
    return total;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={previousMonth}
          className="hover:bg-muted"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl text-foreground" style={{ fontWeight: 700 }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          className="hover:bg-muted"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_100px] gap-2 w-full flex-1" style={{ gridAutoRows: 'minmax(0, 1fr)' }}>
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm text-muted-foreground p-2" style={{ fontWeight: 600 }}>
            {day}
          </div>
        ))}
        <div className="p-2"></div>

        {(() => {
          const weeks: JSX.Element[] = [];
          let currentDay = 1;
          let weekIndex = 0;
          
          // First week with empty cells
          const firstWeekCells: JSX.Element[] = [];
          for (let i = 0; i < startingDayOfWeek; i++) {
            firstWeekCells.push(<div key={`empty-${i}`} className="p-2" />);
          }
          
          for (let i = startingDayOfWeek; i < 7 && currentDay <= daysInMonth; i++) {
            const day = currentDay;
            const dayStats = getDayStats(day);
            firstWeekCells.push(
              <div
                key={day}
                className={`relative p-2 rounded-lg border-2 transition-all duration-200 ${
                  dayStats
                    ? dayStats.profit >= 0
                      ? "bg-success border-success-light cursor-pointer"
                      : "bg-destructive border-destructive-light cursor-pointer"
                    : "border-border bg-card hover:bg-card/80"
                }`}
                onClick={() => handleDayClick(day, dayStats)}
              >
                <div className={`text-sm ${dayStats ? "text-white" : "text-foreground"}`} style={{ fontWeight: 600 }}>
                  {day}
                </div>
                {dayStats && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-xs text-white" style={{ fontWeight: 700 }}>
                      {dayStats.profit >= 0 ? "+" : ""}${Math.abs(dayStats.profit).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-white/80 mt-0.5" style={{ fontWeight: 600 }}>
                      {dayStats.count} {dayStats.count === 1 ? "trade" : "trades"}
                    </div>
                  </div>
                )}
              </div>
            );
            currentDay++;
          }
          
          const weekStartDay = 1;
          const weekPnL = getWeeklyPnL(weekStartDay);
          firstWeekCells.push(
            <div
              key={`week-${weekIndex}`}
              className="p-2 rounded-lg bg-muted border-2 border-border flex flex-col items-center justify-center"
            >
              <div className="text-[10px] text-muted-foreground mb-1" style={{ fontWeight: 600 }}>Week {weekIndex + 1}</div>
              <div className={`text-xs text-center ${weekPnL === 0 ? 'text-muted-foreground' : weekPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} style={{ fontWeight: 700 }}>
                {weekPnL >= 0 ? '+' : '-'}${Math.abs(weekPnL).toFixed(0)}
              </div>
            </div>
          );
          weeks.push(...firstWeekCells);
          weekIndex++;
          
          // Remaining weeks
          while (currentDay <= daysInMonth) {
            const weekStartDay = currentDay;
            let daysInThisWeek = 0;
            
            for (let i = 0; i < 7 && currentDay <= daysInMonth; i++) {
              const day = currentDay;
              const dayStats = getDayStats(day);
              weeks.push(
                <div
                  key={day}
                  className={`relative p-2 rounded-lg border-2 transition-all duration-200 ${
                    dayStats
                      ? dayStats.profit >= 0
                        ? "bg-success border-success-light cursor-pointer"
                        : "bg-destructive border-destructive-light cursor-pointer"
                      : "border-border bg-card hover:bg-card/80"
                  }`}
                  onClick={() => handleDayClick(day, dayStats)}
                >
                  <div className={`text-sm ${dayStats ? "text-white" : "text-foreground"}`} style={{ fontWeight: 600 }}>
                    {day}
                  </div>
                  {dayStats && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-xs text-white" style={{ fontWeight: 700 }}>
                        {dayStats.profit >= 0 ? "+" : ""}${Math.abs(dayStats.profit).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-white/80 mt-0.5" style={{ fontWeight: 600 }}>
                        {dayStats.count} {dayStats.count === 1 ? "trade" : "trades"}
                      </div>
                    </div>
                  )}
                </div>
              );
              currentDay++;
              daysInThisWeek++;
            }
            
            // Fill remaining cells in the week to ensure 7 total cells
            for (let i = daysInThisWeek; i < 7; i++) {
              weeks.push(<div key={`empty-end-${weekIndex}-${i}`} className="p-2" />);
            }
            
            const weekPnL = getWeeklyPnL(weekStartDay);
            weeks.push(
              <div
                key={`week-${weekIndex}`}
                className="p-2 rounded-lg bg-muted border-2 border-border flex flex-col items-center justify-center"
              >
                <div className="text-[10px] text-muted-foreground mb-1" style={{ fontWeight: 600 }}>Week {weekIndex + 1}</div>
                <div className={`text-xs text-center ${weekPnL === 0 ? 'text-muted-foreground' : weekPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} style={{ fontWeight: 700 }}>
                  {weekPnL >= 0 ? '+' : '-'}${Math.abs(weekPnL).toFixed(0)}
                </div>
              </div>
            );
            weekIndex++;
          }
          
          return weeks;
        })()}
      </div>

      <TradeSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        trades={selectedDate ? getTradesForDay(selectedDate.getDate()) : []}
        onTradeSelect={handleTradeSelect}
      />

      <TradeDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTrade(null);
        }}
        trades={selectedTrade ? [selectedTrade] : []}
        selectedDate={selectedDate}
        selectedProfile={selectedProfile}
      />
    </div>
  );
};
