import React, { useState, useRef, useEffect, useMemo } from "react";

export const AudioPlayer = ({
  url,
  autoPlay,
  onPlay,
}: {
  url: string;
  autoPlay?: boolean;
  onPlay?: () => void;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (autoPlay && audioRef.current && !isPlaying) {
      audioRef.current
        .play()
        .catch((e) => console.error("Auto-play failed", e));
      setIsPlaying(true);
      onPlay?.();
    }
  }, [autoPlay, url]);

  // Use a fixed seed for the waveform so it doesn't change on re-renders
  const bars = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => {
      const val = Math.sin(i * 0.5) * 30 + Math.cos(i * 0.2) * 20 + 50;
      return Math.max(20, Math.min(100, val));
    });
  }, [url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);

    return () => {
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 bg-black/40 dark:bg-black/60 rounded-lg p-2 pr-4 shadow-inner w-[260px] sm:w-[300px] border border-white/10 group/player">
      <button
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"} title={isPlaying ? "Pause" : "Play"}
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all active:scale-95 shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/30"
      >
        {isPlaying ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="6" y="4" width="4" height="16" rx="1"></rect>
            <rect x="14" y="4" width="4" height="16" rx="1"></rect>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-1"
          >
            <polygon
              points="5 3 19 12 5 21 5 3"
              strokeLinejoin="round"
            ></polygon>
          </svg>
        )}
      </button>

      <div
        className="flex-1 flex items-center justify-between h-8 gap-[2px] relative cursor-pointer"
        onClick={(e) => {
          if (!audioRef.current || !duration) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percentage = x / rect.width;
          audioRef.current.currentTime = percentage * duration;
        }}
      >
        {bars.map((height, i) => {
          const isPlayed = (i / bars.length) * 100 <= progressPercentage;
          return (
            <div
              key={i}
              className={`w-[3px] rounded-full transition-all duration-150 ${isPlaying ? "waveform-bar-playing" : ""} ${isPlayed ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" : "bg-white/20"}`}
              style={{
                height: `${height}%`,
                animationDelay: `${i * 0.05}s`,
                opacity: isPlaying && !isPlayed ? 0.6 : 1,
              }}
            />
          );
        })}
      </div>

      <div className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-300 tracking-wider shrink-0 w-10 text-right">
        {formatTime(currentTime > 0 ? currentTime : duration)}
      </div>

      <audio
        ref={audioRef}
        src={url}
        onPlay={() => {
          setIsPlaying(true);
          onPlay?.();
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
};
