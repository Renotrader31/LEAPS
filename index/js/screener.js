/**
 * LEAPS Opportunity Screener - Core JavaScript Implementation
 * Converts Python screening logic to client-side functionality
 */

class LEAPSScreener {
    constructor() {
        this.mockData = this.generateMockData();
        this.screeningCriteria = {};
        this.lastResults = null;
    }

    /**
     * Generate mock market data that simulates the screening results
     * In production, this would be replaced with actual market data API calls
     */
    generateMockData() {
        const tickers = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX', 'AMD', 'CRM',
            'ADBE', 'PYPL', 'INTC', 'CSCO', 'ORCL', 'IBM', 'UBER', 'SNOW', 'ZM', 'DOCU',
            'SHOP', 'SQ', 'ROKU', 'TWLO', 'OKTA', 'CRWD', 'ZS', 'DDOG', 'NET', 'FSLY',
            'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'V', 'MA', 'COST',
            'WMT', 'HD', 'LOW', 'TGT', 'SBUX', 'MCD', 'NKE', 'DIS', 'BA', 'CAT'
        ];

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
            close: this.randomBetween(50, 500),
            market_cap_basic: this.randomBetween(10e9, 3000e9), // 10B to 3T
            volume: this.randomBetween(500000, 50000000),
            average_volume_10d_calc: this.randomBetween(400000, 45000000),
            price_earnings_ttm: this.randomBetween(8, 80),
            return_on_equity: this.randomBetween(-5, 40),
            debt_to_equity: this.randomBetween(0, 3),
            total_revenue_yoy_growth_ttm: this.randomBetween(-10, 50),
            earnings_per_share_diluted_yoy_growth_ttm: this.randomBetween(-20, 80),
            beta_1_year: this.randomBetween(0.3, 3.0),
            RSI: this.randomBetween(20, 80),
            recommendation_mark: this.randomBetween(1, 5),
            price_target_1y: null, // Will be calculated
            price_target_1y_delta: this.randomBetween(-5, 40)
        })).map(stock => {
            // Calculate price target based on current price and delta
            stock.price_target_1y = stock.close * (1 + stock.price_target_1y_delta / 100);
            return stock;
        });
    }

    /**
     * Generate random number between min and max with specified decimal places
     */
    randomBetween(min, max, decimals = 2) {
        const value = Math.random() * (max - min) + min;
        return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }

    /**
     * Run the main LEAPS screening with specified criteria
     */
    async runLeapsScreener(criteria = {}) {
        try {
            this.screeningCriteria = {
                minMarketCap: criteria.minMarketCap || 5,
                minVolume: criteria.minVolume || 1,
                maxPE: criteria.maxPE || 50,
                minROE: criteria.minROE || 10,
                minRevGrowth: criteria.minRevGrowth || 5,
                minUpside: criteria.minUpside || 5,
                strategy: criteria.strategy || 'all'
            };

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Apply base filters
            let filteredData = this.mockData.filter(stock => {
                const marketCapB = stock.market_cap_basic / 1e9;
                const volumeM = stock.volume / 1e6;
                
                return (
                    marketCapB >= this.screeningCriteria.minMarketCap &&
                    volumeM >= this.screeningCriteria.minVolume &&
                    stock.price_earnings_ttm > 0 &&
                    stock.price_earnings_ttm <= this.screeningCriteria.maxPE &&
                    stock.return_on_equity >= this.screeningCriteria.minROE &&
                    stock.debt_to_equity <= 3.0 &&  // Made less restrictive
                    stock.total_revenue_yoy_growth_ttm >= this.screeningCriteria.minRevGrowth &&
                    stock.earnings_per_share_diluted_yoy_growth_ttm >= -10 &&  // Made less restrictive
                    stock.RSI >= 20 &&  // Made less restrictive
                    stock.RSI <= 80 &&  // Made less restrictive
                    stock.beta_1_year >= 0.3 &&  // Made less restrictive
                    stock.beta_1_year <= 3.0 &&  // Made less restrictive
                    stock.recommendation_mark <= 3.5 &&  // Made less restrictive
                    stock.price_target_1y_delta >= this.screeningCriteria.minUpside
                );
            });

            console.log(`Client-side filtering: ${filteredData.length} stocks from ${this.mockData.length} total`);

            // Calculate additional metrics
            filteredData = filteredData.map(stock => ({
                ...stock,
                market_cap_billions: stock.market_cap_basic / 1e9,
                volume_ratio: stock.volume / stock.average_volume_10d_calc,
                analyst_score: 6 - stock.recommendation_mark
            }));

            // Sort by market cap descending
            filteredData.sort((a, b) => b.market_cap_basic - a.market_cap_basic);

            // Apply strategy-specific filters
            const strategies = this.filterByStrategy(filteredData);

            // Return results based on selected strategy
            let finalResults;
            if (this.screeningCriteria.strategy === 'all') {
                finalResults = filteredData.slice(0, 50);
            } else {
                finalResults = strategies[this.screeningCriteria.strategy] || [];
            }

            this.lastResults = {
                allCandidates: filteredData,
                strategies: strategies,
                finalResults: finalResults,
                totalCount: filteredData.length,
                strategyCounts: {
                    all: filteredData.length,
                    stock_replacement: strategies.stock_replacement?.length || 0,
                    pmcc: strategies.pmcc?.length || 0,
                    growth: strategies.growth?.length || 0,
                    value: strategies.value?.length || 0
                }
            };

            return this.lastResults;

        } catch (error) {
            console.error('Error running LEAPS screener:', error);
            throw new Error('Failed to run screening analysis. Please try again.');
        }
    }

    /**
     * Apply strategy-specific filters to the data
     */
    filterByStrategy(data) {
        const strategies = {};

        // Strategy 1: Stock Replacement LEAPS (Deep ITM calls)
        strategies.stock_replacement = data.filter(stock => 
            stock.price_earnings_ttm <= 30 &&
            stock.beta_1_year <= 1.5 &&
            stock.return_on_equity >= 15 &&
            stock.market_cap_billions >= 50
        );

        // Strategy 2: Poor Man's Covered Call Candidates
        strategies.pmcc = data.filter(stock =>
            stock.close >= 100 &&
            stock.beta_1_year >= 0.8 &&
            stock.beta_1_year <= 2.0 &&
            stock.volume >= 2000000 &&
            stock.price_target_1y_delta >= 10
        );

        // Strategy 3: Growth LEAPS (High growth potential)
        strategies.growth = data.filter(stock =>
            stock.total_revenue_yoy_growth_ttm >= 15 &&
            stock.earnings_per_share_diluted_yoy_growth_ttm >= 10 &&
            stock.price_target_1y_delta >= 20 &&
            stock.return_on_equity >= 20
        );

        // Strategy 4: Value LEAPS (Undervalued with catalyst potential)
        strategies.value = data.filter(stock =>
            stock.price_earnings_ttm <= 20 &&
            stock.return_on_equity >= 12 &&
            stock.debt_to_equity <= 1.0 &&
            stock.price_target_1y_delta >= 15 &&
            stock.RSI <= 50
        );

        return strategies;
    }

    /**
     * Get top picks for a specific strategy
     */
    getTopPicks(strategyName, count = 10) {
        if (!this.lastResults) return [];
        
        if (strategyName === 'all') {
            return this.lastResults.allCandidates.slice(0, count);
        }
        
        const strategyData = this.lastResults.strategies[strategyName];
        return strategyData ? strategyData.slice(0, count) : [];
    }

    /**
     * Export results to CSV format
     */
    exportToCSV(data, filename = 'leaps_screening_results') {
        if (!data || data.length === 0) return;

        const headers = [
            'Ticker', 'Company', 'Price', 'Market Cap (B)', 'Volume', 'P/E Ratio',
            'ROE (%)', 'Debt/Equity', 'Revenue Growth (%)', 'EPS Growth (%)',
            'Beta', 'RSI', 'Analyst Rating', 'Price Target', 'Upside (%)'
        ];

        const csvContent = [
            headers.join(','),
            ...data.map(stock => [
                stock.ticker,
                `"${stock.name}"`,
                stock.close.toFixed(2),
                stock.market_cap_billions.toFixed(2),
                stock.volume.toLocaleString(),
                stock.price_earnings_ttm.toFixed(2),
                stock.return_on_equity.toFixed(2),
                stock.debt_to_equity.toFixed(2),
                stock.total_revenue_yoy_growth_ttm.toFixed(2),
                stock.earnings_per_share_diluted_yoy_growth_ttm.toFixed(2),
                stock.beta_1_year.toFixed(2),
                stock.RSI.toFixed(2),
                stock.recommendation_mark.toFixed(2),
                stock.price_target_1y.toFixed(2),
                stock.price_target_1y_delta.toFixed(2)
            ].join(','))
        ].join('\n');

        this.downloadFile(csvContent, `${filename}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    }

    /**
     * Export results to JSON format
     */
    exportToJSON(data, filename = 'leaps_screening_results') {
        if (!data || data.length === 0) return;

        const jsonContent = JSON.stringify({
            generatedAt: new Date().toISOString(),
            screeningCriteria: this.screeningCriteria,
            totalResults: data.length,
            results: data
        }, null, 2);

        this.downloadFile(jsonContent, `${filename}_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    }

    /**
     * Download file helper
     */
    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Get strategy description
     */
    getStrategyDescription(strategy) {
        const descriptions = {
            stock_replacement: 'Deep ITM LEAPS calls as stock substitutes for capital efficiency',
            pmcc: 'Poor Man\'s Covered Call - buy LEAPS, sell shorter-term calls',
            growth: 'Long-term growth plays with high potential returns',
            value: 'Undervalued stocks with turnaround catalyst potential'
        };
        return descriptions[strategy] || 'All qualifying LEAPS candidates';
    }

    /**
     * Format currency values
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    }

    /**
     * Format percentage values
     */
    formatPercentage(value) {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }

    /**
     * Format large numbers (market cap, volume)
     */
    formatLargeNumber(value) {
        if (value >= 1e9) {
            return `${(value / 1e9).toFixed(1)}B`;
        } else if (value >= 1e6) {
            return `${(value / 1e6).toFixed(1)}M`;
        } else if (value >= 1e3) {
            return `${(value / 1e3).toFixed(1)}K`;
        }
        return value.toLocaleString();
    }
}

// Create global instance
window.leapsScreener = new LEAPSScreener();
