## RAD Studio Documentation Source of Truth

Use Embarcadero's RAD Studio docwiki as the primary source of truth for Delphi/RAD Studio behavior, UI, terminology, framework details, IDE features, menus, project structure, and component semantics.

- Primary reference: https://docwiki.embarcadero.com/RADStudio/Florence/en/Main_Page
- Allowed lookup domain: https://docwiki.embarcadero.com/RADStudio/
- Check the docwiki before relying on memory or secondary sources for Delphi, RAD Studio, VCL, FireMonkey, IDE behavior, menus, project structure, or component semantics.
- Prefer the Florence/RAD Studio 13 docs when available. Use older-version pages only when Florence coverage is missing or historical comparison is needed.

<claude-mem-context>
# Memory Context

# [Delphi-IDE] recent context, 2026-05-19 7:52pm GMT+2

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (17,081t read) | 316,606t work | 95% savings

### May 18, 2026
S519 Delphi-IDE: Add close button on Welcome Page tab and implement project-based saving in File menu (May 18, 12:26 PM)
S520 Start local dev server for Delphi-IDE to test changes before committing (May 18, 12:37 PM)
S521 Implement IntelliSense (Code Insight) for the Delphi IDE code editor with completion popups, symbol resolution, diagnostic highlighting, and navigation features. (May 18, 12:43 PM)
S522 Delphi-IDE code editor full rewrite — fix broken tab indentation, Enter key, and normal editing operations (May 18, 1:20 PM)
S538 Delphi-IDE: Disable project-specific menu items on Welcome page (no project open state) (May 18, 1:37 PM)
S540 Replicate all Delphi IDE menus from 11 reference screenshots in the web-based Delphi IDE prototype (May 18, 10:01 PM)
S541 Implement comprehensive dark theme styling for Delphi-IDE application, focusing on Welcome page, header/menubar, and menu options (File, Edit, View, etc.) (May 18, 10:59 PM)
S542 Improve menu icons and fix spacing in Delphi-IDE to match reference screenshots exactly (May 18, 11:26 PM)
S613 Security review of pending changes on the Delphi-IDE branch — identifying confirmed vulnerabilities in the diff (May 18, 11:34 PM)
### May 19, 2026
2059 6:09p 🟣 Edit menu Undo, Redo, and Select All wired to Code tab editor
2060 6:10p 🔵 Delphi-IDE project is a browser-based RAD Studio 13 Florence web prototype
2061 " 🔵 Codebase is clean -- only intentional TODO stubs in generated Pascal event handlers
2062 " 🔵 git and bwrap unavailable in Codex sandbox due to unprivileged namespace restriction
2063 6:13p 🟣 Pascal source sync with form state on all mutations
2064 " 🟣 Identifier rename propagates into Pascal source
2065 " 🟣 In-editor Find bar with match highlighting and navigation
2066 " 🟣 Parameter hint tooltip for known Delphi routines
2067 " 🟣 Editor undo/redo history stack
2068 " 🟣 Delphi block auto-completion and code navigation dropdowns
2069 " ✅ Branding bumped to RAD Studio 13 Florence
2070 6:15p 🚨 String.prototype.replace $ token injection in renameIdentifierInCode and syncPascalWithForm
2071 " 🔐 window.onDelphiEditorCommand exposes privileged editor closure to global scope
2072 " ⚖️ window.onDelphiEditorCommand global dismissed as false positive in security review
2073 " 🔵 No input validation on Name field before renameIdentifierInCode calls
2074 " 🔵 Corrupted Pascal source from $ injection is persisted to localStorage
2075 6:16p 🚨 $ token injection in renameIdentifierInCode confirmed at confidence 9/10 with fix
2076 " ⚖️ syncPascalWithForm $ replacement injection classified as correctness bug, not security vulnerability
2077 6:18p 🔴 Fixed $ token injection in renameIdentifierInCode by switching to callback replacement
S614 Security review of Delphi-IDE branch changes — one confirmed vulnerability identified and fixed (May 19, 6:18 PM)
2078 6:20p ⚖️ Embarcadero RAD Studio DocWiki Set as Primary Reference
2079 " 🟣 Delphi IDE Code Editor: Find Bar, Undo/Redo History, and Parameter Hints Added
2080 " 🟣 Pascal Source Auto-Sync: Form/Component Rename and Structure Kept in Sync
2081 " ✅ Version Bumped from RAD Studio 12 Athens to RAD Studio 13 Florence
2082 6:26p ⚖️ RAD Studio DocWiki Set as Primary Reference for Codex
2083 6:30p ⚖️ Embarcadero RAD Studio DocWiki Set as Primary Reference
2084 " 🔴 Code Tab Section Navigator "Top of File" Reset Added
2085 6:32p 🔴 Find/Search UI No Longer Marks Unit as Modified
2086 " 🔴 Undo/Redo Refresh Semantics Corrected After Search/Edit Separation
2087 " 🔵 viewOnly Pattern Distribution Confirmed in src/wire/code.js
2088 " 🔵 Git Commands Fail in Sandbox Due to Namespace Restrictions
2089 6:34p 🔵 Delphi-IDE Uncommitted Changes Span 9 Files Across Editor Session
2090 6:36p 🔴 Find Bar Keeps Focus While Typing Search Query
2091 7:36p 🔵 Pascal/Delphi IDE Emulator - Cursor Alignment Bug Identified
2092 7:37p 🔵 Code Editor Uses Transparent Textarea Overlay Architecture
2093 " 🔵 Code Editor Wire Module Uses Measured Char/Line Dimensions for Cursor Math
2094 " 🔴 Fixed Cursor/Text Misalignment by Normalising Font Metrics Across Editor Layers
2095 " 🔴 Tightened Character Width Measurement Probe in wire/code.js
2096 7:38p 🔴 Cursor Alignment Fix Verified and Complete in Delphi IDE Emulator
2097 " 🟣 Delphi IDE Emulator: Full Code Editor Feature Overhaul
2098 7:46p 🔵 Delphi-IDE code editor uses layered CSS textarea overlay for editing
2099 " 🔵 Delphi-IDE code editor textarea content is generated from form state on every full render
2100 " 🔵 Delphi-IDE `mountCodePage` wiring architecture and event handler setup
2101 7:47p 🔴 Delphi IDE Code Editor Text Invisible Due to Transparent Textarea
2102 " 🔴 Code Editor Cursor/Text Drift Fixed by Removing Metric-Changing Syntax Styles
2103 " 🔴 Fixed invisible code editor text by making textarea directly visible and hiding highlight overlay
2104 " 🔄 Code editor CSS fully simplified to plain static textarea, overlay architecture removed
2106 7:50p 🟣 Syntax highlighting restored using CSS `:focus-within` to switch between view and edit modes
2105 " ⚖️ Delphi-IDE: CSS focus-within pattern for editable syntax-highlighted textarea
2107 " 🔵 Duplicate `position` property bug in `.code-input` after CSS patch — `relative` overrides `absolute`
2108 " 🔴 Removed spurious `position: relative` from `.code-input` to restore absolute overlay positioning

Access 317k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>
