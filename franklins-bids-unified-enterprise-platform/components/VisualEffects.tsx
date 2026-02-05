
import React, { useEffect, useRef } from 'react';

export const SnowEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const particles: { x: number; y: number; r: number; d: number; v: number; opacity: number }[] = [];
    const count = 50; // Slightly less dense for cleaner look

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.5,
        d: Math.random() * count,
        v: Math.random() * 0.4 + 0.1,
        opacity: Math.random() * 0.3 + 0.05
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
        ctx.fill();
        
        p.y += p.v;
        p.x += Math.sin(p.d) * 0.2;
        
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      }
      requestAnimationFrame(draw);
    };

    draw();
    return () => window.removeEventListener('resize', resize);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

export const ShootingStars: React.FC<{ themeColor: string }> = ({ themeColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    let stars: { x: number; y: number; length: number; speed: number; opacity: number; angle: number; width: number }[] = [];

    const createStar = () => {
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
      stars.push({
        x: Math.random() * canvas.width * 1.2,
        y: -150,
        length: Math.random() * 150 + 250,
        speed: Math.random() * 4 + 6, // ULTRA SLOW: Was 12-20
        opacity: 1,
        angle,
        width: Math.random() * 1.5 + 0.5
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      stars = stars.filter(s => s.opacity > 0);
      
      stars.forEach(s => {
        ctx.save();
        ctx.beginPath();
        
        const tailX = s.x - Math.cos(s.angle) * s.length;
        const tailY = s.y - Math.sin(s.angle) * s.length;
        
        const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.2, themeColor);
        grad.addColorStop(0.7, `${themeColor}11`);
        grad.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.lineCap = 'butt';
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Subtle Head Glow
        const headGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 8);
        headGrad.addColorStop(0, '#fff4');
        headGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        
        if (s.x > canvas.width + 300 || s.y > canvas.height + 300) {
          s.opacity = 0;
        }
      });

      // Very infrequent intervals
      if (Math.random() < 0.002) createStar(); 
      requestAnimationFrame(draw);
    };

    draw();
    return () => window.removeEventListener('resize', resize);
  }, [themeColor]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};
