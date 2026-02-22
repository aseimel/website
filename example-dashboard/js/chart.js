/**
 * Chart module for the German Democracy Monitor demo.
 * Wraps Chart.js to render a score line with confidence interval band.
 */
window.DashboardChart = {
    chart: null,
    onPointClick: null,

    /**
     * Render or re-render the chart for a given MP.
     * @param {Object} mpData - MP object from MP_DATA.mps
     * @param {string} timeRange - "all" or a number string like "36", "12", "6"
     */
    render(mpData, timeRange) {
        var scores = this._filterByRange(mpData.scores, timeRange);
        var labels = scores.map(function(s) { return DashboardChart._formatMonth(s.month); });

        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        var ctx = document.getElementById('score-chart').getContext('2d');

        // Three datasets: lower bound, upper bound, main line
        // Dataset 0 (lower) fills to dataset 1 (upper) = confidence band
        // Dataset 2 (main line) renders on top
        var datasets = [
            {
                label: '_lower',
                data: scores.map(function(s) { return s.lower; }),
                borderColor: 'transparent',
                backgroundColor: 'rgba(20, 33, 61, 0.10)',
                pointRadius: 0,
                pointHitRadius: 0,
                fill: '+1',
                tension: 0.3,
                order: 2
            },
            {
                label: '_upper',
                data: scores.map(function(s) { return s.upper; }),
                borderColor: 'transparent',
                backgroundColor: 'transparent',
                pointRadius: 0,
                pointHitRadius: 0,
                fill: false,
                tension: 0.3,
                order: 1
            },
            {
                label: 'Illiberal Discourse Score',
                data: scores.map(function(s) { return s.score; }),
                borderColor: '#14213d',
                borderWidth: 2.5,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: '#14213d',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                fill: false,
                tension: 0.3,
                order: 0
            }
        ];

        var self = this;

        var options = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    filter: function(item) {
                        return item.datasetIndex === 2;
                    },
                    callbacks: {
                        title: function(items) {
                            return items[0].label;
                        },
                        label: function(item) {
                            var idx = item.dataIndex;
                            var s = scores[idx];
                            return 'Score: ' + s.score.toFixed(2) + '  [' + s.lower.toFixed(2) + ' \u2013 ' + s.upper.toFixed(2) + ']';
                        },
                        footer: function() {
                            return 'Klicken zum Filtern';
                        }
                    },
                    backgroundColor: '#14213d',
                    titleFont: { family: "'Source Sans 3', sans-serif", weight: '600', size: 13 },
                    bodyFont: { family: "'Source Sans 3', sans-serif", size: 13 },
                    padding: 12,
                    cornerRadius: 3,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: "'Source Sans 3', sans-serif", size: 12 },
                        color: '#32373c',
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 12
                    }
                },
                y: {
                    min: 0,
                    max: 1,
                    grid: { color: '#f0f0f0' },
                    ticks: {
                        font: { family: "'Source Sans 3', sans-serif", size: 12 },
                        color: '#32373c',
                        stepSize: 0.2,
                        callback: function(v) { return v.toFixed(1); }
                    },
                    title: {
                        display: true,
                        text: 'Illiberaler Diskurs-Score',
                        font: { family: "'Source Sans 3', sans-serif", size: 13, weight: '600' },
                        color: '#32373c'
                    }
                }
            },
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    // Find the element from the main line dataset (index 2)
                    var mainEl = elements.find(function(el) { return el.datasetIndex === 2; });
                    if (mainEl && self.onPointClick) {
                        var idx = mainEl.index;
                        self.onPointClick(scores[idx].month);
                    }
                }
            }
        };

        this.chart = new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: datasets },
            options: options
        });
    },

    /**
     * Filter scores to the last N months, or return all.
     */
    _filterByRange: function(scores, range) {
        if (range === 'all') return scores;
        var n = parseInt(range, 10);
        if (isNaN(n) || n >= scores.length) return scores;
        return scores.slice(-n);
    },

    /**
     * Format "YYYY-MM" to "Jan 2022" style label.
     */
    _formatMonth: function(monthStr) {
        var parts = monthStr.split('-');
        var monthNames = ['Jan','Feb','M\u00e4r','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
        return monthNames[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
    },

    /**
     * Destroy current chart instance.
     */
    destroy: function() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
};
