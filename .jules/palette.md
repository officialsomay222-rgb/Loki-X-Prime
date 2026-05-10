## 2024-05-05 - Missing explicit alt text for unrendered UI components like modal images
**Learning:** Decorative modal imagery and dynamic elements like `MessageBubble` or `SettingsModal` often lack valid fallback descriptors.
**Action:** Always provide explicit, context-driven `alt` attributes or set decorative elements to `alt=""` to optimize screen-reader compatibility and reduce unhelpful auditory noise.

## 2024-05-10 - Screen reader accessibility for destructive action overlays
**Learning:** Destructive action overlays (like `ClearConfirmOverlay`) require explicit `role="alertdialog"`, `aria-modal="true"`, and linked `aria-labelledby` and `aria-describedby` attributes to ensure correct screen reader behavior. Furthermore, interactive elements inside modals like `motion.button` typically lack default focus states, impairing keyboard navigation.
**Action:** For all destructive modals, ensure alertdialog roles and linked descriptions are implemented. Explicitly add Tailwind `focus-visible` utility classes (e.g. `focus-visible:ring-2`, `focus-visible:outline-none`) to `motion.button` components inside modals. Always apply `aria-hidden="true"` to decorative elements like icons inside these overlays to avoid unnecessary screen reader noise.
