## RAD Studio Documentation Source of Truth

Use Embarcadero's RAD Studio docwiki as the primary source of truth for Delphi/RAD Studio behavior, UI, terminology, framework details, IDE features, menus, project structure, and component semantics.

- Primary reference: https://docwiki.embarcadero.com/RADStudio/Florence/en/Main_Page
- Allowed lookup domain: https://docwiki.embarcadero.com/RADStudio/
- Check the docwiki before relying on memory or secondary sources for Delphi, RAD Studio, VCL, FireMonkey, IDE behavior, menus, project structure, or component semantics.
- Prefer the Florence/RAD Studio 13 docs when available. Use older-version pages only when Florence coverage is missing or historical comparison is needed.

<claude-mem-context>
# Memory Context

# [Delphi-IDE] recent context, 2026-05-19 4:44pm GMT+2

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (15,823t read) | 486,780t work | 97% savings

### May 17, 2026
S513 User requested a numbered summary of all prompts given during the session (May 17, 8:37 PM)
S518 User asked if Claude could see the current project — confirmed working directory and project context (May 17, 8:58 PM)
### May 18, 2026
S519 Delphi-IDE: Add close button on Welcome Page tab and implement project-based saving in File menu (May 18, 12:26 PM)
S520 Start local dev server for Delphi-IDE to test changes before committing (May 18, 12:37 PM)
S521 Implement IntelliSense (Code Insight) for the Delphi IDE code editor with completion popups, symbol resolution, diagnostic highlighting, and navigation features. (May 18, 12:43 PM)
S522 Delphi-IDE code editor full rewrite — fix broken tab indentation, Enter key, and normal editing operations (May 18, 1:20 PM)
1609 1:34p 🔵 Caret Helper Functions Architecture in Delphi-IDE Editor
1610 " 🔴 Code Editor Rebuilt: contenteditable Div Replaced with Textarea + Pre Overlay
1611 1:35p 🔴 wire/code.js Fully Rewritten for Textarea-Based Editor
1612 1:36p 🔴 App.css Updated for Textarea + Pre Overlay Editor Layout
1613 " 🔵 Old Contenteditable Caret Helpers Still Present in util.js After Rewrite
1614 " 🔄 Dead Caret Helper Functions Removed from util.js
1615 " ✅ Delphi-IDE Builds Clean After Editor Rewrite
1616 1:37p ✅ Document-Level mousedown Popup Dismiss Handler Removed
1617 " 🔄 Popup Dismiss Listener Moved to Module Scope to Prevent Listener Leaks
S538 Delphi-IDE: Disable project-specific menu items on Welcome page (no project open state) (May 18, 1:37 PM)
1623 2:20p 🔵 Delphi-IDE Project Structure Identified
1624 " 🔵 Delphi-IDE Favicon and README Context Before Image Addition
1625 " 🔵 User-Supplied Image Identified: ChatGPT-Generated PNG in Downloads
1626 2:21p 🟣 Delphi-IDE Project Icon and Social Meta Tags Added
1627 " 🟣 README Hero Image Added and OG/Twitter URLs Fixed to Absolute
1628 2:22p ✅ Project Icon Renamed to Delphi_Helm_Icon.png
1629 " 🔴 index.html References Updated to Match Renamed Icon File
1630 " 🟣 Delphi_Helm_Icon.png Fully Wired as Project Identity Image
1631 " ✅ Delphi-IDE Icon Integration Verified Complete - Awaiting git add
1745 9:58p 🔵 Delphi-IDE Project Structure Mapped
1746 " 🔵 Chrome Always Renders Toolbar Regardless of Project State
1747 " 🔵 Welcome Page Structure and Chrome Architecture
1748 10:00p 🟣 MENU_DISABLED_NO_PROJECT Constant Added to data.js
1749 " ✅ chrome.js Imports MENU_DISABLED_NO_PROJECT
1750 " 🟣 renderMenubar Now Disables Project-Specific Menu Items on Welcome Page
1751 " 🟣 Menu Popup Disabled State CSS Added
S540 Replicate all Delphi IDE menus from 11 reference screenshots in the web-based Delphi IDE prototype (May 18, 10:01 PM)
1769 10:53p 🟣 Delphi IDE Menu Replication Task Initiated
1770 10:56p 🔵 Delphi IDE Project: chrome.js Wiring Architecture
1771 " 🔵 Delphi IDE: actions.js Core Logic and executeMenu Dispatch Map
1772 10:58p 🟣 MENU_DEFS Overhauled to Match Real Delphi IDE Structure
1773 " 🟣 MENU_DISABLED_NO_PROJECT Updated to Match New Menu Structure
1774 10:59p 🟣 renderMenubar Now Handles Submenu Arrows and Info Items
1775 " 🟣 executeMenu Wired for New Delphi Menu Label Aliases
1776 " 🟣 CSS Added for Menu Arrow, Info Row, and Disabled Shortcut Styles
1777 " 🔵 Delphi IDE Build Passes Clean After Menu Overhaul
S541 Implement comprehensive dark theme styling for Delphi-IDE application, focusing on Welcome page, header/menubar, and menu options (File, Edit, View, etc.) (May 18, 10:59 PM)
1778 11:15p ⚖️ FMX-First Strategy: VCL Deferred to Coming Soon Page
1779 " 🔵 Delphi-IDE Project: Mixed Theme Found in App.css
1780 11:20p ✅ Menubar converted to dark theme in Delphi IDE stylesheet
1781 " ✅ Menu button states updated to dark theme in Delphi IDE menubar
1782 " ✅ Menu dropdown popup converted to dark theme in Delphi IDE
1783 " ✅ Menu popup button content styled for dark theme in Delphi IDE
1784 11:32p 🔴 Menu popup button layout and icon spacing fixed in Delphi-IDE
1785 " 🟣 Menu icon redesigned as inline badge element with state-aware opacity
1786 11:33p 🟣 Menu icons upgraded to color-coded HTML badge elements in chrome.js
1787 " 🔴 Menu label span upgraded to .menu-lbl class and .menu-info indent corrected
1788 " 🔵 Delphi-IDE Vite build passes cleanly after menu icon refactor
S542 Improve menu icons and fix spacing in Delphi-IDE to match reference screenshots exactly (May 18, 11:34 PM)
### May 19, 2026
2018 4:42p ⚖️ Embarcadero RAD Studio DocWiki Set as Primary Reference
2019 " 🔵 Codex Sandbox Blocked by Missing Unprivileged User Namespaces
2020 4:43p 🔵 Escalated Sandbox Permissions Bypass bwrap Namespace Restriction
2021 4:44p 🔵 Delphi-IDE Project is a Browser-Based RAD Studio 13 UI Prototype
2022 " ⚖️ RAD Studio DocWiki Preference Persisted to AGENTS.md

Access 487k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>
