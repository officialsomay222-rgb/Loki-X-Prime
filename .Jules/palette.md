## 2024-04-16 - Initial Setup\n**Learning:** Just starting to analyze this codebase for UX improvements. Noticed that aria-labels are missing on almost all icon-only buttons across the app.\n**Action:** Add aria-labels to the most critical interactive elements to improve accessibility.

## 2024-05-24 - Added Titles to Icon-Only Buttons
**Learning:** Found several icon-only buttons that had `aria-label`s for screen readers, but were missing `title` attributes for visual tooltips.
**Action:** Always add `title` attributes along with `aria-label`s to ensure both visual and screen reader accessibility on icon-only buttons.
