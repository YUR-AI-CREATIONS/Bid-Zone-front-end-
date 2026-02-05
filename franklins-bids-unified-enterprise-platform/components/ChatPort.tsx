
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FileText, Volume2, ExternalLink, Grid, Copy, Check, Video, Loader2, BrainCircuit } from 'lucide-react';
import { ChatMessage, AIModel } from '../types';
import { generatePDF, generateExcel, copyToClipboard } from '../services/fileService';

interface Props {
  themeColor: string;
  activeModel: AIModel;
  messages: ChatMessage[];
  isLoading: boolean;
  onSpeak?: (text: string) => void;
  onGenerateVideo?: (prompt: string) => void;
}

const ChatPort: React.FC<Props> = ({ activeModel, messages, isLoading, themeColor, onSpeak, onGenerateVideo }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // If the user has scrolled up significantly, disable auto-scroll
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShouldAutoScroll(isNearBottom);
  }, []);

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, isLoading, shouldAutoScroll, scrollToBottom]);

  const handleCopy = async (text: string, id: number) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      // Fix: Changed 'setCopied(null)' to 'setCopiedId(null)' to match the state variable.
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="h-full relative overflow-hidden bg-transparent">
      {/* LARGE CIRCULAR BRANDING OVERLAY (Moved here from App.tsx) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 opacity-10">
         <div className="w-[80%] h-[80%] border-[20px] border-white/10 rounded-full flex items-center justify-center"> {/* Scaled down */}
            <div className="w-[60%] h-[60%] border-[1px] border-white/5 rounded-full flex flex-col items-center justify-center p-10 text-center"> {/* Scaled down */}
                <h1 className="text-[6vw] lg:text-[4vw] font-black tracking-[0.2em] leading-none chrome-text opacity-20">SOVEREIGN</h1> {/* Adjusted text size */}
                <p className="text-[0.8vw] lg:text-[0.6vw] font-black tracking-[0.8em] uppercase mt-2 opacity-40">The Human-AI Alliance</p> {/* Adjusted text size */}
            </div>
         </div>
      </div>

      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-6 md:p-12 space-y-12 custom-scrollbar"
      >
        {messages.map((m, i) => {
          const isModel = m.role === 'model';
          return (
            <div key={i} className={`flex flex-col ${isModel ? 'items-start' : 'items-end'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
              <div className={`flex items-center gap-3 mb-3 px-2 ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-2 h-2 rounded-full ${isModel ? 'shadow-[0_0_10px_var(--theme-color)]' : ''}`} style={{ backgroundColor: isModel ? themeColor : 'rgba(255,255,255,0.2)' }}></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
                  {isModel ? activeModel : 'Sovereign_Authority'}
                </span>
              </div>
              
              <div 
                className={`max-w-[90%] text-[15px] leading-relaxed font-normal p-8 obsidian-glass relative group/bubble
                  ${isModel ? 'border-l-2' : 'border-r-2'}
                `}
                style={{ 
                  borderLeftColor: isModel ? themeColor : 'rgba(255,255,255,0.05)',
                  borderRightColor: !isModel ? themeColor : 'rgba(255,255,255,0.05)',
                }}
              >
                {/* Visual Accent Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10"></div>

                {m.content && <div className="whitespace-pre-wrap font-space text-white/90 prose prose-invert max-w-none">{m.content}</div>}
                
                {m.mediaUrl && (
                  <div className="mt-6 border border-white/10 bg-black/60 overflow-hidden relative">
                    {m.mediaType === 'video' ? (
                      <video src={m.mediaUrl} controls autoPlay loop className="w-full" />
                    ) : (
                      <img src={m.mediaUrl} className="w-full transition-all hover:scale-[1.02] duration-700" alt="Sovereign Synthesis" />
                    )}
                  </div>
                )}

                {m.groundingUrls && m.groundingUrls.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3">
                     <span className="text-[9px] font-black tracking-widest text-white/20 uppercase">Provenance Linkage</span>
                     {m.groundingUrls.map((url, idx) => (
                       <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-[11px] text-white/40 hover:text-white bg-white/[0.02] p-4 border border-white/5 transition-all">
                         <span className="truncate max-w-[80%] font-mono">{url}</span>
                         <ExternalLink size={12} style={{ color: themeColor }} />
                       </a>
                     ))}
                  </div>
                )}
                
                {isModel && (
                  <div className="mt-8 flex flex-wrap gap-3 pt-6 border-t border-white/5 opacity-0 group-hover/bubble:opacity-100 transition-all duration-300">
                    <button onClick={() => onSpeak?.(m.content)} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-white/10">
                      <Volume2 size={12} style={{ color: themeColor }} /> Audible_Audit
                    </button>
                    <button onClick={() => onGenerateVideo?.(m.content)} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-white/10">
                      <Video size={12} style={{ color: themeColor }} /> Dynamic_Visual
                    </button>
                    <button onClick={() => generatePDF("SOVEREIGN_TRANSMISSION", m.content)} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-white/10">
                      <FileText size={12} /> PDF_Clone
                    </button>
                    <button onClick={() => handleCopy(m.content, i)} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 ml-auto">
                      {copiedId === i ? <Check size={12} /> : <Copy size={12} />} 
                      {copiedId === i ? 'Cloned' : 'Clone_Meta'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex flex-col items-start gap-4 animate-pulse py-4">
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }}></div>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Alliance_Synthesizing...</span>
             </div>
             <div className="h-[2px] w-64 bg-white/5 overflow-hidden">
                <div className="h-full bg-yellow-400 animate-loading-bar"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-10">
           <BrainCircuit size={120} className="mb-8" />
           <span className="text-[14px] font-black tracking-[2em] uppercase">Sovereign_Active</span>
        </div>
      )}

      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 2s infinite ease-in-out;
          width: 50%;
        }
      `}</style>
    </div>
  );
};

export default ChatPort;