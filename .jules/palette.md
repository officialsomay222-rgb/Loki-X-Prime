## 2024-05-05 - Missing explicit alt text for unrendered UI components like modal images
**Learning:** Decorative modal imagery and dynamic elements like `MessageBubble` or `SettingsModal` often lack valid fallback descriptors.
**Action:** Always provide explicit, context-driven `alt` attributes or set decorative elements to `alt=""` to optimize screen-reader compatibility and reduce unhelpful auditory noise.
## 2025-05-13 - Inconsistent Keyboard Focus on Modals
**Learning:** In this codebase, interactive elements like `motion.button` and raw `<button>` inside overlays and modals (e.g., `LiveVoiceOverlay`, `AppsModal`) frequently lack keyboard focus indicators.
**Action:** When creating or modifying modals, explicitly add Tailwind `focus-visible` utility classes (e.g., `focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none`) to ensure keyboard accessibility.
