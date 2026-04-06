import React, { useRef, useEffect } from 'react';

interface Orb {
  x: number;
  y: number;
  radius: number;
  color: string;
  angle: number;
  speed: number;
  distance: number;
}

export const PremiumLiquidShockwave: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Use a fixed virtual size for the canvas to keep performance high
    const dpr = window.devicePixelRatio || 1;
    const size = 600; // Will scale via CSS
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;

    // Gemini-inspired premium colors
    const colors = [
      'rgba(0, 242, 255, ',   // Cyan
      'rgba(66, 133, 244, ',  // Google Blue
      'rgba(189, 0, 255, ',   // Purple
      'rgba(255, 0, 127, '    // Magenta/Pink
    ];

    const orbs: Orb[] = colors.map((color, i) => ({
      x: centerX,
      y: centerY,
      radius: 50 + Math.random() * 50,
      color: color,
      angle: (i * Math.PI) / 2, // Distributed evenly
      speed: 0.02 + Math.random() * 0.02,
      distance: 20 + Math.random() * 30
    }));

    const duration = 3000; // 3 seconds total

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Easing functions
      // Smooth exponential expansion
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      // Smooth fade out at the end (start fading at 60% progress)
      let globalAlpha = 1;
      if (progress > 0.6) {
        globalAlpha = 1 - ((progress - 0.6) / 0.4);
      }

      const currentBaseRadius = 50 + (easeOutExpo * 350);

      // Use lighter composite operation for the glowing "liquid" blend effect
      // lighter is highly performant in canvas compared to CSS mix-blend-mode
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.max(0, globalAlpha);

      orbs.forEach(orb => {
        orb.angle += orb.speed;

        // Liquid wobble effect
        const wobbleX = Math.cos(orb.angle) * orb.distance * (1 + easeOutExpo * 2);
        const wobbleY = Math.sin(orb.angle) * orb.distance * (1 + easeOutExpo * 2);

        const currentX = centerX + wobbleX;
        const currentY = centerY + wobbleY;

        // Scale orb radius with the shockwave
        const currentRadius = currentBaseRadius * (orb.radius / 100);

        // Draw radial gradient for the orb
        if (currentRadius > 0) {
           const gradient = ctx.createRadialGradient(
             currentX, currentY, 0,
             currentX, currentY, currentRadius
           );

           // Intense center, soft edges
           gradient.addColorStop(0, `${orb.color}0.8)`);
           gradient.addColorStop(0.5, `${orb.color}0.4)`);
           gradient.addColorStop(1, `${orb.color}0)`);

           ctx.beginPath();
           ctx.arc(currentX, currentY, currentRadius, 0, Math.PI * 2);
           ctx.fillStyle = gradient;
           ctx.fill();
        }
      });

      // Add a pure white/cyan core flash that expands and fades fast
      if (progress < 0.4) {
        const coreAlpha = 1 - (progress / 0.4);
        const coreRadius = currentBaseRadius * 0.8;
        if (coreRadius > 0) {
           ctx.globalCompositeOperation = 'source-over';
           const coreGradient = ctx.createRadialGradient(
              centerX, centerY, 0,
              centerX, centerY, coreRadius
           );
           coreGradient.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha * 0.9})`);
           coreGradient.addColorStop(0.5, `rgba(0, 242, 255, ${coreAlpha * 0.5})`);
           coreGradient.addColorStop(1, `rgba(0, 242, 255, 0)`);

           ctx.beginPath();
           ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
           ctx.fillStyle = coreGradient;
           ctx.fill();
        }
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[-1]"
      style={{ width: '800px', height: '800px' }} // Large container for expansion
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ transform: 'translateZ(0)' }} // Force GPU acceleration on the canvas wrapper
      />
    </div>
  );
};
