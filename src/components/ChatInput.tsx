import React, { useState, useRef, useEffect, memo, forwardRef } from "react";
import {
  Plus,
  Mic,
  Mic2,
  Send,
  Loader2,
  Trash2,
  Square,
  Image as ImageIcon,
  MessageSquare,
  Square as StopSquare,
  Radio,
  Brain,
  Globe,
  Zap,
  Smile,
  Sparkles,
  ChevronUp,
  Settings2,
  Paperclip,
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import { useGlobalInteraction } from "../contexts/GlobalInteractionContext";
import { transcribeAudio, connectLiveSession } from "../services/geminiService";
import { motion, AnimatePresence } from "framer-motion";
import { InfinityMic } from "./Logos";

interface ChatInputProps {
  isAwakened: boolean;
  isLoading: boolean;
  modelMode: string;
  setModelMode: (mode: string) => void;
  onSendMessage: (
    text: string,
    isImageMode?: boolean,
    audioUrl?: string,
  ) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  currentSessionId: string | null;
  onStopGeneration?: () => void;
  enterToSend: boolean;
  input: string;
  setInput: (value: string) => void;
}

export const ChatInput = memo(
  forwardRef<HTMLTextAreaElement, ChatInputProps>(
    (
      {
        isAwakened,
        isLoading,
        modelMode,
        setModelMode,
        onSendMessage,
        onDeleteSession,
        currentSessionId,
        onStopGeneration,
        enterToSend,
        input,
        setInput,
      },
      ref,
    ) => {
      const [isOptionsOpen, setIsOptionsOpen] = useState(false);
      const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
      const [isImageMode, setIsImageMode] = useState(false);
      const [isRecording, setIsRecording] = useState(false);
      const [isTranscribing, setIsTranscribing] = useState(false);
      const [isFocused, setIsFocused] = useState(false);
      const [isSuccessFlash, setIsSuccessFlash] = useState(false);
      const [micError, setMicError] = useState<string | null>(null);
      const [transcriptionError, setTranscriptionError] = useState<
        string | null
      >(null);
      const mediaRecorderRef = useRef<MediaRecorder | null>(null);
      const audioChunksRef = useRef<Blob[]>([]);
      const internalRef = useRef<HTMLTextAreaElement>(null);
      const inputRef =
        (ref as React.MutableRefObject<HTMLTextAreaElement>) || internalRef;
      const [audioVolume, setAudioVolume] = useState<number>(0);
      const audioContextRef = useRef<AudioContext | null>(null);
      const analyserRef = useRef<AnalyserNode | null>(null);
      const silenceStartRef = useRef<number | null>(null);
      const animationFrameRef = useRef<number | null>(null);
      const hasSpokenRef = useRef<boolean>(false);
      const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
      const recognitionRef = useRef<any>(null);

      const { playChirp, playBlip, playNotification } = useGlobalInteraction();

      const {
        liveAudioEnabled,
        systemInstruction,
        thinkingMode,
        setThinkingMode,
        searchGrounding,
        setSearchGrounding,
      } = useSettings();
      const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
      const liveSessionRef = useRef<any>(null);
      const audioOutRef = useRef<AudioContext | null>(null);
      const audioQueueRef = useRef<Float32Array[]>([]);
      const isPlayingRef = useRef(false);

      useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
          if (
            isOptionsOpen &&
            !(e.target as Element).closest(".options-menu-container")
          ) {
            setIsOptionsOpen(false);
          }
          if (
            isModelMenuOpen &&
            !(e.target as Element).closest(".model-menu-container")
          ) {
            setIsModelMenuOpen(false);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }, [isOptionsOpen, isModelMenuOpen]);

      const autoResizeInput = () => {
        if (inputRef.current) {
          inputRef.current.style.height = "auto";
          const scrollHeight = inputRef.current.scrollHeight;
          inputRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
          // Show scrollbar only if content exceeds roughly 2 lines (approx 72px)
          inputRef.current.style.overflowY =
            scrollHeight > 80 ? "auto" : "hidden";
        }
      };

      useEffect(() => {
        autoResizeInput();
      }, [input]);

      const getOptionsIcon = () => {
        if (isImageMode) return <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />;
        if (thinkingMode) return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />;
        if (searchGrounding) return <Globe className="w-5 h-5 sm:w-6 sm:h-6" />;
        return <Settings2 className="w-5 h-5 sm:w-6 sm:h-6" />;
      };

      const getModelIcon = (mode: string) => {
        switch (mode) {
          case "pro":
            return <Brain className="w-5 h-5 sm:w-6 sm:h-6" />;
          case "happy":
            return <Smile className="w-5 h-5 sm:w-6 sm:h-6" />;
          default:
            return <Zap className="w-5 h-5 sm:w-6 sm:h-6" />;
        }
      };

      const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (enterToSend && e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
        // If enterToSend is false, or if shift+enter is pressed, it naturally adds a new line
      };

      const handleSend = () => {
        if (!input.trim() || isLoading) return;
        onSendMessage(input.trim(), isImageMode);
        setInput("");
        if (inputRef.current) {
          inputRef.current.style.height = "auto";
        }
      };

      const startRecording = async () => {
        setMicError(null);
        setTranscriptionError(null);
        setInput("");
        playChirp();

        let stream: MediaStream;
        let mediaRecorder: MediaRecorder;
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error(
              "Microphone access is not supported in this browser or environment.",
            );
          }
          if (!window.MediaRecorder) {
            throw new Error(
              "Audio recording is not supported in this browser.",
            );
          }

          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                channelCount: 1,
              },
            });
          } catch (advancedErr) {
            console.warn(
              "Advanced audio constraints failed, falling back to basic audio",
              advancedErr,
            );
            // Fallback to basic audio if advanced constraints fail
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          }

          // 1. Setup MediaRecorder for capturing the actual audio file
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          // 2. Setup Web Speech API for live transcription (if available)
          const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
          let finalTranscript = "";
          let isFinishing = false;

          const finishRecording = async () => {
            if (isFinishing) return;
            isFinishing = true;

            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
              } catch (e) {}
            }

            if (mediaRecorder.state === "recording") {
              mediaRecorder.stop();
            }
          };

          mediaRecorder.onstop = () => {
            setTimeout(async () => {
              // If no audio was detected at all, just cancel
              if (!hasSpokenRef.current && !finalTranscript && !input.trim()) {
                setIsRecording(false);
                stopRecording();
                return;
              }

              const mimeType = mediaRecorder.mimeType || "audio/webm";
              const audioBlob = new Blob(audioChunksRef.current, {
                type: mimeType,
              });
              const audioUrl = URL.createObjectURL(audioBlob);

              setIsTranscribing(true);
              const currentInput = input.trim();
              setInput("");

              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = async () => {
                const base64data = (reader.result as string).split(",")[1];
                try {
                  const text = await transcribeAudio(base64data, mimeType);

                  if (text) {
                    playBlip();
                    setIsSuccessFlash(true);
                    setTimeout(() => setIsSuccessFlash(false), 1000);
                    onSendMessage(text, isImageMode, audioUrl);
                  } else {
                    const fallbackText = finalTranscript.trim() || currentInput;
                    if (fallbackText) {
                      playBlip();
                      setIsSuccessFlash(true);
                      setTimeout(() => setIsSuccessFlash(false), 1000);
                      onSendMessage(fallbackText, isImageMode, audioUrl);
                    }
                  }
                } catch (error) {
                  console.error("Error transcribing audio:", error);
                  setTranscriptionError("Error transcribing audio.");
                  setTimeout(() => setTranscriptionError(null), 8000);
                  const fallbackText = finalTranscript.trim() || currentInput;
                  if (fallbackText) {
                    playBlip();
                    setIsSuccessFlash(true);
                    setTimeout(() => setIsSuccessFlash(false), 1000);
                    onSendMessage(fallbackText, isImageMode, audioUrl);
                  }
                } finally {
                  setIsTranscribing(false);
                }
              };

              stopRecording();
            }, 500);
          };

          if (SpeechRecognition) {
            try {
              const recognition = new SpeechRecognition();
              recognitionRef.current = recognition;
              recognition.continuous = true;
              recognition.interimResults = true;
              recognition.lang = "en-IN"; // Optimized for Hinglish

              recognition.onresult = (event: any) => {
                let interimTranscript = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                  if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + " ";
                  } else {
                    interimTranscript += event.results[i][0].transcript;
                  }
                }

                const currentText = (
                  finalTranscript + interimTranscript
                ).trim();
                if (currentText) {
                  // The user requested NOT to automatically type on the textpad while speaking.
                  // We just record the fact that they have spoken.
                  hasSpokenRef.current = true;
                }
              };

              recognition.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
              };

              recognition.start();
            } catch (err) {
              console.error("Speech recognition initialization failed", err);
            }
          }

          mediaRecorder.start();
          setIsRecording(true);
          hasSpokenRef.current = false;

          // 3. Robust Silence Detection (RMS) - Always active
          const audioContext = new (
            window.AudioContext || (window as any).webkitAudioContext
          )();
          await audioContext.resume();
          audioContextRef.current = audioContext;
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 1024;
          analyser.smoothingTimeConstant = 0.5;
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Float32Array(analyser.fftSize);

          const checkSilence = () => {
            if (mediaRecorder.state !== "recording") return;

            analyser.getFloatTimeDomainData(dataArray);

            let sumSquares = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sumSquares += dataArray[i] * dataArray[i];
            }
            const rms = Math.sqrt(sumSquares / dataArray.length);

            // Always update volume for visual feedback
            setAudioVolume(Math.min(1, rms * 50));

            const silenceThreshold = 0.015;

            if (rms >= silenceThreshold) {
              hasSpokenRef.current = true;
              silenceStartRef.current = null;
            } else {
              if (silenceStartRef.current === null) {
                silenceStartRef.current = Date.now();
              } else if (Date.now() - silenceStartRef.current > 2500) {
                // 2.5 seconds of silence detected by RMS
                finishRecording();
                return;
              }
            }

            animationFrameRef.current = requestAnimationFrame(checkSilence);
          };

          checkSilence();
        } catch (err: any) {
          console.error("Error accessing microphone:", err);
          if (
            err.name === "NotAllowedError" ||
            err?.message?.includes("Permission denied")
          ) {
            setMicError(
              "Microphone access denied. Please click the microphone icon in your browser's address bar to allow access, then refresh this page.",
            );
          } else {
            setMicError(
              "Could not access the microphone. Please ensure a microphone is connected and refresh the page.",
            );
          }
          setTimeout(() => setMicError(null), 8000);
        }
      };

      const stopRecording = () => {
        // Stop Web Speech API if active
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        if (mediaRecorderRef.current) {
          if (mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
          }
          mediaRecorderRef.current.stream
            .getTracks()
            .forEach((track) => track.stop());
        }

        setIsRecording(false);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(console.error);
          audioContextRef.current = null;
        }
        silenceStartRef.current = null;
        setAudioVolume(0);
      };

      const toggleRecording = () => {
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      };

      const startLiveSession = async () => {
        if (isLiveSessionActive) return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setMicError(
            "Microphone access is not supported by your browser or is blocked by security policies.",
          );
          return;
        }

        try {
          playNotification();
          setIsLiveSessionActive(true);

          const session = await connectLiveSession(
            {
              onopen: () => {
                console.log("Live session opened");
              },
              onmessage: async (message) => {
                if (
                  message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data
                ) {
                  const base64Audio =
                    message.serverContent.modelTurn.parts[0].inlineData.data;
                  const audioData = Uint8Array.from(atob(base64Audio), (c) =>
                    c.charCodeAt(0),
                  );
                  // Handle audio playback (PCM 16kHz)
                  playLiveAudio(audioData);
                }
                if (message.serverContent?.interrupted) {
                  audioQueueRef.current = [];
                  isPlayingRef.current = false;
                }
              },
              onclose: () => {
                setIsLiveSessionActive(false);
                liveSessionRef.current = null;
              },
              onerror: (err) => {
                console.error("Live session error:", err);
                setIsLiveSessionActive(false);
              },
            },
            systemInstruction,
          );

          liveSessionRef.current = session;

          // Setup microphone streaming for Live API
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const audioCtx = new AudioContext({ sampleRate: 16000 });
          await audioCtx.resume();
          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);

          source.connect(processor);
          processor.connect(audioCtx.destination);

          processor.onaudioprocess = (e) => {
            if (!isLiveSessionActive) return;
            const inputData = e.inputBuffer.getChannelData(0);
            // Convert Float32 to Int16
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
            }
            const base64 = btoa(
              String.fromCharCode(...new Uint8Array(pcmData.buffer)),
            );
            session.sendRealtimeInput({
              media: { data: base64, mimeType: "audio/pcm;rate=16000" },
            });
          };
        } catch (err: any) {
          console.error("Failed to start live session:", err);
          if (
            err.name === "NotAllowedError" ||
            err?.message?.includes("Permission denied")
          ) {
            setMicError(
              "Microphone access denied. Please click the microphone icon in your browser's address bar to allow access, then refresh this page.",
            );
          }
          if (liveSessionRef.current) {
            liveSessionRef.current.close();
            liveSessionRef.current = null;
          }
          setIsLiveSessionActive(false);
        }
      };

      const stopLiveSession = () => {
        if (liveSessionRef.current) {
          liveSessionRef.current.close();
        }
        setIsLiveSessionActive(false);
      };

      const playLiveAudio = async (data: Uint8Array) => {
        if (!audioOutRef.current) {
          audioOutRef.current = new AudioContext({ sampleRate: 24000 });
        }

        // PCM 16-bit to Float32
        const int16 = new Int16Array(data.buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
          float32[i] = int16[i] / 32768.0;
        }

        audioQueueRef.current.push(float32);
        if (!isPlayingRef.current) {
          processAudioQueue();
        }
      };

      const processAudioQueue = async () => {
        if (audioQueueRef.current.length === 0 || !audioOutRef.current) {
          isPlayingRef.current = false;
          return;
        }

        isPlayingRef.current = true;
        const chunk = audioQueueRef.current.shift()!;
        const buffer = audioOutRef.current.createBuffer(1, chunk.length, 24000);
        buffer.getChannelData(0).set(chunk);

        const source = audioOutRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioOutRef.current.destination);
        source.onended = () => processAudioQueue();
        source.start();
      };

      return (
        <div className="w-full pt-1 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))] px-3 sm:px-6 bg-transparent">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: isRecording ? 1.02 : 1,
            }}
            transition={{ 
              opacity: { duration: 0.8, ease: "easeOut" },
              y: { duration: 0.8, ease: "easeOut" },
              scale: { type: "spring", stiffness: 300, damping: 20 }
            }}
            className="max-w-4xl mx-auto relative rounded-2xl"
          >
            {micError && (
              <div className="absolute -top-16 left-0 right-0 mx-auto w-fit px-4 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm rounded-lg backdrop-blur-md shadow-lg flex flex-col items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 z-50">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {micError}
                </div>
                {micError.includes("denied") && (
                  <button
                    onClick={() => window.open(window.location.href, "_blank")}
                    className="mt-1 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-md transition-colors flex items-center gap-2 font-medium"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Open App in New Tab to Fix
                  </button>
                )}
              </div>
            )}
            {transcriptionError && (
              <div className="absolute -top-16 left-0 right-0 mx-auto w-fit px-4 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm rounded-lg backdrop-blur-md shadow-lg flex flex-col items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 z-50">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {transcriptionError}
                </div>
              </div>
            )}

            {isAwakened ? (
              /* AWAKENED MODE TEXTPAD - 10X ADVANCED */
              <motion.div 
                className="relative w-full group"
                initial={{ "--border-opacity": 0 } as any}
                animate={{ 
                  "--border-opacity": 1
                } as any}
                transition={{
                  duration: 1.5, 
                  ease: "easeOut", 
                  delay: 0.5 
                }}
              >
                <div
                  className={`input-wrapper textpad-entry-anim transition-all duration-500 mx-auto ${
                    isSuccessFlash
                      ? "success-flash shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                      : isRecording
                        ? "shadow-[0_0_20px_rgba(244,63,94,0.2)] animate-pulse"
                        : ""
                  }`}
                >
                  <div className="input-border-container"></div>
                  <div className="inner-input flex flex-col gap-1.5 sm:gap-2 p-2 sm:p-3">

                  {/* Background effects container (handles overflow for animations) */}
                  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    {/* Scanning Line Animation */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[200%] -translate-y-full group-focus-within:animate-[scanline_4s_linear_infinite]"></div>
                    {isRecording && (
                      <div className="absolute inset-0 bg-rose-500/5 animate-pulse"></div>
                    )}
                  </div>

                  {/* Tech Corner Accents */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400/30 rounded-tl-2xl opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-400/30 rounded-tr-2xl opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-400/30 rounded-bl-2xl opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/30 rounded-br-2xl opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={
                      isTranscribing
                        ? "Transcribing..."
                        : isRecording
                          ? "Listening..."
                          : isImageMode
                            ? "Describe the image for LOKI..."
                            : "Describe an app and let Gemini do the rest"
                    }
                    className="w-full max-h-[120px] sm:max-h-[150px] min-h-[40px] sm:min-h-[50px] bg-transparent border-0 focus:ring-0 focus:outline-none resize-none px-3 sm:px-4 py-2.5 sm:py-3.5 text-[1rem] sm:text-[1.1rem] text-cyan-50 placeholder:text-cyan-600/50 custom-scrollbar leading-relaxed font-mono tracking-wide relative z-10 caret-[#4285F4] rounded-lg sm:rounded-xl"
                    rows={1}
                    readOnly={isRecording || isTranscribing}
                    disabled={isLoading}
                  />
                  <div className="flex justify-between items-center w-full px-1 relative z-10">
                    <div className="flex items-center gap-0 sm:gap-0.5">
                      <div className="relative options-menu-container">
                        <button
                          onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all border ${isOptionsOpen || isImageMode || thinkingMode || searchGrounding ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(0,242,255,0.2)]" : "text-cyan-600/70 hover:bg-cyan-500/10 hover:text-cyan-400 border-transparent hover:border-cyan-500/30"}`}
                        >
                          {getOptionsIcon()}
                        </button>

                        <AnimatePresence>
                          {isOptionsOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-[calc(100%+8px)] sm:bottom-[calc(100%+12px)] left-0 bg-[#050508]/95 backdrop-blur-xl border border-cyan-500/40 rounded-lg p-2 min-w-[180px] sm:min-w-[220px] z-[999] flex flex-col gap-1.5 shadow-[0_0_30px_rgba(0,242,255,0.2)]"
                            >
                              <div className="px-2 py-1 text-[0.6rem] font-black text-cyan-500/50 uppercase tracking-[0.2em]">
                                Advanced Core
                              </div>

                              <div className="space-y-1">
                                <button
                                  onClick={() => setThinkingMode(!thinkingMode)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${thinkingMode ? "bg-cyan-500/20 text-cyan-300" : "text-cyan-700 hover:bg-cyan-500/10 hover:text-cyan-400"}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span className="text-[0.65rem] font-bold uppercase tracking-wider">
                                      Deep Search
                                    </span>
                                  </div>
                                  <div
                                    className={`w-6 h-3 rounded-full relative transition-colors ${thinkingMode ? "bg-cyan-500" : "bg-cyan-950"}`}
                                  >
                                    <div
                                      className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-transform ${thinkingMode ? "left-3.5" : "left-0.5"}`}
                                    />
                                  </div>
                                </button>

                                <button
                                  onClick={() =>
                                    setSearchGrounding(!searchGrounding)
                                  }
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${searchGrounding ? "bg-cyan-500/20 text-cyan-300" : "text-cyan-700 hover:bg-cyan-500/10 hover:text-cyan-400"}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5" />
                                    <span className="text-[0.65rem] font-bold uppercase tracking-wider">
                                      Web Grounding
                                    </span>
                                  </div>
                                  <div
                                    className={`w-6 h-3 rounded-full relative transition-colors ${searchGrounding ? "bg-cyan-500" : "bg-cyan-950"}`}
                                  >
                                    <div
                                      className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-transform ${searchGrounding ? "left-3.5" : "left-0.5"}`}
                                    />
                                  </div>
                                </button>

                                <button
                                  onClick={() => setIsImageMode(!isImageMode)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${isImageMode ? "bg-cyan-500/20 text-cyan-300" : "text-cyan-700 hover:bg-cyan-500/10 hover:text-cyan-400"}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span className="text-[0.65rem] font-bold uppercase tracking-wider">
                                      Image Mode
                                    </span>
                                  </div>
                                  <div
                                    className={`w-6 h-3 rounded-full relative transition-colors ${isImageMode ? "bg-cyan-500" : "bg-cyan-950"}`}
                                  >
                                    <div
                                      className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-transform ${isImageMode ? "left-3.5" : "left-0.5"}`}
                                    />
                                  </div>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <div className="relative model-menu-container">
                        <button
                          onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all ${isModelMenuOpen ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(0,242,255,0.2)]" : "text-cyan-600/70 hover:bg-cyan-500/10 hover:text-cyan-400 border-transparent hover:border-cyan-500/30"}`}
                        >
                          {getModelIcon(modelMode)}
                          <span className="text-[0.65rem] font-black uppercase tracking-widest hidden sm:inline">
                            {modelMode}
                          </span>
                          <ChevronUp
                            className={`w-3.5 h-3.5 transition-transform duration-300 ${isModelMenuOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        <AnimatePresence>
                          {isModelMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-[calc(100%+8px)] sm:bottom-[calc(100%+12px)] right-0 bg-[#050508]/95 backdrop-blur-xl border border-cyan-500/40 rounded-lg p-1.5 min-w-[120px] z-[999] flex flex-col gap-1 shadow-[0_0_30px_rgba(0,242,255,0.2)]"
                            >
                              {[
                                { id: "fast", icon: Zap, label: "Fast" },
                                { id: "pro", icon: Brain, label: "Pro" },
                                { id: "happy", icon: Smile, label: "Happy" },
                              ].map((m) => (
                                <button
                                  key={m.id}
                                  onClick={() => {
                                    setModelMode(m.id);
                                    setIsModelMenuOpen(false);
                                  }}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${modelMode === m.id ? "bg-cyan-500/20 text-cyan-300" : "text-cyan-700 hover:text-cyan-400 hover:bg-cyan-500/10"}`}
                                >
                                  <m.icon className="w-3.5 h-3.5" />
                                  <span className="text-[0.65rem] font-bold uppercase tracking-wider">
                                    {m.label}
                                  </span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {/* Merged Mic/Send Button */}
                      <div className="flex items-center gap-1.5">
                        {liveAudioEnabled && !input.trim() && (
                          <button
                            onClick={
                              isLiveSessionActive
                                ? stopLiveSession
                                : startLiveSession
                            }
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all border ${isLiveSessionActive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse" : "text-cyan-600/70 hover:bg-cyan-500/10 hover:text-cyan-400 border-transparent hover:border-cyan-500/30"}`}
                            title={
                              isLiveSessionActive
                                ? "Stop Live Session"
                                : "Start Live Session"
                            }
                          >
                            <Radio
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLiveSessionActive ? "animate-spin" : ""}`}
                            />
                          </button>
                        )}

                        {isRecording && (
                          <div className="flex items-center gap-[2px] h-4 mr-2">
                            {[1, 2, 3, 4].map((i) => (
                              <motion.div
                                key={i}
                                animate={{
                                  height: [
                                    4,
                                    4 +
                                      audioVolume *
                                        12 *
                                        (i % 2 === 0 ? 1 : 0.7),
                                    4,
                                  ],
                                }}
                                transition={{ duration: 0.2, repeat: Infinity }}
                                className="w-[2px] bg-rose-500 rounded-full"
                              />
                            ))}
                          </div>
                        )}

                        {isLoading ? (
                          <button
                            onClick={onStopGeneration}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.4)] border border-rose-400/50 group"
                          >
                            <div className="absolute inset-0 bg-rose-400/20 animate-pulse group-hover:animate-none"></div>
                            <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 relative z-10 drop-shadow-[0_0_4px_rgba(244,63,94,1)] fill-current" />
                          </button>
                        ) : input.trim() ? (
                          <button
                            onClick={handleSend}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden bg-cyan-500/20 text-[#00f2ff] hover:bg-cyan-500/40 shadow-[0_0_15px_rgba(0,242,255,0.4)] border border-cyan-400/50 group"
                          >
                            <div className="absolute inset-0 bg-cyan-400/20 animate-pulse group-hover:animate-none"></div>
                            <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-0.5 relative z-10 drop-shadow-[0_0_4px_rgba(0,242,255,1)]" />
                          </button>
                        ) : (
                          <button
                            onClick={toggleRecording}
                            disabled={isTranscribing}
                            style={{
                              boxShadow: isRecording
                                ? `0 0 ${10 + audioVolume * 40}px rgba(244,63,94,${0.3 + audioVolume * 0.5})`
                                : undefined,
                              transform: isRecording
                                ? `scale(${1 + audioVolume * 0.15})`
                                : undefined,
                            }}
                            className={`mic-button-trigger w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all border overflow-hidden ${isRecording ? "bg-rose-500/20 text-rose-400 border-rose-500/50" : "text-cyan-600/70 hover:bg-cyan-500/10 hover:text-cyan-400 border-transparent hover:border-cyan-500/30"}`}
                          >
                            {isTranscribing ? (
                              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                            ) : isRecording ? (
                              <StopSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            ) : (
                              <InfinityMic className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* NORMAL MODE TEXTPAD - CLEAN & SIMPLE */
              <motion.div 
                className="relative w-full group"
                initial={{ "--border-opacity": 0 } as any}
                animate={{ 
                  "--border-opacity": 1
                } as any}
                transition={{
                  duration: 1.5, 
                  ease: "easeOut", 
                  delay: 0.5 
                }}
              >
                <div
                  className={`input-wrapper textpad-entry-anim transition-all duration-500 mx-auto ${
                    isSuccessFlash
                      ? "shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                      : isRecording
                        ? "shadow-[0_0_20px_rgba(6,182,212,0.5)] animate-pulse"
                        : ""
                  }`}
                >
                  <div className="input-border-container"></div>
                  <div className="inner-input flex flex-col gap-2 sm:gap-3 p-4 sm:p-5">

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={
                      isTranscribing
                        ? "Transcribing..."
                        : isRecording
                          ? "Listening..."
                          : isImageMode
                            ? "Describe the image for LOKI..."
                            : "Describe an app and let Gemini do the rest"
                    }
                    className="w-full max-h-[200px] sm:max-h-[250px] min-h-[50px] sm:min-h-[60px] bg-transparent border-0 focus:ring-0 focus:outline-none resize-none px-3 sm:px-4 py-3 sm:py-4 text-[1.05rem] sm:text-[1.2rem] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#6b6b80] custom-scrollbar leading-relaxed font-medium"
                    rows={1}
                    readOnly={isRecording || isTranscribing}
                    disabled={isLoading}
                  />
                  <div className="flex justify-between items-center w-full px-2">
                    <div className="flex items-center gap-0 sm:gap-0.5">
                      <div className="relative options-menu-container">
                        <button
                          onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all ${isOptionsOpen || isImageMode || thinkingMode || searchGrounding ? "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 shadow-lg" : "text-slate-400 dark:text-[#888] hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white"}`}
                        >
                          {getOptionsIcon()}
                        </button>

                        <AnimatePresence>
                          {isOptionsOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-[calc(100%+10px)] sm:bottom-[calc(100%+14px)] left-0 bg-white dark:bg-[#050508] border border-slate-200 dark:border-cyan-500/40 rounded-2xl p-3 min-w-[200px] sm:min-w-[250px] z-[999] flex flex-col gap-2 shadow-2xl dark:shadow-[0_0_30px_rgba(0,242,255,0.15)]"
                            >
                              <div className="px-2 py-1 text-[0.7rem] font-black text-slate-400 dark:text-cyan-500/50 uppercase tracking-[0.2em]">
                                Advanced Core
                              </div>

                              <div className="space-y-1">
                                <button
                                  onClick={() => setThinkingMode(!thinkingMode)}
                                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all ${thinkingMode ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-[0.75rem] font-bold uppercase tracking-wider">
                                      Deep Search
                                    </span>
                                  </div>
                                  <div
                                    className={`w-8 h-4 rounded-full relative transition-colors ${thinkingMode ? "bg-cyan-500" : "bg-slate-200 dark:bg-slate-800"}`}
                                  >
                                    <div
                                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${thinkingMode ? "left-4.5" : "left-0.5"}`}
                                    />
                                  </div>
                                </button>

                                <button
                                  onClick={() =>
                                    setSearchGrounding(!searchGrounding)
                                  }
                                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all ${searchGrounding ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Globe className="w-4 h-4" />
                                    <span className="text-[0.75rem] font-bold uppercase tracking-wider">
                                      Web Grounding
                                    </span>
                                  </div>
                                  <div
                                    className={`w-8 h-4 rounded-full relative transition-colors ${searchGrounding ? "bg-cyan-500" : "bg-slate-200 dark:bg-slate-800"}`}
                                  >
                                    <div
                                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${searchGrounding ? "left-4.5" : "left-0.5"}`}
                                    />
                                  </div>
                                </button>

                                <button
                                  onClick={() => setIsImageMode(!isImageMode)}
                                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all ${isImageMode ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <ImageIcon className="w-4 h-4" />
                                    <span className="text-[0.75rem] font-bold uppercase tracking-wider">
                                      Image Mode
                                    </span>
                                  </div>
                                  <div
                                    className={`w-8 h-4 rounded-full relative transition-colors ${isImageMode ? "bg-cyan-500" : "bg-slate-200 dark:bg-slate-800"}`}
                                  >
                                    <div
                                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isImageMode ? "left-4.5" : "left-0.5"}`}
                                    />
                                  </div>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="relative model-menu-container">
                        <button
                          onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                          className={`flex items-center gap-2.5 px-4 py-2 rounded-full transition-all ${isModelMenuOpen ? "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 shadow-md" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-white"}`}
                        >
                          {getModelIcon(modelMode)}
                          <span className="text-[0.75rem] font-bold uppercase tracking-wider hidden sm:inline">
                            {modelMode}
                          </span>
                          <ChevronUp
                            className={`w-4 h-4 transition-transform duration-300 ${isModelMenuOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        <AnimatePresence>
                          {isModelMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-[calc(100%+10px)] sm:bottom-[calc(100%+14px)] right-0 bg-white dark:bg-[#050508] border border-slate-200 dark:border-cyan-500/40 rounded-2xl p-2 min-w-[140px] z-[999] flex flex-col gap-1 shadow-2xl dark:shadow-[0_0_30px_rgba(0,242,255,0.15)]"
                            >
                              {[
                                { id: "fast", icon: Zap, label: "Fast" },
                                { id: "pro", icon: Brain, label: "Pro" },
                                { id: "happy", icon: Smile, label: "Happy" },
                              ].map((m) => (
                                <button
                                  key={m.id}
                                  onClick={() => {
                                    setModelMode(m.id);
                                    setIsModelMenuOpen(false);
                                  }}
                                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${modelMode === m.id ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"}`}
                                >
                                  <m.icon className="w-4 h-4" />
                                  <span className="text-[0.75rem] font-bold uppercase tracking-wider">
                                    {m.label}
                                  </span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {/* Merged Mic/Send Button */}
                      <div className="flex items-center gap-2">
                        {liveAudioEnabled && !input.trim() && (
                          <button
                            onClick={
                              isLiveSessionActive
                                ? stopLiveSession
                                : startLiveSession
                            }
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all border ${isLiveSessionActive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse" : "text-slate-400 dark:text-[#888] hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white border-transparent"}`}
                            title={
                              isLiveSessionActive
                                ? "Stop Live Session"
                                : "Start Live Session"
                            }
                          >
                            <Radio
                              className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiveSessionActive ? "animate-spin" : ""}`}
                            />
                          </button>
                        )}

                        {isRecording && (
                          <div className="flex items-center gap-[2px] h-4 mr-2">
                            {[1, 2, 3, 4].map((i) => (
                              <motion.div
                                key={i}
                                animate={{
                                  height: [
                                    4,
                                    4 +
                                      audioVolume *
                                        12 *
                                        (i % 2 === 0 ? 1 : 0.7),
                                    4,
                                  ],
                                }}
                                transition={{ duration: 0.2, repeat: Infinity }}
                                className="w-[2px] bg-rose-500 rounded-full"
                              />
                            ))}
                          </div>
                        )}

                        {isLoading ? (
                          <button
                            onClick={onStopGeneration}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-rose-100 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/40 border border-rose-200 dark:border-rose-400/50"
                          >
                            <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                          </button>
                        ) : input.trim() ? (
                          <button
                            onClick={handleSend}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-cyan-600 dark:bg-cyan-500/20 text-white dark:text-[#00f2ff] hover:bg-cyan-500 dark:hover:bg-cyan-500/30 shadow-[0_0_12px_rgba(0,242,255,0.3)] dark:border dark:border-cyan-400/30"
                          >
                            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
                          </button>
                        ) : (
                          <button
                            onClick={toggleRecording}
                            disabled={isTranscribing}
                            style={{
                              boxShadow: isRecording
                                ? `0 0 ${10 + audioVolume * 30}px rgba(244,63,94,${0.2 + audioVolume * 0.4})`
                                : undefined,
                              transform: isRecording
                                ? `scale(${1 + audioVolume * 0.1})`
                                : undefined,
                            }}
                            className={`mic-button-trigger w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all overflow-hidden ${isRecording ? "bg-rose-500/20 text-rose-500" : "text-slate-400 dark:text-[#888] hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white"}`}
                          >
                            {isTranscribing ? (
                              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            ) : isRecording ? (
                              <StopSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                            ) : (
                              <InfinityMic className="w-5 h-5 sm:w-6 sm:h-6" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      );
    },
  ),
);
