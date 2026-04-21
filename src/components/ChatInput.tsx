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
  ChevronDown,
  SlidersHorizontal,
  Settings2,
  Paperclip,
  ArrowRight,
  Rocket,
  Folder
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import { useGlobalInteraction } from "../contexts/GlobalInteractionContext";
import { transcribeAudio, connectLiveSession } from "../services/geminiService";
import { motion, AnimatePresence } from "framer-motion";
import { InfinityMic } from "./Logos";
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { LiveVoiceOverlay } from "./LiveVoiceOverlay";

const sharedPcmData = new Int16Array(4096);
const sharedUint8Data = new Uint8Array(sharedPcmData.buffer);

export interface ChatInputHandle {
  focus: () => void;
  setInput: (text: string) => void;
  value: string;
}

interface ChatInputProps {
  isLoading: boolean;
  modelMode: string;
  setModelMode: (mode: string) => void;
  onSendMessage: (
    text: string,
    isImageMode?: boolean,
    audioUrl?: string,
    attachments?: { data: string, mimeType: string }[]
  ) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  currentSessionId: string | null;
  onStopGeneration?: () => void;
  enterToSend: boolean;
  isAwakened?: boolean;
  draftText?: string;
  draftAttachments?: { data: string, mimeType: string, url: string }[];
  saveSessionDraft?: (id: string, text: string, attachments: any[]) => void;
}

export const ChatInput = memo(
  forwardRef<ChatInputHandle, ChatInputProps>(
    (
      {
        isLoading,
        modelMode,
        setModelMode,
        onSendMessage,
        onDeleteSession,
        currentSessionId,
        onStopGeneration,
        enterToSend,
        isAwakened,
        draftText = "",
        draftAttachments = [],
        saveSessionDraft,
      },
      ref,
    ) => {
      const [input, setInput] = useState(draftText);
      const [isOptionsOpen, setIsOptionsOpen] = useState(false);
      const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
      const [isImageMode, setIsImageMode] = useState(false);
      const [isRecording, setIsRecording] = useState(false);
      const [isTranscribing, setIsTranscribing] = useState(false);
      const [isFocused, setIsFocused] = useState(false);
      const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
      const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
      const [userVolume, setUserVolume] = useState<number>(0);
      const [isSuccessFlash, setIsSuccessFlash] = useState(false);
      const [micError, setMicError] = useState<string | null>(null);
      const [transcriptionError, setTranscriptionError] = useState<
        string | null
      >(null);
      const mediaRecorderRef = useRef<MediaRecorder | null>(null);
      const audioChunksRef = useRef<Blob[]>([]);
      const internalRef = useRef<HTMLTextAreaElement>(null);
      const inputRef = internalRef;
      
      React.useImperativeHandle(ref, () => ({
        focus: () => {
          internalRef.current?.focus();
        },
        setInput: (text: string) => {
          setInput(text);
        },
        get value() {
          return input;
        },
        set value(text: string) {
          setInput(text);
        }
      }), [input]);

      const [attachments, setAttachments] = useState<{data: string, mimeType: string, url: string}[]>(draftAttachments);

      useEffect(() => {
        setInput(draftText);
        setAttachments(draftAttachments);
      }, [currentSessionId]);

      // Use a ref to track the latest input/attachments to avoid adding them to dependency array
      const draftStateRef = useRef({ input, attachments });
      useEffect(() => {
        draftStateRef.current = { input, attachments };
      }, [input, attachments]);

      useEffect(() => {
        if (!saveSessionDraft || !currentSessionId) return;

        const timeoutId = setTimeout(() => {
          saveSessionDraft(currentSessionId, input, attachments);
        }, 500);

        return () => {
          clearTimeout(timeoutId);
        };
      }, [input, attachments, currentSessionId, saveSessionDraft]);

      // Only save on unmount/session switch, reading from the ref to get latest state
      useEffect(() => {
        if (!saveSessionDraft || !currentSessionId) return;

        return () => {
           // When switching sessions, save the last known state of the *previous* session
           saveSessionDraft(currentSessionId, draftStateRef.current.input, draftStateRef.current.attachments);
        };
      }, [currentSessionId, saveSessionDraft]);

      const fileInputRef = useRef<HTMLInputElement>(null);
      const micButtonRef = useRef<HTMLButtonElement>(null);
      const audioContextRef = useRef<AudioContext | null>(null);
      const analyserRef = useRef<AnalyserNode | null>(null);
      const silenceStartRef = useRef<number | null>(null);

      const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          const newAttachments = [...attachments];
          for (let i = 0; i < files.length; i++) {
            if (newAttachments.length >= 10) break; // Max 10 images
            const file = files[i];
            if (file.type.startsWith('image/')) {
              const url = URL.createObjectURL(file);
              const reader = new FileReader();
              reader.readAsDataURL(file);
              await new Promise<void>((resolve) => {
                reader.onload = () => {
                  const base64Data = (reader.result as string).split(',')[1];
                  newAttachments.push({
                    data: base64Data,
                    mimeType: file.type,
                    url: url
                  });
                  resolve();
                };
              });
            }
          }
          setAttachments(newAttachments);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      const handleAttachmentClick = async () => {
        if (Capacitor.isNativePlatform()) {
          setIsAttachmentMenuOpen(true);
        } else {
          fileInputRef.current?.click();
        }
      };

      const handleAttachmentOptionSelect = async (option: 'gallery' | 'files') => {
        setIsAttachmentMenuOpen(false);
        try {
          if (option === 'gallery') {
            const limit = 10 - attachments.length;
            if (limit <= 0) return;

            const photoResult = await Camera.pickImages({
              limit: limit,
            });

            if (photoResult && photoResult.photos && photoResult.photos.length > 0) {
              const newAttachments = [...attachments];
              for (const photo of photoResult.photos) {
                if (newAttachments.length >= 10) break;
                if (photo.webPath) {
                   try {
                     const response = await fetch(photo.webPath);
                     const blob = await response.blob();
                     const reader = new FileReader();
                     reader.readAsDataURL(blob);
                     await new Promise<void>((resolve) => {
                       reader.onload = () => {
                         const base64Data = (reader.result as string).split(',')[1];
                         newAttachments.push({
                           data: base64Data,
                           mimeType: `image/${photo.format || 'jpeg'}`,
                           url: photo.webPath as string
                         });
                         resolve();
                       };
                     });
                   } catch (err) {
                     console.error("Failed to read picked image:", err);
                   }
                }
              }
              setAttachments(newAttachments);
            }
          } else if (option === 'files') {
            // Open file manager for all file types
            fileInputRef.current?.click();
          }
        } catch (error) {
          console.error("Error picking attachments:", error);
        }
      };
      
      const removeAttachment = (index: number) => {
        const newAttachments = [...attachments];
        URL.revokeObjectURL(newAttachments[index].url);
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
      };
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
        effectInputBox,
        sendButtonIcon,
      } = useSettings();
      const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
      const liveSessionRef = useRef<any>(null);
      const audioOutRef = useRef<AudioContext | null>(null);
      const audioQueueRef = useRef<Float32Array[]>([]);
      const isPlayingRef = useRef(false);
      const volumeAnimFrameRef = useRef<number>(0);

      useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
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
          if (
            isAttachmentMenuOpen &&
            !(e.target as Element).closest(".attachment-menu-container")
          ) {
            setIsAttachmentMenuOpen(false);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
          document.removeEventListener("touchstart", handleClickOutside);
        };
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
        if ((!input.trim() && attachments.length === 0) || isLoading) return;
        onSendMessage(input.trim(), isImageMode, undefined, attachments);
        setInput("");
        setAttachments([]);
        if (saveSessionDraft && currentSessionId) saveSessionDraft(currentSessionId, "", []);
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
          if (Capacitor.isNativePlatform()) {
            const hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
            if (!hasPermission.value) {
              const request = await VoiceRecorder.requestAudioRecordingPermission();
              if (!request.value) {
                throw new Error("Permission denied");
              }
            }
          }

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

          // 2. We only use MediaRecorder for audio capture, no SpeechRecognition to avoid Android popup
          let isFinishing = false;

          const finishRecording = async () => {
            if (isFinishing) return;
            isFinishing = true;

            if (mediaRecorder.state === "recording") {
              mediaRecorder.stop();
            }
          };

          mediaRecorder.onstop = () => {
            setTimeout(async () => {
              // If no audio was detected at all, just cancel
              if (!hasSpokenRef.current && !input.trim()) {
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
                    setInput("");
                    setAttachments([]);
                    if (saveSessionDraft && currentSessionId) saveSessionDraft(currentSessionId, "", []);
                  } else {
                    const fallbackText = currentInput;
                    if (fallbackText) {
                      playBlip();
                      setIsSuccessFlash(true);
                      setTimeout(() => setIsSuccessFlash(false), 1000);
                      onSendMessage(fallbackText, isImageMode, audioUrl);
                      setInput("");
                      setAttachments([]);
                      if (saveSessionDraft && currentSessionId) saveSessionDraft(currentSessionId, "", []);
                    }
                  }
                } catch (error) {
                  console.error("Error transcribing audio:", error);
                  setTranscriptionError("Error transcribing audio.");
                  setTimeout(() => setTranscriptionError(null), 8000);
                  const fallbackText = currentInput;
                  if (fallbackText) {
                    playBlip();
                    setIsSuccessFlash(true);
                    setTimeout(() => setIsSuccessFlash(false), 1000);
                    onSendMessage(fallbackText, isImageMode, audioUrl);
                    setInput("");
                    setAttachments([]);
                    if (saveSessionDraft && currentSessionId) saveSessionDraft(currentSessionId, "", []);
                  }
                } finally {
                  setIsTranscribing(false);
                }
              };

              stopRecording();
            }, 500);
          };

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

            // Always update volume for visual feedback directly via DOM
            const volume = Math.min(1, rms * 50);
            if (micButtonRef.current) {
              micButtonRef.current.style.boxShadow = `0 0 ${10 + volume * 30}px rgba(244,63,94,${0.2 + volume * 0.4})`;
              micButtonRef.current.style.transform = `scale(${1 + volume * 0.1})`;
            }

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
              "Microphone access denied. Please allow microphone permissions in your app settings.",
            );
          } else {
            setMicError(
              "Could not access the microphone. Please ensure a microphone is connected.",
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
        if (micButtonRef.current) {
          micButtonRef.current.style.boxShadow = '';
          micButtonRef.current.style.transform = '';
        }
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

        try {
          if (Capacitor.isNativePlatform()) {
            const hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
            if (!hasPermission.value) {
              const request = await VoiceRecorder.requestAudioRecordingPermission();
              if (!request.value) {
                throw new Error("Permission denied");
              }
            }
          }

          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setMicError(
              "Microphone access is not supported or is blocked by security policies.",
            );
            return;
          }

          playNotification();
          setIsLiveSessionActive(true);

          const session = await connectLiveSession(
            {
              onopen: () => {},
              onmessage: async (message) => {
                if (
                  message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data
                ) {
                  const base64Audio =
                    message.serverContent.modelTurn.parts[0].inlineData.data;

                  try {
                    const response = await fetch(`data:application/octet-stream;base64,${base64Audio}`);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioData = new Uint8Array(arrayBuffer);

                    // Handle audio playback (PCM 16kHz)
                    playLiveAudio(audioData);
                  } catch (e) {
                    console.error("Error decoding audio using fetch:", e);
                  }
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
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const processor = audioCtx.createScriptProcessor(4096, 1, 1);

          source.connect(analyser);
          analyser.connect(processor);
          processor.connect(audioCtx.destination);

          const updateVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            setUserVolume(average);
            volumeAnimFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();

          processor.onaudioprocess = (e) => {
            if (!isLiveSessionActive) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const l = inputData.length;
            // Convert Float32 to Int16
            const pcmData = l === 4096 ? sharedPcmData : new Int16Array(l);
            const uint8Data = l === 4096 ? sharedUint8Data : new Uint8Array(pcmData.buffer);

            for (let i = 0; i < l; i++) {
              let s = inputData[i];
              s = s < -1 ? -1 : (s > 1 ? 1 : s);
              pcmData[i] = s * 0x7fff;
            }

            let binary = '';
            const chunkSize = 0x8000;
            for (let i = 0; i < uint8Data.length; i += chunkSize) {
              binary += String.fromCharCode.apply(null, uint8Data.subarray(i, i + chunkSize) as any);
            }

            const base64 = btoa(binary);
            session.sendRealtimeInput({
              audio: { data: base64, mimeType: "audio/pcm;rate=16000" },
            });
          };
        } catch (err: any) {
          console.error("Failed to start live session:", err);
          if (
            err.name === "NotAllowedError" ||
            err?.message?.includes("Permission denied")
          ) {
            setMicError(
              "Microphone access denied. Please allow microphone permissions in your app settings.",
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
        if (volumeAnimFrameRef.current) {
          cancelAnimationFrame(volumeAnimFrameRef.current);
        }
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
        <div className="w-full pt-1 px-3 sm:px-6 bg-transparent">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: isRecording ? 1.02 : 1,
            }}
            transition={{ 
              opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
              y: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
              scale: { type: "spring", stiffness: 400, damping: 30, mass: 0.8 }
            }}
            className="max-w-4xl mx-auto relative rounded-2xl"
          >
            {micError && (
              <div className="absolute -top-16 left-0 right-0 mx-auto w-fit px-4 py-3 bg-rose-900 border border-rose-500/30 text-rose-100 text-xs sm:text-sm rounded-lg shadow-lg flex flex-col items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 z-50">
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
              </div>
            )}
            {transcriptionError && (
              <div className="absolute -top-16 left-0 right-0 mx-auto w-fit px-4 py-3 bg-rose-900 border border-rose-500/30 text-rose-100 text-xs sm:text-sm rounded-lg shadow-lg flex flex-col items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 z-50">
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

            {/* INPUT PANEL */}
              <motion.div 
                className="relative w-full group mx-auto max-w-3xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 400, mass: 0.8 }}
              >
                <div className={`relative rounded-[32px] transition-all duration-500 ${isAwakened || effectInputBox ? 'p-[2px] shadow-[0_0_40px_rgba(0,242,255,0.3)]' : 'p-0 bg-transparent'}`}>
                  {(isAwakened || effectInputBox) && (
                    <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none">
                      <div 
                        className="absolute top-1/2 left-1/2 w-[300%] sm:w-[250%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite]" 
                        style={{ background: 'conic-gradient(from 0deg at 50% 50%, transparent 0%, rgba(0, 242, 255, 0.4) 15%, #00f2ff 30%, transparent 30%, transparent 50%, rgba(189, 0, 255, 0.4) 65%, #bd00ff 80%, transparent 80%, transparent 100%)' }}
                      />
                      <div className="absolute inset-0 rounded-[32px] shadow-[inset_0_0_20px_rgba(0,242,255,0.5)] animate-pulse" style={{ animationDuration: '2s' }} />
                    </div>
                  )}
                  <div
                    className={`relative z-10 rounded-[30px] transition-all duration-500 flex flex-col p-2 sm:p-3 backdrop-blur-xl border-transparent shadow-sm dark:shadow-none ${
                      isAwakened || effectInputBox
                        ? `bg-white/60 dark:bg-[#050505]/90 transition-shadow duration-300 ${isFocused ? 'shadow-[inset_0_0_50px_rgba(0,242,255,0.25)]' : 'shadow-[inset_0_0_30px_rgba(0,242,255,0.1)]'}` 
                        : "bg-slate-100/20 dark:bg-white/5"
                    } ${
                      isSuccessFlash
                        ? "shadow-[0_0_30px_rgba(255,255,255,0.5)] border-white/50"
                        : isRecording
                          ? "shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-pulse border-white/50"
                          : ""
                    }`}
                  >
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-2 pb-2">
                        {attachments.map((att, index) => (
                          <div key={index} className="relative group w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
                            <img src={att.url} alt={`attachment-${index}`} className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeAttachment(index)}
                              title="Remove attachment" aria-label="Remove attachment"
                              className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <textarea
                      aria-label="Chat input"
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
                              : "Ask AI..."
                      }
                      className={`w-full max-h-[200px] sm:max-h-[250px] min-h-[44px] sm:min-h-[52px] bg-transparent border-0 focus:ring-0 focus:outline-none resize-none px-2 py-2 sm:py-3 text-base sm:text-lg text-slate-900 dark:text-[#E3E3E3] placeholder:text-slate-400 dark:placeholder:text-[#C4C7C5] custom-scrollbar leading-relaxed font-medium transition-all duration-300 ${isAwakened || effectInputBox ? 'dark:text-white drop-shadow-[0_0_8px_rgba(0,242,255,0.3)]' : ''}`}
                      rows={1}
                      readOnly={isRecording || isTranscribing}
                      disabled={isLoading}
                    />
                    
                    <div className="flex items-center justify-between mt-1 sm:mt-2 px-1 relative">
                      {/* Left Side Actions */}
                      <div className="flex items-center gap-1">
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFileUpload}
                          multiple
                        />
                        <button
                          onClick={handleAttachmentClick}
                          aria-label="Attach file"
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-slate-500 dark:text-[#C4C7C5] hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-[#E3E3E3] transition-all"
                          title="Attach file"
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                        
                        <div className="relative options-menu-container">
                          <button
                            onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                            title="Options menu" aria-label="Options menu"
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${isOptionsOpen || isImageMode || thinkingMode || searchGrounding ? "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-[#E3E3E3] shadow-lg" : "text-slate-500 dark:text-[#C4C7C5] hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-[#E3E3E3]"}`}
                          >
                            <SlidersHorizontal className="w-5 h-5" />
                          </button>

                          <AnimatePresence>
                            {isOptionsOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-[calc(100%+10px)] sm:bottom-[calc(100%+14px)] left-0 bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 rounded-2xl p-3 min-w-[200px] sm:min-w-[250px] z-[999] flex flex-col gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                              >
                                <div className="px-2 py-1 text-[0.7rem] font-black text-slate-400 dark:text-white/50 uppercase tracking-[0.2em]">
                                  Advanced Core
                                </div>

                                <div className="space-y-1">
                                  {modelMode === 'pro' && (
                                    <button
                                      onClick={() => setThinkingMode(!thinkingMode)}
                                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all ${thinkingMode ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white" : "text-slate-600 dark:text-[#C4C7C5] hover:bg-slate-100 dark:hover:bg-white/5"}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <Sparkles className="w-4 h-4" />
                                        <span className="text-[0.75rem] font-bold uppercase tracking-wider">
                                          Deep Search
                                        </span>
                                      </div>
                                      <div
                                        className={`w-8 h-4 rounded-full relative transition-colors ${thinkingMode ? "bg-slate-900 dark:bg-white" : "bg-slate-200 dark:bg-slate-800"}`}
                                      >
                                        <div
                                          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${thinkingMode ? "left-4.5" : "left-0.5"}`}
                                        />
                                      </div>
                                    </button>
                                  )}

                                  <button
                                    onClick={() =>
                                      setSearchGrounding(!searchGrounding)
                                    }
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all ${searchGrounding ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white" : "text-slate-600 dark:text-[#C4C7C5] hover:bg-slate-100 dark:hover:bg-white/5"}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Globe className="w-4 h-4" />
                                      <span className="text-[0.75rem] font-bold uppercase tracking-wider">
                                        Web Grounding
                                      </span>
                                    </div>
                                    <div
                                      className={`w-8 h-4 rounded-full relative transition-colors ${searchGrounding ? "bg-slate-900 dark:bg-white" : "bg-slate-200 dark:bg-slate-800"}`}
                                    >
                                      <div
                                        className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${searchGrounding ? "left-4.5" : "left-0.5"}`}
                                      />
                                    </div>
                                  </button>

                                  <button
                                    onClick={() => setIsImageMode(!isImageMode)}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all ${isImageMode ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white" : "text-slate-600 dark:text-[#C4C7C5] hover:bg-slate-100 dark:hover:bg-white/5"}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <ImageIcon className="w-4 h-4" />
                                      <span className="text-[0.75rem] font-bold uppercase tracking-wider">
                                        Image Mode
                                      </span>
                                    </div>
                                    <div
                                      className={`w-8 h-4 rounded-full relative transition-colors ${isImageMode ? "bg-slate-900 dark:bg-white" : "bg-slate-200 dark:bg-slate-800"}`}
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

                      {/* Right Side Actions */}
                      <motion.div layout className="flex items-center justify-end gap-1 sm:gap-2">
                        <motion.div layout className="relative model-menu-container">
                          <button
                            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                            title="Select Model" aria-label="Select Model"
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${
                              isModelMenuOpen 
                                ? "bg-slate-200 dark:bg-white/20 border-transparent text-slate-900 dark:text-[#E3E3E3] shadow-md" 
                                : "bg-transparent border-slate-300 dark:border-white/10 text-slate-600 dark:text-[#C4C7C5] hover:bg-slate-100 dark:hover:bg-white/5"
                            }`}
                          >
                            <span className="text-sm font-medium">
                              {modelMode === "pro" ? "Pro" : modelMode === "fast" ? "Fast" : "Happy"}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-300 ${isModelMenuOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                          
                          <AnimatePresence>
                            {isModelMenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-[calc(100%+10px)] sm:bottom-[calc(100%+14px)] right-0 bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 rounded-2xl p-2 min-w-[140px] z-[999] flex flex-col gap-1 shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                              >
                                {[
                                  { id: "fast", icon: Zap, label: "Fast" },
                                  { id: "pro", icon: Brain, label: "Pro" },
                                  { id: "happy", icon: Smile, label: "Happy" },
                                ].map((m) => (
                                  <button
                                    key={m.id}
                                    onClick={() => {
                                      setModelMode(m.id as any);
                                      setIsModelMenuOpen(false);
                                    }}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${modelMode === m.id ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-[#E3E3E3]" : "text-slate-600 dark:text-[#C4C7C5] hover:bg-slate-100 dark:hover:bg-white/5"}`}
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
                        </motion.div>

                        <motion.button
                          layout
                          ref={micButtonRef}
                          onClick={toggleRecording}
                          disabled={isTranscribing}
                          title="Toggle Voice Input" aria-label="Toggle Voice Input"
                          className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all border ${
                            isRecording 
                              ? "bg-rose-500/20 text-rose-500 border-rose-500/50" 
                              : "bg-transparent border-slate-300 dark:border-white/10 text-slate-600 dark:text-[#C4C7C5] hover:bg-slate-100 dark:hover:bg-white/5"
                          }`}
                        >
                          {isTranscribing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : isRecording ? (
                            <StopSquare className="w-5 h-5" />
                          ) : (
                            <Mic className="w-5 h-5" />
                          )}
                        </motion.button>

                        <AnimatePresence mode="popLayout">
                          {!(input.trim() || attachments.length > 0) && !isLoading ? (
                            <motion.button
                              key="live-conv-btn"
                              layout
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              onClick={() => {
                                setIsVoiceOverlayOpen(true);
                                startLiveSession();
                              }}
                              aria-label="Start Live Conversation"
                              className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-[#E3E3E3] hover:bg-slate-300 dark:hover:bg-white/20 border border-transparent"
                            >
                              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 11v3M12 7v10M16 10v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                <path d="M19 4l0.5 1.5L21 6l-1.5 0.5L19 8l-0.5-1.5L17 6l1.5-0.5L19 4z" fill="currentColor"/>
                              </svg>
                            </motion.button>
                          ) : (
                            <motion.div 
                              key="send-btn"
                              layout 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="shrink-0 flex items-center justify-center"
                            >
                              {isLoading ? (
                                <button
                                  onClick={onStopGeneration}
                                  aria-label="Stop Generation"
                                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 border border-rose-400/50 group"
                                  title="Stop Generation"
                                >
                                  <div className="w-6 h-6 rounded-full border-2 border-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform bg-rose-400/10">
                                    <div className="w-2 h-2 bg-rose-400 rounded-full" />
                                  </div>
                                </button>
                              ) : (
                                <button
                                  onClick={handleSend}
                                  disabled={!(input.trim() || attachments.length > 0)}
                                  aria-label="Send Message"
                                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${(input.trim() || attachments.length > 0) ? "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-[#E3E3E3] hover:bg-slate-300 dark:hover:bg-white/20" : "text-slate-400 dark:text-[#C4C7C5] opacity-50 cursor-not-allowed"}`}
                                >
                                  {sendButtonIcon === 'arrow' ? (
                                    <ArrowRight className="w-5 h-5" />
                                  ) : sendButtonIcon === 'rocket' ? (
                                    <Rocket className="w-5 h-5 ml-0.5" />
                                  ) : (
                                    <Send className="w-5 h-5 ml-0.5" />
                                  )}
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>


                    </div>
                  </div>
                </div>
              </motion.div>
          </motion.div>
          

          <LiveVoiceOverlay
            isOpen={isVoiceOverlayOpen}
            userVolume={userVolume}
            onClose={() => {
              setIsVoiceOverlayOpen(false);
              stopLiveSession();
            }}
            onHold={() => {
              // Pause/Hold logic can be added here if needed
              setIsVoiceOverlayOpen(false);
              stopLiveSession();
            }}
          />

          <AnimatePresence>
            {isAttachmentMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAttachmentMenuOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998]"
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 z-[999] attachment-menu-container rounded-t-3xl bg-white dark:bg-[#1E1F20] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border-t border-slate-200 dark:border-white/10"
                  style={{ paddingBottom: 'clamp(24px, env(safe-area-inset-bottom), 48px)' }}
                >
                  <div className="flex flex-col p-4 sm:p-6 gap-4">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/20 rounded-full mx-auto mb-2" />

                    <button
                      onClick={() => handleAttachmentOptionSelect('gallery')}
                      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 active:bg-slate-200 dark:active:bg-white/10 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-base font-semibold text-slate-900 dark:text-white">Gallery</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">Photos and videos</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAttachmentOptionSelect('files')}
                      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 active:bg-slate-200 dark:active:bg-white/10 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-base font-semibold text-slate-900 dark:text-white">File Manager</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">Documents and other files</span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      );
    },
  ),
);
