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

      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}

        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="p-2" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayStats = getDayStats(day);
          
          return (
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
        })}
      </div>
    </div>
  );
};
