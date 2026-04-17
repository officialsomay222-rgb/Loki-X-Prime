## 2026-04-15 - [O(N) List Re-renders]
**Learning:** Passing a globally changing ID (like `copiedId` or `activeId`) to every item in a list causes an O(N) re-render of all items when the ID changes. Furthermore, using a custom `React.memo` equality function that ignores callback props is a dangerous anti-pattern that leads to stale closures.
**Action:** Pass derived boolean flags (e.g., `isCopied={copiedId === message.id}`) to list items. Wrap list items in `React.memo` without custom equality functions (relying on shallow comparison), and ensure parent callbacks passed to them are stable using `useCallback`.

## 2025-02-18 - [ReactMarkdown AST Recreation]
**Learning:** Passing inline arrays to `ReactMarkdown` props like `remarkPlugins` (e.g., `remarkPlugins={[remarkGfm]}`) causes the array reference to change on every render. This forces the library to needlessly invalidate and recreate its internal AST and plugin pipeline, which becomes a severe CPU bottleneck during rapid updates like text streaming.
**Action:** Always extract `remarkPlugins` and `rehypePlugins` arrays to stable module-level constants outside the component body.
