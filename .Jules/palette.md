## 2024-04-16 - Initial Setup\n**Learning:** Just starting to analyze this codebase for UX improvements. Noticed that aria-labels are missing on almost all icon-only buttons across the app.\n**Action:** Add aria-labels to the most critical interactive elements to improve accessibility.

## 2024-04-20 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Found a widespread accessibility issue across key layout and messaging components (like App.tsx, ChatInput.tsx, MessageBubble.tsx, and CommandPalette.tsx) where icon-only action buttons (e.g., scroll to bottom, copy code, toggle modes) completely lack `aria-label` attributes, rendering them invisible or confusing to screen reader users.
**Action:** Applied `aria-label` attributes to these critical action buttons. In the future, explicitly enforce checking for `aria-label` or visually hidden text when introducing new icon-only buttons.
