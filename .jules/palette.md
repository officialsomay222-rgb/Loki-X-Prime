## 2024-05-05 - Missing explicit alt text for unrendered UI components like modal images
**Learning:** Decorative modal imagery and dynamic elements like `MessageBubble` or `SettingsModal` often lack valid fallback descriptors.
**Action:** Always provide explicit, context-driven `alt` attributes or set decorative elements to `alt=""` to optimize screen-reader compatibility and reduce unhelpful auditory noise.

## 2026-05-08 - Accessibility for destructive modal dialogs
**Learning:** Destructive action overlays (like `ClearConfirmOverlay`) must explicitly manage focus, role, and labels for screen readers. Using `motion.div` does not automatically confer dialog semantics. Additionally, `motion.button` components within modals require explicit `focus-visible` Tailwind classes for proper keyboard accessibility since default focus rings are often omitted.
**Action:** When creating or updating modal components, especially destructive ones, ensure the container uses `role="alertdialog"`, `aria-modal="true"`, and links to a title and description using `aria-labelledby` and `aria-describedby`. Add `focus-visible` classes (e.g., `focus-visible:ring-2`, `focus-visible:outline-none`) to interactive `motion.button` elements. Set `aria-hidden="true"` on decorative icons inside the dialog.
