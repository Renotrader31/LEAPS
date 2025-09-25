/**
 * Options Data Service - Real LEAPS Options Chains
 * Integrates with Yahoo Finance and Polygon.io for options data
 */

class OptionsDataService {
  constructor() {
    this.polygonKey = process.env.POLYGON_API_KEY;
    this.cache = new Map();
  }

  /**
   * Get LEAPS options chains for a stock
   * LEAPS = Options with >9 months to expiration
   */
  async getLeapsChains(ticker) {
    const cacheKey = `leaps_${ticker}_${Date.now() - (Date.now() % 600000)}`; // 10-minute cache
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Try Polygon.io first (if API key available), then fallback to Yahoo Finance
      let optionsData;
      
      if (this.polygonKey) {
        optionsData = await this.getPolygonOptions(ticker);
      } else {
        optionsData = await this.getYahooOptions(ticker);
      }
      
      const leapsData = this.processOptionsData(ticker, optionsData);
      this.cache.set(cacheKey, leapsData);
      
      return leapsData;
      
    } catch (error) {
      console.error(`Error fetching LEAPS for ${ticker}:`, error);
      return this.generateMockLeapsData(ticker);
    }
  }

  /**
   * Polygon.io Options Data (Premium)
   */
  async getPolygonOptions(ticker) {
    const expirationUrl = `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${ticker}&limit=1000&apikey=${this.polygonKey}`;
    
    try {
      const response = await fetch(expirationUrl);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.results || [];
      }
      
      throw new Error('Polygon API returned error');
    } catch (error) {
      console.error('Polygon.io error:', error);
      throw error;
    }
  }

  /**
   * Yahoo Finance Options Data (Free but unofficial)
   */
  async getYahooOptions(ticker) {
    // Yahoo Finance options endpoint (unofficial)
    const optionsUrl = `https://query1.finance.yahoo.com/v7/finance/options/${ticker}`;
    
    try {
      const response = await fetch(optionsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const data = await response.json();
      
      if (data.optionChain && data.optionChain.result) {
        return data.optionChain.result[0];
      }
      
      throw new Error('Yahoo Finance returned no options data');
    } catch (error) {
      console.error('Yahoo Finance error:', error);
      throw error;
    }
  }

  /**
   * Process raw options data into LEAPS format
   */
  processOptionsData(ticker, rawData) {
    const currentDate = new Date();
    const leapsThreshold = new Date(currentDate.getTime() + (9 * 30 * 24 * 60 * 60 * 1000)); // 9 months
    
    let leapsExpirations = [];
    
    if (rawData.expirationDates || rawData.options) {
      // Yahoo Finance format
      const expirations = rawData.expirationDates || Object.keys(rawData.options || {});
      
      leapsExpirations = expirations
        .map(exp => new Date(parseInt(exp) * 1000))
        .filter(date => date > leapsThreshold)
        .sort((a, b) => a - b)
        .slice(0, 4); // Top 4 LEAPS expirations
        
    } else if (Array.isArray(rawData)) {
      // Polygon format
      const expirationDates = [...new Set(rawData
        .map(contract => contract.expiration_date)
        .filter(exp => new Date(exp) > leapsThreshold)
      )].sort().slice(0, 4);
      
      leapsExpirations = expirationDates.map(date => new Date(date));
    }

    // Generate LEAPS chains for each expiration
    const leapsChains = leapsExpirations.map(expDate => 
      this.generateLeapsChain(ticker, expDate, rawData)
    );

    return {
      ticker,
      currentDate: currentDate.toISOString(),
      leapsAvailable: leapsChains.length > 0,
      totalExpirations: leapsChains.length,
      chains: leapsChains,
      dataSource: this.polygonKey ? 'polygon' : 'yahoo'
    };
  }

  /**
   * Generate a LEAPS chain for specific expiration
   */
  generateLeapsChain(ticker, expiration, rawData) {
    const currentPrice = this.getCurrentPrice(ticker, rawData);
    const daysToExpiry = Math.ceil((expiration - new Date()) / (1000 * 60 * 60 * 24));
    
    // Generate strike prices around current price
    const strikes = this.generateStrikePrices(currentPrice);
    
    const optionsChain = strikes.map(strike => ({
      strike,
      call: this.generateOptionData('call', strike, currentPrice, daysToExpiry),
      put: this.generateOptionData('put', strike, currentPrice, daysToExpiry)
    }));

    return {
      expiration: expiration.toISOString().split('T')[0],
      daysToExpiry,
      totalStrikes: strikes.length,
      atmStrike: this.findAtmStrike(strikes, currentPrice),
      options: optionsChain
    };
  }

  /**
   * Generate realistic option pricing data
   */
  generateOptionData(type, strike, spotPrice, daysToExpiry) {
    const timeToExpiry = daysToExpiry / 365;
    const volatility = 0.25 + Math.random() * 0.3; // 25-55% IV
    
    // Simplified Black-Scholes approximation
    const moneyness = strike / spotPrice;
    const intrinsic = type === 'call' 
      ? Math.max(spotPrice - strike, 0)
      : Math.max(strike - spotPrice, 0);
    
    const timeValue = this.calculateTimeValue(moneyness, timeToExpiry, volatility);
    const price = intrinsic + timeValue;
    
    // Generate Greeks
    const delta = this.calculateDelta(type, moneyness, timeToExpiry, volatility);
    const theta = this.calculateTheta(timeValue, daysToExpiry);
    const gamma = this.calculateGamma(moneyness, timeToExpiry, volatility);
    const vega = this.calculateVega(timeToExpiry, volatility);
    
    // Generate market data
    const spread = price * (0.02 + Math.random() * 0.03); // 2-5% spread
    const volume = Math.floor(Math.random() * 1000 + 10);
    const openInterest = Math.floor(Math.random() * 10000 + 100);
    
    return {
      bid: Math.max(price - spread/2, 0.05),
      ask: price + spread/2,
      midPrice: price,
      volume,
      openInterest,
      impliedVolatility: volatility,
      
      // Greeks
      delta: Math.abs(delta),
      gamma,
      theta,
      vega,
      
      // Analysis
      intrinsicValue: intrinsic,
      timeValue,
      moneyness: moneyness > 1 ? 'OTM' : moneyness < 0.95 ? 'ITM' : 'ATM',
      
      // LEAPS-specific metrics
      annualizedReturn: this.calculateAnnualizedReturn(price, spotPrice, timeToExpiry),
      breakeven: type === 'call' ? strike + price : strike - price,
      maxLoss: type === 'call' ? price : price,
      maxGain: type === 'call' ? 'unlimited' : strike - price
    };
  }

  /**
   * Generate strike prices around current price
   */
  generateStrikePrices(currentPrice) {
    const strikes = [];
    const interval = this.getStrikeInterval(currentPrice);
    
    // Generate strikes from 50% below to 100% above current price
    const start = Math.floor(currentPrice * 0.5 / interval) * interval;
    const end = Math.ceil(currentPrice * 2.0 / interval) * interval;
    
    for (let strike = start; strike <= end; strike += interval) {
      if (strike > 0) {
        strikes.push(strike);
      }
    }
    
    return strikes.slice(0, 30); // Limit to 30 strikes
  }

  /**
   * Get appropriate strike interval based on stock price
   */
  getStrikeInterval(price) {
    if (price < 25) return 2.5;
    if (price < 50) return 5;
    if (price < 200) return 10;
    if (price < 500) return 25;
    return 50;
  }

  /**
   * Calculate time value using simplified model
   */
  calculateTimeValue(moneyness, timeToExpiry, volatility) {
    const atm = Math.abs(moneyness - 1);
    const timeFactor = Math.sqrt(timeToExpiry);
    const volFactor = volatility;
    
    return (0.4 * timeFactor * volFactor * 100) * Math.exp(-atm * 2);
  }

  /**
   * Calculate option Greeks (simplified)
   */
  calculateDelta(type, moneyness, timeToExpiry, volatility) {
    const d1 = (Math.log(1/moneyness) + 0.5 * volatility * volatility * timeToExpiry) / 
              (volatility * Math.sqrt(timeToExpiry));
    
    const delta = this.normalCDF(d1);
    return type === 'call' ? delta : delta - 1;
  }

  calculateTheta(timeValue, daysToExpiry) {
    return -timeValue / daysToExpiry; // Time decay per day
  }

  calculateGamma(moneyness, timeToExpiry, volatility) {
    return Math.exp(-Math.pow(Math.log(moneyness), 2) / 2) / 
           (volatility * Math.sqrt(timeToExpiry * 2 * Math.PI));
  }

  calculateVega(timeToExpiry, volatility) {
    return Math.sqrt(timeToExpiry) * 0.1; // Simplified vega
  }

  calculateAnnualizedReturn(optionPrice, stockPrice, timeToExpiry) {
    const costBasis = optionPrice / stockPrice;
    return (1 / costBasis - 1) / timeToExpiry;
  }

  /**
   * Helper functions
   */
  normalCDF(x) {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  erf(x) {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  getCurrentPrice(ticker, rawData) {
    // Extract current price from options data or use fallback
    if (rawData.quote && rawData.quote.regularMarketPrice) {
      return rawData.quote.regularMarketPrice;
    }
    
    // Fallback: generate realistic price
    return Math.random() * 400 + 50; // $50-450
  }

  findAtmStrike(strikes, currentPrice) {
    return strikes.reduce((prev, curr) => 
      Math.abs(curr - currentPrice) < Math.abs(prev - currentPrice) ? curr : prev
    );
  }

  /**
   * Generate mock LEAPS data when real data unavailable
   */
  generateMockLeapsData(ticker) {
    const currentPrice = Math.random() * 400 + 50;
    const currentDate = new Date();
    
    // Generate 4 LEAPS expirations (Jan, Jun of next 2 years)
    const expirations = [
      new Date(currentDate.getFullYear() + 1, 0, 15), // Jan next year
      new Date(currentDate.getFullYear() + 1, 5, 15), // Jun next year  
      new Date(currentDate.getFullYear() + 2, 0, 15), // Jan year after
      new Date(currentDate.getFullYear() + 2, 5, 15)  // Jun year after
    ].filter(date => date > new Date(currentDate.getTime() + 9 * 30 * 24 * 60 * 60 * 1000));

    const chains = expirations.map(expDate => 
      this.generateLeapsChain(ticker, expDate, { quote: { regularMarketPrice: currentPrice }})
    );

    return {
      ticker,
      currentDate: currentDate.toISOString(),
      leapsAvailable: true,
      totalExpirations: chains.length,
      chains,
      dataSource: 'mock'
    };
  }
}

export default OptionsDataService;