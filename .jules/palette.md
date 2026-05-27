## 2024-05-05 - Missing explicit alt text for unrendered UI components like modal images
**Learning:** Decorative modal imagery and dynamic elements like `MessageBubble` or `SettingsModal` often lack valid fallback descriptors.
**Action:** Always provide explicit, context-driven `alt` attributes or set decorative elements to `alt=""` to optimize screen-reader compatibility and reduce unhelpful auditory noise.

## 2024-05-27 - Missing ARIA attributes on primary modal overlays
**Learning:** All modals and overlays (e.g., `WelcomeModal`, `ReportOverlay`, `ClearConfirmOverlay`) often omit standard ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`) required for basic screen reader accessibility. Additionally, pure SVG decorations (like `lucide-react` icons that don't take `alt`) need `aria-hidden="true"`.
**Action:** Always wrap overlays and primary dialogs with standard ARIA roles and attributes for keyboard/SR focus management. Explicitly add `aria-hidden="true"` to SVG elements used purely for visual decoration.
