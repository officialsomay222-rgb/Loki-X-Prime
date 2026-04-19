## 2024-04-16 - Initial Setup\n**Learning:** Just starting to analyze this codebase for UX improvements. Noticed that aria-labels are missing on almost all icon-only buttons across the app.\n**Action:** Add aria-labels to the most critical interactive elements to improve accessibility.
## 2026-04-19 - Command Palette Accessibility
**Learning:** Command palettes or search bars that rely purely on visual placeholders or surrounding icons to convey their purpose often lack an explicit `<label>`. This makes them completely invisible or confusing to screen readers.
**Action:** Always ensure that search inputs without a visible `<label>` include a descriptive `aria-label` (e.g., `aria-label="Search sessions"`). Additionally, always add `aria-label` to icon-only close buttons.
