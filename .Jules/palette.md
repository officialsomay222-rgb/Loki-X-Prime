## 2024-04-16 - Initial Setup\n**Learning:** Just starting to analyze this codebase for UX improvements. Noticed that aria-labels are missing on almost all icon-only buttons across the app.\n**Action:** Add aria-labels to the most critical interactive elements to improve accessibility.

## 2024-05-18 - Modals and Overlays Icon Buttons
**Learning:** Found a recurring pattern in the app where modals and overlays (AppsModal, CommandPalette, LiveVoiceOverlay, SettingsModal) use unlabelled icon-only close/action buttons (like 'X' icons). These are critical navigation elements that lack screen reader context.
**Action:** Always ensure icon-only buttons in absolute/fixed overlays receive descriptive `aria-label` attributes to ensure keyboard and screen-reader accessibility for navigation out of modals.
