import { useState, useEffect, useRef } from "react";

// Detect low-end devices (e.g., Exynos 850, old phones)
const isLowEndDevice = () => {
  if (typeof window === 'undefined') return false;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  return hardwareConcurrency <= 4 || deviceMemory <= 4;
};

export function useSmoothStream(
  content: string,
  speed: "slow" | "normal" | "fast",
  enabled: boolean,
) {
  const [displayedContent, setDisplayedContent] = useState(content);
  const contentRef = useRef(content);
  const displayedRef = useRef(content);
  const isLowEnd = useRef(isLowEndDevice());

  useEffect(() => {
    contentRef.current = content;

    // Disable typing animation on low-end devices or if disabled by user
    if (!enabled || isLowEnd.current) {
      setDisplayedContent(content);
      displayedRef.current = content;
      return;
    }

    // If content was completely replaced (e.g. new message), reset
    if (!content.startsWith(displayedRef.current)) {
      setDisplayedContent(content);
      displayedRef.current = content;
      return;
    }

    const charsPerTick = speed === "fast" ? 8 : speed === "slow" ? 2 : 4;

    const intervalId = window.setInterval(() => {
      if (displayedRef.current.length < contentRef.current.length) {
        const nextContent = contentRef.current.substring(
          0,
          displayedRef.current.length + charsPerTick,
        );
        setDisplayedContent(nextContent);
        displayedRef.current = nextContent;
      } else {
        clearInterval(intervalId);
      }
    }, 30); // ~33fps, reduces ReactMarkdown parsing load

    return () => clearInterval(intervalId);
  }, [content, speed, enabled]);

  return displayedContent;
}
