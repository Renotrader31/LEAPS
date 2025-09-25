/**
 * Market Data API - Integrates with Alpha Vantage and Twelve Data
 */

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;

const handler = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tickers } = req.query;
    
    if (!tickers) {
      return res.status(400).json({ error: 'Tickers parameter required' });
    }

    const tickerList = tickers.split(',').slice(0, 50); // Limit to 50 tickers
    const marketData = [];

    // Process tickers in batches to respect API limits
    for (const ticker of tickerList) {
      try {
        const stockData = await fetchStockData(ticker);
        if (stockData) {
          marketData.push(stockData);
        }
      } catch (error) {
        console.error(`Error fetching data for ${ticker}:`, error.message);
        // Continue with other tickers even if one fails
      }
      
      // Add small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      count: marketData.length,
      data: marketData
    });

  } catch (error) {
    console.error('Market data API error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch market data',
      message: error.message 
    });
  }
}

/**
 * Fetch comprehensive stock data for a single ticker
 */
async function fetchStockData(ticker) {
  try {
    // Combine data from multiple sources for comprehensive coverage
    const [quoteData, overviewData, earningsData] = await Promise.allSettled([
      fetchQuoteData(ticker),
      fetchCompanyOverview(ticker),
      fetchEarningsData(ticker)
    ]);

    // Extract data from settled promises
    const quote = quoteData.status === 'fulfilled' ? quoteData.value : {};
    const overview = overviewData.status === 'fulfilled' ? overviewData.value : {};
    const earnings = earningsData.status === 'fulfilled' ? earningsData.value : {};

    // Combine all data into our standard format
    return {
      ticker: ticker,
      name: overview.Name || `${ticker} Corporation`,
      close: parseFloat(quote.price || quote['05. price'] || 0),
      market_cap_basic: parseFloat(overview.MarketCapitalization || 0),
      volume: parseInt(quote.volume || quote['06. volume'] || 0),
      average_volume_10d_calc: parseFloat(overview.AvgVolume || quote.volume || 0),
      price_earnings_ttm: parseFloat(overview.PERatio || 0),
      return_on_equity: parseFloat(overview.ReturnOnEquityTTM || 0) * 100,
      debt_to_equity: parseFloat(overview.DebtToEquityRatio || 0),
      total_revenue_yoy_growth_ttm: parseFloat(overview.RevenueGrowthTTM || 0) * 100,
      earnings_per_share_diluted_yoy_growth_ttm: parseFloat(overview.EPSGrowthTTM || 0) * 100,
      beta_1_year: parseFloat(overview.Beta || 1.0),
      RSI: parseFloat(quote.RSI || 50), // Default to neutral if not available
      recommendation_mark: parseFloat(overview.AnalystRating || 3.0),
      price_target_1y: parseFloat(overview.AnalystTargetPrice || quote.price || 0),
      price_target_1y_delta: calculatePriceTargetDelta(
        parseFloat(quote.price || quote['05. price'] || 0),
        parseFloat(overview.AnalystTargetPrice || 0)
      ),
      last_updated: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Error processing data for ${ticker}:`, error);
    return null;
  }
}

/**
 * Fetch real-time quote data from Twelve Data
 */
async function fetchQuoteData(ticker) {
  if (!TWELVE_DATA_API_KEY) {
    throw new Error('Twelve Data API key not configured');
  }

  const url = `https://api.twelvedata.com/quote?symbol=${ticker}&apikey=${TWELVE_DATA_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status === 'error') {
    throw new Error(data.message);
  }

  return data;
}

/**
 * Fetch company overview from Alpha Vantage
 */
async function fetchCompanyOverview(ticker) {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error('Alpha Vantage API key not configured');
  }

  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.Note && data.Note.includes('API call frequency')) {
    throw new Error('API rate limit exceeded');
  }

  return data;
}

/**
 * Fetch earnings data from Alpha Vantage
 */
async function fetchEarningsData(ticker) {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error('Alpha Vantage API key not configured');
  }

  const url = `https://www.alphavantage.co/query?function=EARNINGS&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.Note && data.Note.includes('API call frequency')) {
    throw new Error('API rate limit exceeded');
  }

  return data;
}

/**
 * Calculate price target delta percentage
 */
function calculatePriceTargetDelta(currentPrice, targetPrice) {
  if (!currentPrice || !targetPrice) return 0;
  return ((targetPrice - currentPrice) / currentPrice) * 100;
}

/**
 * Get default tickers for screening
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

// Export for Vercel
module.exports = handler;
export default handler;
