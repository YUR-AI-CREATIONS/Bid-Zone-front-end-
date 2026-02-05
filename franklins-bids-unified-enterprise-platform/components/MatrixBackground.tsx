
import React, { useEffect, useRef } from 'react';

interface MatrixBackgroundProps {
  color: string;
  opacity?: number;
}

const MatrixBackground: React.FC<MatrixBackgroundProps> = ({ color, opacity = 0.15 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', updateSize);
    updateSize();

    const letters = "YURAI0123456789ABCDEFΣΠΩΔΘΛ";
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = new Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = `rgba(3, 0, 5, 0.1)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px "Fira Code", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        
        // Dynamic color for "YUR AI" branding feel
        const isBranding = Math.random() > 0.98;
        ctx.fillStyle = isBranding ? '#fff' : color;
        
        if (isBranding) {
           ctx.shadowBlur = 10;
           ctx.shadowColor = color;
        } else {
           ctx.shadowBlur = 0;
        }

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateSize);
    };
  }, [color]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none transition-opacity duration-1000"
      style={{ opacity, zIndex: -5 }}
    />
  );
};

export default MatrixBackground;
