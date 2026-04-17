import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, Pin, PinOff, Edit2, Check, MoreVertical } from 'lucide-react';
import { ChatSession } from '../contexts/ChatContext';

interface TimelineItemProps {
  session: ChatSession;
  isActive: boolean;
  isAwakened: boolean;
  effectSidebar: boolean;
  onClick: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onPin: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  index: number;
}

export const TimelineItem = React.memo(({
  session, isActive, isAwakened, effectSidebar, onClick, onDelete, onPin, onRename, index
}: TimelineItemProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsMenuOpen(true);
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(true);
  };

  const submitRename = () => {
    if (!isEditing) return;
    if (editTitle.trim() && editTitle !== session.title) {
      onRename(session.id, editTitle.trim());
    } else {
      setEditTitle(session.title);
    }
    setIsEditing(false);
    setIsMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitRename();
    } else if (e.key === 'Escape') {
      setEditTitle(session.title);
      setIsEditing(false);
      setIsMenuOpen(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      onClick={(e) => {
        if (!isEditing && !isMenuOpen) onClick(session.id);
      }}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      className={`group relative flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 ${
        isActive
          ? (isAwakened || effectSidebar)
            ? 'bg-cyan-500/20 text-slate-800 dark:text-white shadow-[0_0_15px_rgba(0,242,255,0.15)] border border-cyan-500/40'
            : 'bg-white dark:bg-white/10 text-cyan-700 dark:text-white shadow-md border border-cyan-200/50 dark:border-white/10'
          : `hover:bg-white/50 dark:hover:bg-white/5 border border-transparent ${(isAwakened || effectSidebar) ? 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-500 rounded-r-full shadow-[0_0_10px_rgba(0,242,255,1)]" />
      )}

      <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
        {session.isPinned ? (
          <Pin className={`w-4 h-4 shrink-0 transition-colors text-amber-500 dark:text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]`} />
        ) : (
          <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-cyan-600 dark:text-[#00f2ff]' : (isAwakened || effectSidebar) ? 'text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400' : 'text-slate-400 dark:text-[#6b6b80] group-hover:text-cyan-500'}`} />
        )}

        {isEditing ? (
          <div className="flex-1 flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={submitRename}
              className="flex-1 bg-black/10 dark:bg-white/10 border-b border-cyan-500/50 outline-none text-sm px-1 py-0.5 text-inherit min-w-0"
            />
            <button onClick={submitRename} aria-label="Confirm rename" className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md">
              <Check className="w-3 h-3 text-cyan-500" />
            </button>
          </div>
        ) : (
          <div className="truncate text-sm font-semibold tracking-tight">
            {session.title}
          </div>
        )}
      </div>

      {!isEditing && (
        <div className="flex items-center gap-1">
          {/* Hover Action - Delete only */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(e, session.id);
            }}
            aria-label="Delete timeline"
            className={`hidden md:flex p-1.5 hover:bg-slate-200 dark:hover:bg-black/50 rounded-lg transition-all opacity-0 md:group-hover:opacity-100 ${(isAwakened || effectSidebar) ? 'text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400' : 'text-slate-400 dark:text-[#6b6b80] hover:text-red-500 dark:hover:text-red-400'} ${isMenuOpen ? 'hidden' : ''}`}
            title="Delete timeline"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Menu Trigger (Visible on mobile or when menu is open) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            aria-label="More options"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
            className={`p-1.5 hover:bg-slate-200 dark:hover:bg-black/50 rounded-lg transition-all md:opacity-0 ${isMenuOpen ? 'opacity-100 md:opacity-100 bg-slate-200 dark:bg-black/50' : 'opacity-100 md:pointer-events-none'} ${(isAwakened || effectSidebar) ? 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white' : 'text-slate-400 dark:text-[#6b6b80] hover:text-slate-800 dark:hover:text-white'}`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Popover Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-4 top-10 z-50 py-1.5 min-w-[120px] rounded-xl shadow-xl border backdrop-blur-xl
              ${(isAwakened || effectSidebar)
                ? 'bg-black/80 border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.5)]'
                : 'bg-white/95 dark:bg-[#1a1b26]/95 border-slate-200 dark:border-white/10 shadow-lg'
              }`}
            onClick={e => e.stopPropagation()}
            role="menu"
          >
            <button
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                setIsEditing(true);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors
                ${(isAwakened || effectSidebar) ? 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'}
              `}
            >
              <Edit2 className="w-3.5 h-3.5" />
              Rename
            </button>
            <button
              role="menuitem"
              onClick={() => {
                onPin(session.id);
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors
                ${(isAwakened || effectSidebar) ? 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'}
              `}
            >
              {session.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              {session.isPinned ? 'Unpin' : 'Pin'}
            </button>
            <div className={`h-px w-full my-1 ${(isAwakened || effectSidebar) ? 'bg-white/10' : 'bg-slate-200 dark:bg-white/10'}`} />
            <button
              role="menuitem"
              onClick={(e) => {
                onDelete(e, session.id);
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
