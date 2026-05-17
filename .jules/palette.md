## 2024-05-05 - Missing explicit alt text for unrendered UI components like modal images
**Learning:** Decorative modal imagery and dynamic elements like `MessageBubble` or `SettingsModal` often lack valid fallback descriptors.
**Action:** Always provide explicit, context-driven `alt` attributes or set decorative elements to `alt=""` to optimize screen-reader compatibility and reduce unhelpful auditory noise.
## 2024-05-17 - Added focus-visible classes to missing interactive elements
**Learning:** In this codebase, custom interactive elements inside modals and overlays (like `motion.button` components) often lack standard focus indicators. Using the `:focus` selector applies outline when users click on the button using a mouse which can be visually unpleasant.
**Action:** Always add Tailwind `focus-visible` utility classes (e.g., `focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none`) to these elements to ensure keyboard users have visual feedback when tabbing through the UI, without showing rings for pointer clicks.
