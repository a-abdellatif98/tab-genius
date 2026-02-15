// Dashboard UI logic

let currentAnalysis = null;
let selectedTabs = new Set();

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  showLoading();
  await loadAnalysis();
  setupEventListeners();
});

// Load and display analysis
async function loadAnalysis() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'analyzeTabs' });

    if (response.success) {
      currentAnalysis = response.data;
      displaySummary(response.data.stats);
      displayDuplicatesList(response.data.duplicates);
      displayCategories(response.data.tabs);
      displayGroupingOptions(response.data.tabs);
      await loadSessions();
      hideLoading();
    } else {
      showError('Failed to analyze tabs: ' + response.error);
    }
  } catch (error) {
    showError('Error: ' + error.message);
  }
}

// Display summary statistics
function displaySummary(stats) {
  document.getElementById('totalTabs').textContent = stats.total;
  document.getElementById('suggestClose').textContent = stats.byAction.close;
  document.getElementById('suggestBookmark').textContent = stats.byAction.bookmark;
  document.getElementById('suggestKeep').textContent = stats.byAction.keep;
  const dupEl = document.getElementById('duplicatesCount');
  if (dupEl) dupEl.textContent = stats.duplicateCount || 0;

  const dupSection = document.getElementById('duplicatesSection');
  if (dupSection) {
    dupSection.classList.toggle('hidden', !(stats.duplicateCount > 0));
    const label = document.getElementById('duplicatesLabel');
    if (label) label.textContent = `${stats.duplicateCount} duplicate tab${stats.duplicateCount !== 1 ? 's' : ''}`;
  }
}

// Get tabs by action from current analysis
function getTabsByAction(action) {
  if (!currentAnalysis?.tabs) return [];
  const out = [];
  for (const tabs of Object.values(currentAnalysis.tabs)) {
    for (const t of tabs) {
      if (t.action === action) out.push(t);
    }
  }
  return out;
}

// Track which action list is visible (for toggle)
let visibleActionList = null;

// Display action list (close, bookmark, keep) and show/hide section
function showActionList(action) {
  const sections = {
    close: document.getElementById('closeListSection'),
    bookmark: document.getElementById('bookmarkListSection'),
    keep: document.getElementById('keepListSection')
  };
  const containers = {
    close: document.getElementById('closeList'),
    bookmark: document.getElementById('bookmarkList'),
    keep: document.getElementById('keepList')
  };

  const section = sections[action];
  const container = containers[action];
  if (!section || !container) return;

  // Toggle: if this list is already visible, hide it
  if (visibleActionList === action) {
    section.classList.add('hidden');
    visibleActionList = null;
    return;
  }

  // Hide all
  Object.values(sections).forEach(s => s && s.classList.add('hidden'));

  const tabs = getTabsByAction(action);
  if (tabs.length === 0) {
    visibleActionList = null;
    return;
  }

  const borderColors = { close: '#ef4444', bookmark: '#eab308', keep: '#22c55e' };
  container.innerHTML = '';
  tabs.forEach(tab => {
    const item = document.createElement('div');
    item.className = 'action-tab-item tab-clickable';
    item.style.borderLeftColor = borderColors[action] || '#94a3b8';
    const shortUrl = (tab.url || '').length > 80 ? (tab.url || '').slice(0, 77) + '...' : (tab.url || '');
    const title = (tab.title || 'Untitled').slice(0, 60);
    item.innerHTML = `
      <div class="action-tab-info">
        <div class="action-tab-title">${escapeHtml(title)}</div>
        <div class="action-tab-url" title="${escapeHtml(tab.url || '')}">${escapeHtml(shortUrl)}</div>
      </div>
    `;
    item.addEventListener('click', (e) => { e.stopPropagation(); switchToTab(tab.id, tab.windowId); });
    container.appendChild(item);
  });

  section.classList.remove('hidden');
  visibleActionList = action;
  section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Display list of duplicate tab groups
function displayDuplicatesList(duplicates) {
  const container = document.getElementById('duplicatesList');
  if (!container) return;

  container.innerHTML = '';

  if (!duplicates || duplicates.length === 0) return;

  duplicates.forEach((group, idx) => {
    const item = document.createElement('div');
    item.className = 'duplicate-group';
    const shortUrl = group.url.length > 80 ? group.url.slice(0, 77) + '...' : group.url;
    const title = (group.tabs?.[0]?.title || 'Untitled').slice(0, 60);
    item.innerHTML = `
      <div class="duplicate-group-info">
        <span class="duplicate-count">${group.count}×</span>
        <div class="duplicate-details">
          <div class="duplicate-title">${escapeHtml(title)}</div>
          <div class="duplicate-url" title="${escapeHtml(group.url)}">${escapeHtml(shortUrl)}</div>
        </div>
      </div>
    `;
    container.appendChild(item);
  });
}

// Display grouping options for each category
function displayGroupingOptions(categorizedTabs) {
  const container = document.getElementById('groupingContainer');
  if (!container) return;

  container.innerHTML = '';

  const sortedCategories = Object.entries(categorizedTabs).sort(
    (a, b) => b[1].length - a[1].length
  );

  sortedCategories.forEach(([category, tabs]) => {
    if (tabs.length === 0) return;

    const row = document.createElement('div');
    row.className = 'grouping-row';
    row.style.borderLeftColor = tabs[0].color;
    row.innerHTML = `
      <div class="grouping-info">
        <span class="grouping-category">${escapeHtml(tabs[0].categoryName)}</span>
        <span class="grouping-count">${tabs.length} tab${tabs.length !== 1 ? 's' : ''}</span>
      </div>
      <select class="grouping-select" data-category="${category}">
        <option value="keep">Keep as-is</option>
        <option value="new_window">Open in new window</option>
      </select>
    `;
    container.appendChild(row);
  });
}

// Move a tab from one category to another in the analysis data
function moveTabToCategory(tabId, oldCategoryKey, newCategoryKey, newCategoryInfo) {
  if (!currentAnalysis?.tabs) return;

  let tabData = null;
  if (currentAnalysis.tabs[oldCategoryKey]) {
    const idx = currentAnalysis.tabs[oldCategoryKey].findIndex(t => t.id === tabId);
    if (idx >= 0) {
      tabData = currentAnalysis.tabs[oldCategoryKey][idx];
      currentAnalysis.tabs[oldCategoryKey].splice(idx, 1);
    }
  }

  if (tabData) {
    tabData.category = newCategoryKey;
    tabData.categoryName = newCategoryInfo.name;
    tabData.color = newCategoryInfo.color;
    if (!currentAnalysis.tabs[newCategoryKey]) {
      currentAnalysis.tabs[newCategoryKey] = [];
    }
    currentAnalysis.tabs[newCategoryKey].push(tabData);
  }
}

// Collapse or expand all category sections
function collapseExpandAll(collapse) {
  document.querySelectorAll('.tabs-list').forEach(list => {
    if (collapse) {
      list.classList.add('collapsed');
    } else {
      list.classList.remove('collapsed');
    }
  });

  document.querySelectorAll('.category-section .toggle-icon').forEach(icon => {
    icon.textContent = collapse ? '▶' : '▼';
  });
}

// Display all categories with tabs (optionally filtered by search)
function displayCategories(categorizedTabs, searchQuery = '') {
  const container = document.getElementById('categoriesContainer');
  container.innerHTML = '';

  const allCategories = currentAnalysis?.allCategories || [];
  const sortedCategories = Object.entries(categorizedTabs).sort(
    (a, b) => b[1].length - a[1].length
  );

  const q = searchQuery.trim().toLowerCase();

  sortedCategories.forEach(([category, tabs]) => {
    const filtered = q ? tabs.filter(t =>
      (t.title || '').toLowerCase().includes(q) || (t.url || '').toLowerCase().includes(q)
    ) : tabs;
    if (filtered.length === 0) return;

    const categorySection = createCategorySection(category, filtered, allCategories, q);
    container.appendChild(categorySection);
  });
}

// Apply search filter to existing categories (live filter)
function applySearchFilter(query) {
  const q = query.trim().toLowerCase();
  document.querySelectorAll('.tab-item').forEach(item => {
    const title = (item.dataset.title || '').toLowerCase();
    const url = (item.dataset.url || '').toLowerCase();
    const match = !q || title.includes(q) || url.includes(q);
    item.closest('.tabs-list')?.classList.remove('collapsed');
    item.style.display = match ? '' : 'none';
  });
  document.querySelectorAll('.category-section').forEach(section => {
    const hasVisible = Array.from(section.querySelectorAll('.tab-item')).some(el => el.style.display !== 'none');
    section.style.display = hasVisible ? '' : 'none';
  });
}

// Create category section
function createCategorySection(category, tabs, allCategories, searchHighlight = '') {
  const section = document.createElement('div');
  section.className = 'category-section';

  const header = document.createElement('div');
  header.className = 'category-section-header';
  header.style.borderLeftColor = tabs[0].color;
  header.innerHTML = `
    <div class="category-section-title">
      <h3>${tabs[0].categoryName}</h3>
      <span class="category-badge">${tabs.length} tabs</span>
    </div>
    <span class="toggle-icon">▼</span>
  `;

  const tabsList = document.createElement('div');
  tabsList.className = 'tabs-list';
  tabsList.id = `tabs-${category}`;

  tabs.forEach(tab => {
    const tabItem = createTabItem(tab, allCategories);
    tabsList.appendChild(tabItem);
  });

  header.addEventListener('click', () => {
    const icon = header.querySelector('.toggle-icon');
    const isCollapsed = tabsList.classList.toggle('collapsed');
    icon.textContent = isCollapsed ? '▶' : '▼';
  });

  section.appendChild(header);
  section.appendChild(tabsList);

  return section;
}

// Create individual tab item
function createTabItem(tab, allCategories = []) {
  const item = document.createElement('div');
  item.className = `tab-item tab-action-${tab.action}`;
  item.dataset.tabId = tab.id;
  item.dataset.title = tab.title || '';
  item.dataset.url = tab.url || '';

  const favicon = tab.favIconUrl ?
    `<img src="${tab.favIconUrl}" class="tab-favicon" onerror="this.style.display='none'">` :
    '🌐';

  const actionClass = {
    'close': 'action-close',
    'bookmark': 'action-bookmark',
    'keep': 'action-keep'
  }[tab.action];

  const actionLabel = {
    'close': '❌ Close',
    'bookmark': '⭐ Bookmark',
    'keep': '✅ Keep'
  }[tab.action];

  const categoryOptions = allCategories
    .map(c => `<option value="${escapeHtml(c.key)}" ${tab.category === c.key ? 'selected' : ''}>${escapeHtml(c.name)}</option>`)
    .join('');

  item.innerHTML = `
    <input type="checkbox" class="tab-checkbox" data-tab-id="${tab.id}">
    <div class="tab-icon">${favicon}</div>
    <div class="tab-info tab-clickable" title="Click to switch to this tab">
      <div class="tab-title">${escapeHtml(tab.title)}</div>
      <div class="tab-url">${escapeHtml(tab.url)}</div>
      <div class="tab-reason">${escapeHtml(tab.reason)}</div>
    </div>
    <div class="tab-actions">
      <select class="category-select" data-tab-id="${tab.id}" title="Change category">
        ${categoryOptions}
      </select>
      <span class="action-badge ${actionClass}">${actionLabel}</span>
      <select class="action-select" data-tab-id="${tab.id}">
        <option value="keep" ${tab.action === 'keep' ? 'selected' : ''}>✅ Keep</option>
        <option value="close" ${tab.action === 'close' ? 'selected' : ''}>❌ Close</option>
        <option value="bookmark" ${tab.action === 'bookmark' ? 'selected' : ''}>⭐ Bookmark</option>
      </select>
    </div>
  `;

  // Update category on change
  item.querySelector('.category-select').addEventListener('change', (e) => {
    const newCategoryKey = e.target.value;
    const newCategory = allCategories.find(c => c.key === newCategoryKey);
    if (!newCategory || newCategoryKey === tab.category) return;

    moveTabToCategory(tab.id, tab.category, newCategoryKey, newCategory);
    displayCategories(currentAnalysis.tabs);
    displayGroupingOptions(currentAnalysis.tabs);
  });

  // Update action on change
  item.querySelector('.action-select').addEventListener('change', (e) => {
    const newAction = e.target.value;
    const badge = item.querySelector('.action-badge');

    badge.className = `action-badge action-${newAction}`;
    badge.textContent = {
      'close': '❌ Close',
      'bookmark': '⭐ Bookmark',
      'keep': '✅ Keep'
    }[newAction];

    // Update tab data
    for (const [category, tabs] of Object.entries(currentAnalysis.tabs)) {
      const tabData = tabs.find(t => t.id === tab.id);
      if (tabData) {
        tabData.action = newAction;
        break;
      }
    }
  });

  item.querySelector('.tab-info')?.addEventListener('click', (e) => {
    if (e.target.closest('.tab-checkbox') || e.target.closest('.action-select') || e.target.closest('.category-select')) return;
    switchToTab(tab.id, tab.windowId);
  });

  // Track checkbox selection
  item.querySelector('.tab-checkbox').addEventListener('change', (e) => {
    if (e.target.checked) {
      selectedTabs.add(tab.id);
    } else {
      selectedTabs.delete(tab.id);
    }
  });

  return item;
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    showLoading();
    selectedTabs.clear();
    await loadAnalysis();
  });

  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('manualModeBtn').addEventListener('click', (e) => {
    setActiveMode(e.target);
  });

  document.getElementById('autoModeBtn').addEventListener('click', async (e) => {
    const apiKey = await getClaudeApiKey();
    if (!apiKey) {
      alert('Please set your Claude API key in Settings first.');
      chrome.runtime.openOptionsPage();
      return;
    }
    setActiveMode(e.target);
    await runAutoMode(apiKey);
  });

  document.getElementById('collapseAllBtn').addEventListener('click', () => {
    collapseExpandAll(true);
  });

  document.getElementById('expandAllBtn').addEventListener('click', () => {
    collapseExpandAll(false);
  });

  document.getElementById('selectAllBtn').addEventListener('click', () => {
    document.querySelectorAll('.tab-checkbox').forEach(cb => {
      cb.checked = true;
      selectedTabs.add(parseInt(cb.dataset.tabId));
    });
  });

  document.getElementById('deselectAllBtn').addEventListener('click', () => {
    document.querySelectorAll('.tab-checkbox').forEach(cb => {
      cb.checked = false;
    });
    selectedTabs.clear();
  });

  document.getElementById('executeSelectedBtn').addEventListener('click', async () => {
    if (selectedTabs.size === 0) {
      alert('Please select at least one tab to execute actions.');
      return;
    }

    const confirmed = confirm(
      `Execute actions on ${selectedTabs.size} selected tab(s)?`
    );

    if (confirmed) {
      await executeSelectedActions();
    }
  });

  document.getElementById('applyGroupingBtn')?.addEventListener('click', async () => {
    await applyGrouping();
  });

  document.getElementById('tabSearch')?.addEventListener('input', (e) => {
    applySearchFilter(e.target.value);
  });

  document.getElementById('suggestCloseCard')?.addEventListener('click', () => showActionList('close'));
  document.getElementById('suggestBookmarkCard')?.addEventListener('click', () => showActionList('bookmark'));
  document.getElementById('suggestKeepCard')?.addEventListener('click', () => showActionList('keep'));

  document.getElementById('duplicatesSummaryCard')?.addEventListener('click', () => {
    const dup = document.getElementById('duplicatesSection');
    if (dup && !dup.classList.contains('hidden')) dup.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  document.getElementById('closeDuplicatesBtn')?.addEventListener('click', async () => {
    await closeDuplicateTabs();
  });

  document.getElementById('exportJsonBtn')?.addEventListener('click', () => exportSession('json'));
  document.getElementById('exportMdBtn')?.addEventListener('click', () => exportSession('md'));
  document.getElementById('saveSessionBtn')?.addEventListener('click', () => saveSession());

  document.getElementById('restoreSessionSelect')?.addEventListener('change', async (e) => {
    const id = e.target.value;
    if (id) {
      await restoreSession(id);
      e.target.value = '';
    }
  });
}

async function switchToTab(tabId, windowId) {
  try {
    await chrome.tabs.update(tabId, { active: true });
    if (windowId) await chrome.windows.update(windowId, { focused: true });
  } catch (_) {}
}

async function closeDuplicateTabs() {
  if (!currentAnalysis?.duplicates?.length) return;
  const tabIdsToClose = [];
  for (const group of currentAnalysis.duplicates) {
    for (let i = 1; i < group.tabIds.length; i++) {
      tabIdsToClose.push(group.tabIds[i]);
    }
  }
  if (tabIdsToClose.length === 0) return;
  if (!confirm(`Close ${tabIdsToClose.length} duplicate tab(s)?`)) return;
  try {
    await chrome.runtime.sendMessage({ action: 'closeDuplicateTabs', tabIdsToClose });
    await loadAnalysis();
  } catch (e) {
    alert('Failed: ' + e.message);
  }
}

function exportSession(format) {
  if (!currentAnalysis?.tabs) return;
  const tabs = [];
  for (const tabList of Object.values(currentAnalysis.tabs)) {
    tabs.push(...tabList.map(t => ({ url: t.url, title: t.title, category: t.categoryName })));
  }
  let content, filename, mime;
  if (format === 'json') {
    content = JSON.stringify({ tabs, exportedAt: new Date().toISOString() }, null, 2);
    filename = `tab-genius-${Date.now()}.json`;
    mime = 'application/json';
  } else {
    content = '# Tab Genius Export\n\n' + tabs.map(t => `- [${t.title}](${t.url})`).join('\n');
    filename = `tab-genius-${Date.now()}.md`;
    mime = 'text/markdown';
  }
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function saveSession() {
  if (!currentAnalysis?.tabs) return;
  const name = prompt('Session name:', `Session ${new Date().toLocaleDateString()}`);
  if (!name) return;
  const tabs = [];
  for (const tabList of Object.values(currentAnalysis.tabs)) {
    tabs.push(...tabList.map(t => ({ url: t.url, title: t.title })));
  }
  try {
    await chrome.runtime.sendMessage({ action: 'saveSession', name: name.trim(), tabs });
    await loadSessions();
    alert('Session saved!');
  } catch (e) {
    alert('Failed: ' + e.message);
  }
}

async function restoreSession(sessionId) {
  try {
    const r = await chrome.runtime.sendMessage({ action: 'restoreSession', sessionId });
    if (r.success) alert(`Restored ${r.restored} tab(s)`);
    else alert(r.error);
  } catch (e) {
    alert('Failed: ' + e.message);
  }
}

async function loadSessions() {
  try {
    const r = await chrome.runtime.sendMessage({ action: 'getSessions' });
    const select = document.getElementById('restoreSessionSelect');
    if (!select || !r.success) return;
    const optCount = select.options.length;
    for (let i = 1; i < optCount; i++) select.remove(1);
    (r.sessions || []).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.tabs?.length || 0} tabs)`;
      select.appendChild(opt);
    });
  } catch (_) {}
}

// Execute actions on selected tabs
async function executeSelectedActions() {
  showLoading('Executing actions...');

  const actions = [];

  for (const [category, tabs] of Object.entries(currentAnalysis.tabs)) {
    tabs.forEach(tab => {
      if (selectedTabs.has(tab.id)) {
        actions.push({
          type: tab.action,
          tabId: tab.id,
          title: tab.title,
          url: tab.url,
          reason: tab.reason,
          category,
          categoryName: tab.categoryName,
          closeAfterBookmark: tab.action === 'bookmark'
        });
      }
    });
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'executeActions',
      actions: actions
    });

    if (response.success) {
      await generateReport(response.results);
      alert(
        `Actions executed successfully!\n\n` +
        `Closed: ${response.results.closed.length}\n` +
        `Bookmarked: ${response.results.bookmarked.length}\n` +
        `Kept: ${response.results.kept.length}\n` +
        `Errors: ${response.results.errors.length}`
      );

      // Refresh
      selectedTabs.clear();
      await loadAnalysis();
    } else {
      showError('Failed to execute actions: ' + response.error);
    }
  } catch (error) {
    showError('Error: ' + error.message);
  }
}

// Run automatic mode with Claude API
async function runAutoMode(apiKey) {
  showLoading('Analyzing with Claude AI...');

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'analyzeWithClaude',
      tabsData: currentAnalysis.tabs,
      apiKey: apiKey
    });

    if (response.success) {
      applyClaudeDecisions(response.decisions);
      displayCategories(currentAnalysis.tabs);
      hideLoading();
      alert('Claude has analyzed your tabs! Review the suggestions and execute when ready.');
    } else {
      showError('Claude analysis failed: ' + response.error);
    }
  } catch (error) {
    showError('Error: ' + error.message);
  }
}

// Apply tab grouping based on user selection
async function applyGrouping() {
  if (!currentAnalysis?.tabs) return;

  const groupings = {};
  document.querySelectorAll('.grouping-select').forEach(select => {
    groupings[select.dataset.category] = select.value;
  });

  const hasNewWindow = Object.values(groupings).some(v => v === 'new_window');
  if (!hasNewWindow) {
    alert('Select "Open in new window" for at least one category to apply grouping.');
    return;
  }

  const confirmed = confirm(
    'This will move selected categories to new windows and group them. Continue?'
  );
  if (!confirmed) return;

  showLoading('Applying grouping...');

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'groupTabs',
      groupings,
      tabsByCategory: currentAnalysis.tabs
    });

    if (response.success) {
      const count = response.results?.grouped?.length || 0;
      hideLoading();
      alert(`Grouping applied! ${count} categor${count !== 1 ? 'ies' : 'y'} moved to new windows.`);
      await loadAnalysis();
    } else {
      showError('Grouping failed: ' + response.error);
    }
  } catch (error) {
    showError('Error: ' + error.message);
  }
}

// Apply Claude's decisions
function applyClaudeDecisions(decisions) {
  for (const [category, decision] of Object.entries(decisions)) {
    const tabs = currentAnalysis.tabs[category];
    if (!tabs) continue;

    tabs.forEach(tab => {
      if (decision.action === 'close_most' && !decision.keep?.includes(tab.id)) {
        tab.action = 'close';
        tab.reason = decision.reason;
      } else if (decision.action === 'keep_all') {
        tab.action = 'keep';
        tab.reason = decision.reason;
      } else if (decision.action === 'bookmark_useful') {
        tab.action = 'bookmark';
        tab.reason = decision.reason;
      }
    });
  }
}

// Generate and download report
async function generateReport(results) {
  const timestamp = new Date().toLocaleString();
  let report = `TAB GENIUS - DETAILED REPORT\n`;
  report += `Generated: ${timestamp}\n`;
  report += `${'='.repeat(80)}\n\n`;

  report += `SUMMARY\n`;
  report += `${'-'.repeat(80)}\n`;
  report += `Total Tabs Processed: ${results.closed.length + results.bookmarked.length + results.kept.length}\n`;
  report += `Tabs Closed: ${results.closed.length}\n`;
  report += `Tabs Bookmarked: ${results.bookmarked.length}\n`;
  report += `Tabs Kept Open: ${results.kept.length}\n`;
  report += `Errors Encountered: ${results.errors.length}\n\n`;

  if (results.closed.length > 0) {
    report += `CLOSED TABS (${results.closed.length})\n`;
    report += `${'-'.repeat(80)}\n`;
    results.closed.forEach((tab, index) => {
      report += `${index + 1}. ${tab.title}\n`;
      report += `   URL: ${tab.url}\n`;
      report += `   Reason: ${tab.reason}\n\n`;
    });
  }

  if (results.bookmarked.length > 0) {
    report += `BOOKMARKED TABS (${results.bookmarked.length})\n`;
    report += `${'-'.repeat(80)}\n`;
    results.bookmarked.forEach((tab, index) => {
      report += `${index + 1}. ${tab.title}\n`;
      report += `   URL: ${tab.url}\n`;
      report += `   Reason: ${tab.reason}\n`;
      report += `   Status: ${tab.closed ? 'Closed after bookmarking' : 'Kept open'}\n\n`;
    });
  }

  if (results.kept.length > 0) {
    report += `KEPT OPEN (${results.kept.length})\n`;
    report += `${'-'.repeat(80)}\n`;
    results.kept.forEach((tab, index) => {
      report += `${index + 1}. ${tab.title}\n`;
      report += `   URL: ${tab.url}\n`;
      report += `   Reason: ${tab.reason}\n\n`;
    });
  }

  if (results.errors.length > 0) {
    report += `ERRORS (${results.errors.length})\n`;
    report += `${'-'.repeat(80)}\n`;
    results.errors.forEach((error, index) => {
      report += `${index + 1}. ${error.title || 'Unknown'}\n`;
      report += `   Error: ${error.error}\n\n`;
    });
  }

  report += `\n${'='.repeat(80)}\n`;
  report += `Report generated by Tab Genius\n`;

  await chrome.runtime.sendMessage({
    action: 'downloadReport',
    report: report
  });
}

// Helper functions
function setActiveMode(button) {
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
}

async function getClaudeApiKey() {
  const result = await chrome.storage.sync.get(['claudeApiKey']);
  return result.claudeApiKey || null;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading(message = 'Analyzing your tabs...') {
  document.getElementById('loading').querySelector('p').textContent = message;
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('content').classList.add('hidden');
}

function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('content').classList.remove('hidden');
}

function showError(message) {
  hideLoading();
  alert(message);
}
