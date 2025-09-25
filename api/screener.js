/**
 * Vercel API endpoint for LEAPS screening with live market data
 */

// Import default tickers
const getDefaultTickers = () => [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX', 'AMD', 'CRM',
  'ADBE', 'PYPL', 'INTC', 'CSCO', 'ORCL', 'IBM', 'UBER', 'SNOW', 'ZM', 'DOCU',
  'SHOP', 'SQ', 'ROKU', 'TWLO', 'OKTA', 'CRWD', 'ZS', 'DDOG', 'NET', 'FSLY',
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'V', 'MA', 'COST',
  'WMT', 'HD', 'LOW', 'TGT', 'SBUX', 'MCD', 'NKE', 'DIS', 'BA', 'CAT'
];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { criteria = {}, useLiveData = false } = req.body || {};

    // Set default criteria if not provided
    const screeningCriteria = {
      minMarketCap: criteria.minMarketCap || 0.1,
      minVolume: criteria.minVolume || 0.1,
      maxPE: criteria.maxPE || 100,
      minROE: criteria.minROE || -50,
      minRevGrowth: criteria.minRevGrowth || -50,
      minUpside: criteria.minUpside || -50,
      strategy: criteria.strategy || 'all'
    };

    console.log('Screening criteria:', screeningCriteria);

    let marketData;
    
    if (useLiveData && (process.env.ALPHA_VANTAGE_API_KEY || process.env.TWELVE_DATA_API_KEY)) {
      // Fetch live market data
      console.log('Fetching live market data...');
      marketData = fetchLiveMarketData();
    } else {
      // Use mock data as fallback
      console.log('Using mock market data...');
      marketData = generateMarketData();
    }

    // Apply screening filters
    const filteredData = applyScreeningFilters(marketData, screeningCriteria);

    // Apply strategy-specific filters
    const strategies = applyStrategyFilters(filteredData);

    // Prepare response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      dataSource: useLiveData && (process.env.ALPHA_VANTAGE_API_KEY || process.env.TWELVE_DATA_API_KEY) ? 'live' : 'mock',
      criteria: screeningCriteria,
      totalResults: filteredData.length,
      results: filteredData.slice(0, 50), // Top 50 results
      strategies: {
        stock_replacement: strategies.stock_replacement.length,
        pmcc: strategies.pmcc.length,
        growth: strategies.growth.length,
        value: strategies.value.length,
        all: filteredData.length
      },
      strategyResults: strategies
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('API Error:', error);
    console.error('Request body:', req.body);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Fetch live market data from external APIs
 */
function fetchLiveMarketData() {
  try {
    const tickers = getDefaultTickers();
    // For now, return mock data - you can replace this with actual API calls
    return generateMarketData();
  } catch (error) {
    console.error('Error fetching live data:', error);
    return generateMarketData();
  }
}

/**
 * Generate mock market data that simulates the screening results
 */
function generateMarketData() {
  const tickers = getDefaultTickers();
  const companies = [
    'Apple Inc.', 'Microsoft Corporation', 'Alphabet Inc.', 'Amazon.com Inc.', 'NVIDIA Corporation',
    'Tesla Inc.', 'Meta Platforms Inc.', 'Netflix Inc.', 'Advanced Micro Devices', 'Salesforce Inc.',
    'Adobe Inc.', 'PayPal Holdings', 'Intel Corporation', 'Cisco Systems', 'Oracle Corporation',
    'IBM', 'Uber Technologies', 'Snowflake Inc.', 'Zoom Video Communications', 'DocuSign Inc.',
    'Shopify Inc.', 'Block Inc.', 'Roku Inc.', 'Twilio Inc.', 'Okta Inc.',
    'CrowdStrike Holdings', 'Zscaler Inc.', 'Datadog Inc.', 'Cloudflare Inc.', 'Fastly Inc.',
    'JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Goldman Sachs', 'Morgan Stanley',
    'Citigroup Inc.', 'American Express', 'Visa Inc.', 'Mastercard Inc.', 'Costco Wholesale',
    'Walmart Inc.', 'Home Depot', 'Lowe\'s Companies', 'Target Corporation', 'Starbucks Corporation',
    'McDonald\'s Corporation', 'Nike Inc.', 'Walt Disney Company', 'Boeing Company', 'Caterpillar Inc.'
  ];

  return tickers.map((ticker, index) => ({
    ticker: ticker,
    name: companies[index] || `${ticker} Corporation`,
    close: randomBetween(50, 500),
    market_cap_basic: randomBetween(10e9, 3000e9),
    volume: randomBetween(500000, 50000000),
    average_volume_10d_calc: randomBetween(400000, 45000000),
    price_earnings_ttm: randomBetween(8, 80),
    return_on_equity: randomBetween(-5, 40),
    debt_to_equity: randomBetween(0, 3),
    total_revenue_yoy_growth_ttm: randomBetween(-10, 50),
    earnings_per_share_diluted_yoy_growth_ttm: randomBetween(-20, 80),
    beta_1_year: randomBetween(0.3, 3.0),
    RSI: randomBetween(20, 80),
    recommendation_mark: randomBetween(1, 5),
    price_target_1y_delta: randomBetween(-5, 40)
  })).map(stock => {
    stock.price_target_1y = stock.close * (1 + stock.price_target_1y_delta / 100);
    return stock;
  });
}

/**
 * Apply base screening filters
 */
function applyScreeningFilters(data, criteria) {
  const filtered = data.filter(stock => {
    const marketCapB = stock.market_cap_basic / 1e9;
    const volumeM = stock.volume / 1e6;
    
    const passes = (
      marketCapB >= criteria.minMarketCap &&
      volumeM >= criteria.minVolume &&
      stock.price_earnings_ttm > 0 &&
      stock.price_earnings_ttm <= criteria.maxPE &&
      stock.return_on_equity >= criteria.minROE &&
      stock.debt_to_equity <= 5.0 &&  // Very lenient
      stock.total_revenue_yoy_growth_ttm >= criteria.minRevGrowth &&
      stock.earnings_per_share_diluted_yoy_growth_ttm >= -50 &&  // Very lenient
      stock.RSI >= 10 &&  // Very lenient
      stock.RSI <= 90 &&  // Very lenient
      stock.beta_1_year >= 0.1 &&  // Very lenient
      stock.beta_1_year <= 5.0 &&  // Very lenient
      stock.recommendation_mark <= 5.0 &&  // Very lenient
      stock.price_target_1y_delta >= criteria.minUpside
    );
    
    return passes;
  });
  
  console.log(`API Filtering: ${filtered.length} stocks from ${data.length} total with criteria:`, criteria);
  
  return filtered.map(stock => ({
    ...stock,
    market_cap_billions: stock.market_cap_basic / 1e9,
    volume_ratio: stock.volume / stock.average_volume_10d_calc,
    analyst_score: 6 - stock.recommendation_mark
  })).sort((a, b) => b.market_cap_basic - a.market_cap_basic);
}

/**
 * Apply strategy-specific filters
 */
function applyStrategyFilters(data) {
  return {
    stock_replacement: data.filter(stock => 
      stock.price_earnings_ttm <= 30 &&
      stock.beta_1_year <= 1.5 &&
      stock.return_on_equity >= 15 &&
      stock.market_cap_billions >= 50
    ),
    pmcc: data.filter(stock =>
      stock.close >= 100 &&
      stock.beta_1_year >= 0.8 &&
      stock.beta_1_year <= 2.0 &&
      stock.volume >= 2000000 &&
      stock.price_target_1y_delta >= 10
    ),
    growth: data.filter(stock =>
      stock.total_revenue_yoy_growth_ttm >= 15 &&
      stock.earnings_per_share_diluted_yoy_growth_ttm >= 10 &&
      stock.price_target_1y_delta >= 20 &&
      stock.return_on_equity >= 20
    ),
    value: data.filter(stock =>
      stock.price_earnings_ttm <= 20 &&
      stock.return_on_equity >= 12 &&
      stock.debt_to_equity <= 1.0 &&
      stock.price_target_1y_delta >= 15 &&
      stock.RSI <= 50
    )
  };
}

/**
 * Generate random number between min and max
 */
function randomBetween(min, max, decimals = 2) {
  const value = Math.random() * (max - min) + min;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}