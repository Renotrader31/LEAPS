/**
 * Simple Express server to serve the LEAPS Screener app with API endpoints
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// API endpoint for screening
app.post('/api/screener', async (req, res) => {
  try {
    const { criteria, useLiveData = false } = req.body;

    // Validate input criteria
    if (!criteria) {
      return res.status(400).json({ error: 'Screening criteria required' });
    }

    console.log('Running LEAPS screening with criteria:', criteria);

    // Generate mock market data
    const marketData = generateMarketData();
    
    // Apply screening filters
    const filteredData = applyScreeningFilters(marketData, criteria);

    // Apply strategy-specific filters
    const strategies = applyStrategyFilters(filteredData);

    // Prepare response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      dataSource: 'mock', // Always using mock data for simplicity
      criteria: criteria,
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

    return res.json(response);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`LEAPS Screener server running on http://0.0.0.0:${PORT}`);
});

/**
 * Helper functions (copied from the API endpoint)
 */

function getDefaultTickers() {
  return [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX', 'AMD', 'CRM',
    'ADBE', 'PYPL', 'INTC', 'CSCO', 'ORCL', 'IBM', 'UBER', 'SNOW', 'ZM', 'DOCU',
    'SHOP', 'SQ', 'ROKU', 'TWLO', 'OKTA', 'CRWD', 'ZS', 'DDOG', 'NET', 'FSLY',
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'V', 'MA', 'COST',
    'WMT', 'HD', 'LOW', 'TGT', 'SBUX', 'MCD', 'NKE', 'DIS', 'BA', 'CAT'
  ];
}

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

function applyScreeningFilters(data, criteria) {
  return data.filter(stock => {
    const marketCapB = stock.market_cap_basic / 1e9;
    const volumeM = stock.volume / 1e6;
    
    return (
      marketCapB >= (criteria.minMarketCap || 1) &&
      volumeM >= (criteria.minVolume || 1) &&
      stock.price_earnings_ttm > 0 &&
      stock.price_earnings_ttm <= (criteria.maxPE || 50) &&
      stock.return_on_equity >= (criteria.minROE || 10) &&
      stock.debt_to_equity <= 2.0 &&
      stock.total_revenue_yoy_growth_ttm >= (criteria.minRevGrowth || 5) &&
      stock.earnings_per_share_diluted_yoy_growth_ttm >= 0 &&
      stock.RSI >= 30 &&
      stock.RSI <= 70 &&
      stock.beta_1_year >= 0.5 &&
      stock.beta_1_year <= 2.5 &&
      stock.recommendation_mark <= 2.5 &&
      stock.price_target_1y_delta >= (criteria.minUpside || 5)
    );
  }).map(stock => ({
    ...stock,
    market_cap_billions: stock.market_cap_basic / 1e9,
    volume_ratio: stock.volume / stock.average_volume_10d_calc,
    analyst_score: 6 - stock.recommendation_mark
  })).sort((a, b) => b.market_cap_basic - a.market_cap_basic);
}

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

function randomBetween(min, max, decimals = 2) {
  const value = Math.random() * (max - min) + min;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}