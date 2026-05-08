## 2024-05-05 - Missing explicit alt text for unrendered UI components like modal images
**Learning:** Decorative modal imagery and dynamic elements like `MessageBubble` or `SettingsModal` often lack valid fallback descriptors.
**Action:** Always provide explicit, context-driven `alt` attributes or set decorative elements to `alt=""` to optimize screen-reader compatibility and reduce unhelpful auditory noise.
## 2024-05-26 - Add accessible alertdialog to ClearConfirmOverlay
**Learning:** Destructive action overlays (like `ClearConfirmOverlay`) lacked explicit ARIA roles (`role="alertdialog"`, `aria-modal="true"`) and descriptions linked to the visual title and content, and its decorative elements were exposed to screen readers.
**Action:** Always wrap destructive confirm overlays with `role="alertdialog"` and `aria-modal="true"`, explicitly link text descriptions using `aria-labelledby` and `aria-describedby`, and hide purely decorative elements (like trash icons) using `aria-hidden="true"`.
