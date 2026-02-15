// Popup UI logic

let currentAnalysis = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  showLoading();
  await analyzeTabsAndDisplay();
  setupEventListeners();
});

// Analyze tabs and display results
async function analyzeTabsAndDisplay() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'analyzeTabs' });

    if (response.success) {
      currentAnalysis = response.data;
      displayStats(response.data.stats);
      displayCategories(response.data.tabs);
      hideLoading();
    } else {
      showError('Failed to analyze tabs: ' + response.error);
    }
  } catch (error) {
    showError('Error: ' + error.message);
  }
}

// Display statistics
function displayStats(stats) {
  document.getElementById('totalTabs').textContent = stats.total;
  document.getElementById('suggestClose').textContent = stats.byAction.close;
  document.getElementById('suggestBookmark').textContent = stats.byAction.bookmark;
}

// Display categories summary
function displayCategories(categorizedTabs) {
  const container = document.getElementById('categories');
  container.innerHTML = '';

  const sortedCategories = Object.entries(categorizedTabs).sort(
    (a, b) => b[1].length - a[1].length
  );

  sortedCategories.forEach(([category, tabs]) => {
    if (tabs.length === 0) return;

    const categoryCard = document.createElement('div');
    categoryCard.className = 'category-card';
    categoryCard.style.borderLeftColor = tabs[0].color;

    const closeCount = tabs.filter(t => t.action === 'close').length;
    const bookmarkCount = tabs.filter(t => t.action === 'bookmark').length;

    categoryCard.innerHTML = `
      <div class="category-header">
        <span class="category-name">${tabs[0].categoryName}</span>
        <span class="category-count">${tabs.length}</span>
      </div>
      <div class="category-actions">
        ${closeCount > 0 ? `<span class="badge badge-close">${closeCount} to close</span>` : ''}
        ${bookmarkCount > 0 ? `<span class="badge badge-bookmark">${bookmarkCount} to bookmark</span>` : ''}
      </div>
    `;

    container.appendChild(categoryCard);
  });
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('viewDashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'dashboard.html' });
  });

  document.getElementById('quickCleanup').addEventListener('click', async () => {
    if (!currentAnalysis) return;

    const confirmed = confirm(
      'This will close tabs marked for cleanup and bookmark important references. Continue?'
    );

    if (confirmed) {
      await performQuickCleanup();
    }
  });

  document.getElementById('autoMode').addEventListener('change', async (e) => {
    if (e.target.checked) {
      const apiKey = await getClaudeApiKey();
      if (!apiKey) {
        e.target.checked = false;
        alert('Please set your Claude API key in the extension options first.');
        chrome.runtime.openOptionsPage();
      }
    }
  });
}

// Perform quick cleanup
async function performQuickCleanup() {
  showLoading('Cleaning up tabs...');

  const actions = [];

  // Collect all suggested actions
  for (const [category, tabs] of Object.entries(currentAnalysis.tabs)) {
    tabs.forEach(tab => {
      if (tab.action === 'close' || tab.action === 'bookmark') {
        actions.push({
          type: tab.action,
          tabId: tab.id,
          title: tab.title,
          url: tab.url,
          reason: tab.reason,
          category,
          categoryName: tab.categoryName,
          closeAfterBookmark: true
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
      alert(`Cleanup complete!\n\nClosed: ${response.results.closed.length}\nBookmarked: ${response.results.bookmarked.length}`);

      // Refresh analysis
      await analyzeTabsAndDisplay();
    } else {
      showError('Cleanup failed: ' + response.error);
    }
  } catch (error) {
    showError('Error during cleanup: ' + error.message);
  }
}

// Generate and download report
async function generateReport(results) {
  const timestamp = new Date().toLocaleString();
  let report = `TAB GENIUS - CLEANUP REPORT\n`;
  report += `Generated: ${timestamp}\n`;
  report += `${'='.repeat(60)}\n\n`;

  report += `SUMMARY\n`;
  report += `${'-'.repeat(60)}\n`;
  report += `Tabs Closed: ${results.closed.length}\n`;
  report += `Tabs Bookmarked: ${results.bookmarked.length}\n`;
  report += `Tabs Kept: ${results.kept.length}\n`;
  report += `Errors: ${results.errors.length}\n\n`;

  if (results.closed.length > 0) {
    report += `CLOSED TABS\n`;
    report += `${'-'.repeat(60)}\n`;
    results.closed.forEach((tab, index) => {
      report += `${index + 1}. ${tab.title}\n`;
      report += `   URL: ${tab.url}\n`;
      report += `   Reason: ${tab.reason}\n\n`;
    });
  }

  if (results.bookmarked.length > 0) {
    report += `BOOKMARKED TABS\n`;
    report += `${'-'.repeat(60)}\n`;
    results.bookmarked.forEach((tab, index) => {
      report += `${index + 1}. ${tab.title}\n`;
      report += `   URL: ${tab.url}\n`;
      report += `   Reason: ${tab.reason}\n`;
      report += `   ${tab.closed ? 'Tab was closed after bookmarking' : 'Tab kept open'}\n\n`;
    });
  }

  if (results.errors.length > 0) {
    report += `ERRORS\n`;
    report += `${'-'.repeat(60)}\n`;
    results.errors.forEach((error, index) => {
      report += `${index + 1}. ${error.title}\n`;
      report += `   Error: ${error.error}\n\n`;
    });
  }

  // Download report
  await chrome.runtime.sendMessage({
    action: 'downloadReport',
    report: report
  });
}

// Get Claude API key from storage
async function getClaudeApiKey() {
  const result = await chrome.storage.sync.get(['claudeApiKey']);
  return result.claudeApiKey || null;
}

// UI Helper functions
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
