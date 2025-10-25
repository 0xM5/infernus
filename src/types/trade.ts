export interface Trade {
  id?: string;
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
