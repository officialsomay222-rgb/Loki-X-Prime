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
      'rgba(0, 242, 255, ',   // Cyan
      'rgba(66, 133, 244, ',  // Google Blue
      'rgba(189, 0, 255, ',   // Purple
      'rgba(255, 0, 127, '    // Magenta/Pink
    ];

    const duration = 4000; // 4 seconds of epic god-level simulation

    // Continuous flow parameters
    let frameCount = 0;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Strict clear rect for no trailing alpha issues
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // Complex easing
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      let globalAlpha = 1;
      if (progress > 0.7) {
        globalAlpha = 1 - ((progress - 0.7) / 0.3);
      }

      ctx.globalCompositeOperation = 'lighter';

      // Emit new particles continuously for the first 70% of the animation
      if (progress < 0.7 && frameCount % 2 === 0) {
        for (let i = 0; i < 8; i++) {
          const color = colors[Math.floor(Math.random() * colors.length)];
          // Spawn near center
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 20;
          particlesRef.current.push(new Particle(centerX + Math.cos(angle)*dist, centerY + Math.sin(angle)*dist, color));
        }
      }

      // Base massive aura expanding
      const auraRadius = 50 + (easeOutExpo * Math.max(window.innerWidth, window.innerHeight) * 0.8);

      if (auraRadius > 0 && globalAlpha > 0) {
        const auraGradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, auraRadius
        );
        // Deep cosmic core expanding into fluid mist
        auraGradient.addColorStop(0, `rgba(0, 242, 255, ${globalAlpha * 0.3})`);
        auraGradient.addColorStop(0.3, `rgba(189, 0, 255, ${globalAlpha * 0.2})`);
        auraGradient.addColorStop(0.7, `rgba(66, 133, 244, ${globalAlpha * 0.1})`);
        auraGradient.addColorStop(1, `rgba(255, 0, 127, 0)`);

        ctx.beginPath();
        ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
        ctx.fillStyle = auraGradient;
        ctx.fill();
      }

      // Update and draw particles
      particlesRef.current.forEach((p, index) => {
        p.update(progress);
        p.draw(ctx, globalAlpha);
      });

      // Cleanup dead particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // Core white flash at start
      if (progress < 0.3) {
        const coreAlpha = 1 - (progress / 0.3);
        const coreRadius = 30 + easeOutExpo * 150;

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
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0"
        style={{ transform: 'translateZ(0)' }} // Force GPU acceleration
      />
    </div>
  );
};
