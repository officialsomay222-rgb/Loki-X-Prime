## 2024-05-05 - Missing explicit alt text for unrendered UI components like modal images
**Learning:** Decorative modal imagery and dynamic elements like `MessageBubble` or `SettingsModal` often lack valid fallback descriptors.
**Action:** Always provide explicit, context-driven `alt` attributes or set decorative elements to `alt=""` to optimize screen-reader compatibility and reduce unhelpful auditory noise.

## 2024-05-07 - Destructive action overlays require explicit ARIA attributes
**Learning:** Destructive action overlays like `ClearConfirmOverlay` lack structural and contextual ARIA labels for screen readers.
**Action:** Always add `role="alertdialog"`, `aria-modal="true"`, and linked `aria-labelledby`/`aria-describedby` attributes to alert dialogs. Ensure decorative icons are marked `aria-hidden="true"`.
