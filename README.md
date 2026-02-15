# 🧠 Tab Genius - Smart Browser Tab Organization

Tab Genius is a Chrome extension that automatically categorizes, organizes, and manages your browser tabs. Say goodbye to tab overload and hello to a clean, organized browsing experience!

---

## ✨ Features

### Tab Categorization
- **Smart categorization** into 9 built-in categories:
  - Social Media | Work & Productivity | Shopping | News & Media
  - Entertainment | Documentation & Learning | Email | Search & Research | Other
- **Enhanced signals**: Domain, URL path, query params, title suffixes, keywords
- **Subdomain awareness**: e.g. `docs.google.com` → Work, `mail.google.com` → Email

### Popup (Quick Access)
- View tab statistics at a glance (total, to close, to bookmark)
- Category summary with action counts
- **View Full Dashboard** – opens the full interface
- **Quick Cleanup** – execute suggested actions on all tabs in one click

### Dashboard (Full Control)
- **Summary stats** – total tabs, suggested to close, bookmark, keep
- **Auto Group Tabs** – move categories to new windows with Chrome tab groups
- **Categories** – expandable sections with all tabs
- **Per-tab controls**:
  - Change category (dropdown)
  - Change action: Keep / Close / Bookmark
  - Select for bulk execute
- **Bulk actions**: Collapse All, Expand All, Select All, Deselect All, Execute Selected

### Bookmarks
- **Choose where to save**: Bookmark Bar, Other Bookmarks, or Tab Genius folder by category
- **Category folders**: `Tab Genius → [Category Name]` (e.g. Documentation, Social Media)

### Custom Categories
- Add your own categories in Settings
- Define domains (one per line) and keywords (comma-separated)
- Custom categories are checked before built-in ones

### Tools
- **Tab search** – Search tabs by title or URL; click to switch to a tab
- **Duplicate detection** – Shows duplicate tabs; "Close Duplicates" to remove extras
- **Export** – Export tabs as JSON or Markdown
- **Session save & restore** – Save current tabs with a name; restore later from dropdown

### Reports
- Detailed report downloaded after executing actions
- Lists closed, bookmarked, and kept tabs with URLs and reasons

---

## 📦 Installation

1. **Download** the extension folder
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select the extension folder
5. **Pin** the extension (click puzzle icon → pin Tab Genius)

**Keyboard shortcut:** Ctrl+Shift+G (Cmd+Shift+G on Mac) to open Tab Genius

### Icons
Icons are included (`icons/icon16.png`, `icon48.png`, `icon128.png`). If missing, add PNG files with those names and dimensions.

---

## 🚀 How to Use

### Quick Start (Popup)

1. Click the **Tab Genius** icon in the toolbar
2. See your tab stats and category summary
3. Click **View Full Dashboard** for detailed control
4. Or click **Quick Cleanup** to apply all suggestions at once

### Using the Dashboard

1. Open the dashboard (from popup or extension options)
2. Review the **summary** (total tabs, suggested close/bookmark/keep, duplicates)
3. **Search** – Type in the search box to filter tabs; click a tab to switch to it
4. **Duplicates** – If any, click "Close Duplicates" to remove extra tabs with the same URL
5. **Export** – Use Export JSON/Markdown to download your tab list
6. **Sessions** – Save current tabs or restore a saved session
7. **Auto Group** (optional): Choose "Open in new window" for categories → Click **Apply Grouping**
8. In **Categories**:
   - Click a category row to expand/collapse
   - Use **Collapse All** / **Expand All** for bulk
   - Change a tab’s category with the category dropdown
   - Change a tab’s action (Keep/Close/Bookmark) with the action dropdown
   - Check the tabs you want to act on
9. Click **Execute Selected**
10. Confirm → A report is downloaded

### Changing Tab Category

- Use the **category dropdown** next to each tab
- Pick a category to move the tab
- The tab moves visually and uses the new category for grouping and bookmark placement

### Executing Actions

- **Keep** – no change
- **Close** – tab is closed
- **Bookmark** – tab is bookmarked (location set in Settings), optionally closed after

### Auto Group Tabs

1. In the Auto Group section, set each category to **"Open in new window"** or **"Keep as-is"**
2. Click **Apply Grouping**
3. Categories with "Open in new window" are moved to new windows and grouped by category

---

## ⚙️ Settings

Open **Settings** from the dashboard or right-click the extension icon → Options.

### General
- **Close after bookmark** – close tab after bookmarking
- **Where to save bookmarks** – Bookmark Bar, Other Bookmarks, or Tab Genius → Category folder
- **Category folder location** – inside Bookmark Bar or Other Bookmarks

### Categorization
- **Default action per category** – close, keep, or ask for Social, Work, Shopping, Documentation

### Custom Categories
- **Add Custom Category** – name, domains (one per line), keywords (comma-separated)
- **Edit** / **Delete** existing custom categories

---

## 🎯 How Categorization Works

Tab Genius uses (in order):

1. **Subdomain rules** – e.g. `mail.google.com` → Email
2. **URL path** – e.g. `/docs/`, `/cart`, `/search` → Documentation, Shopping, Search
3. **Query params** – e.g. `?q=`, `?search=` → Search
4. **Title suffixes** – e.g. `" - Documentation"`, `" | GitHub"`
5. **Domain match** – built-in and custom domain lists
6. **Keywords** – in title or URL

---

## 📊 Reports

After **Execute Selected** or **Quick Cleanup**, a report is downloaded:
- Summary (closed, bookmarked, kept, errors)
- List of closed tabs with URLs and reasons
- List of bookmarked tabs
- List of kept tabs

---

## 📝 File Structure

```
tab-genius-extension/
├── manifest.json           # Extension configuration
├── background.js           # Service worker, categorizer, actions
├── popup.html/js/css      # Quick access popup
├── dashboard.html/js/css  # Full dashboard
├── options.html/js/css     # Settings page
├── icons/                  # Extension icons (16, 48, 128px)
└── README.md
```

---

## 🔒 Privacy

- All analysis runs locally in your browser
- No data is sent to external servers
- Settings and custom categories are stored in Chrome sync storage

---

## 🛠️ Troubleshooting

| Issue | Fix |
|-------|-----|
| Extension won’t load | Enable Developer mode; check for missing files/icons |
| Tabs not categorized | Add custom categories for your sites |
| Report not downloading | Reload the extension; check Chrome permissions |
| Actions not executing | Ensure tabs weren’t closed elsewhere; check console for errors |

---

## 🔮 Future Ideas

- Undo last action (reopen closed tabs)

---

**Happy tab organizing! 🎉**
