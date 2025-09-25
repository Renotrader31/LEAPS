/**
 * S&P 500 Stock Tickers - Expanded Universe for LEAPS Screening
 * Updated: 2024 - Top liquid options trading stocks
 */

export const SP500_TICKERS = [
  // Large Cap Technology
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX', 'ADBE', 
  'CRM', 'ORCL', 'AVGO', 'CSCO', 'INTC', 'AMD', 'NOW', 'INTU', 'IBM', 'QCOM',
  'AMAT', 'ADI', 'MU', 'LRCX', 'KLAC', 'MCHP', 'SNPS', 'CDNS', 'FTNT', 'PANW',
  
  // Financial Services  
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK', 'SCHW', 'SPGI',
  'CME', 'ICE', 'AON', 'MMC', 'AIG', 'PGR', 'TRV', 'ALL', 'MET', 'PRU',
  
  // Healthcare & Biotech
  'JNJ', 'PFE', 'ABT', 'TMO', 'DHR', 'BMY', 'ABBV', 'MRK', 'LLY', 'UNH',
  'MDT', 'ISRG', 'GILD', 'VRTX', 'REGN', 'BIIB', 'AMGN', 'ZTS', 'SYK', 'BSX',
  
  // Consumer Discretionary
  'AMZN', 'TSLA', 'HD', 'MCD', 'LOW', 'SBUX', 'NKE', 'TJX', 'BKNG', 'CMG',
  'LULU', 'RCL', 'CCL', 'MAR', 'HLT', 'MGM', 'WYNN', 'LVS', 'NCLH', 'DRI',
  
  // Consumer Staples
  'WMT', 'PG', 'KO', 'PEP', 'COST', 'WBA', 'CVS', 'KMB', 'CL', 'GIS',
  'K', 'TSN', 'HSY', 'MKC', 'CAG', 'CPB', 'SJM', 'HRL', 'CHD', 'CLX',
  
  // Energy
  'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'MPC', 'PSX', 'VLO', 'HES', 'BKR',
  'HAL', 'DVN', 'FANG', 'EQT', 'MRO', 'APA', 'OXY', 'KMI', 'WMB', 'EPD',
  
  // Industrials  
  'BA', 'CAT', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'DE', 'FDX', 'WM',
  'EMR', 'ETN', 'ITW', 'MMM', 'GD', 'NOC', 'CSX', 'UNP', 'NSC', 'LUV',
  
  // Communication Services
  'GOOGL', 'META', 'NFLX', 'DIS', 'CMCSA', 'VZ', 'T', 'TMUS', 'CHTR', 'PARA',
  
  // Utilities
  'NEE', 'DUK', 'SO', 'D', 'AEP', 'EXC', 'SRE', 'PEG', 'XEL', 'ED',
  
  // Materials
  'LIN', 'APD', 'ECL', 'SHW', 'FCX', 'NUE', 'DOW', 'DD', 'PPG', 'IFF',
  
  // Real Estate
  'AMT', 'PLD', 'CCI', 'EQIX', 'WELL', 'DLR', 'PSA', 'O', 'CBRE', 'AVB',
  
  // High-Volume Options Trading (Additional)
  'SPY', 'QQQ', 'IWM', 'GDX', 'EEM', 'FXI', 'EWZ', 'USO', 'SLV', 'GLD',
  'ARKK', 'SQQQ', 'TQQQ', 'SPXU', 'UVXY', 'VXX', 'VIXY', 'SVXY', 'TMF', 'TLT',
  
  // Popular Meme/Growth Stocks with LEAPS
  'GME', 'AMC', 'BB', 'PLTR', 'SOFI', 'HOOD', 'COIN', 'RBLX', 'U', 'SNOW',
  'NET', 'CRWD', 'ZS', 'OKTA', 'DDOG', 'MDB', 'FSLY', 'TWLO', 'ZM', 'DOCU',
  
  // Emerging Growth & EV
  'RIVN', 'LCID', 'F', 'GM', 'NIO', 'XPEV', 'LI', 'BYDDY', 'FSR', 'RIDE'
];

// High-liquidity options stocks (prioritized for LEAPS)
export const HIGH_LIQUIDITY_TICKERS = [
  'SPY', 'QQQ', 'AAPL', 'TSLA', 'AMZN', 'MSFT', 'GOOGL', 'NVDA', 'META', 'NFLX',
  'AMD', 'JPM', 'BAC', 'XOM', 'CVX', 'JNJ', 'PFE', 'DIS', 'BA', 'CAT',
  'WMT', 'HD', 'MCD', 'NKE', 'COST', 'SBUX', 'V', 'MA', 'PYPL', 'CRM'
];

// Sector classifications for strategy targeting
export const SECTOR_MAPPING = {
  'Technology': ['AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'AVGO', 'CSCO', 'INTC', 'AMD'],
  'Financial': ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK', 'SCHW', 'SPGI'],
  'Healthcare': ['JNJ', 'PFE', 'ABT', 'TMO', 'DHR', 'BMY', 'ABBV', 'MRK', 'LLY', 'UNH'],
  'Consumer': ['HD', 'MCD', 'LOW', 'SBUX', 'NKE', 'WMT', 'PG', 'KO', 'PEP', 'COST'],
  'Energy': ['XOM', 'CVX', 'COP', 'EOG', 'SLB', 'MPC', 'PSX', 'VLO', 'HES', 'BKR'],
  'Industrial': ['BA', 'CAT', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'DE', 'FDX', 'WM']
};

export default SP500_TICKERS;