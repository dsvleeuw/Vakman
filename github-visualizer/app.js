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
    tabBranches: document.getElementById('tabBranches'),
    tabNetwork: document.getElementById('tabNetwork'),
    viewHeatmap: document.getElementById('viewHeatmap'),
    viewTimeline: document.getElementById('viewTimeline'),
    viewBranches: document.getElementById('viewBranches'),
    viewNetwork: document.getElementById('viewNetwork'),
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
    branchFilter: document.getElementById('branchFilter'),
    btnFetchBranches: document.getElementById('btnFetchBranches'),
    branchesList: document.getElementById('branchesList'),
    branchesEmpty: document.getElementById('branchesEmpty'),
    networkCanvas: document.getElementById('networkCanvas'),
    networkShowAll: document.getElementById('networkShowAll'),
    networkCompact: document.getElementById('networkCompact'),
    networkEmpty: document.getElementById('networkEmpty'),
  };

  const DAYS_NL = ['zon', 'maa', 'din', 'woe', 'don', 'vrij', 'zat'];
  const MONTHS_NL = [
    'januari', 'februari', 'maart', 'april', 'mei', 'juni',
    'juli', 'augustus', 'september', 'oktober', 'november', 'december',
  ];

  let commits = [];
  let authorFilter = localStorage.getItem('ghvis_author') || '';
  let searchFilter = localStorage.getItem('ghvis_search') || '';
  let view = localStorage.getItem('ghvis_view') || 'heatmap';
  let repoOwner = '';
  let repoName = '';
  let branches = [];
  let commitFilesCache = new Map(); // SHA -> file list

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
    els.btnTheme.textContent = dark ? '☀️' : '🌙';
  }

  function toggleTheme() {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('ghvis_theme', dark ? 'dark' : 'light');
    els.btnTheme.textContent = dark ? '☀️' : '🌙';
  }

  /* ---------- toast ---------- */
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    setTimeout(() => els.toast.classList.remove('show'), 2500);
  }

  /* ---------- status ---------- */
  function setStatus(message, kind = 'ok') {
    els.loadStatus.textContent = message;
    els.loadStatus.className = `status status--${kind}`;
  }

  /* ---------- data ---------- */
  async function autoLoadCommits() {
    try {
      const resp = await fetch('commits.json');
      if (resp.ok) {
        const text = await resp.text();
        let json;
        // Try JSON array first, then JSON Lines (one object per line)
        try {
          json = JSON.parse(text);
        } catch {
          // Parse as JSON Lines
          json = text
            .trim()
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line));
        }
        if (Array.isArray(json)) {
          loadCommits(json);
          setStatus(`${commits.length} commits automatisch geladen uit commits.json`, 'ok');
          return true;
        }
      }
    } catch (e) {
      // niet gevonden of niet leesbaar: stil zwijgen, gebruiker kan handmatig laden
    }
    return false;
  }

  function loadCommits(json) {
    if (!Array.isArray(json)) {
      throw new Error('De JSON moet een array (lijst) met commits bevatten.');
    }
    commits = json;
    try {
      localStorage.setItem('ghvis_last_json', JSON.stringify(json));
    } catch (e) {
      // localStorage quota of private mode: negeer, gegevens blijven wel in geheugen
    }
    setStatus(`${commits.length} commit${commits.length === 1 ? '' : 's'} geladen.`, 'ok');
    populateAuthors();
    render();
  }

  function parseAndLoad(text) {
    const json = JSON.parse(text); // werpt fout bij ongeldige JSON
    loadCommits(json);
  }

  function populateAuthors() {
    const authors = [
      ...new Set(commits.map(c => (c && c.author && c.author.name) || null).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, 'nl'));
    els.filterAuthor.innerHTML =
      '<option value="">Alle auteurs</option>' +
      authors.map(a => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('');
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

  /* ---------- GitHub API helpers ---------- */
  function detectRepoFromCommits() {
    if (!commits.length) return null;
    const url = commits[0].url;
    if (!url) return null;
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/commit/);
    if (match) {
      repoOwner = match[1];
      repoName = match[2];
      return { owner: repoOwner, name: repoName };
    }
    return null;
  }

  async function fetchBranches() {
    if (!repoOwner || !repoName) return;
    try {
      setStatus('Branches ophalen van GitHub...', 'ok');
      els.btnFetchBranches.disabled = true;
      els.btnFetchBranches.textContent = 'Laden...';

      const [branchesResp, pullsResp] = await Promise.all([
        fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/branches?per_page=100`),
        fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/pulls?state=all&per_page=100&sort=updated&direction=desc`)
      ]);

      if (!branchesResp.ok || !pullsResp.ok) {
        throw new Error('GitHub API error');
      }

      const branchesData = await branchesResp.json();
      const pullsData = await pullsResp.json();

      // Build branch info with PR data
      const pullsByHead = new Map();
      pullsData.forEach(pr => {
        if (pr.head && pr.head.ref) {
          pullsByHead.set(pr.head.ref, pr);
        }
      });

      branches = branchesData.map(b => {
        const pr = pullsByHead.get(b.name);
        let status = 'active';
        let prInfo = null;
        if (pr) {
          prInfo = {
            number: pr.number,
            title: pr.title,
            state: pr.state,
            merged: pr.merged_at ? true : false,
            url: pr.html_url,
            created: pr.created_at,
            updated: pr.updated_at,
          };
          if (pr.state === 'open') status = 'open';
          else if (pr.merged_at) status = 'merged';
          else status = 'closed';
        } else {
          // Check if branch is stale (no commits in 30 days)
          const lastCommit = commits.find(c => c.sha === b.commit.sha);
          if (lastCommit && lastCommit.author?.date) {
            const daysSince = (Date.now() - new Date(lastCommit.author.date).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince > 30) status = 'stale';
          }
        }
        return {
          name: b.name,
          sha: b.commit.sha,
          protected: b.protected,
          status,
          pr: prInfo,
          lastCommitDate: commits.find(c => c.sha === b.commit.sha)?.author?.date || null,
        };
      });

      renderBranches();
      setStatus(`${branches.length} branches geladen`, 'ok');
    } catch (e) {
      setStatus('Kon branches niet ophalen: ' + e.message, 'error');
    } finally {
      els.btnFetchBranches.disabled = false;
      els.btnFetchBranches.textContent = 'Branches ophalen van GitHub';
    }
  }

  async function fetchCommitFiles(sha) {
    if (commitFilesCache.has(sha)) {
      return commitFilesCache.get(sha);
    }
    if (!repoOwner || !repoName) return [];
    try {
      const resp = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits/${sha}`);
      if (!resp.ok) return [];
      const data = await resp.json();
      const files = (data.files || []).map(f => ({
        filename: f.filename,
        status: f.status, // added, modified, removed, renamed
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch,
      }));
      commitFilesCache.set(sha, files);
      return files;
    } catch (e) {
      return [];
    }
  }

  /* ---------- views ---------- */
  function setView(name, save = true) {
    view = name;
    if (save) {
      localStorage.setItem('ghvis_view', name);
    }
    const heat = name === 'heatmap';
    const time = name === 'timeline';
    const branch = name === 'branches';
    const net = name === 'network';
    els.tabHeatmap.classList.toggle('view-tab--active', heat);
    els.tabTimeline.classList.toggle('view-tab--active', time);
    els.tabBranches.classList.toggle('view-tab--active', branch);
    els.tabNetwork.classList.toggle('view-tab--active', net);
    els.viewHeatmap.classList.toggle('view--active', heat);
    els.viewTimeline.classList.toggle('view--active', time);
    els.viewBranches.classList.toggle('view--active', branch);
    els.viewNetwork.classList.toggle('view--active', net);
    render();

    if (branch && !branches.length && repoOwner && repoName) {
      fetchBranches();
    }
    if (net) {
      renderNetwork();
    }
  }

  function render() {
    const list = filterCommits();
    renderHeatmap(list);
    renderTimeline(list);
    if (view === 'branches') renderBranches();
    if (view === 'network') renderNetwork();
  }

  /* ---------- Branches view ---------- */
  function renderBranches() {
    if (!branches.length) {
      els.branchesList.innerHTML = '';
      els.branchesEmpty.style.display = 'block';
      return;
    }
    els.branchesEmpty.style.display = 'none';

    const filter = els.branchFilter.value;
    let filtered = branches;
    if (filter === 'active') {
      filtered = branches.filter(b => b.status === 'active');
    } else if (filter === 'merged') {
      filtered = branches.filter(b => b.status === 'merged');
    } else if (filter === 'open') {
      filtered = branches.filter(b => b.status === 'open');
    }

    // Sort: open PRs first, then active, merged, stale
    const statusOrder = { open: 0, active: 1, merged: 2, stale: 3, closed: 4 };
    filtered.sort((a, b) => (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5));

    els.branchesList.innerHTML = filtered.map(b => `
      <div class="branch-item" data-branch="${escapeHtml(b.name)}">
        <span class="branch-item__name">${escapeHtml(b.name)}${b.protected ? ' 🔒' : ''}</span>
        <div class="branch-item__meta">
          ${b.pr ? `
            <span class="branch-item__badge branch-item__badge--${b.status}">PR #${b.pr.number}</span>
            <span>${escapeHtml(b.pr.title)}</span>
          ` : `
            <span class="branch-item__badge branch-item__badge--${b.status}">${b.status}</span>
          `}
          ${b.lastCommitDate ? `<span>Laatste commit: ${formatDateTime(b.lastCommitDate)}</span>` : ''}
          ${b.pr ? `<span><a href="${escapeHtml(b.pr.url)}" target="_blank" rel="noopener">Bekijk PR</a></span>` : ''}
        </div>
        <div class="branch-item__actions">
          <button type="button" class="btn btn--outline btn--small" data-action="files" data-sha="${escapeHtml(b.sha)}" data-branch="${escapeHtml(b.name)}">Bestanden</button>
        </div>
        <div class="branch-item__files" data-sha="${escapeHtml(b.sha)}"></div>
      </div>
    `).join('');

    // Bind file buttons
    els.branchesList.querySelectorAll('[data-action="files"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const sha = e.currentTarget.dataset.sha;
        const branchName = e.currentTarget.dataset.branch;
        const filesContainer = e.currentTarget.closest('.branch-item').querySelector('.branch-item__files');
        await toggleBranchFiles(sha, branchName, filesContainer, e.currentTarget);
      });
    });
  }

  async function toggleBranchFiles(sha, branchName, container, button) {
    if (container.classList.contains('branch-item__files--open')) {
      container.classList.remove('branch-item__files--open');
      button.textContent = 'Bestanden';
      return;
    }
    button.textContent = 'Laden...';
    button.disabled = true;
    const files = await fetchCommitFiles(sha);
    if (files.length === 0) {
      container.innerHTML = '<div class="branch-item__files-summary">Geen bestandwijzigingen gevonden of API niet beschikbaar.</div>';
    } else {
      container.innerHTML = `
        <div class="branch-item__files-summary">
          <span>▼ ${files.length} bestand${files.length === 1 ? '' : 's'} gewijzigd</span>
        </div>
        <div class="branch-item__files-list">
          ${files.map(f => `
            <span class="branch-item__file branch-item__file--${f.status}">
              <span class="branch-item__file-status branch-item__file-status--${f.status}">${f.status}</span>
              ${escapeHtml(f.filename)}
              <span style="color:var(--muted);font-size:10px;">+${f.additions}/-${f.deletions}</span>
            </span>
          `).join('')}
        </div>
      `;
    }
    container.classList.add('branch-item__files--open');
    button.textContent = 'Verbergen';
    button.disabled = false;
  }

  /* ---------- Network view (Git graph) ---------- */
  function renderNetwork() {
    const canvas = els.networkCanvas;
    const ctx = canvas.getContext('2d');
    const wrap = canvas.parentElement;

    // Build commit graph data
    const graphData = buildCommitGraph();
    if (!graphData.nodes.length) {
      els.networkEmpty.style.display = 'block';
      canvas.style.display = 'none';
      return;
    }
    els.networkEmpty.style.display = 'none';
    canvas.style.display = 'block';

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const padding = 40;
    const nodeRadius = els.networkCompact.checked ? 4 : 6;
    const rowHeight = els.networkCompact.checked ? 28 : 36;
    const colWidth = 100;

    // Calculate layout
    const layout = layoutGraph(graphData, nodeRadius, rowHeight, colWidth);
    const width = layout.width + padding * 2;
    const height = layout.height + padding * 2;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
    ctx.translate(padding, padding);

    // Draw edges first
    ctx.strokeStyle = '#8c959d';
    ctx.lineWidth = els.networkCompact.checked ? 1.5 : 2;
    layout.edges.forEach(edge => {
      ctx.beginPath();
      ctx.moveTo(edge.from.x, edge.from.y);
      if (edge.type === 'merge') {
        // Curved line for merges
        const cpX = (edge.from.x + edge.to.x) / 2;
        ctx.quadraticCurveTo(cpX, edge.from.y, edge.to.x, edge.to.y);
      } else {
        ctx.lineTo(edge.to.x, edge.to.y);
      }
      ctx.stroke();
    });

    // Draw nodes
    layout.nodes.forEach(node => {
      const color = getNodeColor(node);
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Current HEAD indicator
      if (node.isHead) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#2ea043';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw labels
    ctx.font = els.networkCompact.checked ? '10px monospace' : '11px monospace';
    ctx.fillStyle = '#57606a';
    ctx.textAlign = 'left';
    layout.nodes.forEach(node => {
      if (!els.networkShowAll.checked && !node.isHead && !node.isBranchTip) return;
      const label = node.shortSha + (node.isBranchTip ? ` (${node.branchName})` : '');
      ctx.fillText(label, node.x + nodeRadius + 6, node.y + 3);
    });
  }

  function buildCommitGraph() {
    // Build a simplified graph from commits
    // We need parent info which isn't in the basic commit data
    // For now, create a linear visualization with branch tips marked
    const nodes = [];
    const edges = [];

    // Get unique branch tips
    const branchTips = new Map();
    branches.forEach(b => {
      branchTips.set(b.sha, b.name);
    });

    // Use filtered commits for display
    const list = filterCommits().slice(0, els.networkShowAll.checked ? 200 : 100);
    list.forEach((c, i) => {
      const isBranchTip = branchTips.has(c.sha);
      nodes.push({
        sha: c.sha,
        shortSha: c.sha.slice(0, 7),
        date: c.author?.date,
        author: c.author?.name,
        message: c.message?.split('\n')[0] || '',
        isHead: i === 0,
        isBranchTip,
        branchName: branchTips.get(c.sha) || '',
        index: i,
      });
      if (i > 0) {
        edges.push({
          from: nodes[i - 1],
          to: nodes[i],
          type: isBranchTip ? 'merge' : 'linear',
        });
      }
    });

    return { nodes, edges };
  }

  function layoutGraph(graphData, nodeRadius, rowHeight, colWidth) {
    const nodes = graphData.nodes;
    const edges = graphData.edges;
    let x = 0;
    let y = 0;

    // Simple linear layout with branch offsets
    const branchOffsets = new Map();
    let nextOffset = 0;

    nodes.forEach((node, i) => {
      if (node.isBranchTip && !branchOffsets.has(node.branchName)) {
        branchOffsets.set(node.branchName, nextOffset++);
      }
      const offset = branchOffsets.get(node.branchName) || 0;
      node.x = x + offset * colWidth;
      node.y = y + i * rowHeight;
    });

    // Update edges with positioned nodes
    edges.forEach(edge => {
      edge.from = nodes.find(n => n.sha === edge.from.sha) || edge.from;
      edge.to = nodes.find(n => n.sha === edge.to.sha) || edge.to;
    });

    const width = Math.max(...nodes.map(n => n.x)) + colWidth * branchOffsets.size;
    const height = nodes.length * rowHeight;

    return { nodes, edges, width, height };
  }

  function getNodeColor(node) {
    if (node.isHead) return '#2ea043';
    if (node.isBranchTip) return '#a371f7';
    if (node.message.startsWith('Merge pull request') || node.message.startsWith('Merge branch')) return '#f781a8';
    return '#58a6ff';
  }

  /* ---------- heatmap (bijdragen) ---------- */
  function renderHeatmap(list) {
    els.heatmapGrid.innerHTML = '';
    els.monthLabels.innerHTML = '';
    els.dayLabels.innerHTML = '';
    els.heatmapEmpty.style.display = 'none';
    els.heatmapTooltip.style.display = 'none';

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

    for (let w = 0; w < 52; w++) {
      const weekStart = addDays(start, w * 7);

      // Maandlabel voor de eerste week waarin een maand begint
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
        if (count > 0) {
          const label = `${count} commit${count === 1 ? '' : 's'} op ${formatDate(key)}`;
          cell.addEventListener('mouseenter', evt => showTooltip(evt, label));
          cell.addEventListener('mousemove', moveTooltip);
          cell.addEventListener('mouseleave', hideTooltip);
        }
        els.heatmapGrid.appendChild(cell);
      }
    }

    if (!list.length || Object.keys(counts).length === 0) {
      els.heatmapEmpty.style.display = 'block';
    }
  }

  function showTooltip(evt, label) {
    const t = els.heatmapTooltip;
    t.textContent = label;
    t.style.display = 'block';
    moveTooltip(evt);
  }

  function moveTooltip(evt) {
    const t = els.heatmapTooltip;
    t.style.left = `${evt.clientX + 12}px`;
    t.style.top = `${evt.clientY + 12}px`;
  }

  function hideTooltip() {
    els.heatmapTooltip.style.display = 'none';
  }

  /* ---------- timeline (commits) ---------- */
  function renderTimeline(list) {
    els.timeline.innerHTML = '';
    if (!list.length) {
      els.timelineEmpty.style.display = 'block';
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

    for (const [key, items] of groups) {
      const group = document.createElement('div');
      group.className = 'timeline-group';

      const header = document.createElement('div');
      header.className = 'timeline-group__date';
      header.textContent = formatWeekdayDate(key);
      group.appendChild(header);

      items.forEach(c => group.appendChild(commitCard(c)));
      els.timeline.appendChild(group);
    }
  }

function commitCard(c) {
    const card = document.createElement('article');
    card.className = 'commit-card';
    const short = (c.sha || '').slice(0, 7);
    const full = c.sha || '';
    card.innerHTML = `
      <div class="commit-card__head">
        <span class="commit-card__sha" data-sha="${escapeHtml(
          full
        )}" title="Kopieer SHA naar klembord">${escapeHtml(short)}</span>
        ${
          c.url
            ? `<a class="commit-card__url" href="${escapeHtml(
                c.url
              )}" target="_blank" rel="noopener">Bekijk op GitHub</a>`
            : ''
        }
      </div>
      <div class="commit-card__message">${escapeHtml(c.message || '(geen bericht)')}</div>
      <div class="commit-card__meta">
        <span class="commit-card__author">${escapeHtml(
          c.author && c.author.name ? c.author.name : 'onbekende auteur'
        )} <${escapeHtml(c.author && c.author.email ? c.author.email : '')}></span>
        <time class="commit-card__date">${
          c.author && c.author.date ? formatDateTime(c.author.date) : ''
        }</time>
      </div>
      ${repoOwner && repoName ? `
        <button type="button" class="commit-card__files-toggle" aria-expanded="false" data-sha="${escapeHtml(full)}">
          <span class="toggle-icon">▶</span>
          <span>Bestanden tonen</span>
        </button>
        <div class="commit-card__files" data-sha="${escapeHtml(full)}"></div>
      ` : ''}
    `;
    card.querySelector('.commit-card__sha').addEventListener('click', () => copySha(full));
    const toggleBtn = card.querySelector('.commit-card__files-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', async (e) => {
        const sha = e.currentTarget.dataset.sha;
        const filesContainer = card.querySelector('.commit-card__files');
        await toggleCommitFiles(sha, filesContainer, e.currentTarget);
      });
    }
    return card;
  }

  async function toggleCommitFiles(sha, container, button) {
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      container.classList.remove('commit-card__files--open');
      button.setAttribute('aria-expanded', 'false');
      button.querySelector('.toggle-icon').textContent = '▶';
      button.querySelector('span:last-child').textContent = 'Bestanden tonen';
      return;
    }
    button.disabled = true;
    button.querySelector('span:last-child').textContent = 'Laden...';
    const files = await fetchCommitFiles(sha);
    if (files.length === 0) {
      container.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:8px 0;">Geen bestandwijzigingen gevonden of API niet beschikbaar.</div>';
    } else {
      container.innerHTML = `
        <div class="commit-card__files-list">
          ${files.map(f => `
            <span class="commit-card__file commit-card__file--${f.status}">
              <span class="commit-card__file-status commit-card__file-status--${f.status}">${f.status}</span>
              ${escapeHtml(f.filename)}
              <span style="color:var(--muted);font-size:10px;">+${f.additions}/-${f.deletions}</span>
            </span>
          `).join('')}
        </div>
      `;
    }
    container.classList.add('commit-card__files--open');
    button.setAttribute('aria-expanded', 'true');
    button.querySelector('.toggle-icon').textContent = '▼';
    button.querySelector('span:last-child').textContent = 'Bestanden verbergen';
    button.disabled = false;
  }

  async function copySha(sha) {
    try {
      await navigator.clipboard.writeText(sha);
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
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        try {
          parseAndLoad(e.target.result);
        } catch (err) {
          setStatus('Ongeldig JSON-bestand: ' + escapeHtml(err.message), 'error');
        }
      };
      reader.readAsText(file);
    });

    els.btnLoadPaste.addEventListener('click', () => {
      try {
        parseAndLoad(els.pasteInput.value);
      } catch (err) {
        setStatus('Ongeldig JSON: ' + escapeHtml(err.message), 'error');
      }
    });

    els.tabHeatmap.addEventListener('click', () => setView('heatmap'));
    els.tabTimeline.addEventListener('click', () => setView('timeline'));
    els.tabBranches.addEventListener('click', () => setView('branches'));
    els.tabNetwork.addEventListener('click', () => setView('network'));

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
    });

    // Branches events
    els.branchFilter.addEventListener('change', () => renderBranches());
    els.btnFetchBranches.addEventListener('click', fetchBranches);

    // Network events
    els.networkShowAll.addEventListener('change', () => renderNetwork());
    els.networkCompact.addEventListener('change', () => renderNetwork());

    els.heatmapWrap.addEventListener('mouseleave', hideTooltip);
  }

  /* ---------- init ---------- */
  async function init() {
    initTheme();

    const autoLoaded = await autoLoadCommits();
    if (!autoLoaded) {
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
    }

    // Detect repo from loaded commits
    const repo = detectRepoFromCommits();
    if (repo) {
      els.btnFetchBranches.disabled = false;
      setStatus(`${commits.length} commits geladen. Repository gedetecteerd: ${repo.owner}/${repo.name}`, 'ok');
    }

    els.filterAuthor.value = authorFilter;
    els.searchInput.value = searchFilter;
    setView(view, false);
    bindEvents();
  }

  init();
})();
