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
  initialX: number;
  initialY: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.initialX = x;
    this.initialY = y;
    this.angle = Math.random() * Math.PI * 2;
    // Explode outward fast initially, then slow down
    this.speed = Math.random() * 12 + 4; // slightly faster for more dynamic burst
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.radius = Math.random() * 18 + 5;
    this.color = color;
    this.maxLife = Math.random() * 80 + 50; // frames
    this.life = this.maxLife;
  }

  update(progress: number, frameCount: number) {
    // Add swirl/fluid motion - more pronounced
    const swirlForce = 0.08;
    const tangentX = -this.vy * swirlForce;
    const tangentY = this.vx * swirlForce;

    // Add sine wave oscillation to trajectory
    const sineWobble = Math.sin(frameCount * 0.1 + this.life) * 0.5;

    this.vx += tangentX + Math.cos(this.angle + Math.PI/2) * sineWobble;
    this.vy += tangentY + Math.sin(this.angle + Math.PI/2) * sineWobble;

    // Fluid drag
    this.vx *= 0.95;
    this.vy *= 0.95;

    this.x += this.vx * (1 + progress * 2);
    this.y += this.vy * (1 + progress * 2);

    this.life--;
    this.radius *= 0.97; // shrink over time
  }

  draw(ctx: CanvasRenderingContext2D, globalAlpha: number) {
    if (this.life <= 0 || this.radius <= 0.1) return;

    // Enhanced alpha curve for smoother fade
    const lifeRatio = this.life / this.maxLife;
    const alpha = Math.pow(lifeRatio, 1.5) * globalAlpha; // quadratic fade

    ctx.beginPath();
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius
    );
    gradient.addColorStop(0, `${this.color}${alpha * 0.9})`);
    gradient.addColorStop(0.4, `${this.color}${alpha * 0.5})`);
    gradient.addColorStop(1, `${this.color}0)`);

    ctx.fillStyle = gradient;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

class ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  thickness: number;

  constructor(x: number, y: number, maxRadius: number) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = maxRadius;
    this.maxLife = 60; // frames
    this.life = this.maxLife;
    this.thickness = 15;
  }

  update() {
    this.life--;
    // Ease out cubic for ring expansion
    const progress = 1 - (this.life / this.maxLife);
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    this.radius = easeOutCubic * this.maxRadius;
    this.thickness = 15 * (this.life / this.maxLife);
  }

  draw(ctx: CanvasRenderingContext2D, globalAlpha: number) {
    if (this.life <= 0) return;

    const alpha = (this.life / this.maxLife) * globalAlpha * 0.6; // subtle rings

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 242, 255, ${alpha})`; // Cyan ring
    ctx.lineWidth = this.thickness;
    ctx.stroke();

    // secondary glow ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.95, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
    ctx.lineWidth = this.thickness * 0.5;
    ctx.stroke();
  }
}

export const PremiumLiquidShockwave: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const ringsRef = useRef<ShockwaveRing[]>([]);

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

    // User requested vibrant multi-color palette
    const colors = [
      'rgba(255, 0, 0, ',     // Red
      'rgba(255, 255, 0, ',   // Yellow
      'rgba(0, 255, 0, ',     // Green
      'rgba(0, 0, 255, '      // Blue
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
      const centerY = window.innerHeight * 0.35; // Aligned with avatar's 35vh position

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

        auraGradient.addColorStop(0, `rgba(255, 0, 0, ${globalAlpha * (0.4 + timeOffset * 0.1)})`); // Red center
        auraGradient.addColorStop(0.2, `rgba(255, 255, 0, ${globalAlpha * 0.3})`); // Yellow mid
        auraGradient.addColorStop(0.5, `rgba(0, 255, 0, ${globalAlpha * 0.2})`); // Green outer
        auraGradient.addColorStop(0.8, `rgba(0, 0, 255, ${globalAlpha * 0.05})`); // Blue edges
        auraGradient.addColorStop(1, `rgba(0, 0, 0, 0)`); // Transparent fade

        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = auraGradient;
        ctx.fill();
      }

      // 2. Add Shockwave Rings
      if (progress < 0.8 && frameCount % 45 === 0) { // spawn a ring periodically
        ringsRef.current.push(new ShockwaveRing(centerX, centerY, Math.min(window.innerWidth, window.innerHeight) * 0.8));
      }

      ringsRef.current.forEach(r => {
        r.update();
        r.draw(ctx, globalAlpha);
      });
      ringsRef.current = ringsRef.current.filter(r => r.life > 0);

      // 3. High-performance liquid particles (spawning continuous dense cluster)
      if (progress < 0.85) {
        const spawnCount = Math.floor(Math.random() * 5) + 8; // Dense spawn rate (increased slightly for god level)
        for (let i = 0; i < spawnCount; i++) {
          const color = colors[Math.floor(Math.random() * colors.length)];
          // Spawn tightly around center to explode outward
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 40; // Tight cluster
          particlesRef.current.push(new Particle(centerX + Math.cos(angle)*dist, centerY + Math.sin(angle)*dist, color));
        }
      }

      // Update and render particles
      particlesRef.current.forEach((p) => {
        p.update(progress, frameCount);
        p.draw(ctx, globalAlpha);
      });

      // Purge dead particles instantly for performance
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // 4. Intense energy core at the center, always behind avatar
      ctx.globalCompositeOperation = 'screen';
      // More dynamic pulsating core with rotation effect via gradient shifts
      const coreSize = 70 + Math.sin(frameCount * 0.15) * 15; // Pulsating core
      const coreGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, coreSize
      );

      const coreGlowAlpha = globalAlpha * (0.8 + Math.sin(frameCount * 0.2) * 0.2);

      coreGradient.addColorStop(0, `rgba(255, 255, 255, ${coreGlowAlpha})`);
      coreGradient.addColorStop(0.2, `rgba(0, 242, 255, ${coreGlowAlpha * 0.9})`); // cyan inner core
      coreGradient.addColorStop(0.5, `rgba(255, 255, 0, ${coreGlowAlpha * 0.7})`); // Yellow mid
      coreGradient.addColorStop(1, `rgba(255, 0, 0, 0)`); // Fade to Red

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
