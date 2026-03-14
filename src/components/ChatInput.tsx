import React, { useState, useRef, useEffect, memo, forwardRef } from 'react';
import { Plus, Mic, Send, Loader2, Trash2, Square, Image as ImageIcon, MessageSquare, Square as StopSquare } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useGlobalInteraction } from '../contexts/GlobalInteractionContext';
import { motion } from 'framer-motion';

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
  const [micError, setMicError] = useState<string | null>(null);
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

  const { playChirp, playBlip } = useGlobalInteraction();

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
    setInput('');
    playChirp();
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser or environment.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        } 
      });
      
      // 1. Setup MediaRecorder for capturing the actual audio file
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      // 2. Setup Web Speech API for live transcription and silence detection (if available)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      let recognition: any = null;
      let silenceTimer: NodeJS.Timeout | null = null;
      let finalTranscript = '';
      let isSpeechRecognitionActive = false;

      let isFinishing = false;

      const finishRecording = async (textFromSpeechAPI: string) => {
        if (isFinishing) return;
        isFinishing = true;

        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          // The actual sending and cleanup will happen in mediaRecorder.onstop
        }
      };

      mediaRecorder.onstop = () => {
        // Wait a tiny bit to ensure we have the latest text
        setTimeout(async () => {
          if (!hasSpokenRef.current && !finalTranscript && !input.trim()) {
            setIsRecording(false);
            stopRecording();
            return;
          }

          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          const textToSend = finalTranscript.trim() || input.trim();
          
          if (textToSend) {
            // We have the text from Web Speech API or input, send immediately!
            setInput('');
            playBlip();
            onSendMessage(textToSend, isImageMode, audioUrl);
          } else {
            // Fallback: Transcribe using backend API if Web Speech API failed or wasn't available
            setIsTranscribing(true);
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              const base64data = (reader.result as string).split(',')[1];
              try {
                const response = await fetch('/api/transcribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ audioBase64: base64data, mimeType })
                });
                
                if (response.ok) {
                  const data = await response.json();
                  const text = data.text?.trim() || '';
                  
                  if (text) {
                    playBlip();
                    onSendMessage(text, isImageMode, audioUrl);
                  } else {
                    console.log("Empty transcription result");
                  }
                }
              } catch (error) {
                console.error("Error transcribing audio:", error);
              } finally {
                setIsTranscribing(false);
              }
            };
          }
          
          // Cleanup after sending/processing
          stopRecording();
        }, 500);
      };

      if (SpeechRecognition) {
        try {
          recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-IN'; // Optimized for Indian English / Hinglish
          
          recognition.onstart = () => {
            isSpeechRecognitionActive = true;
            setAudioVolume(0.5);
          };
          
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
              setInput(currentText); // Show live text!
              hasSpokenRef.current = true;
              setAudioVolume(0.8 + Math.random() * 0.2);
              
              if (silenceTimer) clearTimeout(silenceTimer);
              silenceTimer = setTimeout(() => {
                recognition.stop();
              }, 2500); // 2.5s silence detection
            }
          };
          
          recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            isSpeechRecognitionActive = false;
          };
          
          recognition.onend = () => {
            if (silenceTimer) clearTimeout(silenceTimer);
            // We don't check isRecording here because it might be stale from the closure
            // finishRecording has its own isFinishing check to prevent double calls
            finishRecording(finalTranscript);
          };

          (window as any).currentRecognition = recognition;
          recognition.start();

          // Fallback timer if they don't speak at all
          silenceTimer = setTimeout(() => {
            // We don't check isRecording here either
            recognition.stop();
          }, 5000);
          
        } catch (err) {
          console.error("SpeechRecognition failed:", err);
          isSpeechRecognitionActive = false;
        }
      }

      mediaRecorder.start();
      setIsRecording(true);
      hasSpokenRef.current = false;

      // 3. Fallback Silence Detection (RMS) if SpeechRecognition isn't active
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
        
        if (!isSpeechRecognitionActive) {
          setAudioVolume(Math.min(1, rms * 10));
          const silenceThreshold = 0.015;

          if (rms < silenceThreshold) { 
            if (silenceStartRef.current === null) {
              silenceStartRef.current = Date.now();
            } else if (Date.now() - silenceStartRef.current > 2500) {
              finishRecording('');
              return;
            }
          } else {
            hasSpokenRef.current = true;
            silenceStartRef.current = null; 
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
    if ((window as any).currentRecognition) {
      (window as any).currentRecognition.stop();
      (window as any).currentRecognition = null;
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

  return (
    <div className="w-full pt-1 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))] px-3 sm:px-6 bg-transparent">
      <motion.div 
        className="max-w-4xl mx-auto relative rounded-[1.2rem] sm:rounded-[1.5rem]"
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
        
        {isAwakened ? (
          /* AWAKENED MODE TEXTPAD - 10X ADVANCED */
          <div className="relative flex flex-col gap-1.5 sm:gap-2 rounded-[1.2rem] sm:rounded-[1.5rem] p-1.5 sm:p-2 bg-gradient-to-br from-[#0a0a12]/80 to-[#050508]/90 border border-cyan-500/20 backdrop-blur-2xl focus-within:bg-[#0a0a12]/95 focus-within:border-cyan-400/40 focus-within:shadow-[0_0_20px_rgba(0,242,255,0.08)] transition-all duration-500 group">
            
            {/* Background effects container (handles overflow for animations) */}
            <div className="absolute inset-0 overflow-hidden rounded-[1.2rem] sm:rounded-[1.5rem] pointer-events-none">
              {/* Scanning Line Animation */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[200%] -translate-y-full group-focus-within:animate-[scanline_4s_linear_infinite]"></div>
            </div>

            {/* Tech Corner Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400/30 rounded-tl-[1.2rem] sm:rounded-tl-[1.5rem] opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-400/30 rounded-tr-[1.2rem] sm:rounded-tr-[1.5rem] opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-400/30 rounded-bl-[1.2rem] sm:rounded-bl-[1.5rem] opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/30 rounded-br-[1.2rem] sm:rounded-br-[1.5rem] opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            {/* Premium Gemini RGB Gradient Border Layer */}
            <motion.div 
              className="absolute inset-0 rounded-[1.2rem] sm:rounded-[1.5rem] pointer-events-none z-0"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: isFocused ? 1 : 0,
              }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,#4285F4,#DB4437,#F4B400,#0F9D58,#4285F4)]"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                style={{
                  filter: 'blur(8px)',
                }}
              />
              {/* Mask to create the 2px border effect */}
              <div 
                className="absolute inset-0 rounded-[1.2rem] sm:rounded-[1.5rem] bg-transparent border-[2px] border-transparent"
                style={{
                  maskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  background: 'inherit'
                }}
              />
            </motion.div>

            {/* Pulsing Glow Effect */}
            <motion.div
              className="absolute inset-0 rounded-[1.2rem] sm:rounded-[1.5rem] pointer-events-none z-0"
              animate={{ 
                boxShadow: isFocused 
                  ? [
                      '0 0 10px rgba(66, 133, 244, 0.1)',
                      '0 0 25px rgba(66, 133, 244, 0.2)',
                      '0 0 10px rgba(66, 133, 244, 0.1)'
                    ] 
                  : '0 0 0px rgba(0,0,0,0)'
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isTranscribing ? "Transcribing..." : isRecording ? "Listening..." : isImageMode ? "Describe the image for LOKI..." : "Ask LOKI..."}
              className="w-full max-h-[120px] sm:max-h-[150px] min-h-[40px] sm:min-h-[50px] bg-gray-950/90 border-0 focus:ring-0 focus:outline-none resize-none px-3 sm:px-4 py-2.5 sm:py-3.5 text-[1rem] sm:text-[1.1rem] text-cyan-50 placeholder:text-cyan-600/50 custom-scrollbar leading-relaxed font-mono tracking-wide relative z-10 caret-[#4285F4] rounded-[1.1rem] sm:rounded-[1.4rem]"
              rows={1}
              disabled={isLoading || isRecording || isTranscribing}
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
          </div>
        ) : (
          /* NORMAL MODE TEXTPAD - CLEAN & SIMPLE */
          <div className="relative flex flex-col gap-2 sm:gap-3 glass-panel premium-shadow rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 input-container-focus border border-slate-200/50 dark:border-white/10">
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
              disabled={isLoading || isRecording || isTranscribing}
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
          </div>
        )}
      </motion.div>
    </div>
  );
}));
