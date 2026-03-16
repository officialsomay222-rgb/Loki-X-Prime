import React, { useState, useRef, useEffect, memo, forwardRef } from 'react';
import { Plus, Mic, Send, Loader2, Trash2, Square, Image as ImageIcon, MessageSquare, Square as StopSquare, Radio } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useGlobalInteraction } from '../contexts/GlobalInteractionContext';
import { transcribeAudio, connectLiveSession } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  isAwakened: boolean;
  isLoading: boolean;
  modelMode: string;
  setModelMode: (mode: string) => void;
  onSendMessage: (text: string, isImageMode?: boolean, audioUrl?: string) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  currentSessionId: string | null;
  onStopGeneration?: () => void;
  enterToSend: boolean;
  input: string;
  setInput: (value: string) => void;
}

export const ChatInput = memo(forwardRef<HTMLTextAreaElement, ChatInputProps>(({
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
  setInput
}, ref) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = (ref as React.MutableRefObject<HTMLTextAreaElement>) || internalRef;
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasSpokenRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  const { 
    playChirp, 
    playBlip,
    playNotification 
  } = useGlobalInteraction();

  const { liveAudioEnabled, systemInstruction } = useSettings();
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
  const liveSessionRef = useRef<any>(null);
  const audioOutRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isModelDropdownOpen && !(e.target as Element).closest('.model-dropdown-container')) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModelDropdownOpen]);

  const autoResizeInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
      // Show scrollbar only if content exceeds roughly 2 lines (approx 72px)
      inputRef.current.style.overflowY = scrollHeight > 80 ? 'auto' : 'hidden';
    }
  };

  useEffect(() => {
    autoResizeInput();
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (enterToSend && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // If enterToSend is false, or if shift+enter is pressed, it naturally adds a new line
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim(), isImageMode);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const startRecording = async () => {
    setMicError(null);
    setTranscriptionError(null);
    setInput('');
    playChirp();
    
    let stream: MediaStream;
    let mediaRecorder: MediaRecorder;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser or environment.");
      }
      if (!window.MediaRecorder) {
        throw new Error("Audio recording is not supported in this browser.");
      }
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1
          } 
        });
      } catch (advancedErr) {
        console.warn("Advanced audio constraints failed, falling back to basic audio", advancedErr);
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
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      let finalTranscript = '';
      let isFinishing = false;

      const finishRecording = async () => {
        if (isFinishing) return;
        isFinishing = true;

        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }

        if (mediaRecorder.state === 'recording') {
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

          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          setIsTranscribing(true);
          const currentInput = input.trim();
          setInput(''); 
          
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = (reader.result as string).split(',')[1];
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
          recognition.lang = 'en-IN'; // Optimized for Hinglish
          
          recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }
            
            const currentText = (finalTranscript + interimTranscript).trim();
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
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
        if (mediaRecorder.state !== 'recording') return;
        
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
      if (err.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
        setMicError("Microphone access denied. Please click the microphone icon in your browser's address bar to allow access, then refresh this page.");
      } else {
        setMicError("Could not access the microphone. Please ensure a microphone is connected and refresh the page.");
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
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
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
      setMicError("Microphone access is not supported by your browser or is blocked by security policies.");
      return;
    }
    
    try {
      playNotification();
      setIsLiveSessionActive(true);
      
      const session = await connectLiveSession({
        onopen: () => {
          console.log("Live session opened");
        },
        onmessage: async (message) => {
          if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
            const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
            const audioData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
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
        }
      }, systemInstruction);
      
      liveSessionRef.current = session;

      // Setup microphone streaming for Live API
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        session.sendRealtimeInput({
          media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
        });
      };

    } catch (err: any) {
      console.error("Failed to start live session:", err);
      if (err.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
        setMicError("Microphone access denied. Please click the microphone icon in your browser's address bar to allow access, then refresh this page.");
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
        className="max-w-4xl mx-auto relative rounded-[1.75rem]"
        animate={{ 
          scale: isRecording ? 1.02 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {micError && (
          <div className="absolute -top-16 left-0 right-0 mx-auto w-fit px-4 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm rounded-lg backdrop-blur-md shadow-lg flex flex-col items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 z-50">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {micError}
            </div>
            {micError.includes('denied') && (
              <button 
                onClick={() => window.open(window.location.href, '_blank')}
                className="mt-1 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-md transition-colors flex items-center gap-2 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                Open App in New Tab to Fix
              </button>
            )}
          </div>
        )}
        {transcriptionError && (
          <div className="absolute -top-16 left-0 right-0 mx-auto w-fit px-4 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm rounded-lg backdrop-blur-md shadow-lg flex flex-col items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 z-50">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {transcriptionError}
            </div>
          </div>
        )}
        
        {isAwakened ? (
          /* AWAKENED MODE TEXTPAD - 10X ADVANCED */
          <motion.div 
            className={`textpad-container relative flex flex-col gap-1.5 sm:gap-2 p-2 sm:p-3 transition-all duration-500 group ${
              isSuccessFlash ? 'success-flash shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 
              isRecording ? 'shadow-[0_0_20px_rgba(244,63,94,0.2)] animate-pulse' : 
              ''
            }`}
            animate={{ "--border-angle": ["0deg", "360deg"] } as any}
            transition={{ duration: 12, ease: "linear", repeat: Infinity }}
          >
            
            {/* Background effects container (handles overflow for animations) */}
            <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] pointer-events-none">
              {/* Scanning Line Animation */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[200%] -translate-y-full group-focus-within:animate-[scanline_4s_linear_infinite]"></div>
              {isRecording && (
                <div className="absolute inset-0 bg-rose-500/5 animate-pulse"></div>
              )}
            </div>

            {/* Tech Corner Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400/30 rounded-tl-[1.75rem] opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-400/30 rounded-tr-[1.75rem] opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-400/30 rounded-bl-[1.75rem] opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/30 rounded-br-[1.75rem] opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isTranscribing ? "Transcribing..." : isRecording ? "Listening..." : isImageMode ? "Describe the image for LOKI..." : "Ask LOKI..."}
              className="w-full max-h-[120px] sm:max-h-[150px] min-h-[40px] sm:min-h-[50px] bg-transparent border-0 focus:ring-0 focus:outline-none resize-none px-3 sm:px-4 py-2.5 sm:py-3.5 text-[1rem] sm:text-[1.1rem] text-cyan-50 placeholder:text-cyan-600/50 custom-scrollbar leading-relaxed font-mono tracking-wide relative z-10 caret-[#4285F4] rounded-[1.1rem] sm:rounded-[1.4rem]"
              rows={1}
              readOnly={isRecording || isTranscribing}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center w-full px-1 relative z-10">
              <div className="flex items-center gap-1 sm:gap-1.5">
                  <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-cyan-600/70 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all border border-transparent hover:border-cyan-500/30">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button 
                    onClick={() => setIsImageMode(!isImageMode)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all border ${isImageMode ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(0,242,255,0.2)]' : 'text-cyan-600/70 hover:bg-cyan-500/10 hover:text-cyan-400 border-transparent hover:border-cyan-500/30'}`}
                    title={isImageMode ? "Switch to Chat Mode" : "Switch to Image Generation Mode"}
                  >
                    {isImageMode ? <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="relative model-dropdown-container">
                    <button 
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="flex items-center gap-1 sm:gap-1 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[0.6rem] sm:text-[0.75rem] font-bold tracking-[0.1em] transition-all whitespace-nowrap h-7 sm:h-8 border border-cyan-500/30 shadow-[0_0_8px_rgba(0,242,255,0.08)] hover:shadow-[0_0_12px_rgba(0,242,255,0.15)] uppercase"
                    >
                      {modelMode === 'pro' ? 'PRO THINKING' : modelMode === 'fast' ? 'FAST CORE' : 'HAPPY MODEL'}
                    </button>
                    {isModelDropdownOpen && (
                      <div className="absolute bottom-[calc(100%+8px)] sm:bottom-[calc(100%+12px)] right-0 bg-[#050508] border border-cyan-500/40 rounded-lg sm:rounded-xl p-1 sm:p-1.5 min-w-[130px] sm:min-w-[160px] z-[999] flex flex-col gap-0.5 animate-in slide-in-from-bottom-2 duration-200 shadow-[0_0_25px_rgba(0,242,255,0.25)]">
                        {[
                          { id: 'pro', label: 'PRO THINKING' },
                          { id: 'fast', label: 'FAST CORE' },
                          { id: 'happy', label: 'HAPPY MODEL' }
                        ].map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setModelMode(m.id); setIsModelDropdownOpen(false); }}
                            className={`text-left px-2.5 sm:px-3 py-1.5 sm:py-2 text-[0.65rem] sm:text-[0.75rem] font-bold tracking-wider rounded-md sm:rounded-lg transition-all uppercase ${modelMode === m.id ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 shadow-[inset_0_0_8px_rgba(0,242,255,0.15)]' : 'text-cyan-700 hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent'}`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Mic button hides when typing */}
                  <div className="flex items-center gap-1.5">
                    {liveAudioEnabled && (
                      <button
                        onClick={isLiveSessionActive ? stopLiveSession : startLiveSession}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all border ${isLiveSessionActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse' : 'text-cyan-600/70 hover:bg-cyan-500/10 hover:text-cyan-400 border-transparent hover:border-cyan-500/30'}`}
                        title={isLiveSessionActive ? "Stop Live Session" : "Start Live Session"}
                      >
                        <Radio className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLiveSessionActive ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    {isRecording && (
                      <div className="flex items-center gap-[2px] h-4 mr-2">
                        {[1, 2, 3, 4].map(i => (
                          <motion.div
                            key={i}
                            animate={{ height: [4, 4 + audioVolume * 12 * (i % 2 === 0 ? 1 : 0.7), 4] }}
                            transition={{ duration: 0.2, repeat: Infinity }}
                            className="w-[2px] bg-rose-500 rounded-full"
                          />
                        ))}
                      </div>
                    )}
                    <button 
                      onClick={toggleRecording}
                      disabled={isTranscribing}
                      style={{
                        boxShadow: isRecording ? `0 0 ${10 + audioVolume * 40}px rgba(244,63,94,${0.3 + audioVolume * 0.5})` : undefined,
                        transform: isRecording ? `scale(${1 + audioVolume * 0.15})` : undefined
                      }}
                      className={`mic-button-trigger w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all border overflow-hidden ${input.length > 0 ? 'w-0 opacity-0 scale-50 pointer-events-none p-0 m-0 border-0' : 'opacity-100'} ${isRecording ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'text-cyan-600/70 hover:bg-cyan-500/10 hover:text-cyan-400 border-transparent hover:border-cyan-500/30'}`}
                    >
                      {isTranscribing ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : isRecording ? <StopSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </button>
                  </div>
                  
                  {isLoading ? (
                    <button
                      onClick={onStopGeneration}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.4)] border border-rose-400/50 group"
                    >
                      <div className="absolute inset-0 bg-rose-400/20 animate-pulse group-hover:animate-none"></div>
                      <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 relative z-10 drop-shadow-[0_0_4px_rgba(244,63,94,1)] fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
                        input.trim()
                          ? 'bg-cyan-500/20 text-[#00f2ff] hover:bg-cyan-500/40 shadow-[0_0_15px_rgba(0,242,255,0.4)] border border-cyan-400/50 group'
                          : 'bg-white/5 text-[#6b6b80] opacity-50 border border-white/5'
                      }`}
                    >
                      {input.trim() && (
                        <div className="absolute inset-0 bg-cyan-400/20 animate-pulse group-hover:animate-none"></div>
                      )}
                      <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-0.5 relative z-10 drop-shadow-[0_0_4px_rgba(0,242,255,1)]" />
                    </button>
                  )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* NORMAL MODE TEXTPAD - CLEAN & SIMPLE */
          <motion.div 
            className={`textpad-container relative flex flex-col gap-2 sm:gap-3 p-4 sm:p-5 transition-all duration-500 ${
              isSuccessFlash ? 'shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 
              isRecording ? 'shadow-[0_0_20px_rgba(6,182,212,0.5)] animate-pulse' : 
              ''
            }`}
            animate={{ "--border-angle": ["0deg", "360deg"] } as any}
            transition={{ duration: 12, ease: "linear", repeat: Infinity }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isTranscribing ? "Transcribing..." : isRecording ? "Listening..." : isImageMode ? "Describe the image for LOKI..." : "Ask LOKI..."}
              className="w-full max-h-[200px] sm:max-h-[250px] min-h-[50px] sm:min-h-[60px] bg-transparent border-0 focus:ring-0 focus:outline-none resize-none px-3 sm:px-4 py-3 sm:py-4 text-[1.05rem] sm:text-[1.2rem] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#6b6b80] custom-scrollbar leading-relaxed font-medium"
              rows={1}
              readOnly={isRecording || isTranscribing}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center w-full px-2">
              <div className="flex items-center gap-2 sm:gap-3">
                  <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-400 dark:text-[#888] hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-all">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button 
                    onClick={() => setIsImageMode(!isImageMode)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${isImageMode ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-[#888] hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white'}`}
                    title={isImageMode ? "Switch to Chat Mode" : "Switch to Image Generation Mode"}
                  >
                    {isImageMode ? <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative model-dropdown-container">
                    <button 
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="flex items-center gap-1.5 sm:gap-2 bg-slate-100/80 dark:bg-black/40 hover:bg-slate-200 dark:hover:bg-black/60 text-cyan-600 dark:text-[#00f2ff] px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-[0.65rem] sm:text-[0.8rem] font-bold tracking-wide transition-all whitespace-nowrap h-8 sm:h-10 border border-slate-200/50 dark:border-white/5"
                    >
                      {modelMode === 'pro' ? 'PRO THINKING' : modelMode === 'fast' ? 'FAST MODEL' : 'HAPPY MODEL'}
                    </button>
                    {isModelDropdownOpen && (
                      <div className="absolute bottom-[calc(100%+10px)] sm:bottom-[calc(100%+14px)] right-0 bg-white dark:bg-[#050508] border border-slate-200 dark:border-cyan-500/40 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 min-w-[140px] sm:min-w-[180px] z-[999] flex flex-col gap-1 animate-in slide-in-from-bottom-2 duration-200 shadow-xl dark:shadow-[0_0_25px_rgba(0,242,255,0.15)]">
                        {[
                          { id: 'pro', label: 'PRO THINKING' },
                          { id: 'fast', label: 'Fast Model' },
                          { id: 'happy', label: 'Happy Model' }
                        ].map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setModelMode(m.id); setIsModelDropdownOpen(false); }}
                            className={`text-left px-3 sm:px-4 py-2 sm:py-2.5 text-[0.7rem] sm:text-[0.8rem] font-semibold rounded-lg sm:rounded-xl transition-all ${modelMode === m.id ? 'text-cyan-700 dark:text-[#00f2ff] bg-cyan-50 dark:bg-cyan-500/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Mic button hides when typing */}
                  <div className="flex items-center gap-2">
                    {liveAudioEnabled && (
                      <button
                        onClick={isLiveSessionActive ? stopLiveSession : startLiveSession}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all border ${isLiveSessionActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse' : 'text-slate-400 dark:text-[#888] hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white border-transparent'}`}
                        title={isLiveSessionActive ? "Stop Live Session" : "Start Live Session"}
                      >
                        <Radio className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiveSessionActive ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    {isRecording && (
                      <div className="flex items-center gap-[2px] h-4 mr-2">
                        {[1, 2, 3, 4].map(i => (
                          <motion.div
                            key={i}
                            animate={{ height: [4, 4 + audioVolume * 12 * (i % 2 === 0 ? 1 : 0.7), 4] }}
                            transition={{ duration: 0.2, repeat: Infinity }}
                            className="w-[2px] bg-rose-500 rounded-full"
                          />
                        ))}
                      </div>
                    )}
                    <button 
                      onClick={toggleRecording}
                      disabled={isTranscribing}
                      style={{
                        boxShadow: isRecording ? `0 0 ${10 + audioVolume * 30}px rgba(244,63,94,${0.2 + audioVolume * 0.4})` : undefined,
                        transform: isRecording ? `scale(${1 + audioVolume * 0.1})` : undefined
                      }}
                      className={`mic-button-trigger w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all overflow-hidden ${input.length > 0 ? 'w-0 opacity-0 scale-50 pointer-events-none p-0 m-0' : 'opacity-100'} ${isRecording ? 'bg-rose-500/20 text-rose-500' : 'text-slate-400 dark:text-[#888] hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white'}`}
                    >
                      {isTranscribing ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : isRecording ? <StopSquare className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  
                  {isLoading ? (
                    <button
                      onClick={onStopGeneration}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-rose-100 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/40 border border-rose-200 dark:border-rose-400/50"
                    >
                      <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        input.trim()
                          ? 'bg-cyan-600 dark:bg-cyan-500/20 text-white dark:text-[#00f2ff] hover:bg-cyan-500 dark:hover:bg-cyan-500/30 shadow-[0_0_12px_rgba(0,242,255,0.3)] dark:border dark:border-cyan-400/30'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-[#6b6b80] opacity-50'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
                    </button>
                  )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}));
