import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Sliders, Monitor, Zap, Volume2, Type, Layout, Sparkles, Camera, 
  Shield, Database, LogOut, Trash2, Download, ChevronDown, ChevronRight, 
  MessageSquare, Bell, History, Info, HelpCircle, FileText, Lock, Eye, 
  MousePointer2, Smartphone, Moon, Sun, Cloud, Keyboard, XCircle, CheckCircle, 
  Circle, Maximize, Minimize, Square, Box, Palette, Droplets, Wind, Activity, Send, ArrowRight, Rocket
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

import { TermsOverlay } from './TermsOverlay';
import { PrivacyOverlay } from './PrivacyOverlay';
import { ReportOverlay } from './ReportOverlay';
import { ClearConfirmOverlay } from './ClearConfirmOverlay';
import { PickerOverlay } from './PickerOverlay';
import { AssistantIntroOverlay } from './AssistantIntroOverlay';


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportChat: () => void;
  onClearAllChats: () => void;
}

// Sub-component for Edit Profile to prevent lag
const EditProfileOverlay = ({ name, email, onSave, onClose }: { key?: string, name: string, email: string, onSave: (name: string, email: string) => void, onClose: () => void }) => {
  const [tempName, setTempName] = useState(name);
  const [tempEmail, setTempEmail] = useState(email);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-[120] bg-white dark:bg-[#0a0a0a] flex flex-col"
    >
      <div className="flex items-center gap-4 p-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] sticky top-0">
        <motion.button 
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose} 
          aria-label="Collapse Menu"
          title="Collapse Menu"
          className="p-2 rounded-full transition-colors"
        >
          <ChevronDown className="w-5 h-5 text-slate-900 dark:text-white" />
        </motion.button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Edit Profile</h2>
      </div>
      <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar transform-gpu" style={{ WebkitOverflowScrolling: 'touch', transform: 'translateZ(0)', willChange: 'transform' }}>
        <div className="space-y-4">
          <label htmlFor="displayName" className="block text-[10px] font-bold text-slate-500 dark:text-[#717171] uppercase tracking-[0.2em]">Display Name</label>
          <input id="displayName"
            type="text" 
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-slate-300 dark:focus:border-white/20 transition-colors"
            placeholder="Enter your name"
            autoFocus
          />
        </div>
        <div className="space-y-4">
          <label htmlFor="emailAddress" className="block text-[10px] font-bold text-slate-500 dark:text-[#717171] uppercase tracking-[0.2em]">Email Address</label>
          <input id="emailAddress"
            type="email" 
            value={tempEmail}
            onChange={(e) => setTempEmail(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-slate-300 dark:focus:border-white/20 transition-colors"
            placeholder="Enter your email"
          />
        </div>
        <motion.button 
          whileHover={{ scale: 1.02, backgroundColor: "#f0f0f0" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSave(tempName, tempEmail)}
          className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold transition-all mt-4 shadow-xl"
        >
          Save Changes
        </motion.button>
      </div>
    </motion.div>
  );
};

const SettingSection = ({ title, children }: any) => (
  <motion.div 
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }
    }}
    className="space-y-3"
  >
    {title && <h3 className="px-4 text-[11px] font-bold text-slate-500 dark:text-[#717171] uppercase tracking-[0.2em]">{title}</h3>}
    <div className="bg-slate-50 dark:bg-[#161616] rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm transform-gpu">
      {children}
    </div>
  </motion.div>
);

const SettingItem = ({ icon: Icon, label, value, subLabel, onClick, children, danger, noBorder, type, options, min, max, step, onChange, checked, setShowPicker }: any) => {
  const renderControl = () => {
    if (children) return children;
    
    switch (type) {
      case 'toggle':
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
            <div className="w-11 h-6 bg-slate-200 dark:bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-white peer-checked:after:bg-white dark:peer-checked:after:bg-black"></div>
          </label>
        );
      case 'select':
        return (
          <motion.div 
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setShowPicker({ label, options, value, onChange, rect });
            }}
            className="flex items-center gap-1 text-sm text-slate-500 dark:text-[#717171] hover:text-slate-900 dark:hover:text-white transition-colors py-1 px-2 -mr-2 rounded-lg cursor-pointer" aria-label={label}
          >
            <span className="capitalize">{value}</span>
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        );
      case 'range':
        return (
          <div className="flex items-center gap-3 min-w-[120px]">
            <input 
              type="range" min={min} max={max} step={step} value={value} 
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-slate-200 dark:bg-[#333] rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
              aria-label={label}
            />
            <span className="text-[10px] font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-[#222] px-1.5 py-0.5 rounded min-w-[24px] text-center">{value}</span>
          </div>
        );
      case 'text':
        return (
          <input 
            type="text" 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-transparent text-sm text-slate-900 dark:text-white text-right focus:outline-none w-32"
            placeholder="Enter..."
            aria-label={label}
          />
        );
      default:
        return onClick ? <ChevronRight className="w-4 h-4 text-slate-500 dark:text-[#717171]" /> : null;
    }
  };

  return (
    <motion.div 
      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
      whileTap={onClick ? { scale: 0.995 } : {}}
      onClick={onClick}
      className={`flex items-center justify-between p-4 transition-colors ${onClick ? 'cursor-pointer' : ''} ${!noBorder ? 'border-b border-slate-100 dark:border-white/5' : ''} ${danger ? 'text-red-500' : ''}`}
    >
      <div className="flex items-center gap-4 flex-1 mr-4">
        {Icon && <Icon className={`w-5 h-5 shrink-0 ${danger ? 'text-red-500' : 'text-slate-500 dark:text-[#717171]'}`} />}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-bold truncate ${danger ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{label}</div>
          {subLabel && <div className="text-xs text-slate-500 dark:text-[#717171] line-clamp-1">{subLabel}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        {renderControl()}
      </div>
    </motion.div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onExportChat, onClearAllChats }) => {
  const {
    theme, setTheme,
    bgStyle, setBgStyle,
    commanderName, setCommanderName,
    commanderEmail, setCommanderEmail,
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
    effectInputBox, setEffectInputBox,
    effectMessageBubbles, setEffectMessageBubbles,
    effectSidebar, setEffectSidebar,
    effectBackground, setEffectBackground,
    effectAvatar, setEffectAvatar,
    sidebarPosition, setSidebarPosition,
    chatAlignment, setChatAlignment,
    blurIntensity, setBlurIntensity,
    timestampFormat, setTimestampFormat,
    soundTheme, setSoundTheme,
    codeTheme, setCodeTheme,
    avatarShape, setAvatarShape,
    messageShadow, setMessageShadow,
    sendButtonIcon, setSendButtonIcon,
    resetSettings
  } = useSettings();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPicker, setShowPicker] = useState<{ label: string, options: any[], value: any, onChange: (val: any) => void, rect?: DOMRect } | null>(null);
  const [showAssistantIntro, setShowAssistantIntro] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center overflow-hidden">
          {/* Backdrop (Optional for full screen, but good for exit) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex flex-col overflow-hidden relative bg-white dark:bg-[#0a0a0a] z-10 shadow-2xl transform-gpu will-change-transform"
          >
            
            {/* Header */}
            <div
              className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 shrink-0 bg-white dark:bg-[#0a0a0a] sticky top-0 z-20"
              style={{ paddingTop: 'calc(1rem + clamp(24px, env(safe-area-inset-top, 0px), 48px))' }}
            >
              <div className="flex items-center gap-4">
                <motion.button 
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose} 
                  aria-label="Close Settings"
                  title="Close Settings"
                  className="p-2 rounded-full transition-colors group"
                >
                  <X className="w-6 h-6 text-slate-500 dark:text-[#717171] group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                </motion.button>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Settings</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-1.5 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10 shadow-inner">
                  <span className="text-[11px] font-black text-slate-500 dark:text-[#717171] uppercase tracking-[0.2em]">Loki Prime X</span>
                </div>
              </div>
            </div>
              
              <motion.div 
                ref={scrollContainerRef} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-1 overflow-y-auto p-6 sm:p-12 custom-scrollbar min-h-0 overscroll-contain transform-gpu"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  transform: 'translateZ(0)',
                  paddingBottom: 'calc(3rem + clamp(0px, env(safe-area-inset-bottom, 0px), 32px))'
                }}
              >
              <div className="max-w-3xl mx-auto space-y-12">
            
                {/* Profile Section - Centered */}
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                  }}
                  className="flex flex-col items-center py-6 space-y-4"
                >
                  <div className="relative">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 dark:border-white/10 shadow-2xl cursor-pointer group relative aspect-square"
                      style={{ borderRadius: '9999px' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden" style={{ borderRadius: '9999px' }}>
                        <img 
                          src={avatarUrl} 
                          alt="Avatar" 
                          className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/40 dark:bg-black/40" style={{ borderRadius: '9999px' }}>
                        <Camera className="w-6 h-6 text-slate-900 dark:text-white" />
                      </div>
                    </motion.div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  </div>
                  
                  <div className="text-center space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{commanderName || 'Owner'}</h3>
                    <p className="text-sm text-slate-500 dark:text-[#717171] font-medium">{commanderEmail}</p>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: "#f0f0f0" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEditProfile(true)}
                    className="px-10 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-sm font-bold transition-all shadow-xl shadow-black/5 dark:shadow-white/5"
                  >
                    Edit Profile
                  </motion.button>
                </motion.div>

                {/* Promo Card */}
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                  }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-white to-slate-50 dark:from-[#1d1d1d] dark:to-[#161616] rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-white/5 shadow-xl transform-gpu"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <Zap className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Try Loki Prime X Pro</h4>
                      <p className="text-xs text-slate-500 dark:text-[#717171]">Upgrade for higher limits & exclusive features</p>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Try Now
                  </motion.button>
                </motion.div>

                {/* General Section */}
                <SettingSection title="General" delay={0.2}>
                  <SettingItem 
                    icon={Monitor} 
                    label="Appearance" 
                    type="select"
                    value={theme}
                    onChange={setTheme}
                    setShowPicker={setShowPicker}
                    options={[
                      { label: 'Dark', value: 'dark', icon: Moon },
                      { label: 'Light', value: 'light', icon: Sun },
                      { label: 'System', value: 'system', icon: Monitor }
                    ]}
                  />
                  <SettingItem 
                    icon={Volume2} 
                    label="Sound Effects" 
                    type="toggle"
                    checked={soundEnabled}
                    onChange={setSoundEnabled}
                  />
                  <SettingItem 
                    icon={Volume2} 
                    label="Sound Theme" 
                    type="select"
                    value={soundTheme}
                    onChange={setSoundTheme}
                    setShowPicker={setShowPicker}
                    options={[
                      { label: 'Sci-Fi', value: 'sci-fi', icon: Zap },
                      { label: 'Minimal', value: 'minimal', icon: Circle },
                      { label: 'Retro', value: 'retro', icon: Square }
                    ]}
                    noBorder
                  />
                </SettingSection>

                {/* Intelligence Section */}
                <SettingSection title="Intelligence" delay={0.25}>
                  <div className="p-4 space-y-6 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-4">
                      <Sparkles className="w-5 h-5 text-slate-500 dark:text-[#717171]" />
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Advanced Model Config</div>
                    </div>
                    <div className="space-y-6 pl-9">
                      <div>
                        <div id="model-mode-label" className="block text-[10px] font-bold text-slate-500 dark:text-[#717171] mb-3 uppercase tracking-[0.2em]">Model Mode</div>
                        <div role="group" aria-labelledby="model-mode-label" className="flex gap-2 p-1 bg-slate-100 dark:bg-[#222] rounded-xl">
                          {['pro', 'fast', 'happy'].map((m) => (
                            <motion.button
                              key={m}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setModelMode(m as any)}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${modelMode === m ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-500 dark:text-[#717171] hover:text-slate-900 dark:hover:text-white'}`}
                            >
                              {m}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label htmlFor="temperature-slider" className="text-[10px] font-bold text-slate-500 dark:text-[#717171] uppercase tracking-[0.2em]">Temperature</label>
                          <span className="text-xs font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-[#222] px-2 py-0.5 rounded border border-slate-100 dark:border-white/5">{temperature}</span>
                        </div>
                        <input 
                          id="temperature-slider"
                          type="range" min="0" max="2" step="0.1" value={temperature} 
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-[#333] rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                        />
                      </div>
                    </div>
                  </div>
                  {modelMode === 'pro' && (
                    <SettingItem
                      icon={Zap}
                      label="Thinking Mode"
                      subLabel="Enable step-by-step reasoning"
                      type="toggle"
                      checked={thinkingMode}
                      onChange={setThinkingMode}
                    />
                  )}
                  <SettingItem 
                    icon={Eye} 
                    label="Search Grounding" 
                    subLabel="Use Google Search for real-time info"
                    type="toggle"
                    checked={searchGrounding}
                    onChange={setSearchGrounding}
                    noBorder
                  />
                </SettingSection>

                {/* Voice & Input */}
                <SettingSection title="Voice & Input" delay={0.3}>
                  <SettingItem
                    icon={Sparkles}
                    label="AI Assistant"
                    subLabel="Set as default digital assistant"
                    onClick={() => setShowAssistantIntro(true)}
                  />
                  <SettingItem 
                    icon={Smartphone} 
                    label="Live Audio" 
                    subLabel="Enable real-time voice interaction"
                    type="toggle"
                    checked={liveAudioEnabled}
                    onChange={setLiveAudioEnabled}
                  />
                  <SettingItem 
                    icon={MousePointer2} 
                    label="Enter to Send" 
                    type="toggle"
                    checked={enterToSend}
                    onChange={setEnterToSend}
                    noBorder
                  />
                </SettingSection>

                {/* Visuals */}
                <SettingSection title="Visuals" delay={0.35}>
                  <SettingItem 
                    icon={Layout} 
                    label="Sidebar Position" 
                    type="select"
                    value={sidebarPosition}
                    onChange={setSidebarPosition}
                    setShowPicker={setShowPicker}
                    options={[
                      { label: 'Left', value: 'left', icon: Layout },
                      { label: 'Right', value: 'right', icon: Layout }
                    ]}
                  />
                  <SettingItem 
                    icon={Layout} 
                    label="Chat Alignment" 
                    type="select"
                    value={chatAlignment}
                    onChange={setChatAlignment}
                    setShowPicker={setShowPicker}
                    options={[
                      { label: 'Standard', value: 'standard', icon: Layout },
                      { label: 'Left Aligned', value: 'left', icon: Layout }
                    ]}
                  />
                  <SettingItem 
                    icon={Droplets} 
                    label="Glass Blur Intensity" 
                    type="select"
                    value={blurIntensity}
                    onChange={setBlurIntensity}
                    setShowPicker={setShowPicker}
                    options={[
                      { label: 'None', value: 'none', icon: Circle },
                      { label: 'Low', value: 'low', icon: Cloud },
                      { label: 'Medium', value: 'medium', icon: Cloud },
                      { label: 'High', value: 'high', icon: Cloud }
                    ]}
                  />
                  <SettingItem 
                    icon={Layout} 
                    label="Message Density" 
                    type="select"
                    value={messageDensity}
                    onChange={setMessageDensity}
                    setShowPicker={setShowPicker}
                    options={[
                      { label: 'Compact', value: 'compact', icon: Minimize },
                      { label: 'Comfortable', value: 'comfortable', icon: Maximize }
                    ]}
                  />
                  <SettingItem 
                    icon={Type} 
                    label="Font Size" 
                    type="select"
                    value={fontSize}
                    onChange={setFontSize}
                    setShowPicker={setShowPicker}
                    options={[
                      { label: 'Small', value: 'small', icon: Type },
                      { label: 'Medium', value: 'medium', icon: Type },
                      { label: 'Large', value: 'large', icon: Type }
                    ]}
                  />
                  <SettingItem 
                    icon={Palette} 
                    label="Accent Color" 
                    type="select"
                    value={accentColor}
                    onChange={setAccentColor}
                    setShowPicker={setShowPicker}
                    options={[
                      { label: 'Cyan', value: 'cyan', icon: Palette },
                      { label: 'Violet', value: 'violet', icon: Palette },
                      { label: 'Emerald', value: 'emerald', icon: Palette },
                      { label: 'Rose', value: 'rose', icon: Palette }
                    ]}
                  />
                  <SettingItem 
                    icon={User} 
                    label="Show Avatars" 
                    type="toggle"
                    checked={showAvatars}
                    onChange={setShowAvatars}
                  />
                  <SettingItem 
                    icon={User} 
                    label="Avatar Shape" 
                    type="select"
                    value={avatarShape}
                    onChange={setAvatarShape}
                    setShowPicker={setShowPicker}
                    options={[
                      { label: 'Circle', value: 'circle', icon: Circle },
                      { label: 'Square', value: 'square', icon: Square },
                      { label: 'Rounded', value: 'rounded', icon: Box }
                    ]}
                  />
                  <SettingItem 
                    icon={Box} 
                    label="Message Shadow" 
                    type="select"
                    value={messageShadow}
                    onChange={setMessageShadow}
                    setShowPicker={setShowPicker}
                    options={[
                      { label: 'None', value: 'none', icon: Circle },
                      { label: 'Small', value: 'sm', icon: Cloud },
                      { label: 'Medium', value: 'md', icon: Cloud },
                      { label: 'Large', value: 'lg', icon: Cloud }
                    ]}
                  />
                  <SettingItem 
                    icon={Send} 
                    label="Send Button Icon" 
                    type="select"
                    value={sendButtonIcon}
                    onChange={setSendButtonIcon}
                    setShowPicker={setShowPicker}
                    options={[
                      { label: 'Send', value: 'send', icon: Send },
                      { label: 'Arrow', value: 'arrow', icon: ArrowRight },
                      { label: 'Rocket', value: 'rocket', icon: Rocket }
                    ]}
                  />
                  <SettingItem 
                    icon={Box} 
                    label="Code Block Theme" 
                    type="select"
                    value={codeTheme}
                    onChange={setCodeTheme}
                    setShowPicker={setShowPicker}
                    options={[
                      { label: 'Default', value: 'default', icon: Box },
                      { label: 'Matrix', value: 'matrix', icon: Box },
                      { label: 'Neon', value: 'neon', icon: Box }
                    ]}
                  />
                  <SettingItem 
                    icon={Zap} 
                    label="Animations" 
                    type="toggle"
                    checked={messageAnimation}
                    onChange={setMessageAnimation}
                    noBorder
                  />
                </SettingSection>

                {/* Advanced Effects */}
                <SettingSection title="Advanced Effects (Awakened UI)" delay={0.38}>
                  <SettingItem 
                    icon={Sparkles} 
                    label="Input Box Glow" 
                    subLabel="Awakened styling for chat input"
                    type="toggle"
                    checked={effectInputBox}
                    onChange={setEffectInputBox}
                  />
                  <SettingItem 
                    icon={MessageSquare} 
                    label="Message Bubbles" 
                    subLabel="Awakened styling for chat messages"
                    type="toggle"
                    checked={effectMessageBubbles}
                    onChange={setEffectMessageBubbles}
                  />
                  <SettingItem 
                    icon={Layout} 
                    label="Sidebar Effects" 
                    subLabel="Awakened styling for sidebar items"
                    type="toggle"
                    checked={effectSidebar}
                    onChange={setEffectSidebar}
                  />
                  <SettingItem 
                    icon={Monitor} 
                    label="Background Particles" 
                    subLabel="Awakened background animations"
                    type="toggle"
                    checked={effectBackground}
                    onChange={setEffectBackground}
                  />
                  <SettingItem 
                    icon={User} 
                    label="Avatar Aura" 
                    subLabel="Spinning aura around avatars"
                    type="toggle"
                    checked={effectAvatar}
                    onChange={setEffectAvatar}
                    noBorder
                  />
                </SettingSection>

                {/* Behavior */}
                <SettingSection title="Behavior" delay={0.4}>
                  <SettingItem 
                    icon={Zap} 
                    label="Text Reveal" 
                    type="select"
                    value={textReveal}
                    onChange={setTextReveal}
                    setShowPicker={setShowPicker}
                    options={[
                      { label: 'None', value: 'none', icon: XCircle },
                      { label: 'Fade', value: 'fade', icon: Cloud },
                      { label: 'Typewriter', value: 'typewriter', icon: Keyboard }
                    ]}
                  />
                  <SettingItem 
                    icon={Zap} 
                    label="Typing Speed" 
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={typingSpeed}
                    onChange={setTypingSpeed}
                  />
                  <SettingItem 
                    icon={Zap} 
                    label="Response Length" 
                    type="select"
                    value={responseLength}
                    onChange={setResponseLength}
                    setShowPicker={setShowPicker}
                    options={[
                      { label: 'Short', value: 'short', icon: Minimize },
                      { label: 'Balanced', value: 'balanced', icon: Activity },
                      { label: 'Detailed', value: 'detailed', icon: Maximize }
                    ]}
                  />
                  <SettingItem 
                    icon={History} 
                    label="Timestamp Format" 
                    type="select"
                    value={timestampFormat}
                    onChange={setTimestampFormat}
                    setShowPicker={setShowPicker}
                    options={[
                      { label: '12-Hour', value: '12h', icon: History },
                      { label: '24-Hour', value: '24h', icon: History },
                      { label: 'Hidden', value: 'hidden', icon: XCircle }
                    ]}
                    noBorder
                  />
                </SettingSection>

                {/* Data & Privacy */}
                <SettingSection title="Data & Privacy" delay={0.45}>
                  <SettingItem 
                    icon={Download} 
                    label="Export Data" 
                    onClick={onExportChat}
                  />
                  <SettingItem 
                    icon={Trash2} 
                    label="Clear History" 
                    danger
                    onClick={() => setShowClearConfirm(true)}
                  />
                  <SettingItem 
                    icon={Shield} 
                    label="Data Controls" 
                    onClick={() => {}}
                  />
                  <SettingItem 
                    icon={Database} 
                    label="Memories" 
                    noBorder
                    onClick={() => {}}
                  />
                </SettingSection>

                {/* Legal */}
                <SettingSection title="Legal & Support" delay={0.5}>
                  <SettingItem 
                    icon={FileText} 
                    label="Terms of Use" 
                    onClick={() => setShowTerms(true)}
                  />
                  <SettingItem 
                    icon={Lock} 
                    label="Privacy Policy" 
                    onClick={() => setShowPrivacy(true)}
                  />
                  <SettingItem 
                    icon={HelpCircle} 
                    label="Report a Problem" 
                    noBorder
                    onClick={() => setShowReport(true)}
                  />
                </SettingSection>

                {/* System */}
                <SettingSection delay={0.55}>
                  <SettingItem 
                    icon={LogOut} 
                    label="Reset All Settings" 
                    danger
                    noBorder
                    onClick={resetSettings}
                  />
                </SettingSection>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="text-center space-y-4 py-12 border-t border-slate-100 dark:border-white/5 mt-8"
                >
                  <p className="text-[9px] text-slate-500 dark:text-[#717171] uppercase tracking-[0.4em] font-black opacity-40">Loki Prime X v2.5.0</p>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-[#666] font-bold uppercase tracking-[0.2em]">Crafted with passion by</span>
                    <span className="text-base sm:text-lg font-black bg-gradient-to-r from-slate-900 via-blue-500 to-slate-900 dark:from-white dark:via-blue-400 dark:to-white bg-clip-text text-transparent drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] animate-shimmer">
                      Somay a.k.a. Owner
                    </span>
                  </div>
                </motion.div>

              </div>
            </motion.div>

            {/* Overlays Container */}
            <AnimatePresence mode="wait">
              {showEditProfile && (
                <EditProfileOverlay 
                  key="edit-profile"
                  name={commanderName} 
                  email={commanderEmail}
                  onSave={(newName, newEmail) => {
                    setCommanderName(newName);
                    setCommanderEmail(newEmail);
                    setShowEditProfile(false);
                  }} 
                  onClose={() => setShowEditProfile(false)} 
                />
              )}

              {showTerms && <TermsOverlay key="terms" onClose={() => setShowTerms(false)} />}

              {showPrivacy && <PrivacyOverlay key="privacy" onClose={() => setShowPrivacy(false)} />}

              {showAssistantIntro && <AssistantIntroOverlay key="assistant-intro" onClose={() => setShowAssistantIntro(false)} />}

              {showReport && <ReportOverlay key="report" onClose={() => setShowReport(false)} />}

              {showClearConfirm && <ClearConfirmOverlay key="clear-confirm" onClose={() => setShowClearConfirm(false)} onParentClose={onClose} onClearAllChats={onClearAllChats} setShowClearConfirm={setShowClearConfirm} />}
            </AnimatePresence>

            {/* Custom Picker Overlay - Floating Menu Style */}
            <AnimatePresence>
              {showPicker && <PickerOverlay key="picker" showPicker={showPicker} setShowPicker={setShowPicker} />}
            </AnimatePresence>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
