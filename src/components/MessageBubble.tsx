import React, { memo, useMemo, useState, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  Edit2,
  Trash2,
  Play,
  Square,
  Mic,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion, AnimatePresence } from "framer-motion";
import {
  BubbleStyle,
  FontSize,
  TextReveal,
  AnimationSpeed,
  AccentColor,
  MessageDensity,
} from "../contexts/SettingsContext";
import { HeaderInfinityLogo, InfinityLogo } from "./Logos";
import { Message } from "../contexts/ChatContext";

import { useSmoothStream } from "../hooks/useSmoothStream";
import { AudioPlayer } from "./AudioPlayer";

// Extract components to prevent re-creation on every render
const MarkdownCode = ({ node, inline, className, children, codeTheme = 'default', ...props }: any) => {
  const match = /language-(\w+)/.exec(className || "");
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    const codeToCopy = String(children).replace(/\n$/, "");
    navigator.clipboard.writeText(codeToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy code: ', err);
    });
  };
  
  const themeClasses = {
    default: "bg-black/80 text-slate-400 border-white/5",
    matrix: "bg-[#0d1a0d] text-[#00ff00] border-[#00ff00]/20",
    neon: "bg-[#0a0a1a] text-[#00f0ff] border-[#00f0ff]/20"
  };
  
  const headerClass = themeClasses[codeTheme as keyof typeof themeClasses] || themeClasses.default;
  const bgClass = codeTheme === 'matrix' ? '#0d1a0d' : codeTheme === 'neon' ? '#0a0a1a' : '#0d0d12';

  return !inline && match ? (
    <div className={`rounded-md overflow-hidden my-4 border shadow-lg ${codeTheme === 'matrix' ? 'border-[#00ff00]/20' : codeTheme === 'neon' ? 'border-[#00f0ff]/20' : 'border-white/10'}`}>
      <div className={`text-xs px-4 py-1.5 flex justify-between items-center border-b ${headerClass}`}>
        <span className={codeTheme === 'matrix' || codeTheme === 'neon' ? 'font-bold tracking-wider' : ''}>{match[1]}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors p-1 rounded-md"
          title="Copy code" aria-label="Copy code"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[10px] uppercase font-bold">{isCopied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        {...props}
        children={String(children).replace(/\n$/, "")}
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
        customStyle={{ margin: 0, background: bgClass, padding: "1rem" }}
      />
    </div>
  ) : (
    <code
      {...props}
      className={`${className} ${codeTheme === 'matrix' ? 'bg-[#00ff00]/10 text-[#00ff00]' : codeTheme === 'neon' ? 'bg-[#00f0ff]/10 text-[#00f0ff]' : 'bg-black/20 dark:bg-white/10 text-white'} px-1.5 py-0.5 rounded-md font-mono text-sm`}
    >
      {children}
    </code>
  );
};

const MarkdownImage = ({ node, ...props }: any) => {
  if (!props.src) return null;

  // Clean URI for strict Android Capacitor WebViews which fail on unencoded characters
  // pollonations.ai also returns unencoded () which might break strictly parsed views
  const safeSrc = props.src.startsWith('data:')
    ? props.src
    : props.src.replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');

  const isDataUri = safeSrc.startsWith("data:");
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <div
        className={`my-4 aspect-square w-full max-w-[512px] mx-auto rounded-lg overflow-hidden shadow-2xl bg-black/40 group/img relative cursor-pointer ${!isLoaded && !hasError ? "textpad-container" : "border border-white/10"}`}
        onClick={() => isLoaded && !hasError && setIsFullscreen(true)}
      >
        {!hasError ? (
          <img
            {...props}
            src={safeSrc}
            className={`w-full h-full object-cover transition-all duration-700 ${isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500 bg-slate-900/80">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span className="text-xs font-mono">IMAGE_RENDER_FAILED</span>
          </div>
        )}

        {/* Hover overlay for fullscreen hint */}
        {isLoaded && !hasError && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-lg"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </div>
        )}

        {/* Loading Placeholder (Premade Canvas) */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-20 border border-white/5">
            <div className="w-40 h-20 mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <InfinityLogo />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-[11px] font-black text-white tracking-[0.4em] uppercase animate-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                Loading Image
              </div>
              <div className="w-32 h-0.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center animate-in fade-in duration-300"
          style={{ paddingTop: 'clamp(24px, env(safe-area-inset-top, 0px), 48px)', paddingBottom: 'clamp(0px, env(safe-area-inset-bottom, 0px), 32px)' }}
          onClick={() => setIsFullscreen(false)}
        >
          <button
            aria-label="Close fullscreen"
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {isDataUri && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement("a");
                link.href = safeSrc;
                link.download = `loki-prime-gen-${Date.now()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              aria-label="Download image"
              className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-white/20 text-white hover:bg-white/40 hover:text-white border border-white/50 transition-all z-50 flex items-center gap-2 font-bold tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              DOWNLOAD IMAGE
            </button>
          )}

          <img
            {...props}
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

const getMarkdownComponents = (
  textReveal: TextReveal,
  animationSpeed: AnimationSpeed,
  codeTheme: 'default' | 'matrix' | 'neon' = 'default'
) => {
  const CodeComponent = (props: any) => <MarkdownCode {...props} codeTheme={codeTheme} />;

  if (textReveal === "none") {
    return {
      code: CodeComponent,
      img: MarkdownImage,
      p({ node, children }: any) {
        return <div className="mb-4 last:mb-0 leading-relaxed">{children}</div>;
      },
      li({ node, children }: any) {
        return <li className="mb-1 leading-relaxed">{children}</li>;
      },
      h1({ node, children }: any) {
        return <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>;
      },
      h2({ node, children }: any) {
        return <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>;
      },
      h3({ node, children }: any) {
        return <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>;
      },
      table({ node, children }: any) {
        return <div className="overflow-x-auto my-4 rounded-lg border border-white/10 shadow-sm"><table className="w-full text-sm text-left border-collapse">{children}</table></div>;
      },
      thead({ node, children }: any) {
        return <thead className="text-xs uppercase bg-black/10 dark:bg-white/5 border-b border-white/10">{children}</thead>;
      },
      tbody({ node, children }: any) {
        return <tbody className="divide-y divide-white/5">{children}</tbody>;
      },
      tr({ node, children }: any) {
        return <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">{children}</tr>;
      },
      th({ node, children }: any) {
        return <th className="px-4 py-3 font-semibold tracking-wider">{children}</th>;
      },
      td({ node, children }: any) {
        return <td className="px-4 py-2.5">{children}</td>;
      },
      a({ node, children, href, ...props }: any) {
        const isSafeProtocol = href && (href.toLowerCase().startsWith('http://') || href.toLowerCase().startsWith('https://') || href.toLowerCase().startsWith('mailto:') || href.startsWith('/'));
        const safeHref = isSafeProtocol ? href : '#';

        if (href && (href.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || children?.[0]?.toString().match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i))) {
          return <MarkdownImage src={safeHref} alt="Linked Image" />;
        }

        return <a href={safeHref} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline" {...props}>{children}</a>;
      },
    };
  }

  const durationMultiplier =
    animationSpeed === "fast" ? 0.5 : animationSpeed === "slow" ? 1.5 : 1;
  const isTypewriter = textReveal === "typewriter";

  return {
    code: CodeComponent,
    img: MarkdownImage,
    p({ node, children }: any) {
      return (
        <motion.div
          initial={{
            opacity: 0,
            y: isTypewriter ? 2 : 8,
            filter: isTypewriter ? "blur(1px)" : "blur(4px)",
          }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: (isTypewriter ? 0.3 : 0.6) * durationMultiplier,
            ease: "easeOut",
          }}
          className="mb-4 last:mb-0 leading-relaxed"
        >
          {children}
        </motion.div>
      );
    },
    li({ node, children }: any) {
      return (
        <motion.li
          initial={{
            opacity: 0,
            x: isTypewriter ? -2 : -8,
            filter: isTypewriter ? "blur(1px)" : "blur(4px)",
          }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{
            duration: (isTypewriter ? 0.2 : 0.5) * durationMultiplier,
            ease: "easeOut",
          }}
          className="mb-1 leading-relaxed"
        >
          {children}
        </motion.li>
      );
    },
    h1({ node, children }: any) {
      return (
        <motion.h1
          initial={{ opacity: 0, y: isTypewriter ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 * durationMultiplier, ease: "easeOut" }}
          className="text-2xl font-bold mt-6 mb-4"
        >
          {children}
        </motion.h1>
      );
    },
    h2({ node, children }: any) {
      return (
        <motion.h2
          initial={{ opacity: 0, y: isTypewriter ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 * durationMultiplier, ease: "easeOut" }}
          className="text-xl font-bold mt-5 mb-3"
        >
          {children}
        </motion.h2>
      );
    },
    h3({ node, children }: any) {
      return (
        <motion.h3
          initial={{ opacity: 0, y: isTypewriter ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 * durationMultiplier, ease: "easeOut" }}
          className="text-lg font-bold mt-4 mb-2"
        >
          {children}
        </motion.h3>
      );
    },
    table({ node, children }: any) {
      return (
        <motion.div
          initial={{ opacity: 0, y: isTypewriter ? 5 : 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 * durationMultiplier, ease: "easeOut" }}
          className="overflow-x-auto my-4 rounded-lg border border-white/10 shadow-sm"
        >
          <table className="w-full text-sm text-left border-collapse">{children}</table>
        </motion.div>
      );
    },
    thead({ node, children }: any) {
      return <thead className="text-xs uppercase bg-black/10 dark:bg-white/5 border-b border-white/10">{children}</thead>;
    },
    tbody({ node, children }: any) {
      return <tbody className="divide-y divide-white/5">{children}</tbody>;
    },
    tr({ node, children }: any) {
      return <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">{children}</tr>;
    },
    th({ node, children }: any) {
      return <th className="px-4 py-3 font-semibold tracking-wider">{children}</th>;
    },
    td({ node, children }: any) {
      return <td className="px-4 py-2.5">{children}</td>;
    },
    a({ node, children, href, ...props }: any) {
      const isSafeProtocol = href && (href.toLowerCase().startsWith('http://') || href.toLowerCase().startsWith('https://') || href.toLowerCase().startsWith('mailto:') || href.startsWith('/'));
      const safeHref = isSafeProtocol ? href : '#';

      if (href && (href.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || children?.[0]?.toString().match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i))) {
        return <MarkdownImage src={safeHref} alt="Linked Image" />;
      }

      return <a href={safeHref} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline" {...props}>{children}</a>;
    },
  };
};

const customUrlTransform = (url: string) => {
  if (url.startsWith("data:image/")) {
    return url;
  }
  return defaultUrlTransform(url);
};

// Extracted to prevent recreation on every render during stream typing
const markdownPlugins = [remarkGfm];

const MemoizedMarkdown = memo(
  ({
    content,
    textReveal,
    animationSpeed,
    codeTheme,
  }: {
    content: string;
    textReveal: TextReveal;
    animationSpeed: AnimationSpeed;
    codeTheme: 'default' | 'matrix' | 'neon';
  }) => {
    const components = useMemo(
      () => getMarkdownComponents(textReveal, animationSpeed, codeTheme),
      [textReveal, animationSpeed, codeTheme],
    );
    const displayedContent = useSmoothStream(
      content,
      animationSpeed,
      textReveal === "typewriter",
    );

    return (
      <ReactMarkdown
        remarkPlugins={markdownPlugins}
        components={components}
        urlTransform={customUrlTransform}
      >
        {displayedContent}
      </ReactMarkdown>
    );
  },
);

const ImageGenerationPlaceholder = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCanvas, setShowCanvas] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowCanvas(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showCanvas) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    // Resize handler
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    // Particles
    const particles = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 1,
      speedY: (Math.random() - 0.5) * 1,
      color: ['#ff3366', '#ffcc00', '#00ffcc', '#0066ff'][Math.floor(Math.random() * 4)]
    }));

    const render = () => {
      // Clear with dark background
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pulse circle in the middle
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const pulseRadius = 50 + Math.sin(time * 0.05) * 10;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseRadius * 2);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.1)");
      grad.addColorStop(1, "transparent");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw particles
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
      });

      time++;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [showCanvas]);

  if (!showCanvas) {
    return (
      <div className="flex items-center gap-1 h-4 sm:h-5">
        <span
          className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-bounce shadow-[0_0_6px_rgba(255,255,255,0.8)]"
          style={{ animationDelay: "0ms" }}
        ></span>
        <span
          className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-bounce shadow-[0_0_6px_rgba(255,255,255,0.8)]"
          style={{ animationDelay: "150ms" }}
        ></span>
        <span
          className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-bounce shadow-[0_0_6px_rgba(255,255,255,0.8)]"
          style={{ animationDelay: "300ms" }}
        ></span>
      </div>
    );
  }

  return (
    <div className="my-4 aspect-square w-full max-w-[512px] mx-auto rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-[#050505] relative gpu-accelerate" style={{ transform: "translateZ(0)" }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-2xl"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-2xl"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-2xl"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-2xl"></div>

      {/* Center Logo & Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        <div className="w-24 h-12 mb-6 opacity-80">
          <InfinityLogo />
        </div>
        <div className="text-[10px] font-mono text-white/80 tracking-[0.4em] uppercase animate-pulse">
          Rendering Canvas
        </div>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  commanderName: string;
  avatarUrl: string;
  isCopied: boolean;
  onCopy: (text: string, id: string) => void;
  onEdit?: (text: string) => void;
  onDelete?: (id: string) => void;
  formatDate: (date: Date) => string;
  bubbleStyle: BubbleStyle;
  fontSize: FontSize;
  messageAnimation: boolean;
  textReveal: TextReveal;
  animationSpeed: AnimationSpeed;
  accentColor: AccentColor;
  messageDensity: MessageDensity;
  showAvatars: boolean;
  isAwakened?: boolean;
  chatAlignment?: 'standard' | 'left';
  blurIntensity?: 'none' | 'low' | 'medium' | 'high';
  timestampFormat?: '12h' | '24h' | 'hidden';
  codeTheme?: 'default' | 'matrix' | 'neon';
  avatarShape?: 'circle' | 'square' | 'rounded';
  messageShadow?: 'none' | 'sm' | 'md' | 'lg';
  resolvedTheme?: 'light' | 'dark';
}

export const MessageBubble = memo(
  ({
    message,
    commanderName,
    avatarUrl,
    isCopied,
    onCopy,
    onEdit,
    onDelete,
    formatDate,
    bubbleStyle,
    fontSize,
    messageAnimation,
    textReveal,
    animationSpeed,
    accentColor,
    messageDensity,
    showAvatars,
    isAwakened,
    chatAlignment = 'standard',
    blurIntensity = 'medium',
    timestampFormat = '12h',
    codeTheme = 'default',
    avatarShape = 'circle',
    messageShadow = 'md',
    resolvedTheme = 'dark',
  }: MessageBubbleProps) => {
    const [isThinkingOpen, setIsThinkingOpen] = useState(false);

    const fontSizeClass =
      fontSize === "small"
        ? "text-xs sm:text-sm"
        : fontSize === "large"
          ? "text-base sm:text-lg"
          : "text-sm sm:text-base";
    const userFontSizeClass =
      fontSize === "small"
        ? "text-[0.8rem] sm:text-[0.9rem]"
        : fontSize === "large"
          ? "text-[1rem] sm:text-[1.1rem]"
          : "text-[0.9rem] sm:text-[1rem]";

    const densityClass = messageDensity === 'compact' ? 'py-1' : 'py-2';
    const gapClass = messageDensity === 'compact' ? 'gap-1' : 'gap-2';
    const bubblePadding = messageDensity === 'compact' ? 'px-3 py-1.5 sm:px-4 sm:py-2' : 'px-4 py-3 sm:px-5 sm:py-4';
    
    const accentHex = resolvedTheme === 'light' ? '#0f172a' : '#ffffff';
    const accentClass = resolvedTheme === 'light' ? 'text-slate-900' : 'text-white';
    const bgAccentClass = 'bg-white/10';
    const borderAccentClass = 'border-white/20';

    const blurClass = blurIntensity === 'none' ? '' : blurIntensity === 'low' ? 'backdrop-blur-sm' : blurIntensity === 'high' ? 'backdrop-blur-xl' : 'backdrop-blur-md';
    const alignmentClass = chatAlignment === 'left' ? 'items-start' : 'items-end';

    const avatarShapeClass = avatarShape === 'circle' ? 'rounded-full' : avatarShape === 'square' ? 'rounded-none' : 'rounded-md';
    const shadowClass = messageShadow === 'none' ? 'shadow-none' : messageShadow === 'sm' ? 'shadow-sm hover:shadow-md' : messageShadow === 'md' ? 'shadow-md hover:shadow-lg' : 'shadow-lg hover:shadow-xl';

    if (message.role === "model") {
      return (
        <motion.div
          initial={messageAnimation ? { opacity: 0, y: 20, scale: 0.95 } : false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", damping: 30, stiffness: 400, mass: 0.8 }}
          className={`flex flex-col ${gapClass} w-full px-2 sm:px-4 gpu-accelerate`}
        >
          <div className="flex items-center gap-3">
            {showAvatars && (
              <div className="w-6 h-6 sm:w-7 sm:h-7 shrink-0">
                <HeaderInfinityLogo className="w-full h-full" />
              </div>
            )}
            <div className="flex items-center gap-2 px-1.5 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase font-mono">
                Loki Prime
              </span>

              {message.reasoning && (
                <div className="flex items-center">
                  <span className="text-slate-500 dark:text-slate-400 mx-1">•</span>
                  <button
                    onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                    title="Toggle thinking" aria-label="Toggle thinking"
                    className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors uppercase"
                  >
                    <Sparkles className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                    <span>Loki's Thinking</span>
                    {isThinkingOpen ? (
                      <ChevronUp className="w-3 h-3 opacity-50" />
                    ) : (
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    )}
                  </button>
                </div>
              )}

            {!message.content && !message.audioUrl && (
              <span className={`text-[9px] sm:text-[10px] font-mono ${accentClass} animate-pulse ml-1`}>
                {message.isImage ? "GENERATING..." : "THINKING..."}
              </span>
            )}
          </div>
          </div>

          <div className="relative group w-full">
            <div
              className={`relative transition-all duration-300 ${densityClass} text-slate-800/90 dark:text-white/90`}
            >
              {message.reasoning && (
                <AnimatePresence>
                  {isThinkingOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mb-4"
                    >
                      <div className="bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 px-3 sm:px-4 py-3 sm:py-4 text-[0.85em] text-slate-600 dark:text-slate-400 italic">
                        <MemoizedMarkdown
                          content={message.reasoning}
                          textReveal="none"
                          animationSpeed="fast"
                          codeTheme={codeTheme}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              <div className={`markdown-body ${fontSizeClass} bg-transparent p-1`}>
                {message.audioUrl && (
                  <div className="mb-3">
                    <AudioPlayer url={message.audioUrl} autoPlay={false} />
                  </div>
                )}
                {message.content ? (
                  message.content.startsWith("SYSTEM ERROR:") ? (
                    <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 mt-0.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs sm:text-sm uppercase tracking-wider">
                          Generation Failed
                        </span>
                        <span className="text-sm">
                          {message.content.replace("SYSTEM ERROR:", "").trim()}
                        </span>
                      </div>
                    </div>
                  ) : message.isImage && message.content.startsWith("![") ? (
                    <MarkdownImage
                      src={message.content.match(/!\[.*?\]\((.+)\)/)?.[1] || ""}
                      alt="Generated Image"
                    />
                  ) : (
                    <MemoizedMarkdown
                      content={message.content}
                      textReveal={textReveal}
                      animationSpeed={animationSpeed}
                      codeTheme={codeTheme}
                    />
                  )
                ) : message.isImage ? (
                  <ImageGenerationPlaceholder />
                ) : !message.audioUrl ? (
                  <div className="flex items-center gap-1 h-4 sm:h-5">
                    <span
                      className={`w-1 h-1 sm:w-1.5 sm:h-1.5 ${accentClass} rounded-full animate-bounce`}
                      style={{ animationDelay: "0ms", backgroundColor: accentHex, boxShadow: `0 0 6px ${accentHex}80` }}
                    ></span>
                    <span
                      className={`w-1 h-1 sm:w-1.5 sm:h-1.5 ${accentClass} rounded-full animate-bounce`}
                      style={{ animationDelay: "150ms", backgroundColor: accentHex, boxShadow: `0 0 6px ${accentHex}80` }}
                    ></span>
                    <span
                      className={`w-1 h-1 sm:w-1.5 sm:h-1.5 ${accentClass} rounded-full animate-bounce`}
                      style={{ animationDelay: "300ms", backgroundColor: accentHex, boxShadow: `0 0 6px ${accentHex}80` }}
                    ></span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Copy & Delete Buttons */}
            {message.content && (
              <div className="absolute -right-2 sm:-right-4 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => onCopy(message.content, message.id)}
                  aria-label="Copy text"
                  className={`p-1.5 rounded-lg bg-white/80 dark:bg-black/80 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:${accentClass}`}
                  title="Copy text"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(message.id)}
                    aria-label="Delete message"
                    className="p-1.5 rounded-lg bg-white/50 dark:bg-black/50 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 backdrop-blur-sm"
                    title="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={messageAnimation ? { opacity: 0, y: 20, scale: 0.95 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 30, stiffness: 400, mass: 0.8 }}
        className={`flex ${chatAlignment === 'left' ? 'justify-start' : 'justify-end'} w-full px-2 sm:px-4 gpu-accelerate`}
      >
        <div className={`flex flex-col ${gapClass} max-w-[95%] sm:max-w-[85%] ${alignmentClass}`}>
          <div className={`flex items-center gap-2 px-1.5 ${chatAlignment === 'left' ? 'flex-row-reverse' : ''}`}>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-slate-500 dark:text-[#888] uppercase">
              {commanderName}
            </span>
            {timestampFormat !== 'hidden' && (
              <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 dark:text-[#6b6b80]">
                {timestampFormat === '24h' ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : formatDate(message.timestamp)}
              </span>
            )}
            {message.status === "pending" && (
              <span className={`text-[8px] sm:text-[9px] font-mono ${accentClass} animate-pulse`}>
                PENDING
              </span>
            )}
            {showAvatars && (
              <div className={`w-5 h-5 sm:w-6 sm:h-6 ${avatarShapeClass} bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 ${chatAlignment === 'left' ? 'mr-1' : 'ml-1'} overflow-hidden border border-slate-300 dark:border-slate-700`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={commanderName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {commanderName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="relative group w-full">
            <div
              className={`relative group/bubble transition-all duration-500 ${bubblePadding} ${blurClass} border ${shadowClass} overflow-hidden ${
                bubbleStyle === "glass"
                  ? `bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 text-slate-900/90 dark:text-white/90 rounded-2xl sm:rounded-3xl ${chatAlignment === 'left' ? 'rounded-tl-sm' : 'rounded-tr-sm'}`
                  : `bg-slate-100/40 dark:bg-white/10 border-slate-200/50 dark:border-white/10 text-slate-900/90 dark:text-white/90 rounded-xl sm:rounded-2xl ${chatAlignment === 'left' ? 'rounded-tl-sm' : 'rounded-tr-sm'}`
              }`}
            >
              {message.audioUrl && (
                <div className="mb-3">
                  <AudioPlayer url={message.audioUrl} autoPlay={false} />
                </div>
              )}
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {message.attachments.map((att, index) => (
                    <div key={index} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-white/20 shadow-sm">
                      <img src={`data:${att.mimeType};base64,${att.data}`} alt={`attachment-${index}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              {message.content && (
                <div
                  className={`whitespace-pre-wrap ${userFontSizeClass} leading-relaxed font-medium`}
                >
                  {message.content}
                </div>
              )}
            </div>

            {/* Copy, Edit & Delete Buttons */}
            {(message.content || message.audioUrl) && (
              <div className="absolute -left-8 sm:-left-10 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                {!message.audioUrl && (
                  <>
                    <button
                      onClick={() => onCopy(message.content, message.id)}
                      aria-label="Copy text"
                      className="p-1.5 rounded-lg bg-white/80 dark:bg-black/80 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-white"
                      title="Copy text"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </button>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(message.content)}
                        aria-label="Edit message"
                        className="p-1.5 rounded-lg bg-white/80 dark:bg-black/80 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-white"
                        title="Edit message"
                      >
                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(message.id)}
                    aria-label="Delete message"
                    className="p-1.5 rounded-lg bg-white/50 dark:bg-black/50 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 backdrop-blur-sm"
                    title="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.status === nextProps.message.status &&
      prevProps.message.isImage === nextProps.message.isImage &&
      prevProps.message.audioUrl === nextProps.message.audioUrl &&
      prevProps.message.attachments === nextProps.message.attachments &&
      prevProps.message.isVoiceResponse === nextProps.message.isVoiceResponse &&
      prevProps.commanderName === nextProps.commanderName &&
      prevProps.avatarUrl === nextProps.avatarUrl &&
      prevProps.isCopied === nextProps.isCopied &&
      prevProps.bubbleStyle === nextProps.bubbleStyle &&
      prevProps.fontSize === nextProps.fontSize &&
      prevProps.messageAnimation === nextProps.messageAnimation &&
      prevProps.textReveal === nextProps.textReveal &&
      prevProps.animationSpeed === nextProps.animationSpeed &&
      prevProps.accentColor === nextProps.accentColor &&
      prevProps.messageDensity === nextProps.messageDensity &&
      prevProps.showAvatars === nextProps.showAvatars &&
      prevProps.isAwakened === nextProps.isAwakened &&
      prevProps.resolvedTheme === nextProps.resolvedTheme &&
      prevProps.chatAlignment === nextProps.chatAlignment &&
      prevProps.blurIntensity === nextProps.blurIntensity &&
      prevProps.timestampFormat === nextProps.timestampFormat &&
      prevProps.codeTheme === nextProps.codeTheme &&
      prevProps.avatarShape === nextProps.avatarShape &&
      prevProps.messageShadow === nextProps.messageShadow &&
      prevProps.onCopy === nextProps.onCopy &&
      prevProps.onEdit === nextProps.onEdit &&
      prevProps.onDelete === nextProps.onDelete &&
      prevProps.formatDate === nextProps.formatDate
    );
  }
);
