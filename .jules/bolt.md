## 2026-04-15 - [O(N) List Re-renders]
**Learning:** Passing a globally changing ID (like `copiedId` or `activeId`) to every item in a list causes an O(N) re-render of all items when the ID changes. Furthermore, using a custom `React.memo` equality function that ignores callback props is a dangerous anti-pattern that leads to stale closures.
**Action:** Pass derived boolean flags (e.g., `isCopied={copiedId === message.id}`) to list items. Wrap list items in `React.memo` without custom equality functions (relying on shallow comparison), and ensure parent callbacks passed to them are stable using `useCallback`.

## 2025-02-18 - [ReactMarkdown AST Recreation]
**Learning:** Passing inline arrays to `ReactMarkdown` props like `remarkPlugins` (e.g., `remarkPlugins={[remarkGfm]}`) causes the array reference to change on every render. This forces the library to needlessly invalidate and recreate its internal AST and plugin pipeline, which becomes a severe CPU bottleneck during rapid updates like text streaming.
**Action:** Always extract `remarkPlugins` and `rehypePlugins` arrays to stable module-level constants outside the component body.
## 2024-04-18 - React.memo Stale Closures & Callback Stability in Mapped Lists
**Learning:** In highly memoized components mapping over large lists (like `MessageBubble` or `TimelineItem`), passing inline functions from the parent component (`App.tsx`) inherently breaks shallow equality checks. If `React.memo` utilizes a custom `arePropsEqual` function that incorrectly ignores those callback props to maintain O(1) update performance, it can lead to fatal stale closures where the callback refers to outdated state (like capturing old IDs or settings).
**Action:** Always extract inline functions from render map loops using `useCallback` with complete dependency arrays. Then, strictly include those stable callback properties in the custom `arePropsEqual` memoization function. This resolves stale closures while preserving the O(1) performance benefit.

## 2025-02-28 - [Dexie List Re-renders]
**Learning:** Mapping over arrays of objects returned from Dexie's `useLiveQuery` inside a list triggers O(N) re-renders for every item whenever the database updates (e.g., a new message arrives), because Dexie emits entirely new object references for unchanged rows. Standard `React.memo` shallow comparisons fail against these new object references.
**Action:** When mapping lists backed by Dexie, provide a custom `arePropsEqual` function to `React.memo` that explicitly compares the specific primitive fields (like `id`, `title`, `isPinned`) of the database objects instead of relying on shallow object equality. Be sure to also include all stable parent callback references in the equality check.
