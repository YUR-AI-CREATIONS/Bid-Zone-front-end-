
import React, { useEffect, useRef } from 'react';

interface Props {
  themeColor: string;
}

const LiquidBackground: React.FC<Props> = ({ themeColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawGrid = () => {
      time += 0.005;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const spacing = 50;
      const cols = Math.ceil(canvas.width / spacing) + 2;
      const rows = Math.ceil(canvas.height / spacing) + 2;

      ctx.lineWidth = 0.5;
      ctx.strokeStyle = `${themeColor}22`;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;

          // Liquid distortion logic
          const dx = mouseRef.current.x - x;
          const dy = mouseRef.current.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const force = Math.max(0, 150 - dist) / 150;
          
          const ox = Math.sin(time + j * 0.2) * 10 + (dx * force * 0.5);
          const oy = Math.cos(time + i * 0.2) * 10 + (dy * force * 0.5);

          // Draw wireframe intersection
          ctx.beginPath();
          ctx.moveTo(x + ox - 5, y + oy);
          ctx.lineTo(x + ox + 5, y + oy);
          ctx.moveTo(x + ox, y + oy - 5);
          ctx.lineTo(x + ox, y + oy + 5);
          ctx.stroke();

          if (i > 0 && j > 0) {
             // Subtle vertical connection
             ctx.globalAlpha = 0.1;
             ctx.beginPath();
             ctx.moveTo(x + ox, y + oy);
             ctx.lineTo(x + ox, (j - 1) * spacing);
             ctx.stroke();
             ctx.globalAlpha = 1.0;
          }
        }
      }

      // Technical blueprint border
      ctx.strokeStyle = `${themeColor}44`;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      
      requestAnimationFrame(drawGrid);
    };

    window.addEventListener('resize', resize);
    resize();
    drawGrid();
    return () => window.removeEventListener('resize', resize);
  }, [themeColor]);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 pointer-events-none" />;
};

export default LiquidBackground;
