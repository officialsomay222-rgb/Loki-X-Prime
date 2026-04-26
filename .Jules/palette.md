## 2024-04-16 - Initial Setup\n**Learning:** Just starting to analyze this codebase for UX improvements. Noticed that aria-labels are missing on almost all icon-only buttons across the app.\n**Action:** Add aria-labels to the most critical interactive elements to improve accessibility.

## 2024-05-24 - Added Titles to Icon-Only Buttons
**Learning:** Found several icon-only buttons that had `aria-label`s for screen readers, but were missing `title` attributes for visual tooltips.
**Action:** Always add `title` attributes along with `aria-label`s to ensure both visual and screen reader accessibility on icon-only buttons.

## 2024-05-24 - Accessibility Enhancements for Inline Inputs, Orphaned Labels, and Focus Indicators
**Learning:** Discovered that inline edit inputs (like renaming a timeline) lacked `aria-label`s, making them opaque to screen readers. Additionally, standard labels (like "Temperature" for a range slider) were visually present but not programmatically linked (`htmlFor`/`id`) to their inputs, and interactive lists (like Command Palette) lacked visible keyboard focus indicators (`focus-visible`).
**Action:** Always provide an `aria-label` for inline inputs without visible text labels. Ensure all visual labels are explicitly linked to their form controls using `htmlFor` and `id` attributes. Add `focus-visible` classes to all interactive elements to support keyboard navigation.

## 2024-05-25 - Programmatic Labeling for Settings Controls
**Learning:** Found that generic setting items in `SettingsModal.tsx` contained visual text elements disguised as labels (`<div className="text-sm...">`) while input elements inside lacked corresponding IDs. This orphaned the visual labels from screen reader context.
**Action:** Always dynamically generate a stable, unique ID based on the property name or label text (e.g. `label.toLowerCase().replace(/[^a-z0-9]+/g, '-')`), apply it to the underlying control element (like `<input id={inputId}>`), and ensure the visual label explicitly links to it via `<label htmlFor={inputId}>`.
