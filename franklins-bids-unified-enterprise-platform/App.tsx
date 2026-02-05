
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal as TerminalIcon, Folder, Cpu, 
  Activity, Zap, Video, Loader2, Hammer, LandPlot, 
  Building2, ShieldCheck, BrainCircuit, Image, 
  FileSearch, X, Maximize2, Move, Minimize2, Square, 
  ShieldCheck as ShieldIcon, Mic, Radio, Globe, Users,
  ChevronLeft, ChevronRight, Menu, Layout, Settings,
  Database, Boxes, Layers, Compass, Target, Info, Search,
  Construction, User as UserIcon, Coins
} from 'lucide-react';

import { NeuralProvider, useNeural } from './context/NeuralContext';
import { useNeuralEngine } from './hooks/useNeuralEngine';
import { geminiService } from './services/geminiService';
import { apiService } from './services/apiService';

import LiquidBackground from './components/LiquidBackground';
import GhostSignature from './components/GhostSignature';
import ChatPort from './components/ChatPort';
import FilePort from './components/FilePort';
import ModelOrchestrator from './components/ModelOrchestrator';
import TerminalPanel from './components/TerminalPanel';
import PortWindow from './components/PortWindow';
import { LivePort } from './components/LivePort';
import AuthScreen from './components/AuthScreen'; // New: AuthScreen
import { ChatMessage, AIModel, WindowConfig } from './types';

// Fix: The AIStudio interface and global declaration are now managed in types.ts.
// This prevents "Subsequent property declarations must have the same type" error.

const MainLayout: React.FC = () => {
  const { state, dispatch, addLog } = useNeural();
  const { sendMessage, trainSynapticNode, isChatLoading, isThinking } = useNeuralEngine();
  
  const [input, setInput] = useState('');
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  const dragRef = useRef<{ id: string; startX: number; startY: number; windowX: number; windowY: number } | null>(null);
  const resizeRef = useRef<{ id: string; startX: number; startY: number; width: number; height: number } | null>(null);

  // Check Gemini API Key on load
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        try {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasKey(selected);
        } catch (e) {
          // If aistudio is present but throws, assume key is selected for now to proceed
          // Further API calls will fail if key is truly bad.
          setHasKey(true); 
          addLog("API_KEY_CHECK_WARNING: An error occurred during API key validation, proceeding with assumption of key presence.");
        }
      } else {
        // If aistudio is not defined, we're likely in a non-aistudio environment, proceed.
        setHasKey(true);
        addLog("API_KEY_CHECK_INFO: window.aistudio not detected, proceeding without explicit key validation.");
      }
    };
    checkKey();
  }, [addLog]);

  // Sync subscription status if user is logged in
  useEffect(() => {
    const syncSubscription = async () => {
      if (state.user) {
        try {
          addLog("SOVEREIGN_PROFILE: SYNCING_SUBSCRIPTION_STATUS...");
          const updatedUser = await apiService.syncSubscriptionStatus();
          dispatch({ type: 'SET_USER', payload: { ...state.user, ...updatedUser } });
          addLog(`SOVEREIGN_PROFILE: SUBSCRIPTION_SYNCED_TO_${updatedUser.tier}`);
        } catch (error: any) {
          addLog(`SOVEREIGN_PROFILE_ERR: FAILED_TO_SYNC_SUBSCRIPTION: ${error.message}`);
        }
      }
    };
    syncSubscription();
    // Poll for status updates every 5 minutes (adjust as needed)
    const interval = setInterval(syncSubscription, 5 * 60 * 1000); 
    return () => clearInterval(interval);
  }, [state.user?.id, dispatch, addLog]); // Only re-run if user.id changes

  const handleSendMessage = useCallback(() => {
    if (!input.trim() || isChatLoading) return;
    const currentInput = input;
    sendMessage(currentInput);
    // Clear input after send to keep the minimalist search-like feel
    setInput('');
  }, [input, isChatLoading, sendMessage]);

  const handleSpeak = async (text: string) => {
    addLog("FRANKLIN: INITIALIZING_AUDIO_REPORT...");
    try {
      const audioBase64 = await geminiService.generateSpeech(text);
      if (audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        audio.play();
        addLog("FRANKLIN: AUDIO_REPORT_ACTIVE");
      }
    } catch (e) {
      addLog("FRANKLIN_ERR: AUDIO_STREAM_FAILED");
    }
  };

  const handleGenerateVideo = async (prompt: string) => {
    setIsVideoGenerating(true);
    addLog("VISUAL_ENGINE: RENDERING_PHASING_ANIMATION...");
    try {
      const videoUrl = await geminiService.generateVideo(prompt);
      const videoMsg: ChatMessage = {
        role: 'model',
        content: `Synthetic Construction Render for: ${prompt.slice(0, 50)}...`,
        timestamp: new Date(),
        mediaUrl: videoUrl,
        mediaType: 'video'
      };
      dispatch({ type: 'UPDATE_ACTIVE_NODE', payload: { history: [...state.activeNode.history, videoMsg] } });
      addLog("VISUAL_ENGINE: RENDER_SYNTHESIZED");
    } catch (e: any) {
      addLog(`RENDER_ERR: ${e.message}`);
    } finally {
      setIsVideoGenerating(false);
    }
  };

  const onDragStart = (id: string, e: React.MouseEvent) => {
    const win = state.windows.find(w => w.id === id);
    if (!win || win.isMaximized) return;
    dispatch({ type: 'FOCUS_WINDOW', id });
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, windowX: win.x, windowY: win.y };
  };

  const onResizeStart = (id: string, e: React.MouseEvent) => {
    const win = state.windows.find(w => w.id === id);
    if (!win || win.isMaximized) return;
    dispatch({ type: 'FOCUS_WINDOW', id });
    resizeRef.current = { id, startX: e.clientX, startY: e.clientY, width: win.width, height: win.height };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragRef.current) {
      const { id, startX, startY, windowX, windowY } = dragRef.current;
      dispatch({
        type: 'UPDATE_WINDOW',
        id,
        payload: { x: windowX + (e.clientX - startX), y: windowY + (e.clientY - startY) }
      });
    }
    if (resizeRef.current) {
      const { id, startX, startY, width, height } = resizeRef.current;
      dispatch({
        type: 'UPDATE_WINDOW',
        id,
        payload: { width: Math.max(300, width + (e.clientX - startX)), height: Math.max(200, height + (e.clientY - startY)) }
      });
    }
  }, [dispatch]);

  useEffect(() => {
    const handleMouseUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);

  // First, check for Google Gemini API key
  if (hasKey === false) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full p-10 border border-white/10 obsidian-glass text-center space-y-8">
           <ShieldIcon size={48} className="mx-auto text-yellow-400 animate-pulse" />
           <h2 className="text-2xl font-black tracking-widest uppercase chrome-text">SOVEREIGN_ACCESS</h2>
           <p className="text-xs font-mono opacity-60 leading-relaxed uppercase tracking-wider">
             Regenerative Sovereign Systems require paid API credentials for Roosevelt Franklin's Alliance Core.
           </p>
           <button 
             onClick={async () => {
               if (window.aistudio) {
                 await window.aistudio.openSelectKey();
                 setHasKey(true); // Assume success for immediate UI update
               }
             }}
             className="w-full py-4 bg-yellow-400 text-black font-black uppercase tracking-[0.3em] hover:bg-yellow-300 transition-all active:scale-95"
           >
             Initialize Link
           </button>
        </div>
      </div>
    );
  }

  // Second, if API key is present, check for user authentication
  if (state.user === null) {
    return <AuthScreen themeColor={state.neonTheme.color} onAuthSuccess={(user) => dispatch({ type: 'SET_USER', payload: user })} />;
  }

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden relative font-space flex flex-col">
      {/* GLOBAL BACKGROUNDS */}
      <GhostSignature themeColor={state.neonTheme.color} isComputing={isThinking || isChatLoading} />
      <LiquidBackground themeColor={state.neonTheme.color} />
      
      {/* LARGE CIRCULAR BRANDING OVERLAY (Removed from here, moved to ChatPort) */}
      {/*
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-10">
         <div className="w-[80vw] h-[80vw] border-[40px] border-white/10 rounded-full flex items-center justify-center">
            <div className="w-[60vw] h-[60vw] border-[2px] border-white/5 rounded-full flex flex-col items-center justify-center p-20 text-center">
                <h1 className="text-[12vw] font-black tracking-[0.2em] leading-none chrome-text opacity-20">SOVEREIGN</h1>
                <p className="text-[1vw] font-black tracking-[0.8em] uppercase mt-4 opacity-40">The Human-AI Alliance</p>
            </div>
         </div>
      </div>
      */}

      {isVideoGenerating && (
        <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-500">
           <Loader2 size={48} className="animate-spin mb-6" style={{ color: state.neonTheme.color }} />
           <p className="text-[14px] font-black tracking-[1em] uppercase chrome-text">SYNTHESIZING_SOVEREIGN_DYNAMICS</p>
        </div>
      )}

      {/* HEADER NAV */}
      <header className="h-16 px-6 flex items-center justify-between z-[5000] shrink-0 border-b border-white/5 bg-black/60 backdrop-blur-2xl">
        <div className="flex items-center gap-6">
           <button 
             onClick={() => setLeftPanelOpen(!leftPanelOpen)}
             className={`p-2.5 border transition-all ${leftPanelOpen ? 'bg-white/10 border-white/20' : 'border-white/5 hover:bg-white/5'}`}
           >
              <Menu size={20} />
           </button>
           <div className="flex items-center gap-4">
              <Globe size={18} className="text-yellow-400" />
              <div className="flex flex-col">
                 <h1 className="text-lg font-black tracking-[0.3em] chrome-text uppercase leading-none">SOVEREIGN AI</h1>
                 <span className="text-[6px] font-mono opacity-30 tracking-[0.4em] uppercase mt-1">Regenerative Systems // v4.2-STABLE</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden lg:flex items-center gap-8 mr-8">
              <div className="flex flex-col items-end">
                 <span className="text-[7px] font-black tracking-widest uppercase opacity-20">Active_Link</span>
                 <span className="text-[9px] font-mono tracking-widest uppercase text-yellow-400">{state.activeNode.model}</span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[7px] font-black tracking-widest uppercase opacity-20">Throughput</span>
                 <span className="text-[9px] font-mono tracking-widest uppercase">98.4 GB/S</span>
              </div>
           </div>
           <button 
             onClick={() => setRightPanelOpen(!rightPanelOpen)}
             className={`p-2.5 border transition-all ${rightPanelOpen ? 'bg-white/10 border-white/20' : 'border-white/5 hover:bg-white/5'}`}
           >
              <Layout size={20} />
           </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* LEFT UTILITY PANEL */}
        <aside className={`h-full border-r border-white/5 bg-black/80 backdrop-blur-3xl transition-all duration-500 ease-in-out z-[4000] flex flex-col ${leftPanelOpen ? 'w-96 translate-x-0 shadow-2xl' : 'w-0 -translate-x-full'}`}>
           <div className="p-6 border-b border-white/5 flex items-center justify-between overflow-hidden">
              <span className="text-[10px] font-black tracking-[0.6em] uppercase opacity-40 whitespace-nowrap">SOVEREIGN_CORE</span>
              <button onClick={() => setLeftPanelOpen(false)} className="p-1 hover:text-yellow-400 transition-colors"><ChevronLeft size={20}/></button>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="p-4 space-y-2">
                {[
                  { id: 'vault', title: 'Blueprints & Specs', icon: <Folder size={18}/>, desc: 'Structural Archive' },
                  { id: 'oracle', title: 'Agent Orchestra', icon: <Cpu size={18}/>, desc: 'Discipline Control' },
                  { id: 'live', title: 'Acoustic Comms', icon: <Radio size={18}/>, desc: 'Real-time Link' },
                  { id: 'terminal', title: 'Kernel Buffer', icon: <TerminalIcon size={18}/>, desc: 'System Logs' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { dispatch({ type: 'TOGGLE_WINDOW', id: item.id, open: true }); dispatch({ type: 'FOCUS_WINDOW', id: item.id }); }}
                    className="w-full p-6 flex items-start gap-6 bg-white/[0.02] border border-white/5 hover:border-yellow-400/20 hover:bg-yellow-400/[0.03] transition-all text-left group overflow-hidden"
                  >
                    <div className="p-3 bg-white/5 text-white/40 group-hover:text-yellow-400 transition-all">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                       <span className="text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap">{item.title}</span>
                       <span className="text-[8px] font-mono opacity-20 uppercase tracking-[0.4em] mt-1">{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* DIRECT ZIP UPLOAD SECTION IN PANEL */}
              <div className="m-4 p-8 border border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center text-center space-y-4">
                 <Boxes size={32} className="opacity-10 group-hover:opacity-40 transition-opacity" />
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest">Ingest_Blueprints</p>
                    <p className="text-[7px] font-mono opacity-20 uppercase tracking-[0.3em]">Support: ZIP, PDF, DWG</p>
                 </div>
                 <button 
                   onClick={() => dispatch({ type: 'TOGGLE_WINDOW', id: 'vault', open: true })}
                   className="px-6 py-2 border border-white/20 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                 >
                    Open_Vault
                 </button>
              </div>
           </div>

           <div className="p-8 border-t border-white/5 overflow-hidden">
             {/* Replaced generic Human-AI Alliance with User Profile Summary */}
              {state.user && (
                <div className="flex items-center gap-4">
                   <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                      <UserIcon size={14} className="opacity-40" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest">SOVEREIGN_PROFILE</span>
                      <span className="text-[7px] font-mono opacity-20 uppercase">{state.user.email}</span>
                   </div>
                </div>
              )}
           </div>
        </aside>

        {/* ZEN MAIN SCREEN - ONLY CHAT PROMPT */}
        <div className="flex-1 relative flex flex-col h-full">
          {/* WINDOWS LAYER (PORT WINDOWS) */}
          <div className="absolute inset-0 pointer-events-none z-[3000]">
            {state.windows.filter(w => w.isOpen).map((win) => (
              <PortWindow
                key={win.id}
                id={win.id}
                title={win.title}
                themeColor={state.neonTheme.color}
                isActive={state.activeWindowId === win.id}
                isMaximized={win.isMaximized}
                zIndex={win.zIndex}
                style={{
                  left: win.isMaximized ? 0 : win.x,
                  top: win.isMaximized ? 0 : win.y,
                  width: win.isMaximized ? '100%' : win.width,
                  height: win.isMaximized ? '100%' : win.height,
                  pointerEvents: 'auto'
                }}
                icon={
                  win.id === 'chat' ? <BrainCircuit size={14}/> : 
                  win.id === 'vault' ? <Folder size={14}/> : 
                  win.id === 'terminal' ? <TerminalIcon size={14}/> : 
                  win.id === 'live' ? <Radio size={14}/> :
                  <Cpu size={14}/>
                }
                onFocus={() => dispatch({ type: 'FOCUS_WINDOW', id: win.id })}
                onClose={() => dispatch({ type: 'TOGGLE_WINDOW', id: win.id, open: false })}
                onToggleMaximize={() => dispatch({ type: 'UPDATE_WINDOW', id: win.id, payload: { isMaximized: !win.isMaximized } })}
                onDragStart={(e) => onDragStart(win.id, e)}
                onResizeStart={(e) => onResizeStart(win.id, e)}
              >
                {win.id === 'vault' && <FilePort themeColor={state.neonTheme.color} onFileAdded={(file) => trainSynapticNode([file])} />}
                {win.id === 'oracle' && <ModelOrchestrator 
                  selectedModel={state.activeNode.model} 
                  onSelect={(m) => dispatch({ type: 'UPDATE_ACTIVE_NODE', payload: { model: m } })} 
                  themeColor={state.neonTheme.color} 
                  isSubscribed={state.user?.isSubscribed || false} // Pass subscription status
                  config={{aspectRatio:'1:1', imageSize:'1K'}} 
                  onConfigChange={()=>{}} 
                />}
                {win.id === 'terminal' && <TerminalPanel logs={state.logs} themeColor={state.neonTheme.color} />}
                {win.id === 'live' && <LivePort themeColor={state.neonTheme.color} />}
              </PortWindow>
            ))}
          </div>

          {/* MAIN CHAT AREA - THE FOCUS POINT */}
          <div className="h-full w-full max-w-5xl mx-auto flex flex-col relative z-[2000]">
            {/* Minimal Chat History - Integrated into the Flow */}
            <div className="flex-1 overflow-hidden pb-[160px]"> {/* Adjusted padding to accommodate sticky footer */}
               <ChatPort 
                 messages={state.activeNode.history} 
                 isLoading={isChatLoading} 
                 activeModel={state.activeNode.model} 
                 themeColor={state.neonTheme.color} 
                 onSpeak={handleSpeak}
                 onGenerateVideo={handleGenerateVideo}
               />
            </div>
            
            {/* ZEN CENTRAL PROMPT BOX - Now sticky at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-10 z-10 bg-black/80 backdrop-blur-2xl"> {/* Sticky footer for input */}
               <div className="relative group obsidian-glass border-white/10 p-1.5 flex items-center transition-all focus-within:ring-2 ring-white/10 shadow-[0_0_60px_-15px_rgba(255,255,255,0.05)]">
                  <div className="pl-8 pr-4 opacity-40 group-focus-within:opacity-100 transition-all">
                     {isThinking ? (
                        <div className="w-8 h-8 flex items-center justify-center">
                           <Loader2 size={24} className="animate-spin text-yellow-400" />
                        </div>
                     ) : (
                        <Search size={24} className="text-white/40 group-focus-within:text-white" />
                     )}
                  </div>
                  <input 
                    value={input} 
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-transparent border-none py-8 px-4 font-space text-[18px] font-light focus:outline-none text-white selection:bg-yellow-400/30 placeholder:opacity-20 placeholder:tracking-[0.2em]"
                    placeholder="ENTER_SOVEREIGN_COMMAND..."
                  />
                  <div className="flex items-center gap-3 pr-6">
                     <button 
                       onClick={handleSendMessage}
                       disabled={isChatLoading || !input.trim()}
                       className="p-5 bg-white text-black hover:bg-yellow-400 transition-all active:scale-95 disabled:opacity-5 disabled:grayscale"
                     >
                        <Zap size={22} className={isChatLoading ? 'animate-pulse' : ''} />
                     </button>
                  </div>
               </div>
               
               {/* Context Breadcrumbs */}
               <div className="flex items-center justify-center gap-10 mt-8">
                  <div className="flex items-center gap-3">
                     <Target size={12} className="opacity-20" />
                     <span className="text-[9px] font-black tracking-[0.4em] uppercase opacity-20">Link: {state.activeNode.model}</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <Database size={12} className="opacity-20" />
                     <span className="text-[9px] font-black tracking-[0.4em] uppercase opacity-20">Context: 12.4K Tokens</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <Layers size={12} className="opacity-20" />
                     <span className="text-[9px] font-black tracking-[0.4em] uppercase opacity-20">Mode: Precise</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT ANALYTICS PANEL */}
        <aside className={`h-full border-l border-white/5 bg-black/80 backdrop-blur-3xl transition-all duration-500 ease-in-out z-[4000] flex flex-col ${rightPanelOpen ? 'w-96 translate-x-0 shadow-2xl' : 'w-0 translate-x-full'}`}>
           <div className="p-6 border-b border-white/5 flex items-center justify-between overflow-hidden">
              <button onClick={() => setRightPanelOpen(false)} className="p-1 hover:text-yellow-400 transition-colors"><ChevronRight size={20}/></button>
              <span className="text-[10px] font-black tracking-[0.6em] uppercase opacity-40 whitespace-nowrap">META_ANALYSIS</span>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-12">
              {/* Sovereign Profile (User Info) */}
              <div className="space-y-6">
                 <span className="text-[10px] font-black tracking-widest uppercase text-yellow-400/60">SOVEREIGN_PROFILE</span>
                 {state.user && (
                    <div className="grid grid-cols-1 gap-4">
                       <div className="p-5 border border-white/5 bg-white/[0.02] flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                             <p className="text-[8px] font-mono opacity-20 uppercase tracking-widest">User_ID</p>
                             <p className="text-[12px] font-black tracking-widest truncate">{state.user.email.split('@')[0]}</p>
                          </div>
                          <UserIcon size={14} className="text-white/20" />
                       </div>
                       <div className="p-5 border border-white/5 bg-white/[0.02] flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                             <p className="text-[8px] font-mono opacity-20 uppercase tracking-widest">Access_Tier</p>
                             <p className="text-[12px] font-black tracking-widest">{state.user.tier}</p>
                          </div>
                          <ShieldCheck size={14} className={state.user.isSubscribed ? 'text-green-400' : 'text-white/20'} />
                       </div>
                       <div className="p-5 border border-white/5 bg-white/[0.02] flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                             <p className="text-[8px] font-mono opacity-20 uppercase tracking-widest">Credits_Remaining</p>
                             <p className="text-[12px] font-black tracking-widest">{state.user.credits}</p>
                          </div>
                          <Coins size={14} className="text-white/20" />
                       </div>
                    </div>
                 )}
              </div>

              <div className="space-y-6">
                 <span className="text-[10px] font-black tracking-widest uppercase text-yellow-400/60">Cognitive_Metrics</span>
                 <div className="grid grid-cols-1 gap-4">
                    {[
                      { label: 'Synaptic Fidelity', val: '99.98%', icon: <Zap size={10}/> },
                      { label: 'Neural Latency', val: '12ms', icon: <Activity size={10}/> },
                      { label: 'Alliance Trust', val: 'LEVEL_05', icon: <ShieldCheck size={10}/> },
                    ].map(m => (
                      <div key={m.label} className="p-5 border border-white/5 bg-white/[0.02] flex items-center justify-between">
                         <div className="flex flex-col gap-1">
                            <p className="text-[8px] font-mono opacity-20 uppercase tracking-widest">{m.label}</p>
                            <p className="text-[12px] font-black tracking-widest">{m.val}</p>
                         </div>
                         <div className="text-white/20">{m.icon}</div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="space-y-6">
                 <span className="text-[10px] font-black tracking-widest uppercase text-white/20">Operational_DNA</span>
                 <div className="p-6 border border-white/5 bg-black/40 font-mono text-[9px] text-white/40 leading-relaxed max-h-48 overflow-hidden relative">
                    {state.centralBrainDNA}
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                 </div>
                 <button 
                   onClick={() => dispatch({ type: 'TOGGLE_WINDOW', id: 'terminal', open: true })}
                   className="w-full py-4 border border-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                 >
                    Inspect_Source
                 </button>
              </div>

              <div className="p-6 border border-yellow-400/20 bg-yellow-400/5 relative group overflow-hidden">
                 <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-40 transition-opacity">
                    {/* Fix: Construction icon is now correctly imported */}
                    <Construction size={32} />
                 </div>
                 <div className="flex items-center gap-3 mb-4">
                    <ShieldIcon size={14} className="text-yellow-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sovereign_OS</span>
                 </div>
                 <p className="text-[10px] leading-relaxed opacity-60 font-mono italic">
                   "Architected for the preservation of human intent through the speed of neural synthesis."
                 </p>
              </div>
           </div>
        </aside>
      </main>

      <footer className="h-12 px-8 border-t border-white/5 bg-black/90 flex items-center justify-between z-[5000] text-[9px] font-mono opacity-30 tracking-widest uppercase select-none">
        <div className="flex items-center gap-10">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>Alliance_Live</span>
           </div>
           <span>L: 12ms</span>
           <span>R: 1080p_Visual</span>
        </div>
        <div className="flex items-center gap-10">
           <span>Kernel_v4.2.0-Sovereign</span>
           <span>© 2025 Franklin Alliance</span>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <NeuralProvider>
    <MainLayout />
  </NeuralProvider>
);

export default App;