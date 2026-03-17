import { useState, useEffect, useRef } from "react";

export function useSmoothStream(
  content: string,
  speed: "slow" | "normal" | "fast",
  enabled: boolean,
) {
  const [displayedContent, setDisplayedContent] = useState(content);
  const contentRef = useRef(content);
  const displayedRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;

    if (!enabled) {
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

    let animationFrameId: number;

    const charsPerFrame = speed === "fast" ? 4 : speed === "slow" ? 1 : 2;

    const updateText = () => {
      if (displayedRef.current.length < contentRef.current.length) {
        const nextContent = contentRef.current.substring(
          0,
          displayedRef.current.length + charsPerFrame,
        );
        setDisplayedContent(nextContent);
        displayedRef.current = nextContent;
        animationFrameId = requestAnimationFrame(updateText);
      }
    };

    animationFrameId = requestAnimationFrame(updateText);

    return () => cancelAnimationFrame(animationFrameId);
  }, [content, speed, enabled]);

  return displayedContent;
}
