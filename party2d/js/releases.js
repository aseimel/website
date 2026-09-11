(function () {
  'use strict';

  var RELEASE_API = 'https://git.seimel.app/api/v1/repos/armin/party2d/releases?limit=1';
  var RELEASES_URL = 'https://git.seimel.app/armin/party2d/releases';
  var CACHE_KEY = '***';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var target = document.getElementById('release-content');
    if (!target) return;

    // Never contact the self-hosted Gitea (192.168.x.x) on page load.
    // That private address is what triggers the browser local network prompt.
    // Show the baked-in static release only. Live check happens on explicit click.
    var cached = readCache();
    if (cached) {
      try { renderRelease(target, cached, true); } catch (e) { /* keep static */ }
    }
    ensureCheckButton(target);
  }

  function ensureCheckButton(target) {
    if (document.getElementById('release-check')) return;
    var wrap = document.createElement('p');
    wrap.className = 'release-footer';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'release-check';
    btn.className = 'release-check-button';
    btn.textContent = 'Check for newer release';
    btn.addEventListener('click', function () {
      btn.disabled = true;
      btn.textContent = 'Checking…';
      checkLive(target, btn);
    });
    wrap.appendChild(btn);
    target.appendChild(wrap);
  }

  function checkLive(target, btn) {
    if (!window.fetch) {
      btn.textContent = 'Check unavailable';
      return;
    }
    var controller = null;
    var timeoutId = null;
    try {
      if (window.AbortController) {
        controller = new AbortController();
        timeoutId = setTimeout(function () { controller.abort(); }, 8000);
      }
    } catch (e) { controller = null; }

    fetch(RELEASE_API, {
      headers: { Accept: 'application/json' },
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Release API returned ' + response.status);
        return response.json();
      })
      .then(function (releases) {
        if (!Array.isArray(releases) || !releases.length) throw new Error('No published release found');
        writeCache(releases[0]);
        renderRelease(target, releases[0], true);
        ensureCheckButton(target);
      })
      .catch(function () {
        var note = document.createElement('p');
        note.className = 'release-note';
        note.textContent = 'Live check failed, likely off local network. The downloads above remain available.';
        target.appendChild(note);
        btn.disabled = false;
        btn.textContent = 'Retry check';
      })
      .then(function () {
        if (timeoutId) clearTimeout(timeoutId);
      });
  }

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeCache(release) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(release)); } catch (e) { /* ignore */ }
  }

  function renderRelease(target, release, keepCheck) {
    target.replaceChildren();

    var title = document.createElement('h4');
    title.className = 'release-name';
    title.textContent = release.name || release.tag_name || 'Latest release';
    target.appendChild(title);

    var meta = document.createElement('p');
    meta.className = 'release-meta';
    meta.textContent = 'Published ' + formatDate(release.published_at || release.created_at);
    target.appendChild(meta);

    if (release.body) {
      var description = document.createElement('p');
      description.className = 'release-description';
      description.textContent = release.body;
      target.appendChild(description);
    }

    if (Array.isArray(release.assets) && release.assets.length) {
      var actions = document.createElement('div');
      actions.className = 'release-actions';
      release.assets.filter(isVisibleAsset).sort(compareAssets).forEach(function (asset) {
        var link = document.createElement('a');
        link.className = 'release-download';
        link.href = asset.browser_download_url;
        link.textContent = assetLabel(asset.name);
        link.title = asset.name || assetLabel(asset.name);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        actions.appendChild(link);
      });
      target.appendChild(actions);
    }

    var footer = document.createElement('p');
    footer.className = 'release-footer';
    var all = document.createElement('a');
    all.className = 'release-all-link';
    all.href = release.html_url || RELEASES_URL;
    all.target = '_blank';
    all.rel = 'noopener noreferrer';
    all.textContent = 'View all releases and release notes';
    footer.appendChild(all);
    target.appendChild(footer);
  }

  function isVisibleAsset(asset) {
    return !/sha256/i.test(asset.name || '');
  }

  function compareAssets(a, b) {
    return assetPriority(a.name) - assetPriority(b.name) || String(a.name).localeCompare(String(b.name));
  }

  function assetPriority(name) {
    if (/election.?year.*\.(zip|tar\.gz|csv(\.(gz|xz))?)$/i.test(name)) return 0;
    if (/annual.*model.*\.(zip|csv(\.(gz|xz))?|tar\.gz)$/i.test(name)) return 1;
    if (/diagnostics.*\.pdf$/i.test(name)) return 2;
    return 10;
  }

  function assetLabel(name) {
    if (/election.?year.*\.(zip|tar\.gz|csv(\.(gz|xz))?)$/i.test(name)) {
      return 'Download election-year panel (.' + fileExt(name) + ')';
    }
    if (/annual.*model.*\.(zip|tar\.gz|csv(\.(gz|xz))?)$/i.test(name)) {
      return 'Download annual model output (.' + fileExt(name) + ')';
    }
    if (/diagnostics.*\.pdf$/i.test(name)) return 'Download diagnostics report (.pdf)';
    return 'Download ' + name;
  }

  function fileExt(name) {
    var lower = String(name || '').toLowerCase();
    if (/\.csv\.xz$/.test(lower)) return 'csv.xz';
    if (/\.csv\.gz$/.test(lower)) return 'csv.gz';
    if (/\.tar\.gz$/.test(lower)) return 'tar.gz';
    var parts = lower.split('.');
    return parts.length > 1 ? parts.pop() : 'file';
  }

  function formatDate(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return 'recently';
    return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  }
}());
