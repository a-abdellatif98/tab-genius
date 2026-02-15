# Chrome Web Store Publishing Checklist

Copy the text below into the corresponding sections on the Chrome Web Store developer dashboard.

---

## 1. Privacy Practices Tab → Permission Justifications

### Single purpose description
```
Tab Genius organizes and manages browser tabs by categorizing them (Social, Work, Shopping, etc.), suggesting which to close or bookmark, detecting duplicates, and letting you save or restore tab sessions.
```

### Bookmarks justification
```
Used to save suggested tabs as bookmarks when the user chooses the "Bookmark" action. Bookmarks are saved to the user's chosen location (Bookmark Bar, Other Bookmarks, or Tab Genius folder by category). The extension only creates bookmarks when the user explicitly executes a bookmark action.
```

### Downloads justification
```
Used to download the action report after the user executes close/bookmark actions, and to export the tab list as JSON or Markdown. All downloads are user-initiated; no automatic downloading occurs.
```

### Host permission (`<all_urls>`) justification
```
Required to read tab titles and URLs for categorization. The extension analyzes open tabs locally to suggest categories (e.g., Social Media, Work, Documentation). No data is sent to external servers. All processing happens in the user's browser.
```

### Remote code use justification
```
This extension does not use remote code. All code is bundled in the extension package. No scripts are loaded from external URLs, and there is no use of eval, new Function, or dynamic script loading.
```

### Storage justification
```
Used to save user settings (bookmark location, default category actions, custom categories, saved session names) and optional Chrome sync. All data stays on the user's device. No personal data is collected or transmitted.
```

### Tab groups justification
```
Used when the user chooses "Open in new window" in the Auto Group feature. The extension moves tabs into new windows and groups them by category (e.g., Social Media, Work). Only used for organizing the user's own tabs.
```

### Tabs justification
```
Required to list open tabs, read titles/URLs for categorization, switch to tabs when the user clicks one, close tabs when the user executes a close action, and display tab counts. No tab data is sent externally.
```

---

## 2. Data Usage Form (Privacy Practices Tab)

### What user data do you plan to collect?

**Select these boxes** (Tab Genius accesses this data locally; none is transmitted):
- **Web history** — Tab titles and URLs of open tabs, used for categorization
- **Website content** — Tab titles and URLs (text, hyperlinks)

**Do NOT select** (Tab Genius does not access these):
- Personally identifiable information
- Health information
- Financial and payment information
- Authentication information
- Personal communications
- Location
- User activity (e.g. keystroke logging, click tracking)

### Justification text (if the form asks for a description)

```
Tab Genius accesses open tab titles and URLs solely to categorize tabs (e.g., Social Media, Work, Documentation) and suggest actions. All processing happens locally in the user's browser. No tab data, URLs, or titles are sent to external servers or third parties. User settings and saved session names are stored only in Chrome's local storage on the user's device.
```

### Certification checkboxes

Check all three:
- [x] I do not sell or transfer user data to third parties, apart from the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy Policy URL

You must host `privacy-policy.html` online and enter the URL. Options:

**Option A: GitHub Pages (free)**
1. Create a new GitHub repo (e.g. `tab-genius-privacy`)
2. Upload `privacy-policy.html` and rename to `index.html`, or add it as-is
3. Settings → Pages → enable GitHub Pages from main branch
4. URL will be: `https://YOUR_USERNAME.github.io/tab-genius-privacy/privacy-policy.html` (or `.../` if index.html)

**Option B: Any web host**
- Upload `privacy-policy.html` to your website
- Use: `https://yourdomain.com/tab-genius-privacy-policy.html`

**Option C: GitHub Gist (quick)**
1. Go to gist.github.com
2. Create a new gist, paste the content, name it `privacy-policy.html`
3. Click "Create public gist"
4. Click "Raw" → copy the URL (or use the gist page URL if it renders HTML)

The file `privacy-policy.html` is in your extension folder — upload it to one of the options above.

---

## 3. Certification

On the Privacy practices tab, certify that your data usage complies with the Developer Programme Policies. Check the box after reviewing.

---

## 4. Listing Tab

### Category
Select **Productivity**

### Language
Select **English** (or your primary language)

### Detailed description (min 25 characters)
Use the detailed description from earlier, or this shorter version:

```
Tab Genius helps you tame browser tab clutter with smart organization and one-click cleanup.

• Smart categorization — Tabs are automatically sorted into categories (Social, Work, Shopping, News, Entertainment, Documentation, etc.)

• Suggested actions — Each tab gets a suggested action: Close, Bookmark, or Keep. Adjust individually or apply in bulk.

• Duplicate detection — See tabs with the same URL and close extras with one click.

• Session save & restore — Save your current tab set and restore it later.

• Export — Export your tab list as JSON or Markdown.

• Custom categories — Add your own categories with domains and keywords in Settings.

• Auto grouping — Move categories into new windows with Chrome tab groups.

All processing runs locally in your browser. No data is sent to external servers.
```

---

## 5. Account Tab

- **Contact email:** Enter your email (e.g., your Gmail or support email)
- **Verify email:** Click to start verification and complete the process in your inbox

---

## 6. Assets

### Icon
Ensure `icons/icon128.png` exists and is 128×128 pixels. It must be included in your ZIP package at the root level (zip the *contents* of the folder, not the folder itself).

### Screenshots
Upload at least one screenshot. Use the files in `screenshots/`:
- `store_screenshot_1280x800.jpg` (dashboard)
- `store_screenshot_popup_1280x800.jpg` (popup)
- `store_screenshot_settings_1280x800.jpg` (settings)

Dimensions must be **1280×800** or **640×400**.

---

## 7. ZIP Package

Create the ZIP from inside the extension folder so `manifest.json` is at the root:

```bash
cd /Users/ahmed/Downloads/tab-genius-extension
zip -r ../tab-genius-extension.zip .
```

**Do not** include `CHROME_WEB_STORE_CHECKLIST.md` or the `screenshots/` folder in the ZIP if you want a smaller package (they're not required for the extension to run).

---

## Quick checklist

- [ ] Single purpose description
- [ ] All permission justifications (bookmarks, downloads, host, remote code, storage, tabGroups, tabs)
- [ ] Data usage: Select Web history + Website content; certify all three
- [ ] Privacy policy URL (host privacy-policy.html and enter URL)
- [ ] Contact email + verification
- [ ] Category selected (Productivity)
- [ ] Language selected
- [ ] Detailed description (25+ chars)
- [ ] At least one screenshot uploaded
- [ ] Icon in ZIP (128×128 at root)
- [ ] Save draft, then submit for review
