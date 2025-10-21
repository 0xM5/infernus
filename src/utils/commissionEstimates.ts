// Estimated round-trip commission rates for major futures instruments
export const COMMISSION_ESTIMATES: Record<string, number> = {
  // E-mini S&P 500
  '/ES': 2.50,
  'ES': 2.50,
  
  // Micro E-mini S&P 500
  '/MES': 1.25,
  'MES': 1.25,
  
  // E-mini NASDAQ-100
  '/NQ': 2.50,
  'NQ': 2.50,
  
  // Micro E-mini NASDAQ-100
  '/MNQ': 1.25,
  'MNQ': 1.25,
  
  // E-mini Dow
  '/YM': 2.50,
  'YM': 2.50,
  
  // Micro E-mini Dow
  '/MYM': 1.25,
  'MYM': 1.25,
  
  // E-mini Russell 2000
  '/RTY': 2.50,
  'RTY': 2.50,
  
  // Micro E-mini Russell 2000
  '/M2K': 1.25,
  'M2K': 1.25,
  
  // Gold Futures
  '/GC': 2.85,
  'GC': 2.85,
  
  // Micro Gold Futures
  '/MGC': 1.50,
  'MGC': 1.50,
  
  // Silver Futures
  '/SI': 2.85,
  'SI': 2.85,
  
  // Micro Silver Futures
  '/SIL': 1.50,
  'SIL': 1.50,
  
  // Crude Oil
  '/CL': 2.85,
  'CL': 2.85,
  
  // Micro Crude Oil
  '/MCL': 1.50,
  'MCL': 1.50,
  
  // Natural Gas
  '/NG': 2.85,
  'NG': 2.85,
  
  // Euro FX
  '/6E': 2.85,
  '6E': 2.85,
  
  // British Pound
  '/6B': 2.85,
  '6B': 2.85,
  
  // Japanese Yen
  '/6J': 2.85,
  '6J': 2.85,
  
  // Australian Dollar
  '/6A': 2.85,
  '6A': 2.85,
  
  // Canadian Dollar
  '/6C': 2.85,
  '6C': 2.85,
  
  // Swiss Franc
  '/6S': 2.85,
  '6S': 2.85,
  
  // Bitcoin Futures
  '/BTC': 10.00,
  'BTC': 10.00,
  
  // Micro Bitcoin Futures
  '/MBT': 2.50,
  'MBT': 2.50,
  
  // Ethereum Futures
  '/ETH': 10.00,
  'ETH': 10.00,
  
  // 10-Year T-Note
  '/ZN': 2.85,
  'ZN': 2.85,
  
  // 30-Year T-Bond
  '/ZB': 2.85,
  'ZB': 2.85,
  
  // 5-Year T-Note
  '/ZF': 2.85,
  'ZF': 2.85,
  
  // 2-Year T-Note
  '/ZT': 2.85,
  'ZT': 2.85,
  
  // Corn
  '/ZC': 2.85,
  'ZC': 2.85,
  
  // Soybeans
  '/ZS': 2.85,
  'ZS': 2.85,
  
  // Wheat
  '/ZW': 2.85,
  'ZW': 2.85,
};

export const getEstimatedCommission = (symbol: string): number => {
  // Remove common prefixes and normalize
  const normalizedSymbol = symbol.toUpperCase().replace(/^[/@]/, '');
  
  // Try exact match first
  if (COMMISSION_ESTIMATES[symbol]) {
    return COMMISSION_ESTIMATES[symbol];
  }
  
  // Try normalized match
  if (COMMISSION_ESTIMATES[normalizedSymbol]) {
    return COMMISSION_ESTIMATES[normalizedSymbol];
  }
  
  // Try with slash prefix
  if (COMMISSION_ESTIMATES[`/${normalizedSymbol}`]) {
    return COMMISSION_ESTIMATES[`/${normalizedSymbol}`];
  }
  
  // Default commission for unknown instruments
  return 2.50;
};
