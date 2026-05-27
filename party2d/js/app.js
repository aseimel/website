(function() {
  'use strict';

  var DATA_URL = 'party2d_estimates_v0.csv';
  var MAX_INITIAL_SELECTION = 4;

  var COUNTRY_NAMES = {
    AL: 'Albania', AD: 'Andorra', AM: 'Armenia', AR: 'Argentina', AU: 'Australia', AZ: 'Azerbaijan', AT: 'Austria', BA: 'Bosnia and Herzegovina', BE: 'Belgium', BG: 'Bulgaria', BO: 'Bolivia', BR: 'Brazil', BY: 'Belarus', CA: 'Canada', CH: 'Switzerland', CL: 'Chile', CO: 'Colombia', CR: 'Costa Rica', CY: 'Cyprus', CZ: 'Czechia',
    DE: 'Germany', DK: 'Denmark', EE: 'Estonia', ES: 'Spain', FI: 'Finland', FR: 'France',
    GB: 'United Kingdom', GE: 'Georgia', GR: 'Greece', HR: 'Croatia', HU: 'Hungary', DO: 'Dominican Republic', EC: 'Ecuador', IE: 'Ireland', IL: 'Israel', IS: 'Iceland',
    IT: 'Italy', JP: 'Japan', KR: 'South Korea', LI: 'Liechtenstein', LK: 'Sri Lanka', LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia', MD: 'Moldova', ME: 'Montenegro', MK: 'North Macedonia', MT: 'Malta', MX: 'Mexico', NL: 'Netherlands', NZ: 'New Zealand',
    NO: 'Norway', PA: 'Panama', PE: 'Peru', PL: 'Poland', PT: 'Portugal', RO: 'Romania', RS: 'Serbia', RU: 'Russia', SE: 'Sweden', SI: 'Slovenia',
    SK: 'Slovakia', TR: 'Turkey', UA: 'Ukraine', US: 'United States', UY: 'Uruguay', XK: 'Kosovo', ZA: 'South Africa'
  };

  var PARTY_COLORS = {
    CDU: '#000000', CSU: '#008AC5', SPD: '#E3000F', FDP: '#FFED00', GRUENE: '#46962b', GRUNE: '#46962b', GRUNEN: '#46962b',
    AFD: '#009EE0', LINKE: '#BE3075', PDS: '#BE3075', SSW: '#003C78', OVP: '#63C3D1', SPO: '#E31E2D',
    FPO: '#005DA8', NEOS: '#E84188', BZO: '#F58220', SPOE: '#E31E2D', PSOE: '#EF1C27', PP: '#1D84CE',
    VOX: '#63BE21', PODEMOS: '#6A2E68', IU: '#B00020', ERC: '#FFB232', CIU: '#1B75BB', PSC: '#EF1C27',
    PS: '#E30613', LR: '#0066CC', RN: '#1E3D8F', FN: '#1E3D8F', LFI: '#CC2443', EELV: '#00A95C',
    PCF: '#DD0000', LREM: '#FFD600', RE: '#FFD600', NUPES: '#BB1845', PD: '#EF3E42', FI: '#0087DC',
    FDI: '#004C99', LEGA: '#0B8F3A', M5S: '#FFEB3B', LN: '#0B8F3A', PDL: '#0087DC', DS: '#EF3E42',
    LPF: '#0B8F3A', LAB: '#E4003B', CON: '#0087DC', LD: '#FAA61A', SNP: '#FDF38E', UKIP: '#70147A',
    GREEN: '#6AB023', PLAID: '#005B54', PVV: '#012758', VVD: '#FF7F00', PVDA: '#DB0000', CDA: '#008000',
    D66: '#00A95C', SP: '#EC1B23', GL: '#008B5A', CU: '#00AEEF', SGP: '#F58220', VB: '#FFD700', NVA: '#F7C600',
    PSB: '#E30613', MR: '#0047AB', CDV: '#FF8C00', ECOLO: '#00A95C', SPA: '#E30613', SD: '#E8112D',
    M: '#52BDEC', V: '#DA291C', C: '#009933', L: '#006AB3', KD: '#005EA8', MP: '#83CF39', SDSE: '#DDDD00',
    AP: '#005BAA', DNA: '#E31836', SF: '#C00418', RV: '#663399', DF: '#005BAA', EL: '#D71920', FRP: '#024EA2',
    H: '#87ADD7', SV: '#BA0000', KRF: '#F2D230', VENSTRE: '#008542', SPNO: '#008542', SDP: '#ED1B34', KOK: '#006CB4',
    PSFI: '#F00A64', KESK: '#349A2B', VIHR: '#61BF1A', KDPI: '#0235A4', EKRE: '#005EA8', RE: '#FFD300', SDE: '#E10600',
    TPSL: '#E11931', ERP: '#004B8D', BZO: '#F58220', OVP: '#63C3D1', SPO: '#E31E2D', FPO: '#005DA8'
  };

  // party_id is the Party Facts ID, matching the identifier used by partycoloR.
  var PARTY_FACTS_COLORS = {
    463: '#005DA8',
    491: '#004B8D',
    599: '#F58220',
    1164: '#E11931',
    1329: '#63C3D1',
    1384: '#E31E2D',
    1659: '#46962B',
    1970: '#E84188',
    4094: '#005EA8'
  };

  var state = {
    parties: [],
    partySearch: new Map(),
    partyMap: new Map(),
    selectedIds: [],
    years: [],
    currentYear: null,
    showEconomic: true,
    showCultural: true,
    chart: null
  };

  var el = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    el.partySearch = document.getElementById('party-search');
    el.partyOptions = document.getElementById('party-options');
    el.addParty = document.getElementById('add-party');
    el.yearSlider = document.getElementById('year-slider');
    el.yearLabel = document.getElementById('year-label');
    el.yearMin = document.getElementById('year-min');
    el.yearMax = document.getElementById('year-max');
    el.showEconomic = document.getElementById('show-economic');
    el.showCultural = document.getElementById('show-cultural');
    el.clearParties = document.getElementById('clear-parties');
    el.partyChips = document.getElementById('party-chips');
    el.tableBody = document.getElementById('party-table-body');
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

    el.yearSlider.addEventListener('input', function() {
      state.currentYear = Number(el.yearSlider.value);
      render();
    });

    el.showEconomic.addEventListener('change', function() {
      state.showEconomic = el.showEconomic.checked;
      if (!state.showEconomic && !state.showCultural) {
        state.showCultural = true;
        el.showCultural.checked = true;
      }
      renderChart();
    });

    el.showCultural.addEventListener('change', function() {
      state.showCultural = el.showCultural.checked;
      if (!state.showEconomic && !state.showCultural) {
        state.showEconomic = true;
        el.showEconomic.checked = true;
      }
      renderChart();
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
        setupControls();
        pickInitialParties();
        el.loading.classList.add('hidden');
        render();
      },
      error: function(error) {
        el.loading.textContent = 'Could not load party estimates: ' + error.message;
      }
    });
  }

  function buildData(rows) {
    var years = new Set();
    var map = new Map();

    rows.forEach(function(row) {
      if (!row.party_id || !row.country || !row.year) return;
      if (!isFiniteNumber(row.economic_lr) || !isFiniteNumber(row.galtan)) return;

      var id = String(row.party_id);
      var party = map.get(id);
      if (!party) {
        party = {
          id: id,
          name: cleanText(row.party_name_english) || cleanText(row.party_name_short) || id,
          shortName: cleanText(row.party_name_short) || id,
          country: cleanText(row.country),
          observations: []
        };
        party.color = partyColor(party);
        map.set(id, party);
      }

      var observation = {
        year: Number(row.year),
        economic: Number(row.economic_lr),
        economicLow: numberOrNull(row.economic_lr_q025),
        economicHigh: numberOrNull(row.economic_lr_q975),
        cultural: Number(row.galtan),
        culturalLow: numberOrNull(row.galtan_q025),
        culturalHigh: numberOrNull(row.galtan_q975),
        vote: numberOrNull(row.pervote)
      };
      party.observations.push(observation);
      years.add(observation.year);
    });

    state.parties = Array.from(map.values()).map(function(party) {
      party.observations.sort(function(a, b) { return a.year - b.year; });
      party.firstYear = party.observations[0].year;
      party.lastYear = party.observations[party.observations.length - 1].year;
      party.label = party.shortName + ' - ' + party.name + ' (' + party.firstYear + '-' + party.lastYear + ')';
      return party;
    }).sort(function(a, b) {
      return countryLabel(a.country).localeCompare(countryLabel(b.country)) || a.shortName.localeCompare(b.shortName);
    });

    state.partyMap = map;
    state.years = Array.from(years).sort(function(a, b) { return a - b; });
    state.currentYear = state.years[state.years.length - 1];
  }

  function setupControls() {
    state.partySearch.clear();
    el.partyOptions.innerHTML = '';
    state.parties.forEach(function(party) {
      var value = party.shortName + ' - ' + party.name + ' - ' + countryLabel(party.country) + ' (' + party.country + ', ' + party.firstYear + '-' + party.lastYear + ')';
      state.partySearch.set(value, party.id);
      state.partySearch.set(party.id, party.id);
      var option = document.createElement('option');
      option.value = value;
      el.partyOptions.appendChild(option);
    });

    el.yearSlider.min = state.years[0];
    el.yearSlider.max = state.years[state.years.length - 1];
    el.yearSlider.step = 1;
    el.yearSlider.value = state.currentYear;
    el.yearMin.textContent = state.years[0];
    el.yearMax.textContent = state.years[state.years.length - 1];

    el.partySearch.disabled = false;
    el.yearSlider.disabled = false;
  }

  function pickInitialParties() {
    var byShortName = new Set(['SPD', 'CDU', 'FDP', 'GRUNE']);
    state.selectedIds = state.parties.filter(function(party) {
      return party.country === 'DE' && byShortName.has(party.shortName.toUpperCase());
    }).slice(0, MAX_INITIAL_SELECTION).map(function(party) { return party.id; });

    if (state.selectedIds.length === 0) {
      state.selectedIds = state.parties.slice(0, Math.min(MAX_INITIAL_SELECTION, state.parties.length)).map(function(party) {
        return party.id;
      });
    }
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
    el.yearLabel.textContent = state.currentYear ? '(' + state.currentYear + ')' : '';
    el.yearSlider.value = state.currentYear;
    el.clearParties.disabled = state.selectedIds.length === 0;
    renderChips();
    renderChart();
    renderTable();
  }

  function renderChips() {
    if (state.selectedIds.length === 0) {
      el.partyChips.innerHTML = '<span class="empty-state">No parties selected yet.</span>';
      return;
    }

    el.partyChips.innerHTML = state.selectedIds.map(function(id) {
      var party = state.partyMap.get(id);
      return '<span class="party-chip">' +
        '<span class="party-color-dot" style="background:' + party.color + '"></span>' +
        escapeHtml(party.shortName + ' (' + party.country + ')') +
        '<button type="button" data-party-id="' + party.id + '" aria-label="Remove ' + escapeHtml(party.shortName) + '">&times;</button>' +
        '</span>';
    }).join('');
  }

  function renderChart() {
    var datasets = [];
    var selectedParties = state.selectedIds.map(function(id) { return state.partyMap.get(id); }).filter(Boolean);
    var visibleYears = [];

    selectedParties.forEach(function(party) {
      if (state.showEconomic) {
        addDimensionDatasets(datasets, party, 'Economic', 'economic', 'economicLow', 'economicHigh', [], visibleYears);
      }

      if (state.showCultural) {
        addDimensionDatasets(datasets, party, 'Cultural', 'cultural', 'culturalLow', 'culturalHigh', [7, 4], visibleYears);
      }
    });

    var xBounds = yearBounds(visibleYears);

    if (state.chart) {
      state.chart.data.datasets = datasets;
      state.chart.options.plugins.title.text = 'Party estimates over time';
      state.chart.options.scales.x.min = xBounds.min;
      state.chart.options.scales.x.max = xBounds.max;
      state.chart.update();
      return;
    }

    state.chart = new Chart(document.getElementById('party-chart'), {
      type: 'line',
      data: { datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        animation: false,
        plugins: {
          title: {
            display: true,
            text: 'Party estimates over time',
            color: '#1a1a1a',
            font: { family: "'CMU Serif', Georgia, serif", size: 17, weight: 'normal' }
          },
          legend: {
            labels: {
              filter: function(item, chartData) {
                return item.datasetIndex !== null && chartData.datasets[item.datasetIndex].role === 'estimate';
              },
              font: { family: "'CMU Serif', Georgia, serif" }
            }
          },
          tooltip: {
            filter: function(item) {
              return item.dataset.role === 'estimate';
            },
            callbacks: {
              title: function(items) {
                var raw = items[0].raw;
                return raw.party.shortName + ' - ' + raw.party.name;
              },
              label: function(item) {
                var raw = item.raw;
                return raw.dimension + ': ' + formatNumber(raw.value) + ' (' + raw.year + ')';
              },
              afterLabel: function(item) {
                if (!item.raw.obs || !item.raw.dimension) return '';
                var obs = item.raw.obs;
                var lines = [];
                if (item.raw.dimension === 'Economic' && obs.economicLow !== null && obs.economicHigh !== null) {
                  lines.push('Economic 95% CI: ' + formatNumber(obs.economicLow) + '-' + formatNumber(obs.economicHigh));
                }
                if (item.raw.dimension === 'Cultural' && obs.culturalLow !== null && obs.culturalHigh !== null) {
                  lines.push('Cultural 95% CI: ' + formatNumber(obs.culturalLow) + '-' + formatNumber(obs.culturalHigh));
                }
                if (obs.vote !== null) lines.push('Vote share: ' + formatNumber(obs.vote) + '%');
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
            title: { display: true, text: 'Year', color: '#1a1a1a' },
            grid: { color: '#e7e2d8' },
            ticks: {
              color: '#333',
              precision: 0,
              callback: function(value) { return String(Math.round(value)); }
            }
          },
          y: {
            min: 0,
            max: 1,
            title: { display: true, text: 'Estimated position', color: '#1a1a1a' },
            grid: { color: '#e7e2d8' },
            ticks: { color: '#333' }
          }
        }
      }
    });
  }

  function addDimensionDatasets(datasets, party, label, valueKey, lowKey, highKey, dash, visibleYears) {
    var color = party.color;
    var lowerData = [];
    var upperData = [];
    var lineData = [];

    party.observations.forEach(function(obs) {
      visibleYears.push(obs.year);
      lowerData.push({ x: obs.year, y: obs[lowKey], year: obs.year, party: party, dimension: label, obs: obs, value: obs[valueKey] });
      upperData.push({ x: obs.year, y: obs[highKey], year: obs.year, party: party, dimension: label, obs: obs, value: obs[valueKey] });
      lineData.push({ x: obs.year, y: obs[valueKey], year: obs.year, party: party, dimension: label, obs: obs, value: obs[valueKey] });
    });

    datasets.push({
      type: 'line',
      label: party.shortName + ' (' + party.country + ') - ' + label + ' lower',
      data: lowerData,
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      pointRadius: 0,
      pointHitRadius: 0,
      borderWidth: 0,
      tension: 0.2,
      role: 'ribbon-bound'
    });

    datasets.push({
      type: 'line',
      label: party.shortName + ' (' + party.country + ') - ' + label + ' ribbon',
      data: upperData,
      borderColor: 'transparent',
      backgroundColor: alpha(color, label === 'Economic' ? 0.12 : 0.08),
      pointRadius: 0,
      pointHitRadius: 0,
      borderWidth: 0,
      tension: 0.2,
      fill: '-1',
      role: 'ribbon'
    });

    datasets.push({
      type: 'line',
      label: party.shortName + ' (' + party.country + ') - ' + label,
      data: lineData,
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2.4,
      borderDash: dash,
      pointRadius: 0,
      pointHoverRadius: 0,
      pointHitRadius: 8,
      tension: 0.2,
      showLine: true,
      role: 'estimate'
    });
  }

  function yearBounds(years) {
    if (years.length === 0) return { min: state.years[0], max: state.years[state.years.length - 1] };
    var min = Math.min.apply(null, years);
    var max = Math.max.apply(null, years);
    if (min === max) return { min: min - 1, max: max + 1 };
    return { min: min, max: max };
  }

  function renderTable() {
    var rows = state.selectedIds.map(function(id) {
      var party = state.partyMap.get(id);
      var obs = observationForYear(party, state.currentYear);
      return { party: party, obs: obs };
    }).filter(function(row) { return row.party && row.obs; });

    if (rows.length === 0) {
      el.tableBody.innerHTML = '<tr><td colspan="5">No selected parties have estimates for this year.</td></tr>';
      return;
    }

    el.tableBody.innerHTML = rows.map(function(row) {
      return '<tr>' +
        '<td><span class="party-name-cell"><span class="party-color-dot" style="background:' + row.party.color + '"></span>' + escapeHtml(row.party.shortName + ' - ' + row.party.name) + '</span></td>' +
        '<td>' + escapeHtml(countryLabel(row.party.country)) + '</td>' +
        '<td>' + (row.obs.vote === null ? '&mdash;' : formatNumber(row.obs.vote) + '%') + '</td>' +
        '<td>' + estimateWithCi(row.obs.economic, row.obs.economicLow, row.obs.economicHigh) + '</td>' +
        '<td>' + estimateWithCi(row.obs.cultural, row.obs.culturalLow, row.obs.culturalHigh) + '</td>' +
        '</tr>';
    }).join('');
  }

  function observationForYear(party, year) {
    if (!party) return null;
    for (var i = 0; i < party.observations.length; i++) {
      if (party.observations[i].year === year) return party.observations[i];
    }
    return null;
  }

  function partyColor(party) {
    if (PARTY_FACTS_COLORS[party.id]) return PARTY_FACTS_COLORS[party.id];
    var shortName = normalizeKey(party.shortName);
    if (PARTY_COLORS[shortName]) return PARTY_COLORS[shortName];
    return hashColor(party.country + ':' + party.id + ':' + party.shortName);
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

  function alpha(color, opacity) {
    if (color.indexOf('#') !== 0 || color.length !== 7) return color;
    var r = parseInt(color.slice(1, 3), 16);
    var g = parseInt(color.slice(3, 5), 16);
    var b = parseInt(color.slice(5, 7), 16);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + opacity + ')';
  }

  function countryLabel(code) {
    return COUNTRY_NAMES[code] || code;
  }

  function estimateWithCi(value, low, high) {
    var html = formatNumber(value);
    if (low !== null && high !== null) html += ' <span class="empty-state">[' + formatNumber(low) + ', ' + formatNumber(high) + ']</span>';
    return html;
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
