interface ParsedTrade {
  date: Date;
  symbol: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  profit: number;
}

// Point values for different futures contracts
const POINT_VALUES: { [key: string]: number } = {
  ES: 50, // E-mini S&P 500
  NQ: 20, // E-mini NASDAQ
  YM: 5, // E-mini Dow
  RTY: 50, // E-mini Russell 2000
  MES: 5, // Micro E-mini S&P 500
  MNQ: 2, // Micro E-mini NASDAQ
  MYM: 0.5, // Micro E-mini Dow
  M2K: 5, // Micro E-mini Russell 2000
  GC: 100, // Gold
  SI: 5000, // Silver
  CL: 1000, // Crude Oil
  NG: 10000, // Natural Gas
  ZB: 1000, // 30-Year T-Bonds
  ZN: 1000, // 10-Year T-Notes
};

const getPointValue = (symbol: string): number => {
  // Extract the base symbol (remove month/year codes)
  const baseSymbol = symbol.replace(/[0-9]/g, '').replace(/[A-Z]$/, '');
  return POINT_VALUES[baseSymbol] || 1;
};

export const parseSierraChartLog = (content: string): ParsedTrade[] => {
  const lines = content.split('\n');
  const trades: ParsedTrade[] = [];
  
  // Find header line to get column indices
  const headerLine = lines.find(line => line.includes('DateTime'));
  if (!headerLine) return trades;
  
  const headers = headerLine.split('\t');
  const dateTimeIdx = headers.indexOf('DateTime');
  const symbolIdx = headers.indexOf('Symbol');
  const quantityIdx = headers.indexOf('Quantity');
  const buyPriceIdx = headers.findIndex(h => h.includes('Buy') && h.includes('Price'));
  const sellPriceIdx = headers.findIndex(h => h.includes('Sell') && h.includes('Price'));
  const entryPriceIdx = headers.indexOf('EntryPrice') !== -1 ? headers.indexOf('EntryPrice') : buyPriceIdx;
  const exitPriceIdx = headers.indexOf('ExitPrice') !== -1 ? headers.indexOf('ExitPrice') : sellPriceIdx;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('DateTime') || line.startsWith('*')) continue;

    const columns = line.split('\t');
    
    if (columns.length < Math.max(dateTimeIdx, symbolIdx, quantityIdx, entryPriceIdx, exitPriceIdx) + 1) {
      continue;
    }

    try {
      const dateStr = columns[dateTimeIdx]?.trim();
      const symbol = columns[symbolIdx]?.trim();
      const quantity = parseFloat(columns[quantityIdx]?.trim() || '0');
      const entryPrice = parseFloat(columns[entryPriceIdx]?.trim() || '0');
      const exitPrice = parseFloat(columns[exitPriceIdx]?.trim() || '0');

      if (!dateStr || !symbol || !quantity || !entryPrice || !exitPrice) continue;

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) continue;

      const pointValue = getPointValue(symbol);
      const priceDiff = exitPrice - entryPrice;
      const profit = priceDiff * quantity * pointValue;

      trades.push({
        date,
        symbol,
        quantity,
        entryPrice,
        exitPrice,
        profit,
      });
    } catch (error) {
      console.error('Error parsing line:', line, error);
      continue;
    }
  }

  return trades;
};
