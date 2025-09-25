/**
 * Main application JavaScript - UI interactions and data visualization
 */

class LEAPSScreenerApp {
    constructor() {
        this.screener = window.leapsScreener;
        this.currentResults = null;
        this.currentStrategy = 'all';
        this.charts = {};
        
        this.initializeEventListeners();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Run screening button
        document.getElementById('runScreening').addEventListener('click', () => {
            this.runScreening();
        });

        // Strategy selection
        document.querySelectorAll('input[name="strategy"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentStrategy = e.target.value;
                this.updateStrategySelection();
            });
        });

        // Data source selection
        document.querySelectorAll('input[name="dataSource"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateDataSourceSelection();
            });
        });

        // Export buttons
        document.getElementById('exportCSV').addEventListener('click', () => {
            this.exportResults('csv');
        });

        document.getElementById('exportJSON').addEventListener('click', () => {
            this.exportResults('json');
        });

        // Input validation
        this.setupInputValidation();
    }

    /**
     * Setup input validation for screening parameters
     */
    setupInputValidation() {
        const inputs = [
            'minMarketCap', 'minVolume', 'maxPE', 
            'minROE', 'minRevGrowth', 'minUpside'
        ];

        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', (e) => {
                    this.validateInput(e.target);
                });
            }
        });
    }

    /**
     * Validate individual input fields
     */
    validateInput(input) {
        const value = parseFloat(input.value);
        const min = parseFloat(input.min) || 0;
        const max = parseFloat(input.max) || Infinity;

        if (isNaN(value) || value < min || value > max) {
            input.classList.add('border-red-500');
            input.classList.remove('border-gray-300');
        } else {
            input.classList.remove('border-red-500');
            input.classList.add('border-gray-300');
        }
    }

    /**
     * Update strategy selection visual feedback
     */
    updateStrategySelection() {
        document.querySelectorAll('input[name="strategy"]').forEach(radio => {
            const label = radio.closest('label');
            if (radio.checked) {
                label.classList.add('strategy-selected');
            } else {
                label.classList.remove('strategy-selected');
            }
        });
    }

    /**
     * Update data source selection visual feedback
     */
    updateDataSourceSelection() {
        document.querySelectorAll('input[name="dataSource"]').forEach(radio => {
            const label = radio.closest('label');
            if (radio.checked) {
                label.classList.add('strategy-selected');
            } else {
                label.classList.remove('strategy-selected');
            }
        });
    }

    /**
     * Run the LEAPS screening with current parameters
     */
    async runScreening() {
        try {
            // Show loading state
            this.showLoadingState();
            this.hideError();

            // Collect screening criteria
            const criteria = this.collectScreeningCriteria();
            
            // Get data source preference
            const dataSource = document.querySelector('input[name="dataSource"]:checked')?.value || 'mock';

            // Validate inputs
            console.log('Collected criteria:', criteria);
            const isValid = this.validateCriteria(criteria);
            console.log('Validation result:', isValid);
            
            if (!isValid) {
                console.error('Validation failed for criteria:', criteria);
                throw new Error('Please check your input parameters and try again.');
            }

            // Run screening via API
            console.log('Calling API with criteria:', criteria, 'dataSource:', dataSource);
            const results = await this.runScreeningAPI(criteria, dataSource);
            console.log('API results received:', results);
            this.currentResults = results;

            // Display results
            this.displayResults(results);
            this.hideLoadingState();

        } catch (error) {
            this.hideLoadingState();
            this.showError(error.message);
            console.error('Screening error:', error);
        }
    }

    /**
     * Run screening via API endpoint
     */
    async runScreeningAPI(criteria, dataSource) {
        try {
            const response = await fetch('/api/screener', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    criteria: criteria,
                    useLiveData: dataSource === 'live'
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'API returned an error');
            }

            // Transform API response to match expected format
            return {
                allCandidates: result.results,
                strategies: result.strategyResults,
                finalResults: result.results,
                totalCount: result.totalResults,
                strategyCounts: result.strategies,
                dataSource: result.dataSource
            };

        } catch (error) {
            console.error('API Error:', error);
            
            // Fallback to client-side screening if API fails
            console.log('Falling back to client-side screening...');
            return await this.screener.runLeapsScreener(criteria);
        }
    }

    /**
     * Collect screening criteria from form inputs
     */
    collectScreeningCriteria() {
        return {
            minMarketCap: parseFloat(document.getElementById('minMarketCap').value) || 1,
            minVolume: parseFloat(document.getElementById('minVolume').value) || 1,
            maxPE: parseFloat(document.getElementById('maxPE').value) || 50,
            minROE: parseFloat(document.getElementById('minROE').value) || 10,
            minRevGrowth: parseFloat(document.getElementById('minRevGrowth').value) || 5,
            minUpside: parseFloat(document.getElementById('minUpside').value) || 5,
            strategy: this.currentStrategy
        };
    }

    /**
     * Validate screening criteria
     */
    validateCriteria(criteria) {
        return (
            criteria.minMarketCap >= 0 &&
            criteria.minVolume >= 0 &&
            criteria.maxPE > 0 &&
            criteria.minROE >= -100 &&  // Allow negative ROE
            criteria.minRevGrowth >= -100 &&  // Allow negative revenue growth
            criteria.minUpside >= -100  // Allow negative upside
        );
    }

    /**
     * Display screening results
     */
    displayResults(results) {
        this.createSummaryCards(results);
        this.createStrategyChart(results);
        this.createResultsTable(results.finalResults);
        this.updateDataSourceIndicator(results.dataSource);
        
        // Show results section
        document.getElementById('resultsSection').classList.remove('hidden');
        
        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    /**
     * Update data source indicator in results
     */
    updateDataSourceIndicator(dataSource) {
        // Find the results table header and add data source indicator
        const resultsTable = document.querySelector('#resultsSection .bg-white.rounded-lg.shadow-md .px-6.py-4.border-b');
        if (resultsTable) {
            // Remove existing indicator
            const existingIndicator = resultsTable.querySelector('.data-source-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            // Add new indicator
            const indicator = document.createElement('span');
            indicator.className = 'data-source-indicator text-sm font-medium ml-4';
            
            if (dataSource === 'live') {
                indicator.innerHTML = '<span class="text-green-600"><i class="fas fa-broadcast-tower mr-1"></i>Live Data</span>';
            } else {
                indicator.innerHTML = '<span class="text-blue-600"><i class="fas fa-flask mr-1"></i>Demo Data</span>';
            }
            
            resultsTable.querySelector('h3').appendChild(indicator);
        }
    }

    /**
     * Create summary cards with key metrics
     */
    createSummaryCards(results) {
        const container = document.getElementById('summaryCards');
        container.innerHTML = '';

        const cards = [
            {
                title: 'Total Candidates',
                value: results.strategyCounts.all,
                icon: 'fas fa-list',
                color: 'blue'
            },
            {
                title: 'Stock Replacement',
                value: results.strategyCounts.stock_replacement,
                icon: 'fas fa-exchange-alt',
                color: 'green'
            },
            {
                title: 'PMCC Candidates',
                value: results.strategyCounts.pmcc,
                icon: 'fas fa-coins',
                color: 'yellow'
            },
            {
                title: 'Growth LEAPS',
                value: results.strategyCounts.growth,
                icon: 'fas fa-rocket',
                color: 'purple'
            }
        ];

        cards.forEach(card => {
            const cardElement = this.createSummaryCard(card);
            container.appendChild(cardElement);
        });
    }

    /**
     * Create individual summary card element
     */
    createSummaryCard({ title, value, icon, color }) {
        const colorClasses = {
            blue: 'border-blue-500 text-blue-600',
            green: 'border-green-500 text-green-600',
            yellow: 'border-yellow-500 text-yellow-600',
            purple: 'border-purple-500 text-purple-600'
        };

        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md p-6 summary-card border-l-4 ' + colorClasses[color];
        
        card.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <i class="${icon} text-2xl"></i>
                </div>
                <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600">${title}</p>
                    <p class="text-3xl font-bold text-gray-900">${value}</p>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Create strategy distribution chart
     */
    createStrategyChart(results) {
        const ctx = document.getElementById('strategyChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.strategy) {
            this.charts.strategy.destroy();
        }

        const data = {
            labels: ['Stock Replacement', 'PMCC', 'Growth LEAPS', 'Value LEAPS'],
            datasets: [{
                data: [
                    results.strategyCounts.stock_replacement,
                    results.strategyCounts.pmcc,
                    results.strategyCounts.growth,
                    results.strategyCounts.value
                ],
                backgroundColor: [
                    '#10B981', // Green
                    '#F59E0B', // Yellow
                    '#8B5CF6', // Purple
                    '#EF4444'  // Red
                ],
                borderColor: [
                    '#059669',
                    '#D97706',
                    '#7C3AED',
                    '#DC2626'
                ],
                borderWidth: 2
            }]
        };

        this.charts.strategy = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create results table
     */
    createResultsTable(data) {
        const table = document.getElementById('resultsTable');
        const thead = table.querySelector('thead');
        const tbody = document.getElementById('resultsTableBody');

        // Clear existing content
        thead.innerHTML = '';
        tbody.innerHTML = '';

        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="100%" class="text-center py-8 text-gray-500">
                        No results found matching your criteria. Try adjusting the filters.
                    </td>
                </tr>
            `;
            return;
        }

        // Create table headers
        const headers = [
            'Ticker', 'Company', 'Price', 'Market Cap', 'P/E', 'ROE (%)', 
            'Beta', 'Revenue Growth (%)', 'Upside (%)', 'Volume'
        ];

        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.className = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Create table rows
        data.forEach((stock, index) => {
            const row = this.createTableRow(stock, index);
            tbody.appendChild(row);
        });
    }

    /**
     * Create individual table row
     */
    createTableRow(stock, index) {
        const row = document.createElement('tr');
        row.className = 'table-row-hover';

        const cells = [
            // Ticker
            `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                <a href="https://finance.yahoo.com/quote/${stock.ticker}" target="_blank" class="hover:underline">
                    ${stock.ticker}
                </a>
            </td>`,
            
            // Company
            `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate" title="${stock.name}">
                ${stock.name}
            </td>`,
            
            // Price
            `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${this.screener.formatCurrency(stock.close)}
            </td>`,
            
            // Market Cap
            `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${this.screener.formatLargeNumber(stock.market_cap_basic)}
            </td>`,
            
            // P/E Ratio
            `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${stock.price_earnings_ttm.toFixed(2)}
            </td>`,
            
            // ROE
            `<td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="metric-badge ${stock.return_on_equity >= 15 ? 'metric-positive' : stock.return_on_equity >= 10 ? 'metric-neutral' : 'metric-negative'}">
                    ${stock.return_on_equity.toFixed(1)}%
                </span>
            </td>`,
            
            // Beta
            `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${stock.beta_1_year.toFixed(2)}
            </td>`,
            
            // Revenue Growth
            `<td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="metric-badge ${stock.total_revenue_yoy_growth_ttm >= 10 ? 'metric-positive' : stock.total_revenue_yoy_growth_ttm >= 0 ? 'metric-neutral' : 'metric-negative'}">
                    ${this.screener.formatPercentage(stock.total_revenue_yoy_growth_ttm)}
                </span>
            </td>`,
            
            // Upside Potential
            `<td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="metric-badge ${stock.price_target_1y_delta >= 15 ? 'metric-positive' : stock.price_target_1y_delta >= 5 ? 'metric-neutral' : 'metric-negative'}">
                    ${this.screener.formatPercentage(stock.price_target_1y_delta)}
                </span>
            </td>`,
            
            // Volume
            `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${this.screener.formatLargeNumber(stock.volume)}
            </td>`
        ];

        row.innerHTML = cells.join('');
        return row;
    }

    /**
     * Export results in specified format
     */
    exportResults(format) {
        if (!this.currentResults || !this.currentResults.finalResults) {
            alert('No results to export. Please run a screening first.');
            return;
        }

        const data = this.currentResults.finalResults;
        const strategyName = this.currentStrategy === 'all' ? 'all_strategies' : this.currentStrategy;
        const filename = `leaps_${strategyName}_screening`;

        if (format === 'csv') {
            this.screener.exportToCSV(data, filename);
        } else if (format === 'json') {
            this.screener.exportToJSON(data, filename);
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const button = document.getElementById('runScreening');
        const loading = document.getElementById('loadingIndicator');
        
        button.disabled = true;
        button.classList.add('btn-loading');
        button.textContent = '';
        
        loading.classList.remove('hidden');
        document.getElementById('resultsSection').classList.add('hidden');
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const button = document.getElementById('runScreening');
        const loading = document.getElementById('loadingIndicator');
        
        button.disabled = false;
        button.classList.remove('btn-loading');
        button.innerHTML = '<i class="fas fa-search mr-2"></i>Run LEAPS Screening';
        
        loading.classList.add('hidden');
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideError();
        }, 10000);
    }

    /**
     * Hide error message
     */
    hideError() {
        document.getElementById('errorMessage').classList.add('hidden');
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.leapsApp = new LEAPSScreenerApp();
});
