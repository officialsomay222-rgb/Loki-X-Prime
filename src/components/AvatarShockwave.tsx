import React, { useEffect, useRef } from 'react';

interface AvatarShockwaveProps {
  isActive: boolean;
}

class Wave {
  phase: number;
  offset: number;
  frequency: number;
  amplitude: number;

  constructor(phase: number, offset: number, frequency: number, amplitude: number) {
    this.phase = phase;
    this.offset = offset;
    this.frequency = frequency;
    this.amplitude = amplitude;
  }

  update() {
    this.phase += this.frequency;
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number, centerY: number) {
    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let x = 0; x < width; x++) {
      const y = Math.sin((x / width) * Math.PI * 2 + this.phase) * this.amplitude + centerY + this.offset;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  }
}

class CircularWave {
  radius: number;
  phase: number;
  frequency: number;
  amplitude: number;
  colorStops: string[];

  constructor(radius: number, phase: number, frequency: number, amplitude: number, colorStops: string[]) {
    this.radius = radius;
    this.phase = phase;
    this.frequency = frequency;
    this.amplitude = amplitude;
    this.colorStops = colorStops;
  }

  update() {
    this.phase += this.frequency;
  }

  draw(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, intensity: number) {
    ctx.beginPath();

    const points = 100;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;

      // Complex wave composition for organic look
      const wave1 = Math.sin(angle * 3 + this.phase);
      const wave2 = Math.cos(angle * 5 - this.phase * 1.2);
      const wave3 = Math.sin(angle * 2 + this.phase * 0.8);

      const displacement = (wave1 + wave2 * 0.5 + wave3 * 0.25) * this.amplitude * intensity;
      const currentRadius = this.radius + displacement;

      const x = centerX + Math.cos(angle) * currentRadius;
      const y = centerY + Math.sin(angle) * currentRadius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();

    // Create dynamic gradient
    const gradient = ctx.createLinearGradient(
      centerX - this.radius,
      centerY - this.radius,
      centerX + this.radius,
      centerY + this.radius
    );

    gradient.addColorStop(0, this.colorStops[0]);
    gradient.addColorStop(0.5, this.colorStops[1]);
    gradient.addColorStop(1, this.colorStops[2]);

    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

export const AvatarShockwave: React.FC<AvatarShockwaveProps> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intensityRef = useRef(0);
  const expansionRef = useRef(0); // Add a ref for tracking the outwards expansion on exit
  const isActiveRef = useRef(isActive);
  const animationRef = useRef<number | undefined>(undefined);

  // Sync prop to ref
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Size the canvas backing store
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Normalize coordinate system to use css pixels
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const baseRadius = Math.min(width, height) * 0.35;

    // Vibrant colors: Red, Yellow, Green, Blue
    const waves = [
      new CircularWave(baseRadius * 1.1, 0, 0.02, 10, ['rgba(255, 0, 0, 0.4)', 'rgba(255, 255, 0, 0.4)', 'rgba(0, 255, 0, 0.4)']), // Red -> Yellow -> Green
      new CircularWave(baseRadius * 0.9, Math.PI / 2, 0.03, 15, ['rgba(255, 255, 0, 0.4)', 'rgba(0, 255, 0, 0.4)', 'rgba(0, 0, 255, 0.4)']), // Yellow -> Green -> Blue
      new CircularWave(baseRadius * 1.2, Math.PI, 0.015, 8, ['rgba(0, 255, 0, 0.3)', 'rgba(0, 0, 255, 0.3)', 'rgba(255, 0, 0, 0.3)']), // Green -> Blue -> Red
      new CircularWave(baseRadius * 1.0, Math.PI * 1.5, 0.025, 12, ['rgba(0, 0, 255, 0.5)', 'rgba(255, 0, 0, 0.5)', 'rgba(255, 255, 0, 0.5)']) // Blue -> Red -> Yellow
    ];

    let lastTime = performance.now();

    const render = (time: number) => {
      // Delta time for smooth animation regardless of frame rate (optional, but good practice)
      const dt = time - lastTime;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Smoothly interpolate intensity
      const targetIntensity = isActiveRef.current ? 1 : 0;
      intensityRef.current += (targetIntensity - intensityRef.current) * 0.1;

      // Handle the expansion on exit
      if (!isActiveRef.current && intensityRef.current > 0) {
        // Expand outwards when released
        expansionRef.current += 1.5;
      } else if (isActiveRef.current) {
        // Smoothly retract to normal radius when active
        expansionRef.current += (0 - expansionRef.current) * 0.1;
      }

      // Only draw if there's some intensity to show, saving CPU
      if (intensityRef.current > 0.01) {
        // Apply global glow/blend
        ctx.globalCompositeOperation = 'screen';

        // Map intensity to global alpha for a smooth fade out
        ctx.globalAlpha = intensityRef.current;

        // Draw waves
        waves.forEach(wave => {
          wave.update();
          // Temporarily store the original radius to apply the expansion offset safely
          const originalRadius = wave.radius;
          wave.radius = originalRadius + expansionRef.current;

          wave.draw(ctx, centerX, centerY, intensityRef.current);

          // Restore the radius
          wave.radius = originalRadius;
        });

        // Reset state
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    // Resize handler
    const handleResize = () => {
      const newRect = canvas.getBoundingClientRect();
      canvas.width = newRect.width * dpr;
      canvas.height = newRect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array so initialization happens only once

  return (
    <div className="absolute -inset-8 z-[0] pointer-events-none" style={{ filter: 'blur(12px)' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
};
