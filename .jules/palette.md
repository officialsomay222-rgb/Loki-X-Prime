## 2024-05-05 - Missing explicit alt text for unrendered UI components like modal images
**Learning:** Decorative modal imagery and dynamic elements like `MessageBubble` or `SettingsModal` often lack valid fallback descriptors.
**Action:** Always provide explicit, context-driven `alt` attributes or set decorative elements to `alt=""` to optimize screen-reader compatibility and reduce unhelpful auditory noise.

## 2024-05-06 - Missing explicit alertdialog attributes for destructive overlays
**Learning:** Destructive modal confirmation dialogs (like `ClearConfirmOverlay`) often lack standard `alertdialog` semantic roles, breaking screen-reader announcements when the modal mounts.
**Action:** Always provide explicit `role="alertdialog"`, `aria-modal="true"`, and connect the title and description using `aria-labelledby` and `aria-describedby` respectively on destructive overlays to ensure immediate auditory feedback. Decorative icons inside these dialogs must use `aria-hidden="true"`.
