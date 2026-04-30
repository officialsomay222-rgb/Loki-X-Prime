## 2026-04-30 - Focus Management in Modal Overlays
**Learning:** Full-screen custom overlays (like `ReportOverlay`) using `motion.div` block standard focus trees unless explicit interactive elements (like close buttons or primary CTAs) have `focus-visible` utility classes. The lack of standard HTML `<dialog>` requires manual focus indicator injection.
**Action:** Always add `focus-visible:ring-2` (or `ring-4` for primary CTAs) and `focus-visible:outline-none` to all interactive `motion.button` and `button` components within custom modal overlays.
