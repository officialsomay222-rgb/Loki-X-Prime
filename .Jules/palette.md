## 2024-04-16 - Initial Setup\n**Learning:** Just starting to analyze this codebase for UX improvements. Noticed that aria-labels are missing on almost all icon-only buttons across the app.\n**Action:** Add aria-labels to the most critical interactive elements to improve accessibility.

## 2024-05-24 - Added Titles to Icon-Only Buttons
**Learning:** Found several icon-only buttons that had `aria-label`s for screen readers, but were missing `title` attributes for visual tooltips.
**Action:** Always add `title` attributes along with `aria-label`s to ensure both visual and screen reader accessibility on icon-only buttons.

## 2024-05-24 - Accessibility Enhancements for Inline Inputs, Orphaned Labels, and Focus Indicators
**Learning:** Discovered that inline edit inputs (like renaming a timeline) lacked `aria-label`s, making them opaque to screen readers. Additionally, standard labels (like "Temperature" for a range slider) were visually present but not programmatically linked (`htmlFor`/`id`) to their inputs, and interactive lists (like Command Palette) lacked visible keyboard focus indicators (`focus-visible`).
**Action:** Always provide an `aria-label` for inline inputs without visible text labels. Ensure all visual labels are explicitly linked to their form controls using `htmlFor` and `id` attributes. Add `focus-visible` classes to all interactive elements to support keyboard navigation.

## 2024-05-25 - Comprehensive Keyboard Focus Indicator Enhancement
**Learning:** Found that numerous interactive components such as `ChatInput.tsx` action buttons, `TimelineItem.tsx` list options, and `MessageBubble.tsx` interaction controls were lacking keyboard navigation focus indicators. This makes the UI unnavigable for non-mouse users.
**Action:** Always include `focus-visible` CSS properties (e.g., `focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none`) across all interactive `button` elements to ensure a clear visual indicator during keyboard navigation.

## 2026-04-27 - Keyboard Focus on Overlay and Fallback Modal Buttons
**Learning:** Discovered that standalone, full-screen custom overlays (like `SignInOverlay` and `ErrorBoundary`) often use large primary CTA buttons ("Sign In", "Re-Initialize") that completely lack keyboard focus indicators (`focus-visible` classes). This breaks keyboard accessibility on critical authentication and failure recovery paths.
**Action:** When creating or modifying custom overlay components, explicitly test the primary fallback buttons with keyboard navigation and apply distinct `focus-visible` rings, as they don't inherit default form styles.
