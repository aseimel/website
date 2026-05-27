(function() {
  'use strict';

  var DATA_URL = 'party2d_estimates_v0.csv';
  var MAX_INITIAL_SELECTION = 4;

  var COUNTRY_NAMES = {
    AT: 'Austria', BE: 'Belgium', BG: 'Bulgaria', CH: 'Switzerland', CY: 'Cyprus', CZ: 'Czechia',
    DE: 'Germany', DK: 'Denmark', EE: 'Estonia', ES: 'Spain', FI: 'Finland', FR: 'France',
    GB: 'United Kingdom', GR: 'Greece', HR: 'Croatia', HU: 'Hungary', IE: 'Ireland', IS: 'Iceland',
    IT: 'Italy', LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia', MT: 'Malta', NL: 'Netherlands',
    NO: 'Norway', PL: 'Poland', PT: 'Portugal', RO: 'Romania', SE: 'Sweden', SI: 'Slovenia',
    SK: 'Slovakia'
  };

  var PARTY_COLORS = {
    CDU: '#000000', CSU: '#008AC5', SPD: '#E3000F', FDP: '#FFED00', GRUENE: '#64A12D', GRUNE: '#64A12D',
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
    PSFI: '#F00A64', KESK: '#349A2B', VIHR: '#61BF1A', KDPI: '#0235A4', EKRE: '#005EA8', RE: '#FFD300', SDE: '#E10600'
  };

  var state = {
    parties: [],
    partyMap: new Map(),
    selectedIds: [],
    years: [],
    currentYear: null,
    showEconomic: true,
    showGaltan: true,
    chart: null
  };

  var el = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    el.partySelect = document.getElementById('party-select');
    el.addParty = document.getElementById('add-party');
    el.yearSlider = document.getElementById('year-slider');
    el.yearLabel = document.getElementById('year-label');
    el.yearMin = document.getElementById('year-min');
    el.yearMax = document.getElementById('year-max');
    el.showEconomic = document.getElementById('show-economic');
    el.showGaltan = document.getElementById('show-galtan');
    el.clearParties = document.getElementById('clear-parties');
    el.partyChips = document.getElementById('party-chips');
    el.tableBody = document.getElementById('party-table-body');
    el.loading = document.getElementById('loading-message');

    wireEvents();
    loadData();
  }

  function wireEvents() {
    el.addParty.addEventListener('click', function() {
      addSelectedParty(el.partySelect.value);
    });

    el.partySelect.addEventListener('change', function() {
      el.addParty.disabled = !el.partySelect.value;
    });

    el.yearSlider.addEventListener('input', function() {
      state.currentYear = Number(el.yearSlider.value);
      render();
    });

    el.showEconomic.addEventListener('change', function() {
      state.showEconomic = el.showEconomic.checked;
      if (!state.showEconomic && !state.showGaltan) {
        state.showGaltan = true;
        el.showGaltan.checked = true;
      }
      renderChart();
    });

    el.showGaltan.addEventListener('change', function() {
      state.showGaltan = el.showGaltan.checked;
      if (!state.showEconomic && !state.showGaltan) {
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
        galtan: Number(row.galtan),
        galtanLow: numberOrNull(row.galtan_q025),
        galtanHigh: numberOrNull(row.galtan_q975),
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
    var grouped = new Map();
    state.parties.forEach(function(party) {
      if (!grouped.has(party.country)) grouped.set(party.country, []);
      grouped.get(party.country).push(party);
    });

    el.partySelect.innerHTML = '<option value="">Choose a party...</option>';
    Array.from(grouped.keys()).sort(function(a, b) {
      return countryLabel(a).localeCompare(countryLabel(b));
    }).forEach(function(country) {
      var group = document.createElement('optgroup');
      group.label = countryLabel(country);
      grouped.get(country).forEach(function(party) {
        var option = document.createElement('option');
        option.value = party.id;
        option.textContent = party.label;
        group.appendChild(option);
      });
      el.partySelect.appendChild(group);
    });

    el.yearSlider.min = state.years[0];
    el.yearSlider.max = state.years[state.years.length - 1];
    el.yearSlider.step = 1;
    el.yearSlider.value = state.currentYear;
    el.yearMin.textContent = state.years[0];
    el.yearMax.textContent = state.years[state.years.length - 1];

    el.partySelect.disabled = false;
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
    render();
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
        datasets.push({
          type: 'line',
          label: party.shortName + ' (' + party.country + ') - Economic LR',
          data: party.observations.map(function(obs) {
            visibleYears.push(obs.year);
            return { x: obs.year, y: obs.economic, year: obs.year, party: party, dimension: 'Economic LR', obs: obs };
          }),
          borderColor: party.color,
          backgroundColor: party.color,
          borderWidth: 2.25,
          pointRadius: function(context) { return pointRadiusForYear(context.raw); },
          pointHoverRadius: 7,
          tension: 0.2,
          showLine: true
        });
      }

      if (state.showGaltan) {
        datasets.push({
          type: 'line',
          label: party.shortName + ' (' + party.country + ') - GAL-TAN',
          data: party.observations.map(function(obs) {
            visibleYears.push(obs.year);
            return { x: obs.year, y: obs.galtan, year: obs.year, party: party, dimension: 'GAL-TAN', obs: obs };
          }),
          borderColor: party.color,
          backgroundColor: party.color,
          borderWidth: 2.25,
          borderDash: [7, 4],
          pointRadius: function(context) { return pointRadiusForYear(context.raw); },
          pointHoverRadius: 7,
          tension: 0.2,
          showLine: true
        });
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
              font: { family: "'CMU Serif', Georgia, serif" }
            }
          },
          tooltip: {
            callbacks: {
              title: function(items) {
                var raw = items[0].raw;
                return raw.party.shortName + ' - ' + raw.party.name;
              },
              label: function(item) {
                var raw = item.raw;
                return raw.dimension + ': ' + formatNumber(raw.y) + ' (' + raw.year + ')';
              },
              afterLabel: function(item) {
                if (!item.raw.obs || !item.raw.dimension) return '';
                var obs = item.raw.obs;
                var lines = [];
                if (item.raw.dimension === 'Economic LR' && obs.economicLow !== null && obs.economicHigh !== null) {
                  lines.push('Economic 95% CI: ' + formatNumber(obs.economicLow) + '-' + formatNumber(obs.economicHigh));
                }
                if (item.raw.dimension === 'GAL-TAN' && obs.galtanLow !== null && obs.galtanHigh !== null) {
                  lines.push('GAL-TAN 95% CI: ' + formatNumber(obs.galtanLow) + '-' + formatNumber(obs.galtanHigh));
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

  function yearBounds(years) {
    if (years.length === 0) return { min: state.years[0], max: state.years[state.years.length - 1] };
    var min = Math.min.apply(null, years);
    var max = Math.max.apply(null, years);
    if (min === max) return { min: min - 1, max: max + 1 };
    return { min: min, max: max };
  }

  function pointRadiusForYear(raw) {
    if (!raw) return 0;
    return raw.year === state.currentYear ? 5 : 2;
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
        '<td>' + estimateWithCi(row.obs.galtan, row.obs.galtanLow, row.obs.galtanHigh) + '</td>' +
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
