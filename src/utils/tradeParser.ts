interface ParsedTrade {
  date: Date;
  symbol: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  profit: number;
  side: "LONG" | "SHORT";
  commission?: number;
  entryTime?: string;
  exitTime?: string;
}

type TradeProvider = "SierraChart" | "Robinhood" | "InteractiveBrokers" | "Tradovate" | "TradingView" | "Thinkorswim" | "Unknown";

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
            side: openTrade.buySell === 'Buy' ? 'LONG' : 'SHORT',
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

export const parseRobinhoodCSV = (content: string): ParsedTrade[] => {
  const lines = content.split('\n');
  const trades: ParsedTrade[] = [];
  
  if (lines.length < 2) return trades;
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  console.log('Robinhood headers:', headers);
  
  // Parse CSV with proper handling of multi-line fields
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let inQuotes = false;
  let currentField = '';
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    if (!inQuotes) {
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += '\n';
    }
  }
  
  // Map open trades (BTO) to closed trades (STC)
  const openTrades = new Map<string, any[]>();
  
  for (const row of rows) {
    const dateStr = row[0];
    const instrument = row[3];
    const transCode = row[5];
    const quantityStr = row[6];
    const priceStr = row[7];
    const amountStr = row[8];
    
    if (!dateStr || !instrument || !transCode) continue;
    
    // Only process options trades (BTO/STC)
    if (transCode !== 'BTO' && transCode !== 'STC') continue;
    
    const quantity = parseFloat(quantityStr || '0');
    const price = parseFloat(priceStr?.replace('$', '') || '0');
    const amount = parseFloat(amountStr?.replace(/[$(),]/g, '') || '0') * (amountStr?.includes('(') ? -1 : 1);
    
    if (!quantity || !price) continue;
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) continue;
    
    // Extract time from date string
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    // Extract base symbol from options format (e.g., "SPY 8/13/2025 Call $640.00" -> "SPY")
    const baseSymbol = instrument.split(' ')[0];
    const tradeKey = instrument; // Use full instrument name as key for matching
    
    if (transCode === 'BTO') {
      // Buy To Open - store the opening position
      if (!openTrades.has(tradeKey)) {
        openTrades.set(tradeKey, []);
      }
      openTrades.get(tradeKey)!.push({
        date,
        symbol: baseSymbol,
        instrument,
        quantity,
        entryPrice: price,
        entryAmount: Math.abs(amount),
        entryTime: time,
      });
    } else if (transCode === 'STC') {
      // Sell To Close - match with opening position
      const opens = openTrades.get(tradeKey);
      if (opens && opens.length > 0) {
        const openTrade = opens.shift(); // Take first matching open
        const profit = amount - openTrade.entryAmount;
        
        trades.push({
          date: openTrade.date,
          symbol: openTrade.symbol,
          quantity,
          entryPrice: openTrade.entryPrice,
          exitPrice: price,
          profit,
          side: 'LONG',
          entryTime: openTrade.entryTime,
          exitTime: time,
        });
        
        // Clean up empty arrays
        if (opens.length === 0) {
          openTrades.delete(tradeKey);
        }
      }
    }
  }
  
  console.log(`Parsed ${trades.length} completed trades from Robinhood CSV`);
  return trades;
};

export const parseInteractiveBrokersCSV = (content: string): ParsedTrade[] => {
  const lines = content.split('\n');
  const trades: ParsedTrade[] = [];
  
  const headerLine = lines.find(line => line.toLowerCase().includes('date') && line.toLowerCase().includes('symbol'));
  if (!headerLine) return trades;
  
  const headerIndex = lines.indexOf(headerLine);
  const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
  
  const dateIdx = headers.findIndex(h => h.toLowerCase().includes('date'));
  const symbolIdx = headers.findIndex(h => h.toLowerCase().includes('symbol'));
  const sideIdx = headers.findIndex(h => h.toLowerCase().includes('buy') || h.toLowerCase().includes('side'));
  const qtyIdx = headers.findIndex(h => h.toLowerCase().includes('quantity'));
  const priceIdx = headers.findIndex(h => h.toLowerCase().includes('price'));
  const proceedsIdx = headers.findIndex(h => h.toLowerCase().includes('proceeds') || h.toLowerCase().includes('amount'));
  
  const openTrades = new Map<string, any>();
  
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',').map(c => c.trim().replace(/"/g, ''));
    
    const dateStr = columns[dateIdx];
    const symbol = columns[symbolIdx];
    const side = columns[sideIdx]?.toLowerCase();
    const quantity = Math.abs(parseFloat(columns[qtyIdx] || '0'));
    const price = Math.abs(parseFloat(columns[priceIdx] || '0'));
    
    if (!dateStr || !symbol || !quantity || !price) continue;
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) continue;
    
    const isBuy = side.includes('buy') || side.includes('bot');
    
    if (isBuy && !openTrades.has(symbol)) {
      openTrades.set(symbol, { date, symbol, quantity, entryPrice: price, side: 'LONG' });
    } else if (!isBuy && openTrades.has(symbol)) {
      const openTrade = openTrades.get(symbol);
      const profit = (price - openTrade.entryPrice) * openTrade.quantity;
      
      trades.push({
        date: openTrade.date,
        symbol,
        quantity: openTrade.quantity,
        entryPrice: openTrade.entryPrice,
        exitPrice: price,
        profit,
        side: openTrade.side,
      });
      
      openTrades.delete(symbol);
    }
  }
  
  return trades;
};

export const parseTradovateCSV = (content: string): ParsedTrade[] => {
  const lines = content.split('\n');
  const trades: ParsedTrade[] = [];
  
  if (lines.length < 2) return trades;
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  console.log('Tradovate headers:', headers);
  
  // Check for performance report format (has pnl, buyPrice, sellPrice)
  const hasPerformanceFormat = headers.includes('pnl') && headers.includes('buyPrice') && headers.includes('sellPrice');
  
  if (hasPerformanceFormat) {
    // Performance report format - each line is already a complete trade
    const symbolIdx = headers.indexOf('symbol');
    const qtyIdx = headers.indexOf('qty');
    const buyPriceIdx = headers.indexOf('buyPrice');
    const sellPriceIdx = headers.indexOf('sellPrice');
    const pnlIdx = headers.indexOf('pnl');
    const boughtTimestampIdx = headers.indexOf('boughtTimestamp');
    const commissionIdx = headers.findIndex(h => h.toLowerCase().includes('commission') || h.toLowerCase().includes('fee'));
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',').map(c => c.trim().replace(/"/g, ''));
      
      const symbol = columns[symbolIdx];
      const quantity = parseFloat(columns[qtyIdx] || '0');
      const buyPrice = parseFloat(columns[buyPriceIdx] || '0');
      const sellPrice = parseFloat(columns[sellPriceIdx] || '0');
      const pnlStr = columns[pnlIdx] || '';
      const dateStr = columns[boughtTimestampIdx];
      const commissionStr = commissionIdx >= 0 ? columns[commissionIdx] || '' : '';
      
      if (!symbol || !quantity || !buyPrice || !sellPrice || !dateStr) continue;
      
      // Parse PnL - handle format like "$25.50" or "$(67.50)"
      const isNegative = pnlStr.includes('(');
      const pnl = parseFloat(pnlStr.replace(/[$(),]/g, '')) * (isNegative ? -1 : 1);
      
      // Parse commission - handle format like "$2.50" or "$(2.50)"
      let commission = 0;
      if (commissionStr) {
        const isCommissionNegative = commissionStr.includes('(');
        commission = Math.abs(parseFloat(commissionStr.replace(/[$(),]/g, '')) * (isCommissionNegative ? -1 : 1));
      }
      
      // Parse date
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) continue;
      
      // Determine side based on price movement
      const side = buyPrice < sellPrice ? 'LONG' : 'SHORT';
      
      // Subtract commission from profit
      const profitAfterCommission = pnl - commission;
      
      trades.push({
        date,
        symbol,
        quantity,
        entryPrice: buyPrice,
        exitPrice: sellPrice,
        profit: profitAfterCommission,
        side,
        commission,
      });
    }
  } else {
    // Original trade log format
    const dateIdx = headers.findIndex(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('time'));
    const symbolIdx = headers.findIndex(h => h.toLowerCase().includes('contract') || h.toLowerCase().includes('symbol'));
    const sideIdx = headers.findIndex(h => h.toLowerCase().includes('side') || h.toLowerCase().includes('action'));
    const qtyIdx = headers.findIndex(h => h.toLowerCase().includes('qty') || h.toLowerCase().includes('size'));
    const priceIdx = headers.findIndex(h => h.toLowerCase().includes('price'));
    
    const openTrades = new Map<string, any>();
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',').map(c => c.trim().replace(/"/g, ''));
      
      const dateStr = columns[dateIdx];
      const symbol = columns[symbolIdx];
      const side = columns[sideIdx]?.toLowerCase();
      const quantity = parseFloat(columns[qtyIdx] || '0');
      const price = parseFloat(columns[priceIdx] || '0');
      
      if (!dateStr || !symbol || !quantity || !price) continue;
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) continue;
      
      const pointValue = getPointValue(symbol);
      const isBuy = side.includes('buy');
      
      if (isBuy && !openTrades.has(symbol)) {
        openTrades.set(symbol, { date, symbol, quantity, entryPrice: price, side: 'LONG' });
      } else if (!isBuy && openTrades.has(symbol)) {
        const openTrade = openTrades.get(symbol);
        const priceDiff = price - openTrade.entryPrice;
        const profit = priceDiff * openTrade.quantity * pointValue;
        
        trades.push({
          date: openTrade.date,
          symbol,
          quantity: openTrade.quantity,
          entryPrice: openTrade.entryPrice,
          exitPrice: price,
          profit,
          side: openTrade.side,
        });
        
        openTrades.delete(symbol);
      }
    }
  }
  
  return trades;
};

export const parseTradingViewCSV = (content: string): ParsedTrade[] => {
  const lines = content.split('\n');
  const trades: ParsedTrade[] = [];
  
  if (lines.length < 2) return trades;
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  console.log('TradingView headers:', headers);
  
  const dateIdx = headers.findIndex(h => h.toLowerCase().includes('time') || h.toLowerCase().includes('date'));
  const symbolIdx = headers.findIndex(h => h.toLowerCase().includes('symbol') || h.toLowerCase().includes('instrument'));
  const typeIdx = headers.findIndex(h => h.toLowerCase().includes('type') || h.toLowerCase().includes('side'));
  const qtyIdx = headers.findIndex(h => h.toLowerCase().includes('qty') || h.toLowerCase().includes('contracts'));
  const priceIdx = headers.findIndex(h => h.toLowerCase().includes('price'));
  const plIdx = headers.findIndex(h => h.toLowerCase().includes('profit') || h.toLowerCase().includes('p/l'));
  
  const openTrades = new Map<string, any>();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',').map(c => c.trim().replace(/"/g, ''));
    
    const dateStr = columns[dateIdx];
    const symbol = columns[symbolIdx];
    const type = columns[typeIdx]?.toLowerCase();
    const quantity = parseFloat(columns[qtyIdx] || '0');
    const price = parseFloat(columns[priceIdx] || '0');
    
    if (!dateStr || !symbol || !quantity || !price) continue;
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) continue;
    
    const pointValue = getPointValue(symbol);
    const isBuy = type.includes('buy') || type.includes('long');
    
    if (isBuy && !openTrades.has(symbol)) {
      openTrades.set(symbol, { date, symbol, quantity, entryPrice: price, side: 'LONG' });
    } else if (!isBuy && openTrades.has(symbol)) {
      const openTrade = openTrades.get(symbol);
      const priceDiff = price - openTrade.entryPrice;
      const profit = priceDiff * openTrade.quantity * pointValue;
      
      trades.push({
        date: openTrade.date,
        symbol,
        quantity: openTrade.quantity,
        entryPrice: openTrade.entryPrice,
        exitPrice: price,
        profit,
        side: openTrade.side,
      });
      
      openTrades.delete(symbol);
    }
  }
  
  return trades;
};

export const parseThinkorswimCSV = (content: string): ParsedTrade[] => {
  const lines = content.split('\n');
  const trades: ParsedTrade[] = [];
  
  // Find the Cash Balance section with TRD entries
  let inCashBalanceSection = false;
  const cashBalanceLines: string[] = [];
  
  for (const line of lines) {
    if (line.includes('Cash Balance')) {
      inCashBalanceSection = true;
      continue;
    }
    if (inCashBalanceSection) {
      if (line.trim() === '' || line.includes('Futures Statements')) {
        break;
      }
      cashBalanceLines.push(line);
    }
  }
  
  if (cashBalanceLines.length < 2) return trades;
  
  // Parse the header
  const headerLine = cashBalanceLines[0];
  const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
  
  const dateIdx = headers.indexOf('DATE');
  const timeIdx = headers.indexOf('TIME');
  const typeIdx = headers.indexOf('TYPE');
  const descIdx = headers.indexOf('DESCRIPTION');
  const feesIdx = headers.indexOf('Commissions & Fees');
  const amountIdx = headers.indexOf('AMOUNT');
  
  console.log('Thinkorswim headers:', headers);
  console.log('Column indices:', { dateIdx, timeIdx, typeIdx, descIdx, feesIdx, amountIdx });
  
  // Store open positions by option key (symbol + strike + type)
  const openPositions = new Map<string, any[]>();
  
  for (let i = 1; i < cashBalanceLines.length; i++) {
    const line = cashBalanceLines[i].trim();
    if (!line || line.startsWith('TOTAL')) continue;
    
    // Parse CSV with proper handling of quoted fields
    const columns: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        columns.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    columns.push(currentField.trim());
    
    const type = columns[typeIdx];
    if (type !== 'TRD') continue;
    
    const dateStr = columns[dateIdx];
    const timeStr = columns[timeIdx];
    const description = columns[descIdx];
    const feesStr = columns[feesIdx] || '0';
    const amountStr = columns[amountIdx] || '0';
    
    if (!dateStr || !description) continue;
    
    // Parse description: "BOT +1 SPX 100 (Weeklys) 4 NOV 25 6785 PUT @7.30 CBOE"
    const descMatch = description.match(/(BOT|SOLD)\s+([\+\-]\d+)\s+(\w+)\s+(\d+)\s+\([^)]+\)\s+.*?(\d+)\s+(CALL|PUT)\s+@([\d.]+)/i);
    
    if (!descMatch) {
      console.log('Failed to parse description:', description);
      continue;
    }
    
    const [, action, qtyStr, symbol, multiplierStr, strike, optionType, priceStr] = descMatch;
    const quantity = Math.abs(parseInt(qtyStr));
    const multiplier = parseInt(multiplierStr);
    const price = parseFloat(priceStr);
    const fees = Math.abs(parseFloat(feesStr.replace(/[$(),]/g, '')));
    const amount = parseFloat(amountStr.replace(/[$(),]/g, '')) * (amountStr.includes('(') ? -1 : 1);
    
    // Create unique key for matching
    const optionKey = `${symbol} ${strike} ${optionType}`;
    
    // Parse date
    const date = new Date(dateStr + ' ' + timeStr);
    if (isNaN(date.getTime())) continue;
    
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
    
    if (action === 'BOT') {
      // Opening position
      if (!openPositions.has(optionKey)) {
        openPositions.set(optionKey, []);
      }
      openPositions.get(optionKey)!.push({
        date,
        symbol,
        optionKey,
        quantity,
        entryPrice: price,
        entryTime: time,
        entryFees: fees,
        entryAmount: Math.abs(amount),
      });
    } else if (action === 'SOLD') {
      // Closing position
      const opens = openPositions.get(optionKey);
      if (opens && opens.length > 0) {
        // Match quantity - may need to close multiple positions
        let remainingQty = quantity;
        const exitPrice = price;
        const exitTime = time;
        const exitFees = fees;
        
        while (remainingQty > 0 && opens.length > 0) {
          const openTrade = opens[0];
          const closeQty = Math.min(remainingQty, openTrade.quantity);
          
          // Calculate profit
          const profit = ((exitPrice - openTrade.entryPrice) * closeQty * multiplier) - (openTrade.entryFees + exitFees);
          
          trades.push({
            date: openTrade.date,
            symbol,
            quantity: closeQty,
            entryPrice: openTrade.entryPrice,
            exitPrice,
            profit,
            side: 'LONG',
            commission: openTrade.entryFees + exitFees,
            entryTime: openTrade.entryTime,
            exitTime,
          });
          
          if (closeQty >= openTrade.quantity) {
            opens.shift();
          } else {
            openTrade.quantity -= closeQty;
          }
          
          remainingQty -= closeQty;
        }
        
        if (opens.length === 0) {
          openPositions.delete(optionKey);
        }
      }
    }
  }
  
  console.log(`Parsed ${trades.length} completed trades from Thinkorswim CSV`);
  return trades;
};

export const detectTradeProvider = (content: string): TradeProvider => {
  const firstLines = content.split('\n').slice(0, 10).join('\n').toLowerCase();
  
  // Thinkorswim detection (check first as it has distinctive format)
  if (firstLines.includes('account statement') && firstLines.includes('cash balance') && (firstLines.includes('bot') || firstLines.includes('sold'))) {
    return "Thinkorswim";
  }
  
  // SierraChart detection
  if (firstLines.includes('datetime') && firstLines.includes('fillprice') && firstLines.includes('openclose')) {
    return "SierraChart";
  }
  
  // Robinhood detection
  if (firstLines.includes('robinhood') || (firstLines.includes('activity date') && firstLines.includes('process date'))) {
    return "Robinhood";
  }
  
  // Interactive Brokers detection
  if (firstLines.includes('interactive brokers') || firstLines.includes('statement') || firstLines.includes('trades,header')) {
    return "InteractiveBrokers";
  }
  
  // Tradovate detection
  if (firstLines.includes('tradovate') || 
      (firstLines.includes('contract') && firstLines.includes('action')) ||
      (firstLines.includes('buyprice') && firstLines.includes('sellprice') && firstLines.includes('pnl'))) {
    return "Tradovate";
  }
  
  // TradingView detection
  if (firstLines.includes('tradingview') || (firstLines.includes('type') && firstLines.includes('profit'))) {
    return "TradingView";
  }
  
  return "Unknown";
};

export const parseTradeFile = (content: string, provider?: TradeProvider): ParsedTrade[] => {
  const detectedProvider = provider || detectTradeProvider(content);
  
  console.log('Detected trade provider:', detectedProvider);
  
  switch (detectedProvider) {
    case "SierraChart":
      return parseSierraChartLog(content);
    case "Robinhood":
      return parseRobinhoodCSV(content);
    case "InteractiveBrokers":
      return parseInteractiveBrokersCSV(content);
    case "Tradovate":
      return parseTradovateCSV(content);
    case "TradingView":
      return parseTradingViewCSV(content);
    case "Thinkorswim":
      return parseThinkorswimCSV(content);
    default:
      // Try all parsers and return the one with most results
      const results = [
        parseSierraChartLog(content),
        parseRobinhoodCSV(content),
        parseInteractiveBrokersCSV(content),
        parseTradovateCSV(content),
        parseTradingViewCSV(content),
        parseThinkorswimCSV(content),
      ];
      return results.reduce((best, current) => current.length > best.length ? current : best, []);
  }
};
