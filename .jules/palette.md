## 2024-05-05 - Missing explicit alt text for unrendered UI components like modal images
**Learning:** Decorative modal imagery and dynamic elements like `MessageBubble` or `SettingsModal` often lack valid fallback descriptors.
**Action:** Always provide explicit, context-driven `alt` attributes or set decorative elements to `alt=""` to optimize screen-reader compatibility and reduce unhelpful auditory noise.
## 2026-05-26 - Focus Visible consistency on Overlays
**Learning:** In this codebase, interactive elements within modals and overlays (like `motion.button` components) require explicit Tailwind `focus-visible` utility classes (e.g., `focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none`) to ensure proper keyboard accessibility and maintain visual consistency, as default focus states are often missing.
**Action:** When adding new `motion.button` or other interactive elements, especially within overlays, always append the project's standard `focus-visible` classes to ensure keyboard navigability is maintained.
