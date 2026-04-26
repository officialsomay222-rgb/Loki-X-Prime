1. **Remove `copiedId` and `setCopiedId` from `App.tsx`.**
   - Also remove `copyToClipboard` from `App.tsx`.
   - Remove `isCopied={copiedId === message.id}` and `onCopy={copyToClipboard}` from `<MessageBubble>` in `App.tsx`.
   - Remove `copiedId` and `copyToClipboard` from `useMemo` dependencies in `App.tsx`.
2. **Update `MessageBubble.tsx` to manage its own `isCopied` state.**
   - Add `const [isCopied, setIsCopied] = useState(false);` inside the `MessageBubble` component.
   - Create a `handleCopy` function inside `MessageBubble` that calls `navigator.clipboard.writeText(message.content)`, sets `isCopied(true)`, and uses `setTimeout` to set `isCopied(false)` after 2000ms.
   - Update the `onClick` handlers for the copy buttons to use `handleCopy` instead of `onCopy`.
   - Remove `isCopied` and `onCopy` from `MessageBubbleProps` and the component parameters.
   - Update `arePropsEqual` in `MessageBubble.tsx` to remove `prevProps.isCopied === nextProps.isCopied`.
3. **Write to `.jules/bolt.md`**.
   - Add an entry about moving transient state (like `isCopied`) to the child component to prevent O(N) list re-renders.
4. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
5. **Create a PR with Title '⚡ Bolt: [performance improvement]' and Description containing '🎯 What', '❓ Why', '📊 Impact', and '🔬 Measurement' sections.**
