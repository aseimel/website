(function() {
  'use strict';

  var DATA_URL = 'party_contestation.csv';
  var DEFAULT_PARTY_IDS = ['1976', '383'];
  var Y_MAX = 0.9;

  var GROUP_ORDER = [
    'Eurosceptic Right',
    'Social Democrats',
    'Conservatives',
    'Green Parties',
    'Historic Early Contesters'
  ];

  var PARTY_ORDER = {
    'Eurosceptic Right': ['AfD', 'FN/RN', 'FPÖ', 'Fidesz', 'Lega'],
    'Social Democrats': ['SPD', 'PS', 'PD', 'PSOE', 'SD'],
    'Conservatives': ['CDU/CSU', 'Les Républicains', 'Conservatives', 'PP', 'Néa Dimokratía'],
    'Green Parties': ['Grüne', 'Miljöpartiet', 'Vihreät', 'GroenLinks', 'Green Party IE'],
    'Historic Early Contesters': ['Gaullists', 'PCI', 'Volksunie', 'Retsforbundet', 'ARP']
  };

  var DISPLAY_NAMES = {
    'FPÖ': 'Freedom Party (Austria)',
    'AfD': 'Alternative for Germany (Germany)',
    'FN/RN': 'National Rally (France)',
    'Fidesz': 'Fidesz (Hungary)',
    'Lega': 'League (Italy)',
    'SPD': 'Social Democrats (Germany)',
    'PSOE': 'Socialist Party (Spain)',
    'PD': 'Democratic Party (Italy)',
    'PS': 'Socialist Party (France)',
    'SD': 'Social Democrats (Sweden)',
    'CDU/CSU': 'Christian Democrats (Germany)',
    'Conservatives': 'Conservative Party (UK)',
    'Les Républicains': 'The Republicans (France)',
    'PP': "People's Party (Spain)",
    'Néa Dimokratía': 'New Democracy (Greece)',
    'Grüne': 'Greens (Germany)',
    'Miljöpartiet': 'Green Party (Sweden)',
    'Vihreät': 'Greens (Finland)',
    'GroenLinks': 'GreenLeft (Netherlands)',
    'Green Party IE': 'Green Party (Ireland)',
    'Gaullists': 'Gaullists UNR/RPR (France)',
    'PCI': 'Communist Party (Italy)',
    'Volksunie': 'Volksunie (Belgium)',
    'Retsforbundet': 'Justice Party (Denmark)',
    'ARP': 'ARP (Netherlands)'
  };

  var state = {
    parties: [],
    partySearch: new Map(),
    partyMap: new Map(),
    selectedIds: [],
    groupFilter: 'all',
    chart: null
  };

  var el = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    el.partySearch = document.getElementById('party-search');
    el.partyOptions = document.getElementById('party-options');
    el.addParty = document.getElementById('add-party');
    el.groupFilter = document.getElementById('group-filter');
    el.clearParties = document.getElementById('clear-parties');
    el.partyChips = document.getElementById('party-chips');
    el.loading = document.getElementById('loading-message');

    wireEvents();
    loadData();
  }

  function wireEvents() {
    el.addParty.addEventListener('click', function() {
      addSelectedParty(resolvePartySearch(el.partySearch.value));
    });

    el.partySearch.addEventListener('input', function() {
      el.addParty.disabled = !resolvePartySearch(el.partySearch.value);
    });

    el.partySearch.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        addSelectedParty(resolvePartySearch(el.partySearch.value));
      }
    });

    el.groupFilter.addEventListener('change', function() {
      state.groupFilter = el.groupFilter.value;
      setupControls();
    });

    el.clearParties.addEventListener('click', function() {
      state.selectedIds = [];
      render();
    });

    el.partyChips.addEventListener('click', function(event) {
      var button = event.target.closest('button[data-party-id]');
      if (!button) return;
      removeParty(button.dataset.partyId);
    });
  }

  function loadData() {
    Papa.parse(DATA_URL, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: function(results) {
        buildData(results.data);
        state.selectedIds = DEFAULT_PARTY_IDS.filter(function(id) { return state.partyMap.has(id); });
        setupControls();
        el.loading.classList.add('hidden');
        render();
      },
      error: function(error) {
        el.loading.textContent = 'Could not load contestation estimates: ' + error.message;
      }
    });
  }

  function buildData(rows) {
    var map = new Map();

    rows.forEach(function(row) {
      if (row.party_id === null || row.party_id === undefined || row.party_id === '') return;
      if (row.year === null || row.year === undefined || row.year === '') return;
      if (!isFiniteNumber(row.mean)) return;

      var id = String(row.party_id);
      var party = map.get(id);
      if (!party) {
        party = {
          id: id,
          name: cleanText(row.party_name) || id,
          group: cleanText(row.group) || 'Other',
          observations: []
        };
        party.displayName = DISPLAY_NAMES[party.name] || party.name;
        party.color = partyColor(party);
        map.set(id, party);
      }

      var significant = String(row.significant).toLowerCase() === 'true';
      party.observations.push({
        year: Number(row.year),
        mean: Number(row.mean),
        low: numberOrNull(row.lower_95),
        high: numberOrNull(row.upper_95),
        significant: significant
      });
    });

    state.parties = Array.from(map.values()).map(function(party) {
      party.observations.sort(function(a, b) { return a.year - b.year; });
      party.firstYear = party.observations[0].year;
      party.lastYear = party.observations[party.observations.length - 1].year;
      return party;
    }).sort(partySort);

    state.partyMap = map;
  }

  function partySort(a, b) {
    var ga = GROUP_ORDER.indexOf(a.group);
    var gb = GROUP_ORDER.indexOf(b.group);
    if (ga !== gb) return (ga === -1 ? 99 : ga) - (gb === -1 ? 99 : gb);
    var order = PARTY_ORDER[a.group];
    if (order) {
      var ia = order.indexOf(a.name);
      var ib = order.indexOf(b.name);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    }
    return a.name.localeCompare(b.name);
  }

  function visibleParties() {
    if (state.groupFilter === 'all') return state.parties;
    return state.parties.filter(function(party) { return party.group === state.groupFilter; });
  }

  function setupControls() {
    state.partySearch.clear();
    el.partyOptions.innerHTML = '';
    visibleParties().forEach(function(party) {
      var value = party.name + ' - ' + party.displayName + ' (' + party.group + ', ' + party.firstYear + '-' + party.lastYear + ')';
      state.partySearch.set(value, party.id);
      state.partySearch.set(party.id, party.id);
      var option = document.createElement('option');
      option.value = value;
      el.partyOptions.appendChild(option);
    });

    el.partySearch.disabled = false;
  }

  function addSelectedParty(id) {
    if (!id || state.selectedIds.indexOf(id) !== -1) return;
    state.selectedIds.push(id);
    el.partySearch.value = '';
    el.addParty.disabled = true;
    render();
  }

  function resolvePartySearch(value) {
    return state.partySearch.get(cleanText(value)) || null;
  }

  function removeParty(id) {
    state.selectedIds = state.selectedIds.filter(function(selectedId) { return selectedId !== id; });
    render();
  }

  function render() {
    el.clearParties.disabled = state.selectedIds.length === 0;
    renderChips();
    renderChart();
  }

  function renderChips() {
    if (state.selectedIds.length === 0) {
      el.partyChips.innerHTML = '<span class="empty-state">No parties selected yet.</span>';
      return;
    }

    el.partyChips.innerHTML = state.selectedIds.map(function(id) {
      var party = state.partyMap.get(id);
      return '<span class="party-chip">' +
        '<span class="party-color-dot" style="background:' + chartLineColor(party.color) + '"></span>' +
        escapeHtml(party.displayName) +
        '<button type="button" data-party-id="' + party.id + '" aria-label="Remove ' + escapeHtml(party.displayName) + '">&times;</button>' +
        '</span>';
    }).join('');
  }

  // Draws per-election error bars with a dot for the point estimate.
  // Significant elections get a vertical bar plus dot in the party color.
  // Insignificant elections get a small gray tick at zero, matching the paper.
  var errorBarPlugin = {
    id: 'euErrorBars',
    afterDatasetsDraw: function(chart) {
      var ctx = chart.ctx;
      chart.data.datasets.forEach(function(dataset, datasetIndex) {
        if (dataset.role !== 'estimate') return;
        if (!chart.isDatasetVisible(datasetIndex)) return;
        var meta = chart.getDatasetMeta(datasetIndex);
        var color = dataset.borderColor;
        meta.data.forEach(function(point, i) {
          var obs = dataset.rawObs[i];
          if (!obs) return;
          var x = point.x;
          if (obs.significant && obs.low !== null && obs.high !== null) {
            var yLow = chart.scales.y.getPixelForValue(obs.low);
            var yHigh = chart.scales.y.getPixelForValue(obs.high);
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x, yLow);
            ctx.lineTo(x, yHigh);
            ctx.stroke();
            var cap = 4;
            ctx.beginPath();
            ctx.moveTo(x - cap, yLow);
            ctx.lineTo(x + cap, yLow);
            ctx.moveTo(x - cap, yHigh);
            ctx.lineTo(x + cap, yHigh);
            ctx.stroke();
            ctx.restore();
          } else {
            var yZero = chart.scales.y.getPixelForValue(0);
            ctx.save();
            ctx.strokeStyle = '#808080';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, yZero - 5);
            ctx.lineTo(x, yZero + 5);
            ctx.stroke();
            ctx.restore();
          }
        });
      });
    }
  };

  if (typeof Chart !== 'undefined' && Chart.register) {
    Chart.register(errorBarPlugin);
  }

  function chartTheme() {
    var styles = getComputedStyle(document.documentElement);
    return { ink: styles.getPropertyValue('--body-color').trim() || '#1a1a1a', muted: styles.getPropertyValue('--ink-muted').trim() || '#333', grid: styles.getPropertyValue('--chart-grid').trim() || '#e7e2d8', surface: styles.getPropertyValue('--surface').trim() || '#fffefa' };
  }

  function applyChartTheme() {
    if (!state.chart) return;
    var theme = chartTheme();
    state.chart.options.plugins.title.color = theme.ink;
    state.chart.options.plugins.legend.labels.color = theme.ink;
    state.chart.options.plugins.tooltip.backgroundColor = theme.surface;
    state.chart.options.plugins.tooltip.titleColor = theme.ink;
    state.chart.options.plugins.tooltip.bodyColor = theme.ink;
    ['x', 'y'].forEach(function(axis) { state.chart.options.scales[axis].title.color = theme.ink; state.chart.options.scales[axis].ticks.color = theme.muted; state.chart.options.scales[axis].grid.color = theme.grid; });
    state.chart.data.datasets.forEach(function(dataset) {
      if (!dataset._partyColor) return;
      dataset.borderColor = chartLineColor(dataset._partyColor);
      dataset.backgroundColor = chartLineColor(dataset._partyColor);
    });
    renderChips();
  }

  window.addEventListener('site-theme-change', function() { if (state.chart) { applyChartTheme(); state.chart.update(); } });

  function renderChart() {
    var theme = chartTheme();
    var datasets = [];
    var selectedParties = state.selectedIds.map(function(id) { return state.partyMap.get(id); }).filter(Boolean);
    var visibleYears = [];

    selectedParties.forEach(function(party) {
      var color = chartLineColor(party.color);
      var data = [];
      var rawObs = [];
      party.observations.forEach(function(obs) {
        visibleYears.push(obs.year);
        rawObs.push(obs);
        if (obs.significant) {
          data.push({ x: obs.year, y: obs.mean });
        } else {
          data.push({ x: obs.year, y: 0 });
        }
      });

      datasets.push({
        type: 'scatter',
        label: party.displayName,
        data: data,
        rawObs: rawObs,
        borderColor: color,
        backgroundColor: color,
        pointRadius: function(context) {
          var obs = rawObs[context.dataIndex];
          return obs && obs.significant ? 4 : 0;
        },
        pointHoverRadius: 6,
        pointHitRadius: 10,
        showLine: false,
        role: 'estimate',
        _partyColor: party.color,
        _party: party
      });
    });

    var xBounds = yearBounds(visibleYears);

    if (state.chart) {
      applyChartTheme();
      state.chart.data.datasets = datasets;
      state.chart.options.scales.x.min = xBounds.min;
      state.chart.options.scales.x.max = xBounds.max;
      state.chart.update();
      return;
    }

    state.chart = new Chart(document.getElementById('party-chart'), {
      type: 'scatter',
      data: { datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        animation: false,
        plugins: {
          title: {
            display: true,
            text: 'Party contestation intensity over time',
            color: theme.ink,
            font: { family: "'CMU Serif', Georgia, serif", size: 17, weight: 'normal' }
          },
          legend: {
            labels: {
              color: theme.ink,
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { family: "'CMU Serif', Georgia, serif" }
            }
          },
          tooltip: {
            backgroundColor: theme.surface,
            titleColor: theme.ink,
            bodyColor: theme.ink,
            filter: function(item) {
              return item.dataset.role === 'estimate';
            },
            callbacks: {
              title: function(items) {
                var dataset = items[0].dataset;
                return dataset._party.displayName + ' (' + dataset._party.group + ')';
              },
              label: function(item) {
                var obs = item.dataset.rawObs[item.dataIndex];
                var lines = ['Election ' + obs.year + ': ' + formatNumber(obs.mean)];
                if (obs.significant && obs.low !== null && obs.high !== null) {
                  lines.push('95% credible interval: ' + formatNumber(obs.low) + ' to ' + formatNumber(obs.high));
                } else {
                  lines.push('No measurable contestation');
                }
                return lines;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            min: xBounds.min,
            max: xBounds.max,
            title: { display: true, text: 'Election year', color: theme.ink },
            grid: { color: theme.grid },
            ticks: {
              color: theme.muted,
              precision: 0,
              callback: function(value) { return String(Math.round(value)); }
            }
          },
          y: {
            min: 0,
            max: Y_MAX,
            title: { display: true, text: 'Contestation intensity (theta)', color: theme.ink },
            grid: { color: theme.grid },
            ticks: { color: theme.muted }
          }
        }
      }
    });
  }

  function isDarkTheme() {
    try {
      if (getComputedStyle(document.documentElement).colorScheme === 'dark') return true;
    } catch (e) {}
    try {
      if (document.documentElement.getAttribute('data-theme') === 'dark') return true;
    } catch (e) {}
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && !document.documentElement.getAttribute('data-theme')) return true;
    } catch (e) {}
    return false;
  }

  function chartLineColor(color) {
    if (!isDarkTheme() || color.charAt(0) !== '#' || color.length !== 7) return color;
    var r = parseInt(color.slice(1, 3), 16);
    var g = parseInt(color.slice(3, 5), 16);
    var b = parseInt(color.slice(5, 7), 16);
    var luminance = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
    if (luminance >= 0.35) return color;
    var mix = 0.65;
    var nr = Math.round(r + (255 - r) * mix);
    var ng = Math.round(g + (255 - g) * mix);
    var nb = Math.round(b + (255 - b) * mix);
    return '#' + [nr, ng, nb].map(function(v) { var h = v.toString(16); return h.length === 1 ? '0' + h : h; }).join('');
  }

  function yearBounds(years) {
    if (years.length === 0) return { min: 1945, max: 2022 };
    var min = Math.min.apply(null, years);
    var max = Math.max.apply(null, years);
    if (min === max) return { min: min - 1, max: max + 1 };
    return { min: min, max: max };
  }

  function partyColor(party) {
    var shortName = normalizeKey(party.name);
    var palette = {
      AFD: '#009EE0', SPD: '#E3000F', CDUCSU: '#000000', GRUNE: '#46962b',
      FPO: '#005DA8', LEGA: '#0B8F3A', FI: '#0087DC', PD: '#EF3E42',
      PSOE: '#EF1C27', PP: '#1D84CE', PS: '#E30613', LR: '#0066CC',
      FN: '#1E3D8F', FNRN: '#1E3D8F', CON: '#0087DC', LAB: '#E4003B',
      LESREPUBLICAINS: '#0066CC', NEADIMOKRATIA: '#004C99', SD: '#E8112D',
      MILJOPARTIET: '#83CF39', VIHREAT: '#61BF1A', GROENLINKS: '#008B5A',
      PCI: '#DD0000', VOLKSUNIE: '#FFD700', RETSFORBUNDET: '#005BAA', ARP: '#00AEEF'
    };
    // party names with slashes or spaces normalize, so try variants
    if (palette[shortName]) return palette[shortName];
    var compact = shortName.replace(/RN$/, '');
    if (palette[compact]) return palette[compact];
    return hashColor(party.group + ':' + party.id + ':' + party.name);
  }

  function normalizeKey(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
  }

  function hashColor(value) {
    var hash = 0;
    for (var i = 0; i < value.length; i++) {
      hash = value.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    var hue = Math.abs(hash) % 360;
    return 'hsl(' + hue + ', 58%, 44%)';
  }

  function isFiniteNumber(value) {
    return typeof value === 'number' && isFinite(value);
  }

  function numberOrNull(value) {
    return isFiniteNumber(value) ? Number(value) : null;
  }

  function cleanText(value) {
    return String(value || '').trim();
  }

  function formatNumber(value) {
    return Number(value).toFixed(2);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, function(char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char];
    });
  }
})();
