## 2024-05-05 - Missing explicit alt text for unrendered UI components like modal images
**Learning:** Decorative modal imagery and dynamic elements like `MessageBubble` or `SettingsModal` often lack valid fallback descriptors.
**Action:** Always provide explicit, context-driven `alt` attributes or set decorative elements to `alt=""` to optimize screen-reader compatibility and reduce unhelpful auditory noise.

## 2025-02-28 - Missing ARIA dialog attributes on overlay modals
**Learning:** Animated overlay components like `WelcomeModal` often use complex `<motion.div>` structures and lack explicit `role="dialog"`, `aria-modal="true"`, and associated `aria-labelledby`/`aria-describedby` attributes necessary for screen reader users to understand they are in a dialog context.
**Action:** Always provide explicit ARIA roles and labels for modals, and ensure purely decorative SVG icons within them have `aria-hidden="true"` to reduce unhelpful auditory noise.
