import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, X, Sparkles } from 'lucide-react';

interface LiveVoiceOverlayProps {
  isOpen: boolean;
  userVolume?: number;
  onClose: () => void;
  onHold: () => void;
}

class VolumeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  angle: number;
  speed: number;
  life: number;
  maxLife: number;

  constructor(x: number, y: number, color: string, volumeScale: number) {
    this.x = x;
    this.y = y;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = (Math.random() * 8 + 2) * (1 + volumeScale);
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.radius = (Math.random() * 12 + 4) * (1 + volumeScale * 0.5);
    this.color = color;
    this.maxLife = Math.random() * 40 + 20;
    this.life = this.maxLife;
  }

  update() {
    this.vx *= 0.92;
    this.vy *= 0.92;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.radius *= 0.95;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life <= 0 || this.radius <= 0.1) return;
    const alpha = (this.life / this.maxLife);
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    gradient.addColorStop(0, `${this.color}${alpha * 0.8})`);
    gradient.addColorStop(1, `${this.color}0)`);
    ctx.fillStyle = gradient;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const LiveVoiceOverlay: React.FC<LiveVoiceOverlayProps> = ({ isOpen, userVolume = 0, onClose, onHold }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<VolumeParticle[]>([]);

  // Normalize volume: roughly 0-255 from analyser, mapping to 0-1 scale
  const normalizedVolume = Math.min(Math.max(userVolume / 128.0, 0), 1.5);
  const volumeRef = useRef(normalizedVolume);

  useEffect(() => {
    // Smooth out the volume over time to avoid jitter
    volumeRef.current = volumeRef.current * 0.8 + normalizedVolume * 0.2;
  }, [normalizedVolume]);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    const colors = [
      'rgba(255, 0, 0, ',     // Red
      'rgba(255, 255, 0, ',   // Yellow
      'rgba(0, 255, 0, ',     // Green
      'rgba(0, 0, 255, '      // Blue
    ];

    let frameCount = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2; // Center for the voice overlay

      const currentVolume = volumeRef.current;

      ctx.globalCompositeOperation = 'lighter';

      // 1. Dynamic Core Glow
      const coreRadius = 100 + currentVolume * 150 + Math.sin(frameCount * 0.1) * 10;
      if (coreRadius > 0) {
        const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);

        // Shift colors based on frame count
        const r = Math.sin(frameCount * 0.05) * 127 + 128;
        const g = Math.sin(frameCount * 0.05 + 2) * 127 + 128;
        const b = Math.sin(frameCount * 0.05 + 4) * 127 + 128;

        const alphaBase = 0.5 + currentVolume * 0.5;

        coreGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alphaBase})`);
        coreGradient.addColorStop(0.3, `rgba(0, 242, 255, ${alphaBase * 0.6})`); // Cyan mid
        coreGradient.addColorStop(0.8, `rgba(255, 0, 255, ${alphaBase * 0.2})`); // Purple outer
        coreGradient.addColorStop(1, `rgba(0, 0, 0, 0)`);

        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = coreGradient;
        ctx.fill();
      }

      // 2. Volume-driven Particles
      // Spawn particles relative to volume
      const spawnRate = Math.floor(currentVolume * 5) + 1;
      if (frameCount % 2 === 0) {
        for(let i=0; i<spawnRate; i++) {
          const color = colors[Math.floor(Math.random() * colors.length)];
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 30 + 20;
          particlesRef.current.push(new VolumeParticle(centerX + Math.cos(angle)*dist, centerY + Math.sin(angle)*dist, color, currentVolume));
        }
      }

      particlesRef.current.forEach(p => {
        p.update();
        p.draw(ctx);
      });

      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      frameCount++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
       window.removeEventListener('resize', updateSize);
       if (animationRef.current) {
         cancelAnimationFrame(animationRef.current);
       }
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-between pb-12 pt-8 overflow-hidden"
          style={{ paddingTop: 'calc(2rem + clamp(24px, env(safe-area-inset-top, 0px), 48px))', paddingBottom: 'calc(3rem + clamp(0px, env(safe-area-inset-bottom, 0px), 32px))' }}
        >
          {/* Canvas Background */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              transform: 'translateZ(0)',
              willChange: 'transform, opacity'
            }}
          />

          {/* Top Indicator */}
          <div className="relative z-10 flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md mt-4">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-white text-sm font-medium tracking-wide">Live</span>
          </div>

          {/* Bottom Controls */}
          <div className="relative z-10 flex items-center gap-12 mt-auto mb-8">
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onHold}
                aria-label="Hold call"
                title="Hold call"
                className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/5 active:scale-95 transition-transform"
              >
                <Pause className="w-8 h-8 text-white fill-white" />
              </button>
              <span className="text-white/70 text-sm font-medium">Hold</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onClose}
                aria-label="End call"
                title="End call"
                className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-[0_8px_30px_rgba(220,38,38,0.4)] active:scale-95 transition-transform"
              >
                <X className="w-8 h-8 text-white" />
              </button>
              <span className="text-white/70 text-sm font-medium">End</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
