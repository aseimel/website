(function () {
  'use strict';

  var RELEASE_API = 'https://git.seimel.app/api/v1/repos/armin/party2d/releases?limit=1';
  var RELEASES_URL = 'https://git.seimel.app/armin/party2d/releases';

  document.addEventListener('DOMContentLoaded', loadLatestRelease);

  function loadLatestRelease() {
    var target = document.getElementById('release-content');
    if (!target || !window.fetch) return;

    fetch(RELEASE_API, { headers: { Accept: 'application/json' } })
      .then(function (response) {
        if (!response.ok) throw new Error('Release API returned ' + response.status);
        return response.json();
      })
      .then(function (releases) {
        if (!Array.isArray(releases) || !releases.length) throw new Error('No published release found');
        renderRelease(target, releases[0]);
      })
      .catch(function () {
        target.replaceChildren();
        var message = document.createElement('p');
        message.className = 'release-error';
        message.append('Release details are temporarily unavailable. ');
        var link = document.createElement('a');
        link.href = RELEASES_URL;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Browse data releases on Gitea.';
        message.appendChild(link);
        target.appendChild(message);
      });
  }

  function renderRelease(target, release) {
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
    if (/election.year.*\.zip$/i.test(name)) return 0;
    if (/annual.model.*\.zip$/i.test(name)) return 1;
    if (/diagnostics.*\.pdf$/i.test(name)) return 2;
    return 10;
  }

  function assetLabel(name) {
    if (/election.year.*\.zip$/i.test(name)) return 'Download election-year panel (.zip)';
    if (/annual.model.*\.zip$/i.test(name)) return 'Download annual model output (.zip)';
    if (/diagnostics.*\.pdf$/i.test(name)) return 'Download diagnostics report (.pdf)';
    return 'Download ' + name;
  }

  function formatDate(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return 'recently';
    return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  }
}());
