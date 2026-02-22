/**
 * App controller for the German Democracy Monitor demo dashboard.
 * Wires together the MP dropdown, time-range buttons, chart, and document table.
 */
document.addEventListener('DOMContentLoaded', function() {

    // --- State ---
    var currentMpId = null;
    var currentRange = 'all';
    var selectedMonth = null;
    var sortColumn = 'date';
    var sortDirection = 'desc';

    // --- DOM references ---
    var mpSelect = document.getElementById('mp-select');
    var docsBody = document.getElementById('documents-body');
    var indicator = document.getElementById('selection-indicator');
    var rangeButtons = document.querySelectorAll('.btn-range');
    var tableHeaders = document.querySelectorAll('#documents-table th');
    var modalOverlay = document.getElementById('modal-overlay');
    var modalTitle = document.getElementById('modal-title');
    var modalMeta = document.getElementById('modal-meta');
    var modalBody = document.getElementById('modal-body');
    var modalClose = document.getElementById('modal-close');

    // --- Initialize ---
    function init() {
        populateDropdown();
        currentMpId = MP_DATA.mps[0].id;
        mpSelect.value = currentMpId;

        DashboardChart.onPointClick = handlePointClick;

        // Wire events
        mpSelect.addEventListener('change', function(e) {
            currentMpId = e.target.value;
            selectedMonth = null;
            updateDashboard();
        });

        rangeButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                rangeButtons.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentRange = btn.dataset.range;
                selectedMonth = null;
                updateDashboard();
            });
        });

        tableHeaders.forEach(function(th) {
            th.addEventListener('click', function() {
                var col = th.dataset.sort;
                if (!col) return;
                if (sortColumn === col) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumn = col;
                    sortDirection = col === 'score' ? 'desc' : 'asc';
                }
                updateSortIndicators();
                updateTable();
            });
        });

        // Modal close events
        modalClose.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) closeModal();
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeModal();
        });

        // Delegate clicks on source links in the table
        docsBody.addEventListener('click', function(e) {
            var link = e.target.closest('.source-link');
            if (!link) return;
            var idx = parseInt(link.dataset.docIdx, 10);
            var mp = getMp(currentMpId);
            if (mp && mp.documents[idx]) {
                openModal(mp.documents[idx], mp.name);
            }
        });

        updateDashboard();
    }

    function populateDropdown() {
        MP_DATA.mps.forEach(function(mp) {
            var opt = document.createElement('option');
            opt.value = mp.id;
            opt.textContent = mp.name + ' (' + mp.party + ')';
            mpSelect.appendChild(opt);
        });
    }

    // --- Event handlers ---
    function handlePointClick(month) {
        if (selectedMonth === month) {
            selectedMonth = null;
        } else {
            selectedMonth = month;
        }
        updateTable();
        updateIndicator();
    }

    // --- Update functions ---
    function updateDashboard() {
        var mp = getMp(currentMpId);
        if (!mp) return;
        DashboardChart.render(mp, currentRange);
        updateTable();
        updateIndicator();
        updateSortIndicators();
    }

    function updateTable() {
        var mp = getMp(currentMpId);
        if (!mp) return;

        var docs = mp.documents.slice();

        // Filter by time range
        if (currentRange !== 'all') {
            var n = parseInt(currentRange, 10);
            var allMonths = mp.scores.map(function(s) { return s.month; });
            var visibleMonths = allMonths.slice(-n);
            docs = docs.filter(function(d) {
                return visibleMonths.indexOf(d.month) !== -1;
            });
        }

        // Filter by selected month
        if (selectedMonth) {
            docs = docs.filter(function(d) {
                return d.month === selectedMonth;
            });
        }

        // Sort
        docs.sort(function(a, b) {
            var va, vb;
            if (sortColumn === 'date') {
                va = new Date(a.date);
                vb = new Date(b.date);
            } else if (sortColumn === 'score') {
                va = a.score;
                vb = b.score;
            } else {
                va = a.label.toLowerCase();
                vb = b.label.toLowerCase();
            }
            if (va < vb) return sortDirection === 'asc' ? -1 : 1;
            if (va > vb) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // Render rows
        var html = '';
        docs.forEach(function(d) {
            var scoreClass = d.score < 0.2 ? 'score-low' : d.score < 0.5 ? 'score-medium' : 'score-high';
            // Find the original index in mp.documents for the modal lookup
            var mp = getMp(currentMpId);
            var docIdx = mp.documents.indexOf(d);
            html += '<tr>' +
                '<td><a class="source-link" data-doc-idx="' + docIdx + '">' + escapeHtml(d.label) + '</a></td>' +
                '<td class="score-cell ' + scoreClass + '">' + d.score.toFixed(2) + '</td>' +
                '<td>' + formatDate(d.date) + '</td>' +
                '</tr>';
        });

        if (docs.length === 0) {
            html = '<tr><td colspan="3" style="text-align:center;color:#abb8c3;padding:24px;">Keine Dokumente f\u00fcr diese Auswahl</td></tr>';
        }

        docsBody.innerHTML = html;
    }

    function updateIndicator() {
        if (selectedMonth) {
            var parts = selectedMonth.split('-');
            var monthNames = ['Januar','Februar','M\u00e4rz','April','Mai','Juni',
                'Juli','August','September','Oktober','November','Dezember'];
            indicator.textContent = 'Dokumente f\u00fcr: ' + monthNames[parseInt(parts[1], 10) - 1] + ' ' + parts[0] +
                '  \u00b7  Erneut klicken zum Aufheben';
        } else {
            indicator.textContent = 'Alle Dokumente  \u00b7  Datenpunkt anklicken zum Filtern';
        }
    }

    function updateSortIndicators() {
        tableHeaders.forEach(function(th) {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.sort === sortColumn) {
                th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        });
    }

    // --- Helpers ---
    function getMp(id) {
        for (var i = 0; i < MP_DATA.mps.length; i++) {
            if (MP_DATA.mps[i].id === id) return MP_DATA.mps[i];
        }
        return null;
    }

    function formatDate(dateStr) {
        // Parse as local date to avoid UTC offset shifting the day
        var parts = dateStr.split('-');
        var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        var day = d.getDate();
        var monthNames = ['Jan','Feb','M\u00e4r','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
        return day + '. ' + monthNames[d.getMonth()] + ' ' + d.getFullYear();
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // --- Modal / Text Viewer ---

    // Placeholder speech excerpts (rotated by document index for variety)
    var PLACEHOLDER_TEXTS = [
        '<p>Herr Pr\u00e4sident, meine sehr verehrten Damen und Herren, die Frage, die wir heute diskutieren, betrifft die Grundlagen unseres Zusammenlebens. Es geht nicht um Parteipolitik, sondern um die Prinzipien, auf denen unser Grundgesetz aufgebaut ist.</p>' +
        '<p>Wir m\u00fcssen anerkennen, dass die <span class="highlight">gegenw\u00e4rtigen Herausforderungen eine klare Antwort des Rechtsstaats erfordern</span>. Die B\u00fcrgerinnen und B\u00fcrger erwarten von uns, dass wir handeln \u2014 aber im Rahmen der Verfassung, nicht au\u00dferhalb.</p>' +
        '<p>Ich m\u00f6chte darauf hinweisen, dass die vorgeschlagenen Ma\u00dfnahmen sorgf\u00e4ltig gegen die Grundrechte abgewogen werden m\u00fcssen. Eine Demokratie zeigt ihre St\u00e4rke nicht in der Beschr\u00e4nkung von Rechten, sondern in deren Verteidigung.</p>',

        '<p>Sehr geehrte Frau Pr\u00e4sidentin, die aktuelle Debatte zeigt einmal mehr, wie wichtig es ist, dass wir sachlich und respektvoll miteinander umgehen. <span class="highlight">Wer den politischen Gegner delegitimiert, schadet der Demokratie insgesamt.</span></p>' +
        '<p>Die Zahlen des Statistischen Bundesamtes belegen eindeutig, dass die Situation differenzierter ist, als manche hier im Hause behaupten. Ich bitte darum, bei den Fakten zu bleiben und nicht mit \u00c4ngsten zu spielen.</p>' +
        '<p>Unsere Fraktion wird dem Gesetzentwurf in der vorliegenden Form nicht zustimmen, weil er fundamentale rechtsstaatliche Prinzipien missachtet. Wir sind bereit, konstruktiv an einer L\u00f6sung mitzuarbeiten.</p>',

        '<p>Meine Damen und Herren, <span class="highlight">die Souver\u00e4nit\u00e4t des deutschen Volkes wird durch die gegenw\u00e4rtige Politik dieser Regierung systematisch untergraben</span>. Wir brauchen eine grundlegende Kurskorrektur in der Migrationspolitik.</p>' +
        '<p>Die B\u00fcrger dieses Landes haben ein Recht darauf zu erfahren, wer in unser Land kommt und welche Kosten damit verbunden sind. <span class="highlight">Es ist nicht fremdenfeindlich, diese Fragen zu stellen \u2014 es ist demokratische Pflicht.</span></p>' +
        '<p>Wir fordern die Bundesregierung auf, die Kontrolle \u00fcber die Grenzen wiederherzustellen und die Interessen der deutschen Steuerzahler an erste Stelle zu setzen. Das Volk hat gesprochen, und Sie ignorieren seinen Willen.</p>',

        '<p>Frau Pr\u00e4sidentin, Kolleginnen und Kollegen, der vorliegende Haushaltsentwurf spiegelt die Priorit\u00e4ten dieser Koalition wider \u2014 und diese Priorit\u00e4ten sind falsch gesetzt.</p>' +
        '<p>W\u00e4hrend Milliarden f\u00fcr fragw\u00fcrdige Projekte ausgegeben werden, fehlt es an Investitionen in Bildung, Infrastruktur und innere Sicherheit. Die Kommunen sind am Limit, und die Bundesregierung schaut zu.</p>' +
        '<p>Ich fordere den Bundesfinanzminister auf, hier und heute zu erkl\u00e4ren, wie er gedenkt, <span class="highlight">die wachsende Ungleichheit in diesem Land zu bek\u00e4mpfen</span>, anstatt sie durch seine Politik noch zu versch\u00e4rfen.</p>',

        '<p>Herr Pr\u00e4sident, der Klimawandel ist die zentrale Herausforderung unserer Zeit. Die wissenschaftlichen Erkenntnisse sind eindeutig, und wir d\u00fcrfen keine weitere Zeit verlieren.</p>' +
        '<p>Die Transformation unserer Wirtschaft hin zu Klimaneutralit\u00e4t ist nicht nur \u00f6kologisch notwendig, sondern auch \u00f6konomisch sinnvoll. Jeder Euro, den wir heute in erneuerbare Energien investieren, spart morgen ein Vielfaches an Folgekosten.</p>' +
        '<p>Ich appelliere an alle Fraktionen in diesem Hause, \u00fcber Parteigrenzen hinweg an L\u00f6sungen zu arbeiten. <span class="highlight">Der Schutz unserer nat\u00fcrlichen Lebensgrundlagen ist keine ideologische Frage, sondern eine Frage der Verantwortung gegen\u00fcber kommenden Generationen.</span></p>',

        '<p>Sehr geehrter Herr Pr\u00e4sident, die heute diskutierte Gesetzesvorlage greift tief in die Grundrechte der B\u00fcrgerinnen und B\u00fcrger ein. Als Liberale k\u00f6nnen wir das nicht hinnehmen.</p>' +
        '<p><span class="highlight">Freiheit ist kein Luxusgut, das man in Krisenzeiten einfach einschr\u00e4nken kann.</span> Im Gegenteil: Gerade in schwierigen Zeiten muss der Staat die Freiheitsrechte seiner B\u00fcrger besonders sch\u00fctzen.</p>' +
        '<p>Wir werden einen \u00c4nderungsantrag einbringen, der die verh\u00e4ltnism\u00e4\u00dfige Anwendung der vorgeschlagenen Ma\u00dfnahmen sicherstellt und eine automatische Befristung vorsieht. Befristete Eingriffe, klare Kontrolle \u2014 das ist liberale Rechtsstaatlichkeit.</p>'
    ];

    function openModal(doc, mpName) {
        modalTitle.textContent = doc.label;
        var scoreClass = doc.score < 0.2 ? 'score-low' : doc.score < 0.5 ? 'score-medium' : 'score-high';
        modalMeta.innerHTML =
            '<span><strong>Sprecher/in:</strong> ' + escapeHtml(mpName) + '</span>' +
            '<span><strong>Datum:</strong> ' + formatDate(doc.date) + '</span>' +
            '<span><strong>Score:</strong> <span class="' + scoreClass + '">' + doc.score.toFixed(2) + '</span></span>';
        // Pick a placeholder text based on document index for variety
        var mp = getMp(currentMpId);
        var idx = mp ? mp.documents.indexOf(doc) : 0;
        modalBody.innerHTML = PLACEHOLDER_TEXTS[idx % PLACEHOLDER_TEXTS.length] +
            '<p class="modal-disclaimer">Synthetischer Platzhaltertext \u2014 kein realer Parlamentsbeitrag.</p>';
        modalOverlay.classList.add('visible');
    }

    function closeModal() {
        modalOverlay.classList.remove('visible');
    }

    // Start
    init();
});
