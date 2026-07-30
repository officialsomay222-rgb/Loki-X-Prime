## 2024-05-05 - Missing explicit alt text for unrendered UI components like modal images
**Learning:** Decorative modal imagery and dynamic elements like `MessageBubble` or `SettingsModal` often lack valid fallback descriptors.
**Action:** Always provide explicit, context-driven `alt` attributes or set decorative elements to `alt=""` to optimize screen-reader compatibility and reduce unhelpful auditory noise.
## 2024-05-18 - Added focus-visible classes to modals and action buttons
**Learning:** In this codebase, interactive elements within modals and overlays (like `motion.button` components) require explicit Tailwind `focus-visible` utility classes (e.g., `focus-visible:ring-2`, `focus-visible:outline-none`) to ensure proper keyboard accessibility, as default focus states are often missing.
**Action:** When creating new modals, overlays, or interactive elements, always ensure that `focus-visible` utility classes are included for keyboard accessibility.
