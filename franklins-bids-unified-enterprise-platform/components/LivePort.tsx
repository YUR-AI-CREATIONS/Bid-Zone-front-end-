
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Activity, Radio, Loader2, Zap, BrainCircuit } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import AudioVisualizer from './AudioVisualizer';

interface Props {
  themeColor: string;
}

export const LivePort: React.FC<Props> = ({ themeColor }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  
  const audioContextInput = useRef<AudioContext | null>(null);
  const audioContextOutput = useRef<AudioContext | null>(null);
  // Track the session promise to handle race conditions between connection and streaming
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTime = useRef(0);
  const sources = useRef(new Set<AudioBufferSourceNode>());

  // manual decode implementation following @google/genai guidelines
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // manual encode implementation following @google/genai guidelines to prevent stack overflow
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // manual PCM audio decoding following @google/genai guidelines
  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  const startSession = async () => {
    setIsConnecting(true);
    // Initialize GoogleGenAI with named apiKey parameter as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    audioContextInput.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    audioContextOutput.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setCurrentStream(stream);
      
      // Use sessionPromise to ensure data is sent only after connection is established
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            const source = audioContextInput.current!.createMediaStreamSource(stream);
            const processor = audioContextInput.current!.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const input = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(input.length);
              for (let i = 0; i < input.length; i++) {
                int16[i] = input[i] * 32768;
              }
              const b64 = encode(new Uint8Array(int16.buffer));
              // Critical: wait for sessionPromise before sending realtime input
              sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({ media: { data: b64, mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            source.connect(processor);
            processor.connect(audioContextInput.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const b64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (b64 && audioContextOutput.current) {
              nextStartTime.current = Math.max(nextStartTime.current, audioContextOutput.current.currentTime);
              const bytes = decode(b64);
              const buffer = await decodeAudioData(bytes, audioContextOutput.current, 24000, 1);
              const source = audioContextOutput.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextOutput.current.destination);
              source.addEventListener('ended', () => {
                sources.current.delete(source);
              });
              source.start(nextStartTime.current);
              nextStartTime.current += buffer.duration;
              // Fix: Correctly access the .current property of the sources ref Set
              sources.current.add(source);
            }
            if (message.serverContent?.interrupted) {
              sources.current.forEach(s => {
                try { s.stop(); } catch (e) {}
              });
              sources.current.clear();
              nextStartTime.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live Error:", e);
            setIsConnecting(false);
            setIsActive(false);
          },
          onclose: () => {
            setIsActive(false);
            setCurrentStream(null);
          }
        }
      });
    } catch (err) {
      console.error("Permission denied or stream error:", err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    sessionPromiseRef.current?.then(session => session.close());
    setIsActive(false);
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
    }
  };

  return (
    <div className="p-0 h-full flex flex-col items-center bg-black overflow-hidden relative">
      {/* Visualizer Backdrop - Taking most of the space */}
      <div className="flex-1 w-full relative group">
        <div className="absolute inset-0 flex items-center justify-center p-12">
           <AudioVisualizer stream={currentStream} themeColor={themeColor} isActive={isActive} />
        </div>
        
        {/* Context Overlays */}
        {!isActive && !isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-1000">
             <div className="p-8 border border-white/5 rounded-full bg-white/[0.02] backdrop-blur-sm">
                <BrainCircuit size={48} className="opacity-10 animate-pulse" />
             </div>
             <span className="text-[10px] font-black tracking-[0.8em] uppercase opacity-20 mt-8">SOVEREIGN_CORE_STANDBY</span>
          </div>
        )}

        {isActive && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-2 border border-white/10 bg-black/60 backdrop-blur-md rounded-full animate-in fade-in zoom-in duration-500">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[9px] font-black tracking-[0.3em] uppercase">ALLIANCE_LINK_ACTIVE</span>
          </div>
        )}
      </div>
      
      {/* Controls Overlay Footer */}
      <div className="w-full p-8 border-t border-white/10 bg-black/80 backdrop-blur-2xl z-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col">
              <span className="text-[11px] font-black tracking-[0.4em] uppercase chrome-text">NATIVE_ACOUSTIC_LINK</span>
              <span className="text-[8px] font-mono opacity-30 mt-1">LATENCY: 12MS // RESOLUTION: 24BIT</span>
            </div>
            <Activity size={16} className={isActive ? 'animate-pulse' : 'opacity-20'} style={{color: isActive ? themeColor : 'white'}} />
          </div>

          <button
            onClick={isActive ? stopSession : startSession}
            disabled={isConnecting}
            className={`w-full py-5 border transition-all flex items-center justify-center gap-4 text-[10px] font-black tracking-[0.6em] relative overflow-hidden group/btn ${isActive ? 'bg-white text-black' : 'bg-transparent text-white border-white/20 hover:border-white/40'}`}
          >
            {isConnecting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isActive ? (
              <><MicOff size={16} /> TERMINATE_LINK</>
            ) : (
              <><Mic size={16} /> INITIALIZE_ALLIANCE</>
            )}
            
            {/* Animated border pulse on hover */}
            <div className={`absolute bottom-0 left-0 h-[2px] bg-yellow-400 transition-all duration-700 ${isActive ? 'w-full' : 'w-0 group-hover/btn:w-full'}`}></div>
          </button>
        </div>
      </div>
    </div>
  );
};
