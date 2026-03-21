import React, { useState, useEffect, useRef } from 'react';
import { X, User, Sliders, Monitor, Zap, Volume2, Type, Layout, Sparkles, ChevronLeft, ChevronRight, ChevronDown, Camera, Shield, Database, LogOut, Trash2, Download } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportChat: () => void;
  onClearAllChats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onExportChat, onClearAllChats }) => {
  const {
    theme, setTheme,
    bgStyle, setBgStyle,
    commanderName, setCommanderName,
    avatarUrl, setAvatarUrl,
    modelMode, setModelMode,
    tone, setTone,
    systemInstruction, setSystemInstruction,
    temperature, setTemperature,
    topP, setTopP,
    topK, setTopK,
    enterToSend, setEnterToSend,
    bubbleStyle, setBubbleStyle,
    fontSize, setFontSize,
    fontStyle, setFontStyle,
    soundEnabled, setSoundEnabled,
    messageAnimation, setMessageAnimation,
    autoScroll, setAutoScroll,
    typingSpeed, setTypingSpeed,
    showAvatars, setShowAvatars,
    responseLength, setResponseLength,
    accentColor, setAccentColor,
    messageDensity, setMessageDensity,
    thinkingMode, setThinkingMode,
    searchGrounding, setSearchGrounding,
    imageSize, setImageSize,
    liveAudioEnabled, setLiveAudioEnabled,
    animationSpeed, setAnimationSpeed,
    borderRadius, setBorderRadius,
    textReveal, setTextReveal,
    appWidth, setAppWidth,
    glowIntensity, setGlowIntensity,
    isAwakened, setIsAwakened,
    resetSettings
  } = useSettings();

  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'advanced' | 'data'>('account');
  const [mobileView, setMobileView] = useState<'menu' | 'content'>('menu');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMobileView('menu');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Layout },
    { id: 'advanced', label: 'Advanced', icon: Sliders },
    { id: 'data', label: 'Data & Privacy', icon: Database },
  ] as const;

  const handleTabClick = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    setMobileView('content');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex bg-white dark:bg-[#000000] animate-in fade-in duration-300 font-sans overscroll-none settings-modal">
      <div className="w-full h-[100dvh] flex flex-col md:flex-row overflow-hidden max-w-[1600px] mx-auto relative">
        
        {/* Sidebar (Menu) */}
        <div className={`w-full md:w-[320px] shrink-0 border-r border-slate-200 dark:border-white/10 bg-[#f8fafd] dark:bg-[#131314] flex-col ${mobileView === 'menu' ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-6 md:p-8 flex items-center justify-between shrink-0">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Settings
            </h2>
            <button 
              onClick={onClose}
              className="p-2 -mr-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors md:hidden"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 md:px-6 space-y-1 custom-scrollbar min-h-0 overscroll-contain touch-pan-y">
            {/* Profile Summary in Sidebar */}
            <div className="mb-8 p-4 rounded-lg bg-white dark:bg-[#1e1f20] border border-slate-200 dark:border-white/10 flex items-center gap-4 shadow-sm">
              <img src={avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-slate-300 dark:border-white/20" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{commanderName}</h3>
                <p className="text-xs text-slate-600 dark:text-[#9aa0a6] truncate font-medium">Pro Member</p>
              </div>
            </div>

            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-full transition-all text-left group ${
                    isActive 
                      ? 'bg-slate-200 text-slate-900 dark:bg-white/10 dark:text-white' 
                      : 'text-slate-700 dark:text-[#bdc1c6] hover:bg-slate-200/50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-[#9aa0a6] group-hover:text-slate-900 dark:group-hover:text-white transition-colors'}`} />
                    <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 md:hidden ${isActive ? 'text-slate-900/50 dark:text-white/50' : 'text-slate-400 dark:text-slate-500'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 flex-col min-w-0 bg-white dark:bg-[#000000] relative h-full overflow-hidden ${mobileView === 'content' ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex items-center justify-between p-4 md:p-8 border-b border-slate-100 dark:border-white/10 shrink-0 bg-white/80 dark:bg-[#000000]/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => mobileView === 'content' ? setMobileView('menu') : onClose()}
                className="p-2 -ml-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-6 h-6" />
                <span className="text-sm font-semibold hidden sm:inline">Back</span>
              </button>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white capitalize tracking-tight">
                {activeTab === 'data' ? 'Data & Privacy' : activeTab}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar min-h-0 overscroll-contain touch-pan-y">
            <div className="max-w-3xl mx-auto space-y-12 pb-24">
              
              {activeTab === 'account' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Avatar Section */}
                  <section className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Profile Picture</h4>
                    <div className="flex items-center gap-6">
                      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 dark:border-white/10 group-hover:border-slate-400 dark:group-hover:border-white/30 transition-colors">
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                          <Camera className="w-8 h-8 text-slate-900 dark:text-white drop-shadow-md" />
                        </div>
                      </div>
                      <div>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-black rounded-full text-sm font-semibold transition-colors"
                        >
                          Change Avatar
                        </button>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">JPG, GIF or PNG. 1MB max.</p>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleImageUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />
                      </div>
                    </div>
                  </section>

                  <hr className="border-slate-100 dark:border-white/10" />

                  {/* Profile Details */}
                  <section className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Personal Information</h4>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Display Name</label>
                        <input 
                          type="text" 
                          value={commanderName}
                          onChange={(e) => setCommanderName(e.target.value)}
                          className="w-full bg-transparent border-b border-slate-300 dark:border-white/20 px-0 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors text-lg placeholder-slate-400 dark:placeholder-slate-600"
                          placeholder="Enter your name"
                        />
                      </div>

                      <div className="pt-4">
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">Model Mode</label>
                        <div className="flex gap-3">
                          {['pro', 'fast', 'happy'].map((m) => (
                            <button
                              key={m}
                              onClick={() => setModelMode(m as any)}
                              className={`flex-1 py-3 rounded-lg border text-sm font-bold capitalize transition-all ${modelMode === m ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-black shadow-md' : 'bg-transparent border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-white/40'}`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Pro mode uses advanced reasoning, Fast is for quick tasks, Happy is for a cheerful tone.</p>
                      </div>
                    </div>
                  </section>

                  <hr className="border-slate-100 dark:border-white/10" />

                  {/* Preferences Section */}
                  <section className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Chat Preferences</h4>
                    
                    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Enter to Send</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Send message on Enter, Shift+Enter for new line</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input type="checkbox" className="sr-only peer" checked={enterToSend} onChange={(e) => setEnterToSend(e.target.checked)} />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-slate-900 dark:peer-checked:bg-white"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Sound Effects</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Play sounds for messages and actions</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input type="checkbox" className="sr-only peer" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-slate-900 dark:peer-checked:bg-white"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Auto Scroll</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Automatically scroll to new messages</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input type="checkbox" className="sr-only peer" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-slate-900 dark:peer-checked:bg-white"></div>
                      </label>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <section className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Theme & Background</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {['dark', 'light', 'system'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t as any)}
                          className={`p-5 rounded-lg border text-base font-semibold capitalize transition-all ${theme === t ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-black shadow-lg' : 'bg-transparent border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-white/40'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    
                    <div className="pt-4">
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">Background Style</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {['nebula', 'aurora', 'void', 'minimal'].map((s) => (
                          <button
                            key={s}
                            onClick={() => setBgStyle(s as any)}
                            className={`px-4 py-2.5 rounded-lg border text-sm font-medium capitalize transition-all ${bgStyle === s ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-black shadow-md' : 'bg-transparent border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-white/40'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>


                  </section>

                  <section className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Typography & Layout</h4>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">Font Size</label>
                          <div className="relative">
                            <select 
                              value={fontSize} 
                              onChange={(e) => setFontSize(e.target.value as any)}
                              className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none text-base font-medium cursor-pointer"
                            >
                              <option value="small">Small</option>
                              <option value="medium">Medium</option>
                              <option value="large">Large</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">Font Style</label>
                          <div className="relative">
                            <select 
                              value={fontStyle} 
                              onChange={(e) => setFontStyle(e.target.value as any)}
                              className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none text-base font-medium cursor-pointer"
                            >
                              <option value="sans">Sans Serif</option>
                              <option value="serif">Serif</option>
                              <option value="mono">Monospace</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">Message Style</label>
                          <div className="relative">
                            <select 
                              value={bubbleStyle} 
                              onChange={(e) => setBubbleStyle(e.target.value as any)}
                              className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none text-base font-medium cursor-pointer"
                            >
                              <option value="glass">Glassmorphism</option>
                              <option value="flat">Flat Minimal</option>
                              <option value="gradient">Vibrant Gradient</option>
                              <option value="brutalist">Brutalist</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">Border Radius</label>
                          <div className="relative">
                            <select 
                              value={borderRadius} 
                              onChange={(e) => setBorderRadius(e.target.value as any)}
                              className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none text-base font-medium cursor-pointer"
                            >
                              <option value="sharp">Square</option>
                              <option value="rounded">Rounded Rectangle</option>
                              <option value="pill">Pill</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">App Width</label>
                          <div className="relative">
                            <select 
                              value={appWidth} 
                              onChange={(e) => setAppWidth(e.target.value as any)}
                              className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none text-base font-medium cursor-pointer"
                            >
                              <option value="narrow">Narrow</option>
                              <option value="normal">Standard</option>
                              <option value="wide">Wide</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">Glow Intensity</label>
                          <div className="relative">
                            <select 
                              value={glowIntensity} 
                              onChange={(e) => setGlowIntensity(e.target.value as any)}
                              className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none text-base font-medium cursor-pointer"
                            >
                              <option value="none">None</option>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Animations & Effects</h4>
                    
                    <div className="space-y-8">
                      <div>
                        <div className="flex justify-between mb-4">
                          <label className="text-sm font-semibold text-slate-900 dark:text-white">Typing Speed</label>
                          <span className="text-sm font-mono text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md">{typingSpeed}ms</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" step="5" 
                          value={typingSpeed} 
                          onChange={(e) => setTypingSpeed(parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                        />
                        <div className="flex justify-between text-xs font-medium text-slate-500 mt-3 uppercase tracking-wider">
                          <span>Instant</span>
                          <span>Slow</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">Animation Speed</label>
                          <div className="relative">
                            <select 
                              value={animationSpeed} 
                              onChange={(e) => setAnimationSpeed(e.target.value as any)}
                              className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none text-base font-medium cursor-pointer"
                            >
                              <option value="fast">Fast</option>
                              <option value="normal">Normal</option>
                              <option value="slow">Slow</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">Text Reveal Effect</label>
                          <div className="relative">
                            <select 
                              value={textReveal} 
                              onChange={(e) => setTextReveal(e.target.value as any)}
                              className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none text-base font-medium cursor-pointer"
                            >
                              <option value="none">None (Instant)</option>
                              <option value="typewriter">Typewriter</option>
                              <option value="fade">Fade In</option>
                              <option value="slide">Slide Up</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Visuals</h4>
                    
                    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Message Density</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Spacing between messages</div>
                      </div>
                      <div className="relative w-32 shrink-0 ml-4">
                        <select 
                          value={messageDensity} 
                          onChange={(e) => setMessageDensity(e.target.value as any)}
                          className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none text-sm font-medium cursor-pointer capitalize"
                        >
                          <option value="compact">Compact</option>
                          <option value="comfortable">Comfortable</option>
                          <option value="spacious">Spacious</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Show Avatars</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Display avatars next to messages</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input type="checkbox" className="sr-only peer" checked={showAvatars} onChange={(e) => setShowAvatars(e.target.checked)} />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-slate-900 dark:peer-checked:bg-white"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Message Animation</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Animate messages as they appear</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input type="checkbox" className="sr-only peer" checked={messageAnimation} onChange={(e) => setMessageAnimation(e.target.checked)} />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-slate-900 dark:peer-checked:bg-white"></div>
                      </label>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <section className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Model Configuration</h4>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">System Instruction</label>
                      <textarea 
                        value={systemInstruction}
                        onChange={(e) => setSystemInstruction(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all min-h-[160px] resize-y text-base font-mono"
                        placeholder="You are a helpful AI assistant..."
                      />
                      <p className="text-sm text-slate-500 mt-3">Instructions that guide the model's behavior across the entire conversation.</p>
                    </div>

                    <div className="space-y-10 pt-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">Response Tone</label>
                        <div className="relative">
                          <select 
                            value={tone} 
                            onChange={(e) => setTone(e.target.value as any)}
                            className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none text-base font-medium cursor-pointer capitalize"
                          >
                            <option value="formal">Formal & Professional</option>
                            <option value="casual">Casual & Friendly</option>
                            <option value="humorous">Witty & Humorous</option>
                            <option value="concise">Concise & Direct</option>
                          </select>
                          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-4">
                          <label className="text-sm font-semibold text-slate-900 dark:text-white">Temperature</label>
                          <span className="text-sm font-mono text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md">{temperature}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="2" step="0.1" 
                          value={temperature} 
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                        />
                        <div className="flex justify-between text-xs font-medium text-slate-500 mt-3 uppercase tracking-wider">
                          <span>Precise</span>
                          <span>Creative</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-4">
                          <label className="text-sm font-semibold text-slate-900 dark:text-white">Top P</label>
                          <span className="text-sm font-mono text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md">{topP}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="1" step="0.05" 
                          value={topP} 
                          onChange={(e) => setTopP(parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-4">
                          <label className="text-sm font-semibold text-slate-900 dark:text-white">Top K</label>
                          <span className="text-sm font-mono text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md">{topK}</span>
                        </div>
                        <input 
                          type="range" 
                          min="1" max="100" step="1" 
                          value={topK} 
                          onChange={(e) => setTopK(parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Features</h4>
                    
                    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Awakened Mode</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Enable experimental AI personality traits</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input type="checkbox" className="sr-only peer" checked={isAwakened} onChange={(e) => setIsAwakened(e.target.checked)} />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-slate-900 dark:peer-checked:bg-white"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Google Search Grounding</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Allow the model to access real-time information</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input type="checkbox" className="sr-only peer" checked={searchGrounding} onChange={(e) => setSearchGrounding(e.target.checked)} />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-slate-900 dark:peer-checked:bg-white"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Thinking Mode</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Show the model's reasoning process</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input type="checkbox" className="sr-only peer" checked={thinkingMode} onChange={(e) => setThinkingMode(e.target.checked)} />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-slate-900 dark:peer-checked:bg-white"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Live Audio</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Enable real-time voice interactions</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input type="checkbox" className="sr-only peer" checked={liveAudioEnabled} onChange={(e) => setLiveAudioEnabled(e.target.checked)} />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-slate-900 dark:peer-checked:bg-white"></div>
                      </label>
                    </div>

                      <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">Image Generation Size</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Resolution for generated images</div>
                        </div>
                        <div className="relative w-32 shrink-0 ml-4">
                          <select 
                            value={imageSize} 
                            onChange={(e) => setImageSize(e.target.value as any)}
                            className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none text-sm font-medium cursor-pointer"
                          >
                            <option value="1K">1K (Standard)</option>
                            <option value="2K">2K (High)</option>
                            <option value="4K">4K (Ultra)</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">Response Length</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Preferred length of AI responses</div>
                        </div>
                        <div className="relative w-32 shrink-0 ml-4">
                          <select 
                            value={responseLength} 
                            onChange={(e) => setResponseLength(e.target.value as any)}
                            className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none text-sm font-medium cursor-pointer capitalize"
                          >
                            <option value="short">Short</option>
                            <option value="balanced">Balanced</option>
                            <option value="detailed">Detailed</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                      </div>
                  </section>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <section className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Data Management</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-full">
                            <Download className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                          </div>
                          <div>
                            <h5 className="text-base font-semibold text-slate-900 dark:text-white">Export Data</h5>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Download your current chat history as JSON</p>
                          </div>
                        </div>
                        <button 
                          onClick={onExportChat}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-black rounded-full text-sm font-semibold transition-colors"
                        >
                          Export
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-5 rounded-lg border border-red-200 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-900/50 transition-colors bg-red-50/50 dark:bg-red-950/10">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <h5 className="text-base font-semibold text-red-600 dark:text-red-400">Clear History</h5>
                            <p className="text-sm text-red-500/80 dark:text-red-400/80">Permanently delete all chat sessions</p>
                          </div>
                        </div>
                        {!showClearConfirm ? (
                          <button 
                            onClick={() => setShowClearConfirm(true)}
                            className="px-4 py-2 bg-[#b3261e] hover:bg-[#8c1d18] text-white rounded-full text-sm font-semibold transition-colors"
                          >
                            Clear
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setShowClearConfirm(false)}
                              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => {
                                onClearAllChats();
                                onClose();
                                setShowClearConfirm(false);
                              }}
                              className="px-4 py-2 bg-[#b3261e] hover:bg-[#8c1d18] text-white rounded-full text-sm font-bold transition-colors shadow-lg shadow-red-500/20"
                            >
                              Confirm
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Privacy</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">Local Storage Only</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your data never leaves your browser</div>
                        </div>
                        <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">Active</div>
                      </div>
                      <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">Anonymous Usage Data</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Help improve Loki by sharing anonymous metrics</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                          <input type="checkbox" className="sr-only peer" checked={true} readOnly />
                          <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-slate-900 dark:peer-checked:bg-white"></div>
                        </label>
                      </div>
                    </div>
                  </section>

                  <hr className="border-slate-100 dark:border-white/10" />

                  <section className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">System Reset</h4>
                    <div className="flex items-center justify-between p-5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-full">
                            <LogOut className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                          </div>
                          <div>
                            <h5 className="text-base font-semibold text-slate-900 dark:text-white">Reset Settings</h5>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Restore all preferences to default</p>
                          </div>
                        </div>
                        <button 
                          onClick={resetSettings}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white rounded-full text-sm font-semibold transition-colors"
                        >
                          Reset
                        </button>
                      </div>
                  </section>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
