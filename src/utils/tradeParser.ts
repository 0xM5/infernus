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
  // Handle SierraChart format like "F.US.MESZ25"
  // Extract the base symbol (MES in this case)
  const parts = symbol.split('.');
  const symbolPart = parts[parts.length - 1]; // Get last part (MESZ25)
  const baseSymbol = symbolPart.replace(/[0-9]/g, '').replace(/[A-Z]$/, ''); // Remove numbers and last letter (MES)
  
  console.log('Symbol:', symbol, 'Base symbol:', baseSymbol, 'Point value:', POINT_VALUES[baseSymbol] || 1);
  return POINT_VALUES[baseSymbol] || 1;
};

export const parseSierraChartLog = (content: string): ParsedTrade[] => {
  const lines = content.split('\n');
  const trades: ParsedTrade[] = [];
  
  // Find header line to get column indices
  const headerLine = lines.find(line => line.includes('DateTime'));
  if (!headerLine) {
    console.log('No header line found');
    return trades;
  }
  
  const headers = headerLine.split('\t');
  console.log('Headers found:', headers);
  
  const dateTimeIdx = headers.indexOf('DateTime');
  const symbolIdx = headers.indexOf('Symbol');
  const quantityIdx = headers.indexOf('Quantity');
  const fillPriceIdx = headers.indexOf('FillPrice');
  const buySellIdx = headers.indexOf('BuySell');
  const openCloseIdx = headers.indexOf('OpenClose');

  console.log('Column indices:', { dateTimeIdx, symbolIdx, quantityIdx, fillPriceIdx, buySellIdx, openCloseIdx });

  // Group trades by pairs (Open + Close)
  const openTrades = new Map<string, any>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('ActivityType') || line.startsWith('DateTime')) continue;

    const columns = line.split('\t');
    
    try {
      const dateStr = columns[dateTimeIdx]?.trim();
      const symbol = columns[symbolIdx]?.trim();
      const quantity = parseFloat(columns[quantityIdx]?.trim() || '0');
      const fillPrice = parseFloat(columns[fillPriceIdx]?.trim() || '0');
      const buySell = columns[buySellIdx]?.trim();
      const openClose = columns[openCloseIdx]?.trim();

      if (!dateStr || !symbol || !quantity || !fillPrice) continue;

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) continue;

      console.log('Parsed trade:', { dateStr, symbol, quantity, fillPrice, buySell, openClose });

      if (openClose === 'Open') {
        // Store the opening trade
        openTrades.set(symbol, {
          date,
          symbol,
          quantity,
          entryPrice: fillPrice,
          buySell,
        });
      } else if (openClose === 'Close') {
        // Find the matching open trade
        const openTrade = openTrades.get(symbol);
        if (openTrade) {
          const pointValue = getPointValue(symbol);
          
          // Calculate profit based on whether we bought or sold first
          let priceDiff: number;
          if (openTrade.buySell === 'Buy') {
            // Bought low, sold high
            priceDiff = fillPrice - openTrade.entryPrice;
          } else {
            // Sold high, bought low (short)
            priceDiff = openTrade.entryPrice - fillPrice;
          }
          
          const profit = priceDiff * quantity * pointValue;

          console.log('Completed trade:', {
            symbol,
            entryPrice: openTrade.entryPrice,
            exitPrice: fillPrice,
            profit,
            pointValue,
            priceDiff
          });

          trades.push({
            date: openTrade.date,
            symbol,
            quantity,
            entryPrice: openTrade.entryPrice,
            exitPrice: fillPrice,
            profit,
          });

          openTrades.delete(symbol);
        }
      }
    } catch (error) {
      console.error('Error parsing line:', line, error);
      continue;
    }
  }

  console.log('Total trades parsed:', trades.length);
  return trades;
};
