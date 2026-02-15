// Background service worker for Tab Genius
// Categorizer code inlined for Manifest V3 compatibility

const CATEGORIES = {
  SOCIAL: {
    name: 'Social Media',
    color: '#3b82f6',
    domains: ['facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com', 'reddit.com', 'tiktok.com', 'snapchat.com', 'pinterest.com', 'threads.net', 'mastodon.social', 'bluesky.social', 'discord.com', 'discord.gg'],
    keywords: ['social', 'feed', 'post', 'profile', 'message', 'tweet', 'timeline']
  },
  WORK: {
    name: 'Work & Productivity',
    color: '#10b981',
    domains: ['notion.so', 'slack.com', 'teams.microsoft.com', 'asana.com', 'trello.com', 'monday.com', 'jira.atlassian.com', 'confluence.atlassian.com', 'zoom.us', 'meet.google.com', 'drive.google.com', 'docs.google.com', 'sheets.google.com', 'calendar.google.com', 'linear.app', 'clickup.com', 'airtable.com', 'figma.com', 'miro.com'],
    keywords: ['dashboard', 'project', 'task', 'meeting', 'workspace', 'calendar', 'sprint', 'board']
  },
  SHOPPING: {
    name: 'Shopping',
    color: '#f59e0b',
    domains: ['amazon.com', 'ebay.com', 'aliexpress.com', 'walmart.com', 'target.com', 'etsy.com', 'shopify.com', 'bestbuy.com', 'apple.com', 'samsung.com', 'newegg.com', 'costco.com', 'aliexpress.com', 'shein.com', 'zalando.com'],
    keywords: ['cart', 'checkout', 'product', 'shop', 'buy', 'order', 'price', 'basket', 'wishlist']
  },
  NEWS: {
    name: 'News & Media',
    color: '#ef4444',
    domains: ['news.ycombinator.com', 'cnn.com', 'bbc.com', 'nytimes.com', 'theguardian.com', 'reuters.com', 'medium.com', 'substack.com', 'apnews.com', 'npr.org', 'axios.com', 'techcrunch.com', 'theverge.com', 'wired.com'],
    keywords: ['article', 'news', 'breaking', 'story', 'blog', 'headline', 'op-ed']
  },
  ENTERTAINMENT: {
    name: 'Entertainment',
    color: '#ec4899',
    domains: ['youtube.com', 'netflix.com', 'twitch.tv', 'spotify.com', 'soundcloud.com', 'hulu.com', 'disneyplus.com', 'primevideo.com', 'crunchyroll.com', 'vimeo.com', 'dailymotion.com', 'bandcamp.com', 'deezer.com', 'apple.com'],
    keywords: ['watch', 'video', 'music', 'stream', 'play', 'episode', 'movie', 'song', 'album', 'podcast']
  },
  DOCUMENTATION: {
    name: 'Documentation & Learning',
    color: '#8b5cf6',
    domains: ['stackoverflow.com', 'github.com', 'gitlab.com', 'docs.microsoft.com', 'developer.mozilla.org', 'w3schools.com', 'coursera.org', 'udemy.com', 'khanacademy.org', 'learn.microsoft.com', 'devdocs.io', 'documentation.ubuntu.com', 'doc.rust-lang.org', 'reactjs.org', 'vuejs.org', 'angular.io', 'nodejs.org', 'npmjs.com', 'python.org', 'rubyonrails.org'],
    keywords: ['docs', 'documentation', 'tutorial', 'guide', 'api', 'reference', 'learn', 'course', 'getting started', 'quickstart']
  },
  EMAIL: {
    name: 'Email',
    color: '#06b6d4',
    domains: ['mail.google.com', 'outlook.com', 'outlook.office.com', 'yahoo.com', 'protonmail.com', 'mail.yahoo.com', 'gmail.com', 'icloud.com', 'zoho.com', 'fastmail.com', 'tutanota.com'],
    keywords: ['mail', 'inbox', 'email', 'compose', 'message', 'sent']
  },
  SEARCH: {
    name: 'Search & Research',
    color: '#64748b',
    domains: ['google.com', 'bing.com', 'duckduckgo.com', 'scholar.google.com', 'startpage.com', 'ecosia.org', 'brave.com'],
    keywords: ['search', 'query', 'results', 'q=']
  },
  OTHER: {
    name: 'Other',
    color: '#6b7280',
    domains: [],
    keywords: []
  }
};

// URL path patterns -> category (checked before domain match for specificity)
const PATH_PATTERNS = {
  DOCUMENTATION: ['/docs', '/documentation', '/api/', '/reference', '/tutorial', '/guide', '/learn', '/courses', '/wiki/', '/manual'],
  NEWS: ['/blog/', '/article', '/news/', '/story', '/archive'],
  SHOPPING: ['/product', '/products/', '/item/', '/cart', '/checkout', '/basket', '/order', '/p/', '/dp/'],
  SEARCH: ['/search', '/query', '/results', '/find'],
  EMAIL: ['/mail', '/inbox', '/compose', '/sent'],
  WORK: ['/workspace', '/project', '/dashboard', '/tasks', '/board'],
  ENTERTAINMENT: ['/watch', '/video/', '/play', '/episode', '/movie'],
  SOCIAL: ['/profile', '/feed', '/timeline', '/post']
};

// Subdomain -> category (exact match, checked before generic domain)
const SUBDOMAIN_RULES = {
  'mail.google.com': 'EMAIL',
  'mail.yahoo.com': 'EMAIL',
  'inbox.google.com': 'EMAIL',
  'docs.google.com': 'WORK',
  'drive.google.com': 'WORK',
  'sheets.google.com': 'WORK',
  'slides.google.com': 'WORK',
  'calendar.google.com': 'WORK',
  'meet.google.com': 'WORK',
  'scholar.google.com': 'SEARCH',
  'play.google.com': 'ENTERTAINMENT',
  'music.youtube.com': 'ENTERTAINMENT',
  'github.io': 'DOCUMENTATION',
  'readthedocs.io': 'DOCUMENTATION',
  'gitlab.io': 'DOCUMENTATION',
  'notion.site': 'WORK',
  'obsidian.md': 'WORK'
};

// Title suffixes/phrases that indicate category (e.g. " - Documentation", " | GitHub")
const TITLE_SUFFIXES = {
  DOCUMENTATION: [' - documentation', ' | docs', ' - api reference', ' · github', ' - mdn', ' - dev docs', ' documentation', 'tutorial -', 'guide -'],
  NEWS: [' - the new york times', ' | medium', ' - techcrunch', ' - bbc news', ' article', ' - reuters'],
  SHOPPING: [' - amazon', ' | ebay', ' - walmart', ' - target', ' shopping', ' - etsy'],
  SOCIAL: [' - youtube', ' | twitter', ' | x.com', ' - facebook', ' - reddit', ' | linkedin'],
  WORK: [' - notion', ' | slack', ' - asana', ' - trello', ' | jira'],
  ENTERTAINMENT: [' - netflix', ' - spotify', ' - twitch', ' watch'],
  EMAIL: [' - gmail', ' - outlook', ' inbox']
};

// Query params that indicate search
const SEARCH_QUERY_PARAMS = ['q', 'query', 'search', 's', 'p', 'keywords', 'term'];

class TabCategorizer {
  categorizeTab(tab, categories) {
    const url = new URL(tab.url);
    const domain = url.hostname.replace('www.', '');
    const path = url.pathname.toLowerCase();
    const pathWithSlash = path.endsWith('/') ? path : path + '/';
    const title = (tab.title || '').toLowerCase();
    const urlLower = tab.url.toLowerCase();

    // 1. Subdomain rules (exact match - high specificity)
    for (const [subdomainPattern, categoryKey] of Object.entries(SUBDOMAIN_RULES)) {
      if (domain === subdomainPattern || domain.endsWith('.' + subdomainPattern)) {
        const category = categories[categoryKey];
        if (category) {
          return {
            category: categoryKey,
            categoryName: category.name,
            color: category.color,
            confidence: 'high',
            reason: `Subdomain matches ${category.name}`
          };
        }
      }
    }
    // 2. Path patterns (strong signal)
    for (const [categoryKey, patterns] of Object.entries(PATH_PATTERNS)) {
      const category = categories[categoryKey];
      if (!category) continue;
      const match = patterns.find(p => path.includes(p.toLowerCase()) || pathWithSlash.includes(p.toLowerCase() + '/'));
      if (match) {
        return {
          category: categoryKey,
          categoryName: category.name,
          color: category.color,
          confidence: 'high',
          reason: `Path matches ${category.name} (${match})`
        };
      }
    }

    // 3. Query param hints (search)
    for (const param of SEARCH_QUERY_PARAMS) {
      if (url.searchParams.has(param) && url.searchParams.get(param)) {
        const cat = categories.SEARCH;
        if (cat) {
          return {
            category: 'SEARCH',
            categoryName: cat.name,
            color: cat.color,
            confidence: 'medium',
            reason: `Search query param (${param}=)`
          };
        }
      }
    }

    // 4. Title suffix patterns
    for (const [categoryKey, suffixes] of Object.entries(TITLE_SUFFIXES)) {
      const category = categories[categoryKey];
      if (!category) continue;
      const match = suffixes.find(suffix => title.includes(suffix));
      if (match) {
        return {
          category: categoryKey,
          categoryName: category.name,
          color: category.color,
          confidence: 'medium',
          reason: `Title suffix: ${match}`
        };
      }
    }

    // 5. Domain match (existing logic)
    for (const [key, category] of Object.entries(categories)) {
      if (key === 'OTHER') continue;
      const domains = category.domains || [];
      if (domains.length && domains.some(d => domain.includes(d) || d.includes(domain))) {
        return {
          category: key,
          categoryName: category.name,
          color: category.color,
          confidence: 'high',
          reason: `Domain matches ${category.name}`
        };
      }
    }

    // 6. Keyword match (existing logic)
    for (const [key, category] of Object.entries(categories)) {
      if (key === 'OTHER') continue;
      const keywords = category.keywords || [];
      const keywordMatches = keywords.filter(kw =>
        title.includes(kw.toLowerCase()) || urlLower.includes(kw.toLowerCase())
      );
      if (keywordMatches.length > 0) {
        return {
          category: key,
          categoryName: category.name,
          color: category.color,
          confidence: 'medium',
          reason: `Keywords: ${keywordMatches.join(', ')}`
        };
      }
    }

    return {
      category: 'OTHER',
      categoryName: categories.OTHER?.name || 'Other',
      color: categories.OTHER?.color || '#6b7280',
      confidence: 'low',
      reason: 'No clear category match'
    };
  }

  suggestAction(tab, categoryInfo, settings = {}) {
    const age = Date.now() - (tab.lastAccessed || Date.now());
    const ageInHours = age / (1000 * 60 * 60);
    const inactiveHours = parseInt(settings.inactiveHours, 10) || 24;
    const autoCloseOldTabs = settings.autoCloseOldTabs === undefined ? true : settings.autoCloseOldTabs;
    const autoBookmarkDocs = settings.autoBookmarkDocs !== false;
    const categoryActions = settings.categoryActions || {};

    const getCategoryAction = (cat) => categoryActions[cat] || 'ask';

    const suggestions = {
      action: 'keep',
      reason: 'Recently accessed',
      priority: 0
    };

    if (categoryInfo.category === 'SHOPPING' && (tab.url.includes('cart') || tab.url.includes('checkout'))) {
      suggestions.action = 'keep';
      suggestions.reason = 'Shopping cart active';
      suggestions.priority = 0;
      return suggestions;
    }

    if (categoryInfo.category === 'WORK' && ageInHours < 4) {
      suggestions.action = 'keep';
      suggestions.reason = 'Recently active work tab';
      suggestions.priority = 0;
      return suggestions;
    }

    const catAction = getCategoryAction(categoryInfo.category);

    if (catAction === 'keep') {
      suggestions.action = 'keep';
      suggestions.reason = 'Category set to keep';
      return suggestions;
    }

    if (catAction === 'bookmark' && categoryInfo.category === 'DOCUMENTATION' && autoBookmarkDocs && ageInHours > 2) {
      suggestions.action = 'bookmark';
      suggestions.reason = 'Useful reference material';
      suggestions.priority = 1;
      return suggestions;
    }

    if (categoryInfo.category === 'DOCUMENTATION' && autoBookmarkDocs && ageInHours > 2 && catAction !== 'close') {
      suggestions.action = 'bookmark';
      suggestions.reason = 'Useful reference material';
      suggestions.priority = 1;
      return suggestions;
    }

    if (categoryInfo.category === 'SEARCH' && ageInHours > 1 && (catAction === 'close' || catAction === 'ask')) {
      suggestions.action = 'close';
      suggestions.reason = 'Old search tab';
      suggestions.priority = 3;
      return suggestions;
    }

    if (categoryInfo.category === 'SOCIAL' && ageInHours > 3 && (catAction === 'close' || catAction === 'ask')) {
      suggestions.action = 'close';
      suggestions.reason = 'Old social media tab';
      suggestions.priority = 2;
      return suggestions;
    }

    if (autoCloseOldTabs && ageInHours > inactiveHours && (catAction === 'close' || catAction === 'ask')) {
      suggestions.action = 'close';
      suggestions.reason = `Inactive for ${Math.floor(ageInHours)} hours`;
      suggestions.priority = 2;
    }

    return suggestions;
  }

  async analyzeTabs(mergedCategories, settings = {}) {
    const tabs = await chrome.tabs.query({});
    const windows = {};
    const categorized = {};
    const stats = {
      total: 0,
      byCategory: {},
      byAction: { keep: 0, close: 0, bookmark: 0 },
      duplicateCount: 0
    };

    const categories = mergedCategories || CATEGORIES;

    const urlToTabs = {};
    for (const tab of tabs) {
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;
      const normalized = this._normalizeUrl(tab.url);
      if (!urlToTabs[normalized]) urlToTabs[normalized] = [];
      urlToTabs[normalized].push(tab);
    }

    const duplicateGroups = Object.entries(urlToTabs).filter(([, t]) => t.length > 1);
    stats.duplicateCount = duplicateGroups.reduce((sum, [, t]) => sum + t.length - 1, 0);

    for (const tab of tabs) {
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;

      stats.total++;

      const categoryInfo = this.categorizeTab(tab, categories);
      const actionSuggestion = this.suggestAction(tab, categoryInfo, settings);

      const normalized = this._normalizeUrl(tab.url);
      const isDuplicate = urlToTabs[normalized]?.length > 1;

      const tabData = {
        id: tab.id,
        windowId: tab.windowId,
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl,
        active: tab.active,
        pinned: tab.pinned,
        isDuplicate,
        duplicateCount: isDuplicate ? urlToTabs[normalized].length : 1,
        ...categoryInfo,
        ...actionSuggestion
      };

      if (!categorized[categoryInfo.category]) categorized[categoryInfo.category] = [];
      categorized[categoryInfo.category].push(tabData);

      if (!windows[tab.windowId]) windows[tab.windowId] = [];
      windows[tab.windowId].push(tabData);

      stats.byCategory[categoryInfo.category] = (stats.byCategory[categoryInfo.category] || 0) + 1;
      stats.byAction[actionSuggestion.action]++;
    }

    const duplicates = duplicateGroups.map(([url, tabsList]) => ({
      url,
      tabIds: tabsList.map(t => t.id),
      count: tabsList.length,
      tabs: tabsList.map(t => ({ id: t.id, title: t.title, windowId: t.windowId }))
    }));

    return {
      tabs: categorized,
      windows,
      stats,
      duplicates,
      timestamp: new Date().toISOString()
    };
  }

  _normalizeUrl(url) {
    try {
      const u = new URL(url);
      u.searchParams.sort();
      u.hash = '';
      return u.href;
    } catch (_) {
      return url;
    }
  }
}

const categorizer = new TabCategorizer();

// Update badge with tab count
async function updateTabBadge() {
  try {
    const tabs = await chrome.tabs.query({});
    const count = tabs.filter(t => !t.url?.startsWith('chrome://') && !t.url?.startsWith('chrome-extension://')).length;
    await chrome.action.setBadgeText({ text: count > 99 ? '99+' : String(count) });
    await chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
  } catch (_) {}
}

chrome.tabs.onCreated.addListener(updateTabBadge);
chrome.tabs.onRemoved.addListener(updateTabBadge);
chrome.tabs.onUpdated.addListener(() => updateTabBadge());
updateTabBadge();

// Merge built-in categories with user-defined custom categories
// Custom categories are checked first so users can override built-in matches
function mergeCategories(builtIn, customList) {
  const merged = {};

  if (customList && Array.isArray(customList)) {
    customList.forEach(cat => {
      const key = cat.id || `CUSTOM_${Date.now()}`;
      merged[key] = {
        name: cat.name || 'Custom',
        color: cat.color || '#6b7280',
        groupColor: cat.groupColor || 'grey',
        domains: Array.isArray(cat.domains) ? cat.domains.map(d => d.trim().toLowerCase()).filter(Boolean) : [],
        keywords: Array.isArray(cat.keywords) ? cat.keywords.map(k => k.trim().toLowerCase()).filter(Boolean) : []
      };
    });
  }

  for (const [k, v] of Object.entries(builtIn)) {
    merged[k] = v;
  }

  return merged;
}

// Message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeTabs') {
    handleAnalyzeTabs(sendResponse);
    return true; // Keep channel open for async response
  }

  if (request.action === 'executeActions') {
    handleExecuteActions(request.actions, sendResponse);
    return true;
  }

  if (request.action === 'analyzeWithClaude') {
    handleClaudeAnalysis(request.tabsData, request.apiKey, sendResponse);
    return true;
  }

  if (request.action === 'downloadReport') {
    handleDownloadReport(request.report, sendResponse);
    return true;
  }

  if (request.action === 'groupTabs') {
    handleGroupTabs(request.groupings, request.tabsByCategory, sendResponse);
    return true;
  }

  if (request.action === 'saveSession') {
    handleSaveSession(request.name, request.tabs, sendResponse);
    return true;
  }

  if (request.action === 'restoreSession') {
    handleRestoreSession(request.sessionId, sendResponse);
    return true;
  }

  if (request.action === 'getSessions') {
    handleGetSessions(sendResponse);
    return true;
  }

  if (request.action === 'deleteSession') {
    handleDeleteSession(request.sessionId, sendResponse);
    return true;
  }

  if (request.action === 'closeDuplicateTabs') {
    handleCloseDuplicates(request.tabIdsToClose, sendResponse);
    return true;
  }
});

// Analyze all tabs
async function handleAnalyzeTabs(sendResponse) {
  try {
    const {
      customCategories = [],
      autoCloseOldTabs = false,
      inactiveHours = '24',
      autoBookmarkDocs = false,
      categoryActions = {}
    } = await chrome.storage.sync.get([
      'customCategories',
      'autoCloseOldTabs',
      'inactiveHours',
      'autoBookmarkDocs',
      'categoryActions'
    ]);
    const mergedCategories = mergeCategories(CATEGORIES, customCategories);
    const settings = { autoCloseOldTabs, inactiveHours, autoBookmarkDocs, categoryActions };
    const analysis = await categorizer.analyzeTabs(mergedCategories, settings);
    const allCategories = Object.entries(mergedCategories).map(([key, cat]) => ({
      key,
      name: cat.name,
      color: cat.color
    }));
    sendResponse({ success: true, data: { ...analysis, allCategories } });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Get Chrome bookmark root folder IDs (Chrome uses id 1 = Bookmark Bar, 2 = Other Bookmarks)
async function getBookmarkRootIds() {
  const tree = await chrome.bookmarks.getTree();
  const roots = tree[0]?.children || [];

  let bookmarkBarId = '1';
  let otherBookmarksId = '2';

  for (const node of roots) {
    const title = (node.title || '').toLowerCase();
    if (title.includes('bookmark') && (title.includes('bar') || title.includes('favorit'))) {
      bookmarkBarId = node.id;
    }
    if (title.includes('other') || title === 'other bookmarks') {
      otherBookmarksId = node.id;
    }
  }

  return { bookmarkBarId, otherBookmarksId };
}

// Get or create Tab Genius folder, then get or create category subfolder
async function getOrCreateCategoryFolder(categoryName, parentType, rootIds) {
  const parentId = parentType === 'bookmark_bar' ? rootIds.bookmarkBarId : rootIds.otherBookmarksId;

  const children = await chrome.bookmarks.getChildren(parentId);
  let tabGeniusFolder = children.find(c => c.title === 'Tab Genius' && !c.url);

  if (!tabGeniusFolder) {
    tabGeniusFolder = await chrome.bookmarks.create({
      parentId,
      title: 'Tab Genius'
    });
  }

  const categoryChildren = await chrome.bookmarks.getChildren(tabGeniusFolder.id);
  let categoryFolder = categoryChildren.find(c => c.title === categoryName && !c.url);

  if (!categoryFolder) {
    categoryFolder = await chrome.bookmarks.create({
      parentId: tabGeniusFolder.id,
      title: categoryName
    });
  }

  return categoryFolder.id;
}

// Execute actions on tabs
async function handleExecuteActions(actions, sendResponse) {
  const results = {
    closed: [],
    bookmarked: [],
    kept: [],
    errors: []
  };

  const { bookmarkSaveLocation = 'category_folder', bookmarkFolderParent = 'other_bookmarks' } =
    await chrome.storage.sync.get(['bookmarkSaveLocation', 'bookmarkFolderParent']);
  const rootIds = await getBookmarkRootIds();
  const categoryFolderCache = {};

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'close':
          await chrome.tabs.remove(action.tabId);
          results.closed.push({
            tabId: action.tabId,
            title: action.title,
            url: action.url,
            reason: action.reason
          });
          break;

        case 'bookmark':
          let parentId;
          if (bookmarkSaveLocation === 'bookmark_bar') {
            parentId = rootIds.bookmarkBarId;
          } else if (bookmarkSaveLocation === 'other_bookmarks') {
            parentId = rootIds.otherBookmarksId;
          } else if (bookmarkSaveLocation === 'category_folder' && action.categoryName) {
            const cacheKey = action.categoryName;
            if (!categoryFolderCache[cacheKey]) {
              categoryFolderCache[cacheKey] = await getOrCreateCategoryFolder(
                action.categoryName,
                bookmarkFolderParent,
                rootIds
              );
            }
            parentId = categoryFolderCache[cacheKey];
          } else {
            parentId = rootIds.otherBookmarksId;
          }
          await chrome.bookmarks.create({
            title: action.title,
            url: action.url,
            parentId: action.folderId || parentId
          });

          // Optionally close after bookmarking
          if (action.closeAfterBookmark) {
            await chrome.tabs.remove(action.tabId);
            results.bookmarked.push({
              tabId: action.tabId,
              title: action.title,
              url: action.url,
              reason: action.reason,
              closed: true
            });
          } else {
            results.bookmarked.push({
              tabId: action.tabId,
              title: action.title,
              url: action.url,
              reason: action.reason,
              closed: false
            });
          }
          break;

        case 'keep':
          results.kept.push({
            tabId: action.tabId,
            title: action.title,
            url: action.url,
            reason: action.reason
          });
          break;
      }
    } catch (error) {
      results.errors.push({
        tabId: action.tabId,
        title: action.title,
        error: error.message
      });
    }
  }

  sendResponse({ success: true, results });
}

// Analyze tabs using Claude API
async function handleClaudeAnalysis(tabsData, apiKey, sendResponse) {
  if (!apiKey) {
    sendResponse({ success: false, error: 'Claude API key not provided' });
    return;
  }

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
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Analyze these browser tabs and provide recommendations for each category. For each tab, decide whether to: KEEP (important/active), CLOSE (old/unnecessary), or BOOKMARK (useful reference).

Categories and their tabs:
${JSON.stringify(tabsData, null, 2)}

Respond with a JSON object containing decisions for each category with reasoning. Format:
{
  "SOCIAL": { "action": "close_most", "reason": "...", "keep": [tab_ids...] },
  "WORK": { "action": "keep_all", "reason": "..." },
  ...
}

Be conservative - when in doubt, keep the tab.`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse Claude's response
    const decisions = JSON.parse(content);

    sendResponse({ success: true, decisions });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Download report as text file
async function handleDownloadReport(report, sendResponse) {
  try {
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    await chrome.downloads.download({
      url: url,
      filename: `tab-genius-report-${timestamp}.txt`,
      saveAs: true
    });

    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Session save & restore
const SESSIONS_STORAGE_KEY = 'tabGeniusSessions';

async function handleSaveSession(name, tabs, sendResponse) {
  try {
    const session = {
      id: `session_${Date.now()}`,
      name: name || `Session ${new Date().toLocaleDateString()}`,
      tabs: tabs.map(t => ({ url: t.url, title: t.title })),
      createdAt: Date.now()
    };
    const { [SESSIONS_STORAGE_KEY]: sessions = [] } = await chrome.storage.local.get([SESSIONS_STORAGE_KEY]);
    sessions.unshift(session);
    await chrome.storage.local.set({ [SESSIONS_STORAGE_KEY]: sessions.slice(0, 50) });
    sendResponse({ success: true, session });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetSessions(sendResponse) {
  try {
    const { [SESSIONS_STORAGE_KEY]: sessions = [] } = await chrome.storage.local.get([SESSIONS_STORAGE_KEY]);
    sendResponse({ success: true, sessions });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleRestoreSession(sessionId, sendResponse) {
  try {
    const { [SESSIONS_STORAGE_KEY]: sessions = [] } = await chrome.storage.local.get([SESSIONS_STORAGE_KEY]);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      sendResponse({ success: false, error: 'Session not found' });
      return;
    }
    for (const tab of session.tabs) {
      await chrome.tabs.create({ url: tab.url, active: false });
    }
    sendResponse({ success: true, restored: session.tabs.length });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDeleteSession(sessionId, sendResponse) {
  try {
    const { [SESSIONS_STORAGE_KEY]: sessions = [] } = await chrome.storage.local.get([SESSIONS_STORAGE_KEY]);
    const filtered = sessions.filter(s => s.id !== sessionId);
    await chrome.storage.local.set({ [SESSIONS_STORAGE_KEY]: filtered });
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCloseDuplicates(tabIdsToClose, sendResponse) {
  try {
    if (tabIdsToClose?.length) {
      await chrome.tabs.remove(tabIdsToClose);
    }
    sendResponse({ success: true, closed: tabIdsToClose?.length || 0 });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Map category colors to Chrome tab group colors (grey, blue, red, yellow, green, pink, purple, cyan, orange)
const CATEGORY_TO_GROUP_COLOR = {
  SOCIAL: 'blue',
  WORK: 'green',
  SHOPPING: 'orange',
  NEWS: 'red',
  ENTERTAINMENT: 'pink',
  DOCUMENTATION: 'purple',
  EMAIL: 'cyan',
  SEARCH: 'grey',
  OTHER: 'grey'
};

function getGroupColorForCategory(categoryKey, tabsByCategory, customCategories) {
  if (CATEGORY_TO_GROUP_COLOR[categoryKey]) return CATEGORY_TO_GROUP_COLOR[categoryKey];
  const custom = (customCategories || []).find(c => c.id === categoryKey);
  return custom?.groupColor || 'grey';
}

// Auto-group tabs by category across all windows
async function handleGroupTabs(groupings, tabsByCategory, sendResponse) {
  const results = { grouped: [], errors: [] };
  const { customCategories = [] } = await chrome.storage.sync.get(['customCategories']);

  try {
    for (const [category, choice] of Object.entries(groupings)) {
      if (choice !== 'new_window') continue; // "keep" = do nothing

      const tabs = tabsByCategory[category];
      if (!tabs || tabs.length === 0) continue;

      const tabIds = tabs.map(t => t.id).filter(Boolean);
      if (tabIds.length === 0) continue;

      try {
        // Filter out invalid tabs (chrome://, extension pages, incognito)
        const validTabIds = [];
        let targetWindowIncognito = null;
        for (const id of tabIds) {
          try {
            const tab = await chrome.tabs.get(id);
            const isValidUrl = tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://');
            if (isValidUrl) {
              if (targetWindowIncognito === null) targetWindowIncognito = tab.incognito;
              if (tab.incognito === targetWindowIncognito) {
                validTabIds.push(id);
              }
            }
          } catch (_) { /* tab may have closed */ }
        }

        if (validTabIds.length === 0) continue;

        // Create new window with first tab (moves it out of current window)
        const createOptions = { tabId: validTabIds[0] };
        if (targetWindowIncognito) createOptions.incognito = true;
        const newWindow = await chrome.windows.create(createOptions);

        // Move remaining tabs to the new window
        if (validTabIds.length > 1) {
          await chrome.tabs.move(validTabIds.slice(1), {
            windowId: newWindow.id,
            index: -1
          });
        }

        // Group all tabs in the new window
        const groupId = await chrome.tabs.group({
          tabIds: validTabIds,
          createProperties: { windowId: newWindow.id }
        });

        // Set group title and color
        const groupColor = getGroupColorForCategory(category, tabsByCategory, customCategories);
        const categoryName = tabs[0].categoryName || category;
        await chrome.tabGroups.update(groupId, {
          title: categoryName,
          color: groupColor
        });

        results.grouped.push({
          category,
          categoryName,
          tabCount: validTabIds.length,
          windowId: newWindow.id
        });
      } catch (err) {
        results.errors.push({ category, error: err.message });
      }
    }

    sendResponse({ success: true, results });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Context menu removed - add "contextMenus" to manifest.json permissions to enable
