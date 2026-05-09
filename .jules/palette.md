## 2024-05-05 - Missing explicit alt text for unrendered UI components like modal images
**Learning:** Decorative modal imagery and dynamic elements like `MessageBubble` or `SettingsModal` often lack valid fallback descriptors.
**Action:** Always provide explicit, context-driven `alt` attributes or set decorative elements to `alt=""` to optimize screen-reader compatibility and reduce unhelpful auditory noise.
## 2026-05-09 - Adding explicit screen reader properties to standard visual modals
**Learning:** Destructive action overlays (like `ClearConfirmOverlay`) or general modal containers often lack necessary structural ARIA roles, leading screen readers to treat them as standard inline content rather than isolated dialogs.
**Action:** Always wrap primary modal containers with `role="alertdialog"` (or `dialog`), `aria-modal="true"`, and link `aria-labelledby` and `aria-describedby` to explicit ID hooks on the internal title and description tags to ensure screen reader focus is trapped and announced correctly.
