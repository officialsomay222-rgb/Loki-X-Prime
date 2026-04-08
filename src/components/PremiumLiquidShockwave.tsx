import React, { useRef, useEffect } from 'react';

// A God-Level Fluid Aura Particle System
class Particle {
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

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.angle = Math.random() * Math.PI * 2;
    // Explode outward fast initially, then slow down
    this.speed = Math.random() * 8 + 2;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.radius = Math.random() * 15 + 5;
    this.color = color;
    this.maxLife = Math.random() * 60 + 40; // frames
    this.life = this.maxLife;
  }

  update(progress: number) {
    // Add swirl/fluid motion
    const swirlForce = 0.05;
    const tangentX = -this.vy * swirlForce;
    const tangentY = this.vx * swirlForce;

    this.vx += tangentX;
    this.vy += tangentY;

    // Fluid drag
    this.vx *= 0.96;
    this.vy *= 0.96;

    this.x += this.vx * (1 + progress * 2);
    this.y += this.vy * (1 + progress * 2);

    this.life--;
    this.radius *= 0.98; // shrink over time
  }

  draw(ctx: CanvasRenderingContext2D, globalAlpha: number) {
    if (this.life <= 0 || this.radius <= 0.1) return;

    const alpha = (this.life / this.maxLife) * globalAlpha;

    ctx.beginPath();
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius
    );
    gradient.addColorStop(0, `${this.color}${alpha * 0.8})`);
    gradient.addColorStop(0.5, `${this.color}${alpha * 0.4})`);
    gradient.addColorStop(1, `${this.color}0)`);

    ctx.fillStyle = gradient;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const PremiumLiquidShockwave: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Use full screen sizing dynamically
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

    // Premium Gemini/Cosmic inspired palette
    const colors = [
      'rgba(0, 242, 255, ',   // Cyan (Gemini Core)
      'rgba(66, 133, 244, ',  // Google Blue
      'rgba(189, 0, 255, ',   // Deep Purple
      'rgba(255, 0, 127, ',   // Magenta
      'rgba(141, 198, 255, '  // Bright Liquid Blue
    ];

    const duration = 5000; // 5 seconds of continuous liquid god-level flow

    // Continuous flow parameters
    let frameCount = 0;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Strict clear rect for zero alpha trailing/artifacting
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // Silky smooth easing (easeOutQuart)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      // Fluid expanding base that scales with screen size
      const maxRadius = Math.max(window.innerWidth, window.innerHeight) * 1.2;

      // Smooth fade out in the last 20%
      let globalAlpha = 1;
      if (progress > 0.8) {
        globalAlpha = 1 - ((progress - 0.8) / 0.2);
      }

      ctx.globalCompositeOperation = 'lighter';

      // 1. Massive continuous liquid aura base
      const currentRadius = 50 + (easeOutQuart * maxRadius);

      if (currentRadius > 0 && globalAlpha > 0) {
        // Multi-layered god-tier gradient
        const auraGradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, currentRadius
        );

        // Fluid color shifting based on frameCount and progress
        const timeOffset = Math.sin(frameCount * 0.05);

        auraGradient.addColorStop(0, `rgba(0, 242, 255, ${globalAlpha * (0.4 + timeOffset * 0.1)})`); // Cyan center
        auraGradient.addColorStop(0.2, `rgba(189, 0, 255, ${globalAlpha * 0.3})`); // Purple mid
        auraGradient.addColorStop(0.5, `rgba(66, 133, 244, ${globalAlpha * 0.2})`); // Deep Blue outer
        auraGradient.addColorStop(0.8, `rgba(255, 0, 127, ${globalAlpha * 0.05})`); // Magenta edges
        auraGradient.addColorStop(1, `rgba(0, 0, 0, 0)`); // Transparent fade

        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = auraGradient;
        ctx.fill();
      }

      // 2. High-performance liquid particles (spawning continuous dense cluster)
      if (progress < 0.85) {
        const spawnCount = Math.floor(Math.random() * 4) + 6; // Dense spawn rate
        for (let i = 0; i < spawnCount; i++) {
          const color = colors[Math.floor(Math.random() * colors.length)];
          // Spawn tightly around center to explode outward
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 30; // Tight cluster
          particlesRef.current.push(new Particle(centerX + Math.cos(angle)*dist, centerY + Math.sin(angle)*dist, color));
        }
      }

      // Update and render particles
      particlesRef.current.forEach((p) => {
        p.update(progress);
        p.draw(ctx, globalAlpha);
      });

      // Purge dead particles instantly for performance
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // 3. Intense energy core at the center, always behind avatar
      ctx.globalCompositeOperation = 'screen';
      const coreSize = 60 + Math.sin(frameCount * 0.1) * 10; // Pulsating core
      const coreGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, coreSize
      );
      coreGradient.addColorStop(0, `rgba(255, 255, 255, ${globalAlpha})`);
      coreGradient.addColorStop(0.3, `rgba(0, 242, 255, ${globalAlpha * 0.8})`);
      coreGradient.addColorStop(1, `rgba(0, 242, 255, 0)`);

      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      frameCount++;

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[998] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{
          transform: 'translateZ(0)',
          willChange: 'transform, opacity'
        }} // Force GPU acceleration, zero lag
      />
    </div>
  );
};
