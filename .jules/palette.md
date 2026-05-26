## 2024-05-05 - Missing explicit alt text for unrendered UI components like modal images
**Learning:** Decorative modal imagery and dynamic elements like `MessageBubble` or `SettingsModal` often lack valid fallback descriptors.
**Action:** Always provide explicit, context-driven `alt` attributes or set decorative elements to `alt=""` to optimize screen-reader compatibility and reduce unhelpful auditory noise.
## 2026-05-26 - Add focus visible styles to interactive elements
**Learning:** Interactive elements within modals and overlays require explicit Tailwind focus-visible utility classes to ensure proper keyboard accessibility.
**Action:** Add explicit focus-visible classes like focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none to buttons and interactive elements.
