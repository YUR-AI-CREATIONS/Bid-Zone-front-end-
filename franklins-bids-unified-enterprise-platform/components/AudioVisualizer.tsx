import React, { useEffect, useRef } from 'react';

interface Props {
  stream: MediaStream | null;
  themeColor: string;
  isActive: boolean;
}

const AudioVisualizer: React.FC<Props> = ({ stream, themeColor, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayFreqRef = useRef<Uint8Array | null>(null);
  const dataArrayTimeRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || !isActive) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    
    // Higher FFT size for smoother circular resolution
    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    const dataArrayFreq = new Uint8Array(bufferLength);
    const dataArrayTime = new Uint8Array(bufferLength);
    
    source.connect(analyser);
    analyserRef.current = analyser;
    dataArrayFreqRef.current = dataArrayFreq;
    dataArrayTimeRef.current = dataArrayTime;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      if (!analyserRef.current || !dataArrayFreqRef.current || !dataArrayTimeRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArrayFreqRef.current);
      analyserRef.current.getByteTimeDomainData(dataArrayTimeRef.current);

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      
      ctx.clearRect(0, 0, width, height);

      // --- 1. CIRCULAR FREQUENCY BARS (Outer Ring) ---
      const outerRadius = Math.min(centerX, centerY) * 0.85;
      const innerRadius = outerRadius * 0.45;
      const barCount = dataArrayFreqRef.current.length;
      
      ctx.save();
      ctx.translate(centerX, centerY);
      
      for (let i = 0; i < barCount; i++) {
        const val = dataArrayFreqRef.current[i];
        const percent = val / 255;
        const angle = (i / barCount) * Math.PI * 2;
        
        const barHeight = percent * (outerRadius - innerRadius);
        
        ctx.rotate(angle);
        
        // Glow effect
        ctx.shadowBlur = isActive ? 10 * percent : 0;
        ctx.shadowColor = themeColor;
        
        ctx.fillStyle = themeColor;
        ctx.globalAlpha = 0.1 + (percent * 0.7);
        
        // Draw thin needle-like bars
        ctx.fillRect(innerRadius, -1, barHeight, 2);
        
        // Occasional highlight spikes
        if (percent > 0.8) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(innerRadius, -0.5, barHeight + 5, 1);
        }
        
        ctx.rotate(-angle);
      }
      ctx.restore();

      // --- 2. WAVEFORM RING (Middle Ring) ---
      const waveRadius = innerRadius * 0.8;
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.globalAlpha = 0.6;
      ctx.shadowBlur = 15;
      ctx.shadowColor = themeColor;

      for (let i = 0; i < barCount; i++) {
        const val = dataArrayTimeRef.current[i];
        const percent = (val - 128) / 128; // -1 to 1
        const angle = (i / barCount) * Math.PI * 2;
        
        const r = waveRadius + (percent * 25);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // --- 3. CORE AMBIENT PULSE ---
      const coreVal = dataArrayFreqRef.current[2] / 255; // Low frequency for bass pulse
      const coreRadius = (innerRadius * 0.3) + (coreVal * 15);
      
      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 2);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.3, themeColor);
      grad.addColorStop(1, 'transparent');
      
      ctx.globalAlpha = 0.2 + (coreVal * 0.3);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Structural accents (Circuit traces feel)
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      audioCtx.close();
    };
  }, [stream, isActive, themeColor]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={600} 
      className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]"
    />
  );
};

export default AudioVisualizer;