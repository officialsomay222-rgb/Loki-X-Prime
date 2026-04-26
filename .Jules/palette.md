## 2024-04-16 - Initial Setup\n**Learning:** Just starting to analyze this codebase for UX improvements. Noticed that aria-labels are missing on almost all icon-only buttons across the app.\n**Action:** Add aria-labels to the most critical interactive elements to improve accessibility.

## 2024-05-24 - Added Titles to Icon-Only Buttons
**Learning:** Found several icon-only buttons that had `aria-label`s for screen readers, but were missing `title` attributes for visual tooltips.
**Action:** Always add `title` attributes along with `aria-label`s to ensure both visual and screen reader accessibility on icon-only buttons.

## 2024-05-24 - Accessibility Enhancements for Inline Inputs, Orphaned Labels, and Focus Indicators
**Learning:** Discovered that inline edit inputs (like renaming a timeline) lacked `aria-label`s, making them opaque to screen readers. Additionally, standard labels (like "Temperature" for a range slider) were visually present but not programmatically linked (`htmlFor`/`id`) to their inputs, and interactive lists (like Command Palette) lacked visible keyboard focus indicators (`focus-visible`).
**Action:** Always provide an `aria-label` for inline inputs without visible text labels. Ensure all visual labels are explicitly linked to their form controls using `htmlFor` and `id` attributes. Add `focus-visible` classes to all interactive elements to support keyboard navigation.

## 2026-04-26 - Keyboard Accessibility for Interactive Motion Elements
**Learning:** Found several `<motion.div>` and `<motion.button>` elements used as interactive components (like list items or settings toggles) that lacked proper keyboard accessibility attributes. While they had `onClick` handlers, they were invisible to keyboard navigation because they lacked `role="button"`, `tabIndex={0}`, `onKeyDown` handlers, and visible focus indicators (`focus-visible` classes).
**Action:** Always add `role="button"`, `tabIndex={0}`, `onKeyDown` (to handle 'Enter' or 'Space' keys), and `focus-visible` utility classes (e.g., `focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none`) to any custom interactive element to ensure full keyboard navigation support.
