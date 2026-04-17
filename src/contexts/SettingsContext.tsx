import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { NavigationBar } from "@hugotomazi/capacitor-navigation-bar";

export type Theme = "light" | "dark" | "system";
export type BgStyle = "default" | "nebula" | "cyber-grid";
export type ModelMode = "pro" | "fast" | "happy";
export type BubbleStyle = "glass" | "solid";
export type FontSize = "small" | "medium" | "large";
export type FontStyle = "sans" | "serif" | "mono";
export type ResponseLength = "short" | "balanced" | "detailed";
export type AccentColor = "cyan" | "violet" | "emerald" | "rose";
export type MessageDensity = "compact" | "comfortable";
export type Tone = "formal" | "casual" | "happy" | "custom";
export type ImageSize = "1K" | "2K" | "4K";
export type AnimationSpeed = "slow" | "normal" | "fast";
export type BorderRadius = "sharp" | "rounded" | "pill";
export type TextReveal = "none" | "fade" | "typewriter";
export type AppWidth = "narrow" | "normal" | "wide";
export type GlowIntensity = "low" | "medium" | "high";
export type SidebarPosition = "left" | "right";
export type ChatAlignment = "standard" | "left";
export type BlurIntensity = "none" | "low" | "medium" | "high";
export type TimestampFormat = "12h" | "24h" | "hidden";
export type SoundTheme = "sci-fi" | "minimal" | "retro";
export type CodeTheme = "default" | "matrix" | "neon";
export type AvatarShape = "circle" | "square" | "rounded";
export type MessageShadow = "none" | "sm" | "md" | "lg";
export type SendButtonIcon = "send" | "arrow" | "rocket";
export type MessageHoverEffect = "none" | "lift" | "glow";
export type SidebarTheme = "default" | "glass" | "solid";
export type InputBoxStyle = "default" | "floating" | "minimal";

interface SettingsState {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  bgStyle: BgStyle;
  commanderName: string;
  commanderEmail: string;
  avatarUrl: string;
  modelMode: ModelMode;
  tone: Tone;
  systemInstruction: string;
  temperature: number;
  topP: number;
  topK: number;
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
  isAwakened: boolean;
  effectInputBox: boolean;
  effectMessageBubbles: boolean;
  effectSidebar: boolean;
  effectBackground: boolean;
  effectAvatar: boolean;
  sidebarPosition: SidebarPosition;
  chatAlignment: ChatAlignment;
  blurIntensity: BlurIntensity;
  timestampFormat: TimestampFormat;
  soundTheme: SoundTheme;
  codeTheme: CodeTheme;
  avatarShape: AvatarShape;
  messageShadow: MessageShadow;
  sendButtonIcon: SendButtonIcon;
  messageHoverEffect: MessageHoverEffect;
  sidebarTheme: SidebarTheme;
  inputBoxStyle: InputBoxStyle;
  setTheme: (theme: Theme) => void;
  setBgStyle: (bg: BgStyle) => void;
  setCommanderName: (name: string) => void;
  setCommanderEmail: (email: string) => void;
  setAvatarUrl: (url: string) => void;
  setModelMode: (mode: ModelMode) => void;
  setSystemInstruction: (instruction: string) => void;
  setTemperature: (temp: number) => void;
  setTopP: (topP: number) => void;
  setTopK: (topK: number) => void;
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
  setIsAwakened: (isAwakened: boolean) => void;
  setEffectInputBox: (enabled: boolean) => void;
  setEffectMessageBubbles: (enabled: boolean) => void;
  setEffectSidebar: (enabled: boolean) => void;
  setEffectBackground: (enabled: boolean) => void;
  setEffectAvatar: (enabled: boolean) => void;
  setSidebarPosition: (pos: SidebarPosition) => void;
  setChatAlignment: (align: ChatAlignment) => void;
  setBlurIntensity: (intensity: BlurIntensity) => void;
  setTimestampFormat: (format: TimestampFormat) => void;
  setSoundTheme: (theme: SoundTheme) => void;
  setCodeTheme: (theme: CodeTheme) => void;
  setAvatarShape: (shape: AvatarShape) => void;
  setMessageShadow: (shadow: MessageShadow) => void;
  setSendButtonIcon: (icon: SendButtonIcon) => void;
  setMessageHoverEffect: (effect: MessageHoverEffect) => void;
  setSidebarTheme: (theme: SidebarTheme) => void;
  setInputBoxStyle: (style: InputBoxStyle) => void;
  resetSettings: () => void;
}

const defaultSettings: Omit<
  SettingsState,
  | "setTheme"
  | "setBgStyle"
  | "setCommanderName"
  | "setCommanderEmail"
  | "setAvatarUrl"
  | "setModelMode"
  | "setTone"
  | "setSystemInstruction"
  | "setTemperature"
  | "setTopP"
  | "setTopK"
  | "setEnterToSend"
  | "setBubbleStyle"
  | "setFontSize"
  | "setFontStyle"
  | "setSoundEnabled"
  | "setMessageAnimation"
  | "setAutoScroll"
  | "setTypingSpeed"
  | "setShowAvatars"
  | "setResponseLength"
  | "setAccentColor"
  | "setMessageDensity"
  | "setThinkingMode"
  | "setSearchGrounding"
  | "setImageSize"
  | "setLiveAudioEnabled"
  | "setAnimationSpeed"
  | "setBorderRadius"
  | "setTextReveal"
  | "setAppWidth"
  | "setGlowIntensity"
  | "setIsAwakened"
  | "setEffectInputBox"
  | "setEffectMessageBubbles"
  | "setEffectSidebar"
  | "setEffectBackground"
  | "setEffectAvatar"
  | "setSidebarPosition"
  | "setChatAlignment"
  | "setBlurIntensity"
  | "setTimestampFormat"
  | "setSoundTheme"
  | "setCodeTheme"
  | "setAvatarShape"
  | "setMessageShadow"
  | "setSendButtonIcon"
  | "setMessageHoverEffect"
  | "setSidebarTheme"
  | "setInputBoxStyle"
  | "resetSettings"
> = {
  theme: "system",
  resolvedTheme: "dark", // Will be re-evaluated on mount
  bgStyle: "nebula",
  commanderName: "Commander",
  commanderEmail: "",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Loki",
  modelMode: "pro",
  tone: "formal",
  systemInstruction:
    "You are Loki Prime X, an advanced AI assistant. You MUST respond ONLY in natural, conversational Hinglish (a mix of Hindi and English written in Latin script). Speak like a helpful, friendly, and highly intelligent human companion. Avoid sounding robotic or overly formal. Understand the user's intent deeply and reply with empathy, clarity, and a touch of personality. NEVER output any internal thoughts, reasoning, or monologues. Do NOT use <thought> or <think> tags. Provide ONLY the final response. When presenting data or lists of items, ALWAYS format them as beautiful Markdown tables rather than plain text. Keep your responses concise, highly readable, and visually structured using bullet points and bold text where appropriate to make them simplified and attractive.",
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  enterToSend: false,
  bubbleStyle: "glass",
  fontSize: "medium",
  fontStyle: "sans",
  soundEnabled: true,
  messageAnimation: true,
  autoScroll: true,
  typingSpeed: 30,
  showAvatars: true,
  responseLength: "balanced",
  accentColor: "cyan",
  messageDensity: "comfortable",
  thinkingMode: false,
  searchGrounding: false,
  imageSize: "1K",
  liveAudioEnabled: false,
  animationSpeed: "normal",
  borderRadius: "rounded",
  textReveal: "typewriter",
  appWidth: "normal",
  glowIntensity: "medium",
  isAwakened: false,
  effectInputBox: false,
  effectMessageBubbles: false,
  effectSidebar: false,
  effectBackground: false,
  effectAvatar: false,
  sidebarPosition: "left",
  chatAlignment: "standard",
  blurIntensity: "medium",
  timestampFormat: "12h",
  soundTheme: "sci-fi",
  codeTheme: "default",
  avatarShape: "circle",
  messageShadow: "md",
  sendButtonIcon: "send",
  messageHoverEffect: "none",
  sidebarTheme: "glass",
  inputBoxStyle: "default",
};

const SettingsContext = createContext<SettingsState | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(defaultSettings.theme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    defaultSettings.theme === "dark" ? "dark" : "light",
  );
  const [bgStyle, setBgStyle] = useState<BgStyle>(defaultSettings.bgStyle);
  const [commanderName, setCommanderName] = useState(
    defaultSettings.commanderName,
  );
  const [commanderEmail, setCommanderEmail] = useState(
    defaultSettings.commanderEmail,
  );
  const [avatarUrl, setAvatarUrl] = useState(defaultSettings.avatarUrl);
  const [modelMode, setModelMode] = useState<ModelMode>(
    defaultSettings.modelMode,
  );
  const [tone, setTone] = useState<Tone>(defaultSettings.tone);
  const [systemInstruction, setSystemInstruction] = useState(
    defaultSettings.systemInstruction,
  );
  const [temperature, setTemperature] = useState(defaultSettings.temperature);
  const [topP, setTopP] = useState(defaultSettings.topP);
  const [topK, setTopK] = useState(defaultSettings.topK);
  const [enterToSend, setEnterToSend] = useState(defaultSettings.enterToSend);
  const [bubbleStyle, setBubbleStyle] = useState<BubbleStyle>(
    defaultSettings.bubbleStyle,
  );
  const [fontSize, setFontSize] = useState<FontSize>(defaultSettings.fontSize);
  const [fontStyle, setFontStyle] = useState<FontStyle>(
    defaultSettings.fontStyle,
  );
  const [soundEnabled, setSoundEnabled] = useState(
    defaultSettings.soundEnabled,
  );
  const [messageAnimation, setMessageAnimation] = useState(
    defaultSettings.messageAnimation,
  );
  const [autoScroll, setAutoScroll] = useState(defaultSettings.autoScroll);
  const [typingSpeed, setTypingSpeed] = useState(defaultSettings.typingSpeed);
  const [showAvatars, setShowAvatars] = useState(defaultSettings.showAvatars);
  const [responseLength, setResponseLength] = useState<ResponseLength>(
    defaultSettings.responseLength,
  );
  const [accentColor, setAccentColor] = useState<AccentColor>(
    defaultSettings.accentColor,
  );
  const [messageDensity, setMessageDensity] = useState<MessageDensity>(
    defaultSettings.messageDensity,
  );
  const [thinkingMode, setThinkingMode] = useState<boolean>(
    defaultSettings.thinkingMode,
  );
  const [searchGrounding, setSearchGrounding] = useState<boolean>(
    defaultSettings.searchGrounding,
  );
  const [imageSize, setImageSize] = useState<ImageSize>(
    defaultSettings.imageSize,
  );
  const [liveAudioEnabled, setLiveAudioEnabled] = useState<boolean>(
    defaultSettings.liveAudioEnabled,
  );
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>(
    defaultSettings.animationSpeed,
  );
  const [borderRadius, setBorderRadius] = useState<BorderRadius>(
    defaultSettings.borderRadius,
  );
  const [textReveal, setTextReveal] = useState<TextReveal>(
    defaultSettings.textReveal,
  );
  const [appWidth, setAppWidth] = useState<AppWidth>(defaultSettings.appWidth);
  const [glowIntensity, setGlowIntensity] = useState<GlowIntensity>(
    defaultSettings.glowIntensity,
  );
  const [isAwakened, setIsAwakened] = useState<boolean>(
    defaultSettings.isAwakened,
  );
  const [effectInputBox, setEffectInputBox] = useState<boolean>(
    defaultSettings.effectInputBox,
  );
  const [effectMessageBubbles, setEffectMessageBubbles] = useState<boolean>(
    defaultSettings.effectMessageBubbles,
  );
  const [effectSidebar, setEffectSidebar] = useState<boolean>(
    defaultSettings.effectSidebar,
  );
  const [effectBackground, setEffectBackground] = useState<boolean>(
    defaultSettings.effectBackground,
  );
  const [effectAvatar, setEffectAvatar] = useState<boolean>(
    defaultSettings.effectAvatar,
  );
  const [sidebarPosition, setSidebarPosition] = useState<SidebarPosition>(
    defaultSettings.sidebarPosition,
  );
  const [chatAlignment, setChatAlignment] = useState<ChatAlignment>(
    defaultSettings.chatAlignment,
  );
  const [blurIntensity, setBlurIntensity] = useState<BlurIntensity>(
    defaultSettings.blurIntensity,
  );
  const [timestampFormat, setTimestampFormat] = useState<TimestampFormat>(
    defaultSettings.timestampFormat,
  );
  const [soundTheme, setSoundTheme] = useState<SoundTheme>(
    defaultSettings.soundTheme,
  );
  const [codeTheme, setCodeTheme] = useState<CodeTheme>(
    defaultSettings.codeTheme,
  );
  const [avatarShape, setAvatarShape] = useState<AvatarShape>(
    defaultSettings.avatarShape,
  );
  const [messageShadow, setMessageShadow] = useState<MessageShadow>(
    defaultSettings.messageShadow,
  );
  const [sendButtonIcon, setSendButtonIcon] = useState<SendButtonIcon>(
    defaultSettings.sendButtonIcon,
  );
  const [messageHoverEffect, setMessageHoverEffect] =
    useState<MessageHoverEffect>(defaultSettings.messageHoverEffect);
  const [sidebarTheme, setSidebarTheme] = useState<SidebarTheme>(
    defaultSettings.sidebarTheme,
  );
  const [inputBoxStyle, setInputBoxStyle] = useState<InputBoxStyle>(
    defaultSettings.inputBoxStyle,
  );

  const resetSettings = () => {
    setTheme(defaultSettings.theme);
    setBgStyle(defaultSettings.bgStyle);
    setCommanderName(defaultSettings.commanderName);
    setCommanderEmail(defaultSettings.commanderEmail);
    setAvatarUrl(defaultSettings.avatarUrl);
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
    setEffectInputBox(defaultSettings.effectInputBox);
    setEffectMessageBubbles(defaultSettings.effectMessageBubbles);
    setEffectSidebar(defaultSettings.effectSidebar);
    setEffectBackground(defaultSettings.effectBackground);
    setEffectAvatar(defaultSettings.effectAvatar);
    setSidebarPosition(defaultSettings.sidebarPosition);
    setChatAlignment(defaultSettings.chatAlignment);
    setBlurIntensity(defaultSettings.blurIntensity);
    setTimestampFormat(defaultSettings.timestampFormat);
    setSoundTheme(defaultSettings.soundTheme);
    setCodeTheme(defaultSettings.codeTheme);
    setAvatarShape(defaultSettings.avatarShape);
    setMessageShadow(defaultSettings.messageShadow);
    setSendButtonIcon(defaultSettings.sendButtonIcon);
    setMessageHoverEffect(defaultSettings.messageHoverEffect);
    setSidebarTheme(defaultSettings.sidebarTheme);
    setInputBoxStyle(defaultSettings.inputBoxStyle);
  };

  useEffect(() => {
    const loadSetting = <T,>(
      key: string,
      setter: (val: T) => void,
      parser?: (val: string) => T,
    ) => {
      try {
        const saved = localStorage.getItem(`loki_${key}`);
        if (saved) {
          setter(parser ? parser(saved) : (saved as unknown as T));
        }
      } catch (e) {
        console.error(`Failed to load setting ${key}`, e);
      }
    };

    loadSetting("theme", setTheme as any);
    loadSetting("bgStyle", setBgStyle as any);
    loadSetting("commanderName", setCommanderName);
    loadSetting("commanderEmail", setCommanderEmail);
    loadSetting("avatarUrl", setAvatarUrl);
    loadSetting("modelMode", setModelMode as any);
    loadSetting("tone", setTone as any);
    loadSetting("systemInstruction", setSystemInstruction);
    loadSetting("temperature", setTemperature, parseFloat);
    loadSetting("topP", setTopP, parseFloat);
    loadSetting("topK", setTopK, parseInt);
    loadSetting("enterToSend", setEnterToSend, (val) => val === "true");
    loadSetting("bubbleStyle", setBubbleStyle as any);
    loadSetting("fontSize", setFontSize as any);
    loadSetting("fontStyle", setFontStyle as any);
    loadSetting("soundEnabled", setSoundEnabled, (val) => val === "true");
    loadSetting(
      "messageAnimation",
      setMessageAnimation,
      (val) => val === "true",
    );
    loadSetting("autoScroll", setAutoScroll, (val) => val === "true");
    loadSetting("typingSpeed", setTypingSpeed, parseInt);
    loadSetting("showAvatars", setShowAvatars, (val) => val === "true");
    loadSetting("responseLength", setResponseLength as any);
    loadSetting("accentColor", setAccentColor as any);
    loadSetting("messageDensity", setMessageDensity as any);
    loadSetting("thinkingMode", setThinkingMode, (val) => val === "true");
    loadSetting("searchGrounding", setSearchGrounding, (val) => val === "true");
    loadSetting("imageSize", setImageSize as any);
    loadSetting(
      "liveAudioEnabled",
      setLiveAudioEnabled,
      (val) => val === "true",
    );
    loadSetting("animationSpeed", setAnimationSpeed as any);
    loadSetting("borderRadius", setBorderRadius as any);
    loadSetting("textReveal", setTextReveal as any);
    loadSetting("appWidth", setAppWidth as any);
    loadSetting("glowIntensity", setGlowIntensity as any);
    loadSetting("effectInputBox", setEffectInputBox, (val) => val === "true");
    loadSetting(
      "effectMessageBubbles",
      setEffectMessageBubbles,
      (val) => val === "true",
    );
    loadSetting("effectSidebar", setEffectSidebar, (val) => val === "true");
    loadSetting(
      "effectBackground",
      setEffectBackground,
      (val) => val === "true",
    );
    loadSetting("effectAvatar", setEffectAvatar, (val) => val === "true");
    loadSetting("sidebarPosition", setSidebarPosition as any);
    loadSetting("chatAlignment", setChatAlignment as any);
    loadSetting("blurIntensity", setBlurIntensity as any);
    loadSetting("timestampFormat", setTimestampFormat as any);
    loadSetting("soundTheme", setSoundTheme as any);
    loadSetting("codeTheme", setCodeTheme as any);
    loadSetting("avatarShape", setAvatarShape as any);
    loadSetting("messageShadow", setMessageShadow as any);
    loadSetting("sendButtonIcon", setSendButtonIcon as any);
    loadSetting("messageHoverEffect", setMessageHoverEffect as any);
    loadSetting("sidebarTheme", setSidebarTheme as any);
    loadSetting("inputBoxStyle", setInputBoxStyle as any);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("loki_theme", theme);
      localStorage.setItem("loki_bgStyle", bgStyle);
      localStorage.setItem("loki_commanderName", commanderName);
      localStorage.setItem("loki_commanderEmail", commanderEmail);
      localStorage.setItem("loki_avatarUrl", avatarUrl);
      localStorage.setItem("loki_modelMode", modelMode);
      localStorage.setItem("loki_tone", tone);
      localStorage.setItem("loki_systemInstruction", systemInstruction);
      localStorage.setItem("loki_temperature", temperature.toString());
      localStorage.setItem("loki_topP", topP.toString());
      localStorage.setItem("loki_topK", topK.toString());
      localStorage.setItem("loki_enterToSend", enterToSend.toString());
      localStorage.setItem("loki_bubbleStyle", bubbleStyle);
      localStorage.setItem("loki_fontSize", fontSize);
      localStorage.setItem("loki_fontStyle", fontStyle);
      localStorage.setItem("loki_soundEnabled", soundEnabled.toString());
      localStorage.setItem(
        "loki_messageAnimation",
        messageAnimation.toString(),
      );
      localStorage.setItem("loki_autoScroll", autoScroll.toString());
      localStorage.setItem("loki_typingSpeed", typingSpeed.toString());
      localStorage.setItem("loki_showAvatars", showAvatars.toString());
      localStorage.setItem("loki_responseLength", responseLength);
      localStorage.setItem("loki_accentColor", accentColor);
      localStorage.setItem("loki_messageDensity", messageDensity);
      localStorage.setItem("loki_thinkingMode", thinkingMode.toString());
      localStorage.setItem("loki_searchGrounding", searchGrounding.toString());
      localStorage.setItem("loki_imageSize", imageSize);
      localStorage.setItem(
        "loki_liveAudioEnabled",
        liveAudioEnabled.toString(),
      );
      localStorage.setItem("loki_animationSpeed", animationSpeed);
      localStorage.setItem("loki_borderRadius", borderRadius);
      localStorage.setItem("loki_textReveal", textReveal);
      localStorage.setItem("loki_appWidth", appWidth);
      localStorage.setItem("loki_glowIntensity", glowIntensity);
      localStorage.setItem("loki_effectInputBox", effectInputBox.toString());
      localStorage.setItem(
        "loki_effectMessageBubbles",
        effectMessageBubbles.toString(),
      );
      localStorage.setItem("loki_effectSidebar", effectSidebar.toString());
      localStorage.setItem(
        "loki_effectBackground",
        effectBackground.toString(),
      );
      localStorage.setItem("loki_effectAvatar", effectAvatar.toString());
      localStorage.setItem("loki_sidebarPosition", sidebarPosition);
      localStorage.setItem("loki_chatAlignment", chatAlignment);
      localStorage.setItem("loki_blurIntensity", blurIntensity);
      localStorage.setItem("loki_timestampFormat", timestampFormat);
      localStorage.setItem("loki_soundTheme", soundTheme);
      localStorage.setItem("loki_codeTheme", codeTheme);
      localStorage.setItem("loki_avatarShape", avatarShape);
      localStorage.setItem("loki_messageShadow", messageShadow);
      localStorage.setItem("loki_sendButtonIcon", sendButtonIcon);
      localStorage.setItem("loki_messageHoverEffect", messageHoverEffect);
      localStorage.setItem("loki_sidebarTheme", sidebarTheme);
      localStorage.setItem("loki_inputBoxStyle", inputBoxStyle);
    } catch (e) {
      console.error("Failed to save settings to localStorage", e);
    }

    const applyTheme = (isDark: boolean) => {
      setResolvedTheme(isDark ? "dark" : "light");
      if (isDark) {
        document.documentElement.classList.add("dark");
        document.body.style.backgroundColor = isAwakened
          ? "#08080c"
          : "#08080c";
        document.documentElement.style.backgroundColor = isAwakened
          ? "#08080c"
          : "#08080c";

        if (Capacitor.isNativePlatform()) {
          StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
          StatusBar.setBackgroundColor({ color: "#00000000" }).catch(() => {});
          NavigationBar.setTransparency({ isTransparent: true }).catch(() => {});
          NavigationBar.setColor({
            color: "#00000000",
            darkButtons: false,
          }).catch(() => {});
        }
      } else {
        document.documentElement.classList.remove("dark");
        document.body.style.backgroundColor = isAwakened
          ? "#ffffff"
          : "#08080c";
        document.documentElement.style.backgroundColor = isAwakened
          ? "#ffffff"
          : "#08080c";

        if (Capacitor.isNativePlatform()) {
          StatusBar.setStyle({ style: Style.Light }).catch(() => {});
          StatusBar.setBackgroundColor({ color: "#00000000" }).catch(() => {});
          NavigationBar.setTransparency({ isTransparent: true }).catch(() => {});
          NavigationBar.setColor({
            color: "#00000000",
            darkButtons: true,
          }).catch(() => {});
        }
      }
    };

    let cleanupFn: (() => void) | undefined;

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener("change", listener);

      cleanupFn = () => {
        mediaQuery.removeEventListener("change", listener);
      };
    } else {
      applyTheme(theme === "dark");
    }

    // Apply global CSS variables
    const radiusVar =
      borderRadius === "sharp"
        ? "0px"
        : borderRadius === "pill"
          ? "9999px"
          : "16px";
    const glowOpacity =
      glowIntensity === "low"
        ? "0.2"
        : glowIntensity === "high"
          ? "0.8"
          : "0.5";

    document.documentElement.style.setProperty("--global-radius", radiusVar);
    document.documentElement.style.setProperty("--glow-opacity", glowOpacity);

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [
    theme,
    bgStyle,
    commanderName,
    commanderEmail,
    avatarUrl,
    modelMode,
    tone,
    systemInstruction,
    temperature,
    topP,
    topK,
    enterToSend,
    bubbleStyle,
    fontSize,
    fontStyle,
    soundEnabled,
    messageAnimation,
    autoScroll,
    typingSpeed,
    showAvatars,
    responseLength,
    accentColor,
    messageDensity,
    thinkingMode,
    searchGrounding,
    imageSize,
    liveAudioEnabled,
    animationSpeed,
    borderRadius,
    textReveal,
    appWidth,
    glowIntensity,
    isAwakened,
    effectInputBox,
    effectMessageBubbles,
    effectSidebar,
    effectBackground,
    effectAvatar,
    sidebarPosition,
    chatAlignment,
    blurIntensity,
    timestampFormat,
    soundTheme,
    codeTheme,
    avatarShape,
    messageShadow,
    sendButtonIcon,
    messageHoverEffect,
    sidebarTheme,
    inputBoxStyle,
  ]);

  return (
    <SettingsContext.Provider
      value={
        {
          theme,
          resolvedTheme,
          bgStyle,
          commanderName,
          commanderEmail,
          avatarUrl,
          modelMode,
          tone,
          systemInstruction,
          temperature,
          topP,
          topK,
          enterToSend,
          bubbleStyle,
          fontSize,
          fontStyle,
          soundEnabled,
          messageAnimation,
          autoScroll,
          typingSpeed,
          showAvatars,
          responseLength,
          accentColor,
          messageDensity,
          thinkingMode,
          searchGrounding,
          imageSize,
          liveAudioEnabled,
          animationSpeed,
          borderRadius,
          textReveal,
          appWidth,
          glowIntensity,
          isAwakened,
          effectInputBox,
          effectMessageBubbles,
          effectSidebar,
          effectBackground,
          effectAvatar,
          sidebarPosition,
          chatAlignment,
          blurIntensity,
          timestampFormat,
          soundTheme,
          codeTheme,
          avatarShape,
          messageShadow,
          sendButtonIcon,
          messageHoverEffect,
          sidebarTheme,
          inputBoxStyle,
          setTheme,
          setBgStyle,
          setCommanderName,
          setCommanderEmail,
          setAvatarUrl,
          setModelMode,
          setTone,
          setSystemInstruction,
          setTemperature,
          setTopP,
          setTopK,
          setEnterToSend,
          setBubbleStyle,
          setFontSize,
          setFontStyle,
          setSoundEnabled,
          setMessageAnimation,
          setAutoScroll,
          setTypingSpeed,
          setShowAvatars,
          setResponseLength,
          setAccentColor,
          setMessageDensity,
          setThinkingMode,
          setSearchGrounding,
          setImageSize,
          setLiveAudioEnabled,
          setAnimationSpeed,
          setBorderRadius,
          setTextReveal,
          setAppWidth,
          setGlowIntensity,
          setIsAwakened,
          resetSettings,
          setEffectInputBox,
          setEffectMessageBubbles,
          setEffectSidebar,
          setEffectBackground,
          setEffectAvatar,
          setSidebarPosition,
          setChatAlignment,
          setBlurIntensity,
          setTimestampFormat,
          setSoundTheme,
          setCodeTheme,
          setAvatarShape,
          setMessageShadow,
          setSendButtonIcon,
        } as any
      }
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
