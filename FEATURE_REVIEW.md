# Tab Genius – Feature Review & Roadmap

## Implemented Features

### ✅ Functional

| Feature | Location | Status |
|---------|----------|--------|
| **Tab analysis & categorization** | background.js | ✅ Uses domain, path, query params, title suffixes, keywords. Enhanced with path patterns, subdomain rules. |
| **Popup – stats & quick view** | popup.html/js | ✅ Shows total tabs, to close, to bookmark. Category summary. |
| **View Full Dashboard** | popup | ✅ Opens dashboard in new tab |
| **Quick Cleanup** | popup | ✅ Executes suggested close/bookmark on all tabs |
| **Dashboard – summary stats** | dashboard | ✅ Total, to close, to bookmark, to keep |
| **Dashboard – categories list** | dashboard | ✅ Tabs grouped by category with per-tab controls |
| **Execute actions** | dashboard, popup | ✅ Close, Bookmark, Keep on selected tabs |
| **Change category** | dashboard | ✅ Dropdown to move tab between categories |
| **Collapse/Expand All** | dashboard | ✅ Bulk collapse/expand category sections |
| **Click header to toggle** | dashboard | ✅ Entire category row toggles expand/collapse |
| **Auto Group Tabs** | dashboard | ✅ Move categories to new windows with Chrome tab groups |
| **Bookmark save location** | options | ✅ Bookmark Bar, Other Bookmarks, or Tab Genius → Category folder |
| **Custom categories** | options | ✅ Add/edit/delete with domains & keywords |
| **Report generation** | dashboard, popup | ✅ Text report after execute (now has downloads permission) |
| **Settings page** | options | ✅ Save, reset, bookmark options, category rules UI |
| **Icons** | icons/ | ✅ 16, 48, 128px PNGs |

### ⚠️ Partially Functional / Stored but not applied

| Feature | Issue |
|---------|-------|
| **autoCloseOldTabs** | Saved in options, not used in suggestAction or anywhere |
| **inactiveHours** | Saved, not used (suggestAction uses hardcoded 24h) |
| **autoBookmarkDocs** | Saved, not used |
| **categoryActions** | Default action per category (close/keep/ask) saved, not used when suggesting or executing |

### ❌ Non-Functional / Hidden

| Feature | Status |
|---------|--------|
| **Claude Auto Mode** | UI hidden; backend code still present |
| **categorizer.js** | Unused – background.js has inlined logic; this file is outdated |

---

## Bug Fixes Applied

- **Report download** – Added `"downloads"` permission to manifest; was failing silently before.

---

## New Features (Implemented)

### ✅ Completed

1. **Duplicate tab detection** – Detects same URL, shows count, "Close Duplicates" button.
2. **Tab search** – Search bar filters tabs by title/URL; click tab to switch to it.
3. **Export session** – Export JSON or Markdown of current tabs.
4. **Session save & restore** – Save tab set with name; restore from dropdown.
5. **Category rules** – `categoryActions` from settings applied in suggestAction.
6. **Auto-close settings** – `autoCloseOldTabs` and `inactiveHours` applied.
7. **categorizer.js** – Removed (logic lives in background.js).
8. **Keyboard shortcut** – Ctrl+Shift+G (Cmd+Shift+G on Mac) opens Tab Genius.
9. **Tab count badge** – Badge on icon shows open tab count.

### Not implemented

10. **Undo last action** – Reopen recently closed tabs.
