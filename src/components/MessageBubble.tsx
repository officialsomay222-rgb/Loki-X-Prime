import React, { memo } from 'react';
import { Bot, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useSettings } from '../contexts/SettingsContext';

const MemoizedMarkdown = memo(({ content }: { content: string }) => (
  <ReactMarkdown 
    remarkPlugins={[remarkGfm]}
    components={{
      code({node, inline, className, children, ...props}: any) {
        const match = /language-(\w+)/.exec(className || '')
        return !inline && match ? (
          <div className="rounded-md overflow-hidden my-4 border border-white/10 shadow-lg">
            <div className="bg-black/80 text-xs text-slate-400 px-4 py-1.5 flex justify-between items-center border-b border-white/5">
              <span>{match[1]}</span>
            </div>
            <SyntaxHighlighter
              {...props}
              children={String(children).replace(/\n$/, '')}
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              customStyle={{ margin: 0, background: '#0d0d12', padding: '1rem' }}
            />
          </div>
        ) : (
          <code {...props} className={`${className} bg-black/20 dark:bg-white/10 px-1.5 py-0.5 rounded-md text-cyan-600 dark:text-cyan-400 font-mono text-sm`}>
            {children}
          </code>
        )
      }
    }}
  >
    {content}
  </ReactMarkdown>
));

import { Message } from '../contexts/ChatContext';

interface MessageBubbleProps {
  message: Message;
  isAwakened: boolean;
  commanderName: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  formatDate: (date: Date) => string;
}

export const MessageBubble = memo(({
  message,
  isAwakened,
  commanderName,
  copiedId,
  onCopy,
  formatDate
}: MessageBubbleProps) => {
  const { bubbleStyle, fontSize, messageAnimation } = useSettings();

  const fontSizeClass = fontSize === 'small' ? 'text-xs sm:text-sm' : fontSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base';
  const userFontSizeClass = fontSize === 'small' ? 'text-[0.8rem] sm:text-[0.9rem]' : fontSize === 'large' ? 'text-[1rem] sm:text-[1.1rem]' : 'text-[0.9rem] sm:text-[1rem]';

  return (
    <div 
      className={`flex gap-3 sm:gap-4 ${messageAnimation ? 'animate-in fade-in slide-in-from-bottom-4 duration-150' : ''} ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {message.role === 'model' && !isAwakened && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,242,255,0.2)] mt-1 border border-cyan-300/50">
          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )}
      
      <div className={`flex flex-col gap-1 max-w-[95%] sm:max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 px-1.5">
          <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-slate-500 dark:text-[#888] uppercase">
            {message.role === 'user' ? commanderName : 'Loki Prime'}
          </span>
          <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 dark:text-[#6b6b80]">
            {formatDate(message.timestamp)}
          </span>
          {message.status === 'pending' && (
            <span className="text-[8px] sm:text-[9px] font-mono text-cyan-500 animate-pulse">PENDING</span>
          )}
        </div>
        
        <div className="relative group w-full">
          <div 
            className={`px-4 py-3 sm:px-5 sm:py-4 premium-shadow relative overflow-hidden group/bubble transition-all duration-300 ${
              message.role === 'user' 
                ? isAwakened
                  ? 'bg-gradient-to-br from-cyan-950/60 to-blue-950/40 text-cyan-50 rounded-2xl sm:rounded-3xl rounded-tr-sm border border-cyan-500/20 hover:border-cyan-500/40 shadow-[0_0_20px_rgba(0,242,255,0.04)]'
                  : bubbleStyle === 'glass'
                    ? 'bg-slate-900/90 dark:bg-[#2a2a30]/90 text-white rounded-2xl sm:rounded-3xl rounded-tr-sm border border-slate-700 dark:border-white/10 hover:border-slate-600 dark:hover:border-white/20 backdrop-blur-md'
                    : 'bg-slate-900 dark:bg-[#2a2a30] text-white rounded-2xl sm:rounded-3xl rounded-tr-sm'
                : isAwakened 
                  ? 'bg-gradient-to-br from-[#0a0a12]/90 to-[#050508]/90 border border-cyan-500/20 hover:border-cyan-500/40 rounded-xl sm:rounded-2xl rounded-tl-sm text-cyan-50 shadow-[0_0_25px_rgba(0,242,255,0.06)] backdrop-blur-2xl'
                  : bubbleStyle === 'glass'
                    ? 'bg-white/80 dark:bg-[#1e1e22]/80 border border-slate-200/50 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 text-slate-800 dark:text-[#e0e0e0] rounded-xl sm:rounded-2xl rounded-tl-sm backdrop-blur-md'
                    : 'bg-white dark:bg-[#1e1e22] border border-slate-100 dark:border-white/5 text-slate-800 dark:text-[#e0e0e0] rounded-xl sm:rounded-2xl rounded-tl-sm'
            }`}
          >
            {isAwakened && message.role === 'model' && (
              <>
                <div className="absolute top-0 left-0 w-8 h-[1px] bg-gradient-to-r from-cyan-400 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-gradient-to-l from-cyan-400 to-transparent"></div>
                <div className="absolute top-0 left-0 w-[1px] h-8 bg-gradient-to-b from-cyan-400 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-[1px] h-8 bg-gradient-to-t from-cyan-400 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </>
            )}
            {isAwakened && message.role === 'user' && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </>
            )}
            {message.role === 'model' ? (
              <div className={`markdown-body ${fontSizeClass}`}>
                {message.content ? (
                  <MemoizedMarkdown content={message.content} />
                ) : (
                  <div className="flex items-center gap-1 h-4 sm:h-5">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cyan-400 dark:bg-[#00f2ff] rounded-full animate-bounce shadow-[0_0_6px_rgba(0,242,255,0.8)]" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cyan-400 dark:bg-[#00f2ff] rounded-full animate-bounce shadow-[0_0_6px_rgba(0,242,255,0.8)]" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cyan-400 dark:bg-[#00f2ff] rounded-full animate-bounce shadow-[0_0_6px_rgba(0,242,255,0.8)]" style={{ animationDelay: '300ms' }}></span>
                  </div>
                )}
              </div>
            ) : (
              <div className={`whitespace-pre-wrap ${userFontSizeClass} leading-relaxed font-medium`}>
                {message.content}
              </div>
            )}
          </div>
          
          {/* Copy Button */}
          {message.content && (
            <button 
              onClick={() => onCopy(message.content, message.id)}
              className={`absolute ${message.role === 'user' ? '-left-8 sm:-left-10' : '-right-8 sm:-right-10'} top-2 p-1.5 rounded-lg bg-white/50 dark:bg-black/50 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm`}
              title="Copy text"
            >
              {copiedId === message.id ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
