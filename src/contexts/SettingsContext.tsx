import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export type BgStyle = 'default' | 'nebula' | 'cyber-grid';
export type ModelMode = 'pro' | 'fast' | 'happy';
export type BubbleStyle = 'glass' | 'solid';
export type FontSize = 'small' | 'medium' | 'large';
export type FontStyle = 'sans' | 'serif' | 'mono';
export type ResponseLength = 'short' | 'balanced' | 'detailed';
export type AccentColor = 'cyan' | 'violet' | 'emerald' | 'rose';
export type MessageDensity = 'compact' | 'comfortable';
export type Tone = 'formal' | 'casual' | 'happy' | 'custom';
export type ImageSize = '1K' | '2K' | '4K';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';
export type BorderRadius = 'sharp' | 'rounded' | 'pill';
export type TextReveal = 'none' | 'fade' | 'typewriter';
export type AppWidth = 'narrow' | 'normal' | 'wide';
export type GlowIntensity = 'low' | 'medium' | 'high';

interface SettingsState {
  theme: Theme;
  bgStyle: BgStyle;
  commanderName: string;
  modelMode: ModelMode;
  tone: Tone;
  systemInstruction: string;
  temperature: number;
  topP: number;
  topK: number;
  isAwakened: boolean;
  enterToSend: boolean;
  bubbleStyle: BubbleStyle;
  fontSize: FontSize;
  fontStyle: FontStyle;
  soundEnabled: boolean;
  messageAnimation: boolean;
  autoScroll: boolean;
  typingSpeed: number;
  showAvatars: boolean;
  responseLength: ResponseLength;
  accentColor: AccentColor;
  messageDensity: MessageDensity;
  thinkingMode: boolean;
  searchGrounding: boolean;
  imageSize: ImageSize;
  liveAudioEnabled: boolean;
  animationSpeed: AnimationSpeed;
  borderRadius: BorderRadius;
  textReveal: TextReveal;
  appWidth: AppWidth;
  glowIntensity: GlowIntensity;
  setTheme: (theme: Theme) => void;
  setBgStyle: (bg: BgStyle) => void;
  setCommanderName: (name: string) => void;
  setModelMode: (mode: ModelMode) => void;
  setSystemInstruction: (instruction: string) => void;
  setTemperature: (temp: number) => void;
  setTopP: (topP: number) => void;
  setTopK: (topK: number) => void;
  setIsAwakened: (awakened: boolean) => void;
  setEnterToSend: (enterToSend: boolean) => void;
  setBubbleStyle: (style: BubbleStyle) => void;
  setFontSize: (size: FontSize) => void;
  setFontStyle: (style: FontStyle) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setMessageAnimation: (enabled: boolean) => void;
  setAutoScroll: (enabled: boolean) => void;
  setTypingSpeed: (speed: number) => void;
  setShowAvatars: (show: boolean) => void;
  setResponseLength: (length: ResponseLength) => void;
  setAccentColor: (color: AccentColor) => void;
  setMessageDensity: (density: MessageDensity) => void;
  setTone: (tone: Tone) => void;
  setThinkingMode: (enabled: boolean) => void;
  setSearchGrounding: (enabled: boolean) => void;
  setImageSize: (size: ImageSize) => void;
  setLiveAudioEnabled: (enabled: boolean) => void;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  setBorderRadius: (radius: BorderRadius) => void;
  setTextReveal: (reveal: TextReveal) => void;
  setAppWidth: (width: AppWidth) => void;
  setGlowIntensity: (intensity: GlowIntensity) => void;
  resetSettings: () => void;
}

const defaultSettings: Omit<SettingsState, 'setTheme' | 'setBgStyle' | 'setCommanderName' | 'setModelMode' | 'setTone' | 'setSystemInstruction' | 'setTemperature' | 'setTopP' | 'setTopK' | 'setIsAwakened' | 'setEnterToSend' | 'setBubbleStyle' | 'setFontSize' | 'setFontStyle' | 'setSoundEnabled' | 'setMessageAnimation' | 'setAutoScroll' | 'setTypingSpeed' | 'setShowAvatars' | 'setResponseLength' | 'setAccentColor' | 'setMessageDensity' | 'setThinkingMode' | 'setSearchGrounding' | 'setImageSize' | 'setLiveAudioEnabled' | 'setAnimationSpeed' | 'setBorderRadius' | 'setTextReveal' | 'setAppWidth' | 'setGlowIntensity' | 'resetSettings'> = {
  theme: 'dark',
  bgStyle: 'nebula',
  commanderName: 'Commander',
  modelMode: 'pro',
  tone: 'formal',
  systemInstruction: 'You are Loki Prime X, an advanced AI assistant. You MUST respond ONLY in natural, conversational Hinglish (a mix of Hindi and English written in Latin script). Speak like a helpful, friendly, and highly intelligent human companion. Avoid sounding robotic or overly formal. Understand the user\'s intent deeply and reply with empathy, clarity, and a touch of personality. NEVER output any internal thoughts, reasoning, or monologues. Do NOT use <thought> or <think> tags. Provide ONLY the final response.',
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  isAwakened: false,
  enterToSend: false,
  bubbleStyle: 'glass',
  fontSize: 'medium',
  fontStyle: 'sans',
  soundEnabled: true,
  messageAnimation: true,
  autoScroll: true,
  typingSpeed: 30,
  showAvatars: true,
  responseLength: 'balanced',
  accentColor: 'cyan',
  messageDensity: 'comfortable',
  thinkingMode: false,
  searchGrounding: false,
  imageSize: '1K',
  liveAudioEnabled: false,
  animationSpeed: 'normal',
  borderRadius: 'rounded',
  textReveal: 'typewriter',
  appWidth: 'normal',
  glowIntensity: 'medium',
};

const SettingsContext = createContext<SettingsState | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(defaultSettings.theme);
  const [bgStyle, setBgStyle] = useState<BgStyle>(defaultSettings.bgStyle);
  const [commanderName, setCommanderName] = useState(defaultSettings.commanderName);
  const [modelMode, setModelMode] = useState<ModelMode>(defaultSettings.modelMode);
  const [tone, setTone] = useState<Tone>(defaultSettings.tone);
  const [systemInstruction, setSystemInstruction] = useState(defaultSettings.systemInstruction);
  const [temperature, setTemperature] = useState(defaultSettings.temperature);
  const [topP, setTopP] = useState(defaultSettings.topP);
  const [topK, setTopK] = useState(defaultSettings.topK);
  const [isAwakened, setIsAwakened] = useState(defaultSettings.isAwakened);
  const [enterToSend, setEnterToSend] = useState(defaultSettings.enterToSend);
  const [bubbleStyle, setBubbleStyle] = useState<BubbleStyle>(defaultSettings.bubbleStyle);
  const [fontSize, setFontSize] = useState<FontSize>(defaultSettings.fontSize);
  const [fontStyle, setFontStyle] = useState<FontStyle>(defaultSettings.fontStyle);
  const [soundEnabled, setSoundEnabled] = useState(defaultSettings.soundEnabled);
  const [messageAnimation, setMessageAnimation] = useState(defaultSettings.messageAnimation);
  const [autoScroll, setAutoScroll] = useState(defaultSettings.autoScroll);
  const [typingSpeed, setTypingSpeed] = useState(defaultSettings.typingSpeed);
  const [showAvatars, setShowAvatars] = useState(defaultSettings.showAvatars);
  const [responseLength, setResponseLength] = useState<ResponseLength>(defaultSettings.responseLength);
  const [accentColor, setAccentColor] = useState<AccentColor>(defaultSettings.accentColor);
  const [messageDensity, setMessageDensity] = useState<MessageDensity>(defaultSettings.messageDensity);
  const [thinkingMode, setThinkingMode] = useState<boolean>(defaultSettings.thinkingMode);
  const [searchGrounding, setSearchGrounding] = useState<boolean>(defaultSettings.searchGrounding);
  const [imageSize, setImageSize] = useState<ImageSize>(defaultSettings.imageSize);
  const [liveAudioEnabled, setLiveAudioEnabled] = useState<boolean>(defaultSettings.liveAudioEnabled);
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>(defaultSettings.animationSpeed);
  const [borderRadius, setBorderRadius] = useState<BorderRadius>(defaultSettings.borderRadius);
  const [textReveal, setTextReveal] = useState<TextReveal>(defaultSettings.textReveal);
  const [appWidth, setAppWidth] = useState<AppWidth>(defaultSettings.appWidth);
  const [glowIntensity, setGlowIntensity] = useState<GlowIntensity>(defaultSettings.glowIntensity);

  const resetSettings = () => {
    setTheme(defaultSettings.theme);
    setBgStyle(defaultSettings.bgStyle);
    setCommanderName(defaultSettings.commanderName);
    setModelMode(defaultSettings.modelMode);
    setTone(defaultSettings.tone);
    setSystemInstruction(defaultSettings.systemInstruction);
    setTemperature(defaultSettings.temperature);
    setTopP(defaultSettings.topP);
    setTopK(defaultSettings.topK);
    setEnterToSend(defaultSettings.enterToSend);
    setBubbleStyle(defaultSettings.bubbleStyle);
    setFontSize(defaultSettings.fontSize);
    setFontStyle(defaultSettings.fontStyle);
    setSoundEnabled(defaultSettings.soundEnabled);
    setMessageAnimation(defaultSettings.messageAnimation);
    setAutoScroll(defaultSettings.autoScroll);
    setTypingSpeed(defaultSettings.typingSpeed);
    setShowAvatars(defaultSettings.showAvatars);
    setResponseLength(defaultSettings.responseLength);
    setAccentColor(defaultSettings.accentColor);
    setMessageDensity(defaultSettings.messageDensity);
    setThinkingMode(defaultSettings.thinkingMode);
    setSearchGrounding(defaultSettings.searchGrounding);
    setImageSize(defaultSettings.imageSize);
    setLiveAudioEnabled(defaultSettings.liveAudioEnabled);
    setAnimationSpeed(defaultSettings.animationSpeed);
    setBorderRadius(defaultSettings.borderRadius);
    setTextReveal(defaultSettings.textReveal);
    setAppWidth(defaultSettings.appWidth);
    setGlowIntensity(defaultSettings.glowIntensity);
  };

  useEffect(() => {
    const loadSetting = <T,>(key: string, setter: (val: T) => void, parser?: (val: string) => T) => {
      try {
        const saved = localStorage.getItem(`loki_${key}`);
        if (saved) {
          setter(parser ? parser(saved) : saved as unknown as T);
        }
      } catch (e) {
        console.error(`Failed to load setting ${key}`, e);
      }
    };

    loadSetting('theme', setTheme as any);
    loadSetting('bgStyle', setBgStyle as any);
    loadSetting('commanderName', setCommanderName);
    loadSetting('modelMode', setModelMode as any);
    loadSetting('tone', setTone as any);
    loadSetting('systemInstruction', setSystemInstruction);
    loadSetting('temperature', setTemperature, parseFloat);
    loadSetting('topP', setTopP, parseFloat);
    loadSetting('topK', setTopK, parseInt);
    loadSetting('enterToSend', setEnterToSend, (val) => val === 'true');
    loadSetting('bubbleStyle', setBubbleStyle as any);
    loadSetting('fontSize', setFontSize as any);
    loadSetting('fontStyle', setFontStyle as any);
    loadSetting('soundEnabled', setSoundEnabled, (val) => val === 'true');
    loadSetting('messageAnimation', setMessageAnimation, (val) => val === 'true');
    loadSetting('autoScroll', setAutoScroll, (val) => val === 'true');
    loadSetting('typingSpeed', setTypingSpeed, parseInt);
    loadSetting('showAvatars', setShowAvatars, (val) => val === 'true');
    loadSetting('responseLength', setResponseLength as any);
    loadSetting('accentColor', setAccentColor as any);
    loadSetting('messageDensity', setMessageDensity as any);
    loadSetting('thinkingMode', setThinkingMode, (val) => val === 'true');
    loadSetting('searchGrounding', setSearchGrounding, (val) => val === 'true');
    loadSetting('imageSize', setImageSize as any);
    loadSetting('liveAudioEnabled', setLiveAudioEnabled, (val) => val === 'true');
    loadSetting('animationSpeed', setAnimationSpeed as any);
    loadSetting('borderRadius', setBorderRadius as any);
    loadSetting('textReveal', setTextReveal as any);
    loadSetting('appWidth', setAppWidth as any);
    loadSetting('glowIntensity', setGlowIntensity as any);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('loki_theme', theme);
      localStorage.setItem('loki_bgStyle', bgStyle);
      localStorage.setItem('loki_commanderName', commanderName);
      localStorage.setItem('loki_modelMode', modelMode);
      localStorage.setItem('loki_tone', tone);
      localStorage.setItem('loki_systemInstruction', systemInstruction);
      localStorage.setItem('loki_temperature', temperature.toString());
      localStorage.setItem('loki_topP', topP.toString());
      localStorage.setItem('loki_topK', topK.toString());
      localStorage.setItem('loki_enterToSend', enterToSend.toString());
      localStorage.setItem('loki_bubbleStyle', bubbleStyle);
      localStorage.setItem('loki_fontSize', fontSize);
      localStorage.setItem('loki_fontStyle', fontStyle);
      localStorage.setItem('loki_soundEnabled', soundEnabled.toString());
      localStorage.setItem('loki_messageAnimation', messageAnimation.toString());
      localStorage.setItem('loki_autoScroll', autoScroll.toString());
      localStorage.setItem('loki_typingSpeed', typingSpeed.toString());
      localStorage.setItem('loki_showAvatars', showAvatars.toString());
      localStorage.setItem('loki_responseLength', responseLength);
      localStorage.setItem('loki_accentColor', accentColor);
      localStorage.setItem('loki_messageDensity', messageDensity);
      localStorage.setItem('loki_thinkingMode', thinkingMode.toString());
      localStorage.setItem('loki_searchGrounding', searchGrounding.toString());
      localStorage.setItem('loki_imageSize', imageSize);
      localStorage.setItem('loki_liveAudioEnabled', liveAudioEnabled.toString());
      localStorage.setItem('loki_animationSpeed', animationSpeed);
      localStorage.setItem('loki_borderRadius', borderRadius);
      localStorage.setItem('loki_textReveal', textReveal);
      localStorage.setItem('loki_appWidth', appWidth);
      localStorage.setItem('loki_glowIntensity', glowIntensity);
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }

    if (isAwakened) {
      document.documentElement.classList.add('dark', 'awakened-mode-active');
      document.body.classList.add('awakened-mode-active');
      document.body.style.backgroundColor = '#050508';
      document.documentElement.style.backgroundColor = '#050508';
    } else if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('awakened-mode-active');
      document.body.classList.remove('awakened-mode-active');
      document.body.style.backgroundColor = '#08080c';
      document.documentElement.style.backgroundColor = '#08080c';
    } else {
      document.documentElement.classList.remove('dark', 'awakened-mode-active');
      document.body.classList.remove('awakened-mode-active');
      document.body.style.backgroundColor = '#f8fafc';
      document.documentElement.style.backgroundColor = '#f8fafc';
    }
  }, [theme, bgStyle, commanderName, modelMode, tone, systemInstruction, temperature, topP, topK, isAwakened, enterToSend, bubbleStyle, fontSize, fontStyle, soundEnabled, messageAnimation, autoScroll, typingSpeed, showAvatars, responseLength, accentColor, messageDensity, thinkingMode, searchGrounding, imageSize, liveAudioEnabled, animationSpeed, borderRadius, textReveal, appWidth, glowIntensity]);

  return (
    <SettingsContext.Provider value={{
      theme, bgStyle, commanderName, modelMode, tone, systemInstruction, temperature, topP, topK, isAwakened, enterToSend, bubbleStyle, fontSize, fontStyle, soundEnabled, messageAnimation, autoScroll, typingSpeed, showAvatars, responseLength, accentColor, messageDensity, thinkingMode, searchGrounding, imageSize, liveAudioEnabled, animationSpeed, borderRadius, textReveal, appWidth, glowIntensity,
      setTheme, setBgStyle, setCommanderName, setModelMode, setTone, setSystemInstruction, setTemperature, setTopP, setTopK, setIsAwakened, setEnterToSend, setBubbleStyle, setFontSize, setFontStyle, setSoundEnabled, setMessageAnimation, setAutoScroll, setTypingSpeed, setShowAvatars, setResponseLength, setAccentColor, setMessageDensity, setThinkingMode, setSearchGrounding, setImageSize, setLiveAudioEnabled, setAnimationSpeed, setBorderRadius, setTextReveal, setAppWidth, setGlowIntensity, resetSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
