(() => {
  'use strict';

  /* ---------- DOM elements ---------- */
  const els = {
    fileInput: document.getElementById('fileInput'),
    pasteInput: document.getElementById('pasteInput'),
    btnLoadPaste: document.getElementById('btnLoadPaste'),
    loadStatus: document.getElementById('loadStatus'),
    filterAuthor: document.getElementById('filterAuthor'),
    searchInput: document.getElementById('searchInput'),
    btnResetFilters: document.getElementById('btnResetFilters'),
    tabHeatmap: document.getElementById('tabHeatmap'),
    tabTimeline: document.getElementById('tabTimeline'),
    viewHeatmap: document.getElementById('viewHeatmap'),
    viewTimeline: document.getElementById('viewTimeline'),
    heatmapGrid: document.getElementById('heatmapGrid'),
    monthLabels: document.getElementById('monthLabels'),
    dayLabels: document.getElementById('dayLabels'),
    heatmapEmpty: document.getElementById('heatmapEmpty'),
    heatmapTooltip: document.getElementById('heatmapTooltip'),
    heatmapWrap: document.getElementById('heatmapWrap'),
    timeline: document.getElementById('timeline'),
    timelineEmpty: document.getElementById('timelineEmpty'),
    btnTheme: document.getElementById('btnTheme'),
    tabFile: document.getElementById('tabFile'),
    tabPaste: document.getElementById('tabPaste'),
    panelFile: document.getElementById('panelFile'),
    panelPaste: document.getElementById('panelPaste'),
    toast: document.getElementById('toast'),
  };

  /* ---------- constants ---------- */
  const DAYS_NL = ['zon', 'maa', 'din', 'woe', 'don', 'vrij', 'zat'];
  const MONTHS_NL = [
    'januari', 'februari', 'maart', 'april', 'mei', 'juni',
    'juli', 'augustus', 'september', 'oktober', 'november', 'december',
  ];
  const ANIM_STAGGER_MS = 6;

  /* ---------- state ---------- */
  let commits = [];
  let authorFilter = localStorage.getItem('ghvis_author') || '';
  let searchFilter = localStorage.getItem('ghvis_search') || '';
  let view = localStorage.getItem('ghvis_view') || 'heatmap';
  let isLoading = false;

  /* ---------- helpers ---------- */
  function dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function localDateKey(iso) {
    return dateKey(new Date(iso));
  }

  function startOfWeek(date) {
    // Zondag als begin van de week (GitHub-stijl)
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function levelOf(count) {
    if (count === 0) return 0;
    if (count <= 3) return 1;
    if (count <= 6) return 2;
    return 3;
  }

  function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  function formatDate(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function formatWeekdayDate(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function formatDateTime(iso) {
    return new Date(iso).toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /* ---------- theme ---------- */
  function initTheme() {
    const stored = localStorage.getItem('ghvis_theme');
    const dark =
      stored === 'dark' ||
      (stored === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    applyTheme(dark);
  }

  function applyTheme(dark) {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const icon = els.btnTheme.querySelector('.icon-btn__icon');
    icon.textContent = dark ? '☀️' : '🌙';
  }

  function toggleTheme() {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('ghvis_theme', dark ? 'dark' : 'light');
    applyTheme(dark);
    showToast(dark ? 'Donkere modus aan' : 'Lichte modus aan');
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function showToast(message, duration = 2500) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add('show');
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), duration);
  }

  /* ---------- status ---------- */
  function setStatus(message, kind = 'ok') {
    els.loadStatus.textContent = message;
    els.loadStatus.className = `status status--${kind}`;
    els.loadStatus.style.opacity = '1';
    setTimeout(() => { els.loadStatus.style.opacity = '0'; }, 4000);
  }

  function showSkeleton(show) {
    isLoading = show;
    if (show) {
      els.heatmapGrid.innerHTML = '';
      els.monthLabels.innerHTML = '';
      els.dayLabels.innerHTML = '';
      els.timeline.innerHTML = '';
      els.heatmapEmpty.style.display = 'none';
      els.timelineEmpty.style.display = 'none';
      for (let i = 0; i < 7; i++) {
        const row = document.createElement('div');
        row.className = 'skeleton';
        row.style.height = '11px';
        row.style.width = '100%';
        els.heatmapGrid.appendChild(row);
      }
      for (let i = 0; i < 4; i++) {
        const card = document.createElement('div');
        card.className = 'skeleton commit-card skeleton-card';
        card.style.height = '120px';
        card.style.marginBottom = '0.75rem';
        card.innerHTML = '<div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text" style="width:80%"></div><div class="skeleton skeleton-text"></div>';
        els.timeline.appendChild(card);
      }
    } else {
      document.querySelectorAll('.skeleton-card').forEach(n => n.remove());
    }
  }

  /* ---------- data ---------- */
  function loadCommits(json) {
    if (!Array.isArray(json)) {
      throw new Error('De JSON moet een array (lijst) met commits bevatten.');
    }
    commits = json;
    try {
      localStorage.setItem('ghvis_last_json', JSON.stringify(json));
    } catch (e) {
      // localStorage quota / private mode: negeer
    }
    setStatus(`${commits.length} commit${commits.length === 1 ? '' : 's'} geladen.`, 'ok');
    populateAuthors();
    render();
  }

  function parseAndLoad(text) {
    const json = JSON.parse(text);
    loadCommits(json);
  }

  function populateAuthors() {
    const authors = [
      ...new Set(commits.map(c => (c && c.author && c.author.name) || null).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, 'nl'));
    const options = authors.map(a => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('');
    els.filterAuthor.innerHTML = '<option value="">Alle auteurs</option>' + options;
    els.filterAuthor.value = authorFilter;
  }

  function filterCommits() {
    const term = searchFilter.toLowerCase();
    return commits.filter(c => {
      const authorOk = !authorFilter || (c.author && c.author.name === authorFilter);
      if (!authorOk) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = [
        c.message || '',
        c.sha || '',
        c.author && c.author.name || '',
        c.author && c.author.email || '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }

  /* ---------- views ---------- */
  function setView(name, save = true) {
    view = name;
    if (save) {
      localStorage.setItem('ghvis_view', name);
    }
    const heat = name === 'heatmap';
    els.tabHeatmap.classList.toggle('view-tab--active', heat);
    els.tabTimeline.classList.toggle('view-tab--active', !heat);
    els.viewHeatmap.classList.toggle('view--active', heat);
    els.viewTimeline.classList.toggle('view--active', !heat);
    const list = filterCommits();
    renderHeatmap(list);
    renderTimeline(list);
  }

  function render() {
    const list = filterCommits();
    renderHeatmap(list);
    renderTimeline(list);
  }

  /* ---------- heatmap ---------- */
  function renderHeatmap(list) {
    els.heatmapGrid.innerHTML = '';
    els.monthLabels.innerHTML = '';
    els.dayLabels.innerHTML = '';
    els.heatmapEmpty.style.display = 'none';
    els.heatmapTooltip.classList.remove('visible');

    DAYS_NL.forEach(day => {
      const div = document.createElement('div');
      div.className = 'day';
      div.textContent = day;
      els.dayLabels.appendChild(div);
    });

    const counts = {};
    list.forEach(c => {
      if (!c || !c.author || !c.author.date) {
        return;
      }
      const key = localDateKey(c.author.date);
      counts[key] = (counts[key] || 0) + 1;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = dateKey(today);
    const start = startOfWeek(addDays(today, -364));

    let cellIndex = 0;
    const fragment = document.createDocumentFragment();

    for (let w = 0; w < 52; w++) {
      const weekStart = addDays(start, w * 7);

      let monthLabel = '';
      for (let d = 0; d < 7; d++) {
        const probe = addDays(weekStart, d);
        if (probe.getDate() === 1) {
          monthLabel = MONTHS_NL[probe.getMonth()];
          break;
        }
      }
      const monthDiv = document.createElement('div');
      monthDiv.className = 'month';
      monthDiv.textContent = monthLabel;
      els.monthLabels.appendChild(monthDiv);

      for (let d = 0; d < 7; d++) {
        const day = addDays(weekStart, d);
        const key = dateKey(day);
        const count = counts[key] || 0;
        const cell = document.createElement('div');
        cell.className = `heatmap-cell level-${levelOf(count)} ${
          key === todayKey ? 'heatmap-cell--today' : ''
        }`;
        cell.dataset.date = key;
        cell.dataset.count = count;
        cell.style.animationDelay = `${cellIndex * ANIM_STAGGER_MS}ms`;
        cellIndex++;

        if (count > 0) {
          const label = `${count} commit${count === 1 ? '' : 's'} op ${formatDate(key)}`;
          cell.addEventListener('mouseenter', evt => showTooltip(evt, label));
          cell.addEventListener('mousemove', moveTooltip);
          cell.addEventListener('mouseleave', hideTooltip);
        }
        fragment.appendChild(cell);
      }
    }
    els.heatmapGrid.appendChild(fragment);

    if (!list.length || Object.keys(counts).length === 0) {
      els.heatmapEmpty.style.display = 'flex';
    }
  }

  function showTooltip(evt, label) {
    const t = els.heatmapTooltip;
    t.textContent = label;
    t.classList.add('visible');
    moveTooltip(evt);
  }

  function moveTooltip(evt) {
    const t = els.heatmapTooltip;
    t.style.left = `${evt.clientX + 14}px`;
    t.style.top = `${evt.clientY + 14}px`;
  }

  function hideTooltip() {
    els.heatmapTooltip.classList.remove('visible');
  }

  /* ---------- timeline ---------- */
  function renderTimeline(list) {
    els.timeline.innerHTML = '';
    if (!list.length) {
      els.timelineEmpty.style.display = 'flex';
      return;
    }
    els.timelineEmpty.style.display = 'none';

    const groups = new Map();
    [...list]
      .sort((a, b) => new Date(b.author.date) - new Date(a.author.date))
      .forEach(c => {
        const key = localDateKey(c.author.date);
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key).push(c);
      });

    const fragment = document.createDocumentFragment();
    let groupIndex = 0;
    for (const [key, items] of groups) {
      const group = document.createElement('div');
      group.className = 'timeline-group';
      group.style.animationDelay = `${groupIndex * 60}ms`;
      groupIndex++;

      const marker = document.createElement('div');
      marker.className = 'timeline-group__marker';
      group.appendChild(marker);

      const header = document.createElement('div');
      header.className = 'timeline-group__date';
      header.textContent = formatWeekdayDate(key);
      group.appendChild(header);

      items.forEach(c => group.appendChild(commitCard(c)));
      fragment.appendChild(group);
    }
    els.timeline.appendChild(fragment);
  }

  function commitCard(c) {
    const card = document.createElement('article');
    card.className = 'commit-card';
    const short = (c.sha || '').slice(0, 7);
    const full = c.sha || '';
    card.innerHTML = `
      <div class="commit-card__head">
        <span class="commit-card__sha" data-sha="${escapeHtml(full)}" title="Kopieer SHA naar klembord">${escapeHtml(short)}</span>
        ${c.url ? `<a class="commit-card__url" href="${escapeHtml(c.url)}" target="_blank" rel="noopener">Bekijk op GitHub</a>` : ''}
      </div>
      <div class="commit-card__message">${escapeHtml(c.message || '(geen bericht)')}</div>
      <div class="commit-card__meta">
        <span class="commit-card__author">${escapeHtml(c.author && c.author.name ? c.author.name : 'onbekende auteur')} &lt;${escapeHtml(c.author && c.author.email ? c.author.email : '')}&gt;</span>
        <time class="commit-card__date">${c.author && c.author.date ? formatDateTime(c.author.date) : ''}</time>
      </div>
    `;
    const shaBtn = card.querySelector('.commit-card__sha');
    shaBtn.addEventListener('click', () => copySha(full));
    shaBtn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        copySha(full);
      }
    });
    shaBtn.setAttribute('tabindex', '0');
    shaBtn.setAttribute('role', 'button');
    return card;
  }

  async function copySha(sha) {
    const btn = document.querySelector(`.commit-card__sha[data-sha="${escapeHtml(sha)}"]`);
    const original = btn ? btn.textContent : '';
    try {
      await navigator.clipboard.writeText(sha);
      if (btn) {
        btn.textContent = '✓ gekopieerd';
        btn.style.color = 'var(--color-success)';
        setTimeout(() => {
          btn.textContent = original;
          btn.style.color = '';
        }, 1400);
      }
      showToast('SHA gekopieerd naar klembord');
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = sha;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        showToast('SHA gekopieerd naar klembord');
      } catch (e) {
        showToast('Kopieëren mislukt');
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  /* ---------- events ---------- */
  function bindEvents() {
    els.btnTheme.addEventListener('click', toggleTheme);

    els.tabFile.addEventListener('click', () => {
      els.tabFile.classList.add('input-tab--active');
      els.tabPaste.classList.remove('input-tab--active');
      els.panelFile.classList.add('input-panel--active');
      els.panelPaste.classList.remove('input-panel--active');
    });
    els.tabPaste.addEventListener('click', () => {
      els.tabPaste.classList.add('input-tab--active');
      els.tabFile.classList.remove('input-tab--active');
      els.panelPaste.classList.add('input-panel--active');
      els.panelFile.classList.remove('input-panel--active');
    });

    els.fileInput.addEventListener('change', evt => {
      const file = evt.target.files && evt.target.files[0];
      if (!file) return;
      showSkeleton(true);
      setTimeout(() => {
        const reader = new FileReader();
        reader.onload = e => {
          try {
            parseAndLoad(e.target.result);
          } catch (err) {
            setStatus('Ongeldig JSON-bestand: ' + escapeHtml(err.message), 'error');
          } finally {
            showSkeleton(false);
          }
        };
        reader.readAsText(file);
      }, 120);
    });

    els.btnLoadPaste.addEventListener('click', () => {
      showSkeleton(true);
      setTimeout(() => {
        try {
          parseAndLoad(els.pasteInput.value);
        } catch (err) {
          setStatus('Ongeldig JSON: ' + escapeHtml(err.message), 'error');
        } finally {
          showSkeleton(false);
        }
      }, 120);
    });

    els.tabHeatmap.addEventListener('click', () => setView('heatmap'));
    els.tabTimeline.addEventListener('click', () => setView('timeline'));

    els.filterAuthor.addEventListener('change', evt => {
      authorFilter = evt.target.value;
      localStorage.setItem('ghvis_author', authorFilter);
      render();
    });
    els.searchInput.addEventListener('input', evt => {
      searchFilter = evt.target.value;
      localStorage.setItem('ghvis_search', searchFilter);
      render();
    });
    els.btnResetFilters.addEventListener('click', () => {
      authorFilter = '';
      searchFilter = '';
      els.filterAuthor.value = '';
      els.searchInput.value = '';
      localStorage.removeItem('ghvis_author');
      localStorage.removeItem('ghvis_search');
      render();
      showToast('Filters gereset');
    });

    els.heatmapWrap.addEventListener('mouseleave', hideTooltip);
  }

  /* ---------- init ---------- */
  function init() {
    initTheme();

    const storedJson = localStorage.getItem('ghvis_last_json');
    if (storedJson) {
      try {
        const parsed = JSON.parse(storedJson);
        if (Array.isArray(parsed)) {
          loadCommits(parsed);
          setStatus('Eerder geladen gegevens hersteld uit lokale opslag.', 'ok');
        }
      } catch (e) {
        // corrupte opslag: negeren
      }
    }

    els.filterAuthor.value = authorFilter;
    els.searchInput.value = searchFilter;
    setView(view, false);
    bindEvents();
  }

  init();
})();
