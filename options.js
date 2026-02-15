// Options page logic

// Load saved settings on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

// Load settings from storage
async function loadSettings() {
  const settings = await chrome.storage.sync.get([
    'claudeApiKey',
    'autoCloseOldTabs',
    'inactiveHours',
    'autoBookmarkDocs',
    'closeAfterBookmark',
    'bookmarkSaveLocation',
    'bookmarkFolderParent',
    'categoryActions',
    'customCategories'
  ]);

  // Populate form fields
  if (settings.claudeApiKey) {
    document.getElementById('apiKey').value = settings.claudeApiKey;
  }

  document.getElementById('autoCloseOldTabs').checked = settings.autoCloseOldTabs || false;
  document.getElementById('inactiveHours').value = settings.inactiveHours || '24';
  document.getElementById('autoBookmarkDocs').checked = settings.autoBookmarkDocs || false;
  document.getElementById('closeAfterBookmark').checked = settings.closeAfterBookmark || true;
  document.getElementById('bookmarkSaveLocation').value = settings.bookmarkSaveLocation || 'category_folder';
  document.getElementById('bookmarkFolderParent').value = settings.bookmarkFolderParent || 'other_bookmarks';
  updateBookmarkFolderVisibility();

  // Load category actions
  if (settings.categoryActions) {
    document.querySelectorAll('.category-action').forEach(select => {
      const category = select.dataset.category;
      if (settings.categoryActions[category]) {
        select.value = settings.categoryActions[category];
      }
    });
  }

  // Load and display custom categories
  renderCustomCategories(settings.customCategories || []);
}

// Setup event listeners
function setupEventListeners() {
  // Toggle API key visibility
  document.getElementById('toggleApiKey').addEventListener('click', (e) => {
    const input = document.getElementById('apiKey');
    if (input.type === 'password') {
      input.type = 'text';
      e.target.textContent = 'Hide';
    } else {
      input.type = 'password';
      e.target.textContent = 'Show';
    }
  });

  // Test API key
  document.getElementById('testApiKey').addEventListener('click', async () => {
    await testApiKey();
  });

  // Save settings
  document.getElementById('saveSettings').addEventListener('click', async () => {
    await saveSettings();
  });

  // Reset settings
  document.getElementById('resetSettings').addEventListener('click', async () => {
    const confirmed = confirm('Are you sure you want to reset all settings to defaults?');
    if (confirmed) {
      await resetSettings();
    }
  });

  // Documentation links
  document.getElementById('viewDocs').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Documentation coming soon!');
  });

  document.getElementById('reportIssue').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Please email your issues to: support@tabgenius.com');
  });

  document.getElementById('rateExtension').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Thank you for using Tab Genius!');
  });

  // Custom categories
  document.getElementById('addCategoryBtn').addEventListener('click', () => {
    showCategoryForm();
  });

  document.getElementById('saveCategoryBtn').addEventListener('click', async () => {
    await saveCustomCategory();
  });

  document.getElementById('cancelCategoryBtn').addEventListener('click', () => {
    hideCategoryForm();
  });

  document.getElementById('bookmarkSaveLocation').addEventListener('change', updateBookmarkFolderVisibility);
}

function updateBookmarkFolderVisibility() {
  const location = document.getElementById('bookmarkSaveLocation').value;
  const parentGroup = document.getElementById('bookmarkFolderParentGroup');
  parentGroup.classList.toggle('hidden', location !== 'category_folder');
}

// Custom Categories logic
let editingCategoryId = null;

function renderCustomCategories(categories) {
  const container = document.getElementById('customCategoriesList');
  container.innerHTML = '';

  if (categories.length === 0) {
    container.innerHTML = '<p class="empty-state">No custom categories yet. Click "Add Custom Category" to create one.</p>';
    return;
  }

  categories.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'custom-category-item';
    item.style.borderLeftColor = cat.color || '#6b7280';
    const domainCount = (cat.domains || []).length;
    const keywordCount = (cat.keywords || []).length;
    item.innerHTML = `
      <div class="custom-category-info">
        <span class="custom-category-name">${escapeHtml(cat.name)}</span>
        <span class="custom-category-meta">${domainCount} domain${domainCount !== 1 ? 's' : ''}, ${keywordCount} keyword${keywordCount !== 1 ? 's' : ''}</span>
      </div>
      <div class="custom-category-actions">
        <button class="btn-icon btn-edit" data-id="${escapeHtml(cat.id)}" title="Edit">✏️</button>
        <button class="btn-icon btn-delete" data-id="${escapeHtml(cat.id)}" title="Delete">🗑️</button>
      </div>
    `;

    item.querySelector('.btn-edit').addEventListener('click', () => editCategory(cat));
    item.querySelector('.btn-delete').addEventListener('click', () => deleteCategory(cat.id));

    container.appendChild(item);
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function showCategoryForm(category = null) {
  editingCategoryId = category ? category.id : null;
  document.getElementById('categoryFormTitle').textContent = category ? 'Edit Custom Category' : 'Add Custom Category';
  document.getElementById('customCategoryName').value = category?.name || '';
  document.getElementById('customCategoryDomains').value = (category?.domains || []).join('\n');
  document.getElementById('customCategoryKeywords').value = (category?.keywords || []).join(', ');
  document.getElementById('customCategoryColor').value = category?.color || '#22c55e';
  document.getElementById('customCategoryGroupColor').value = category?.groupColor || 'green';
  document.getElementById('categoryForm').classList.remove('hidden');
}

function hideCategoryForm() {
  editingCategoryId = null;
  document.getElementById('categoryForm').classList.add('hidden');
}

async function editCategory(category) {
  showCategoryForm(category);
}

async function deleteCategory(id) {
  if (!confirm('Delete this custom category?')) return;
  const { customCategories = [] } = await chrome.storage.sync.get(['customCategories']);
  const updated = customCategories.filter(c => c.id !== id);
  await chrome.storage.sync.set({ customCategories: updated });
  renderCustomCategories(updated);
  showSaveStatus('Category deleted', 'success');
}

async function saveCustomCategory() {
  const name = document.getElementById('customCategoryName').value.trim();
  if (!name) {
    alert('Please enter a category name.');
    return;
  }

  const domainsText = document.getElementById('customCategoryDomains').value;
  const domains = domainsText.split(/[\n,]/).map(d => d.trim()).filter(Boolean);

  const keywordsText = document.getElementById('customCategoryKeywords').value;
  const keywords = keywordsText.split(',').map(k => k.trim()).filter(Boolean);

  if (domains.length === 0 && keywords.length === 0) {
    alert('Please add at least one domain or keyword.');
    return;
  }

  const color = document.getElementById('customCategoryColor').value;
  const groupColor = document.getElementById('customCategoryGroupColor').value;

  const { customCategories = [] } = await chrome.storage.sync.get(['customCategories']);
  let updated;

  if (editingCategoryId) {
    updated = customCategories.map(c =>
      c.id === editingCategoryId
        ? { ...c, name, domains, keywords, color, groupColor }
        : c
    );
  } else {
    const id = `CUSTOM_${Date.now()}`;
    updated = [...customCategories, { id, name, domains, keywords, color, groupColor }];
  }

  await chrome.storage.sync.set({ customCategories: updated });
  renderCustomCategories(updated);
  hideCategoryForm();
  showSaveStatus('Category saved!', 'success');
}

// Test Claude API key
async function testApiKey() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const statusEl = document.getElementById('apiKeyStatus');

  if (!apiKey) {
    showStatus(statusEl, 'Please enter an API key', 'error');
    return;
  }

  statusEl.textContent = 'Testing...';
  statusEl.className = 'status-message status-loading';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Hi'
        }]
      })
    });

    if (response.ok) {
      showStatus(statusEl, '✓ API key is valid!', 'success');
    } else {
      const error = await response.json();
      showStatus(statusEl, `✗ Invalid API key: ${error.error?.message || 'Unknown error'}`, 'error');
    }
  } catch (error) {
    showStatus(statusEl, `✗ Error: ${error.message}`, 'error');
  }
}

// Save settings
async function saveSettings() {
  const categoryActions = {};
  document.querySelectorAll('.category-action').forEach(select => {
    categoryActions[select.dataset.category] = select.value;
  });

  const settings = {
    claudeApiKey: document.getElementById('apiKey').value.trim(),
    autoCloseOldTabs: document.getElementById('autoCloseOldTabs').checked,
    inactiveHours: document.getElementById('inactiveHours').value,
    autoBookmarkDocs: document.getElementById('autoBookmarkDocs').checked,
    closeAfterBookmark: document.getElementById('closeAfterBookmark').checked,
    bookmarkSaveLocation: document.getElementById('bookmarkSaveLocation').value,
    bookmarkFolderParent: document.getElementById('bookmarkFolderParent').value,
    categoryActions: categoryActions
  };

  try {
    await chrome.storage.sync.set(settings);
    showSaveStatus('Settings saved successfully!', 'success');
  } catch (error) {
    showSaveStatus('Failed to save settings: ' + error.message, 'error');
  }
}

// Reset settings to defaults
async function resetSettings() {
  const defaults = {
    claudeApiKey: '',
    autoCloseOldTabs: false,
    inactiveHours: '24',
    autoBookmarkDocs: false,
    closeAfterBookmark: true,
    bookmarkSaveLocation: 'category_folder',
    bookmarkFolderParent: 'other_bookmarks',
    categoryActions: {
      SOCIAL: 'close',
      WORK: 'keep',
      SHOPPING: 'ask',
      DOCUMENTATION: 'bookmark'
    }
  };

  try {
    await chrome.storage.sync.clear();
    await chrome.storage.sync.set(defaults);
    await loadSettings();
    showSaveStatus('Settings reset to defaults', 'success');
  } catch (error) {
    showSaveStatus('Failed to reset settings: ' + error.message, 'error');
  }
}

// Show status message
function showStatus(element, message, type) {
  element.textContent = message;
  element.className = `status-message status-${type}`;

  if (type === 'success') {
    setTimeout(() => {
      element.textContent = '';
      element.className = 'status-message';
    }, 3000);
  }
}

// Show save status
function showSaveStatus(message, type) {
  const statusEl = document.getElementById('saveStatus');
  statusEl.textContent = message;
  statusEl.className = `save-status save-status-${type}`;
  statusEl.classList.remove('hidden');

  setTimeout(() => {
    statusEl.classList.add('hidden');
  }, 3000);
}
