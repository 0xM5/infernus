import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Trade {
  date: Date;
  profit: number;
  symbol: string;
}

interface TradeCalendarProps {
  trades: Trade[];
}

export const TradeCalendar = ({ trades }: TradeCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={previousMonth}
          className="hover:bg-muted"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-semibold text-foreground">
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

      <div className="grid grid-cols-[repeat(7,1fr)_auto] gap-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
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
                className={`relative aspect-square p-2 rounded-lg border-2 transition-all duration-200 ${
                  dayStats
                    ? dayStats.profit >= 0
                      ? "bg-success border-success-light"
                      : "bg-destructive border-destructive-light"
                    : "border-border bg-card hover:bg-card/80"
                }`}
              >
                <div className={`text-sm font-medium ${dayStats ? "text-white" : "text-foreground"}`}>
                  {day}
                </div>
                {dayStats && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-xs font-bold text-white">
                      {dayStats.profit >= 0 ? "+" : ""}${Math.abs(dayStats.profit).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-white/80 mt-0.5">
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
              className="aspect-square p-2 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: weekPnL >= 0 ? 'rgb(0, 150, 255)' : 'rgb(144, 144, 144)' }}
            >
              <div className="text-xs font-bold text-white text-center">
                {weekPnL >= 0 ? '+' : ''}${Math.abs(weekPnL).toFixed(0)}
              </div>
            </div>
          );
          weeks.push(...firstWeekCells);
          weekIndex++;
          
          // Remaining weeks
          while (currentDay <= daysInMonth) {
            const weekStartDay = currentDay;
            for (let i = 0; i < 7 && currentDay <= daysInMonth; i++) {
              const day = currentDay;
              const dayStats = getDayStats(day);
              weeks.push(
                <div
                  key={day}
                  className={`relative aspect-square p-2 rounded-lg border-2 transition-all duration-200 ${
                    dayStats
                      ? dayStats.profit >= 0
                        ? "bg-success border-success-light"
                        : "bg-destructive border-destructive-light"
                      : "border-border bg-card hover:bg-card/80"
                  }`}
                >
                  <div className={`text-sm font-medium ${dayStats ? "text-white" : "text-foreground"}`}>
                    {day}
                  </div>
                  {dayStats && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-xs font-bold text-white">
                        {dayStats.profit >= 0 ? "+" : ""}${Math.abs(dayStats.profit).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-white/80 mt-0.5">
                        {dayStats.count} {dayStats.count === 1 ? "trade" : "trades"}
                      </div>
                    </div>
                  )}
                </div>
              );
              currentDay++;
            }
            
            // Fill remaining cells in the week if needed
            const remainingCells = currentDay > daysInMonth ? (7 - ((currentDay - 1) % 7)) % 7 : 0;
            for (let i = 0; i < remainingCells; i++) {
              weeks.push(<div key={`empty-end-${weekIndex}-${i}`} className="p-2" />);
            }
            
            const weekPnL = getWeeklyPnL(weekStartDay);
            weeks.push(
              <div
                key={`week-${weekIndex}`}
                className="aspect-square p-2 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: weekPnL >= 0 ? 'rgb(0, 150, 255)' : 'rgb(144, 144, 144)' }}
              >
                <div className="text-xs font-bold text-white text-center">
                  {weekPnL >= 0 ? '+' : ''}${Math.abs(weekPnL).toFixed(0)}
                </div>
              </div>
            );
            weekIndex++;
          }
          
          return weeks;
        })()}
      </div>
    </div>
  );
};
