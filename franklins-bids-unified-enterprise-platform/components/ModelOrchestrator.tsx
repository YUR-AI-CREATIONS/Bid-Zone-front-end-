
import React, { useState, useMemo } from 'react';
import { 
  Cpu, Zap, Map, Image, Video, Radio, Search, 
  BrainCircuit, Lock, ShieldCheck, ShieldAlert, 
  Activity, Workflow, Copy, Check, Hammer, 
  Building2, HardHat, LandPlot, FileSearch, 
  Target, Info, Layers, Boxes, Ruler, 
  Compass, Drill, Construction, UtilityPole,
  Scale, BarChart3, TrendingUp, Handshake, Landmark, Grid // Fix: Added Grid to imports
} from 'lucide-react';
import { AIModel } from '../types';
import { useNeural } from '../context/NeuralContext';
import { copyToClipboard } from '../services/fileService';
import { apiService } from '../services/apiService'; // Import apiService

interface ModelOrchestratorProps {
  selectedModel: AIModel;
  onSelect: (model: AIModel) => void;
  themeColor: string;
  isSubscribed: boolean;
  config: {
    aspectRatio: string;
    imageSize: string;
  };
  onConfigChange: (key: string, value: string) => void;
}

const AGENT_GROUPS = [
  {
    label: 'SOVEREIGN_ORCHESTRATION',
    agents: [
      { 
        name: 'MASTER_FRANKLIN', 
        icon: <Building2 />, 
        desc: 'MASTER CIVIL ENGINEER: LAND PROCUREMENT, FEASIBILITY, LEGAL, MARKET ANALYSIS, ALL-DISCIPLINE MASTER ESTIMATOR, INDUSTRY PRICING & FORMATTING', 
        premium: true 
      },
      { name: 'PROJECT_MANAGER_AGENT', icon: <ShieldAlert />, desc: 'TIMELINE_RESOURCES_RISK_AUDIT, SUBMITTALS', premium: true },
      { name: 'ORACLE_ESTIMATOR', icon: <BrainCircuit />, desc: 'CSI_MASTERFORMAT_2024_ESTIMATING, VALUE_ENGINEERING' },
    ]
  },
  {
    label: 'LAND_DEVELOPMENT_COMPONENTS',
    agents: [
      { 
        name: 'LAND_PROCUREMENT', 
        icon: <Landmark />, 
        desc: 'MARKET ANALYSIS, FEASIBILITY STUDIES, ENVIRONMENTAL PHASE 1, FINANCIAL PROFORMA, REAL_ESTATE_LAW', 
        premium: true 
      },
      { 
        name: 'DEVELOPMENT_PLANNER', // New Agent
        icon: <Grid />, 
        desc: '5 LAYOUT OPTIONS, ZONING COMPLIANCE, 2D/3D RENDERING, COST_REVENUE_COMPARISON', 
        premium: true 
      },
      { 
        name: 'GEOTECH_ENGINEER', // New Agent
        icon: <Drill />, 
        desc: 'SOIL PROPERTIES, BEARING CAPACITY, ROCK ANALYSIS, FOUNDATION RECS, EARTHWORK', 
        premium: true 
      },
    ]
  },
  {
    label: 'CONSTRUCTION_DISCIPLINES',
    agents: [
      { name: 'STRUCTURAL_AGENT', icon: <Hammer />, desc: 'BEAM_LOAD_FOUNDATION_QUANTITIES, STEEL_CONCRETE_WOOD_TAKEOFF' },
      { name: 'MEP_AGENT', icon: <Zap />, desc: 'MECHANICAL_ELEC_PLUMBING_LOGIC, HVAC_DUCTING_PIPE_SIZING', premium: true },
      { name: 'FINISHES_AGENT', icon: <Activity />, desc: 'ARCH_FINISHES_QUANTITY_TAKEOFF, MATERIAL_SPEC_COMPLIANCE' },
      { name: 'SITE_WORK_AGENT', icon: <LandPlot />, desc: 'EARTHWORK_GRADING_CUT_FILL, UTILITY_TRENCHING, ROADWAYS' },
    ]
  },
  {
    label: 'ADVANCED_ANALYSIS',
    agents: [
      { 
        name: 'RISK_ANALYZER', // New Agent
        icon: <ShieldCheck />, 
        desc: 'COST_RISK_IDENTIFICATION, MITIGATION_STRATEGIES, CONTINGENCY_CALCULATION, SENSITIVITY_ANALYSIS', 
        premium: true 
      },
      { name: 'ENVIRONMENTAL_AGENT', icon: <Handshake />, desc: 'ASTM_E1527_PHASE_1_REPORTS, HAZMAT_ID_MITIGATION', premium: true },
      { name: 'VISUAL_RENDERER', icon: <Image />, desc: '2D_CAD_3D_INFRASTRUCTURE_RENDER, TERRAIN_BUILDING_CUT_FILL' },
      { name: 'TEMPORAL_VEO', icon: <Video />, desc: 'CONSTRUCTION_PHASING_ANIMATION, PROJECT_TIMELINE_VISUAL' },
    ]
  }
];

const ModelOrchestrator: React.FC<ModelOrchestratorProps> = ({ selectedModel, onSelect, themeColor, isSubscribed, config, onConfigChange }) => {
  const { state, dispatch, addLog } = useNeural(); // Fix: Destructure 'dispatch' from useNeural
  const [activeTab, setActiveTab] = useState<'agents' | 'dna'>('agents');
  const [dnaCopied, setDnaCopied] = useState(false);

  const activeAgent = useMemo(() => {
    for (const group of AGENT_GROUPS) {
      const found = group.agents.find(a => a.name === selectedModel);
      if (found) return found;
    }
    // Default to the first agent in the first group if selectedModel isn't found
    return AGENT_GROUPS[0].agents[0];
  }, [selectedModel]);

  const handleCopyDNA = async () => {
    const success = await copyToClipboard(state.centralBrainDNA);
    if (success) {
      setDnaCopied(true);
      setTimeout(() => setDnaCopied(false), 2000);
      addLog("FRANKLIN: SYNAPTIC_STRANDS_COPIED");
    }
  };

  const handleUpgradeClick = async () => {
    try {
      addLog("SOVEREIGN_BILLING: INITIATING_STRIPE_SESSION...");
      const { url } = await apiService.createStripeSession();
      // In a real app, this would redirect to Stripe. For simulation, we just update local storage.
      // window.location.href = url; 
      
      // Simulate successful upgrade
      const mockUser = JSON.parse(localStorage.getItem('mockUser') || '{}');
      mockUser.isSubscribed = true;
      mockUser.tier = 'PREMIUM';
      mockUser.credits += 1000; // Add some credits for premium
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      
      // Force UI update
      if (state.user) {
        dispatch({ type: 'SET_USER', payload: mockUser }); // Fix: Use the 'dispatch' function directly
      }
      addLog("SOVEREIGN_BILLING: SUBSCRIPTION_UPGRADED_SUCCESSFULLY_SIMULATED");

    } catch (error: any) {
      addLog(`SOVEREIGN_BILLING_ERR: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/90 text-white font-space overflow-hidden">
      {/* HUD HEADER */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent sticky top-0 z-20 backdrop-blur-xl">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass size={10} className="text-yellow-400 animate-pulse" />
              <span className="text-[8px] font-black tracking-[0.5em] text-white/40 uppercase">COMMAND_CONTEXT</span>
            </div>
            <h2 className="text-2xl font-black tracking-widest chrome-text uppercase leading-tight">
              {selectedModel.replace(/_/g, ' ')}
            </h2>
            <div className="flex items-center gap-4 mt-2">
               <div className="px-2 py-0.5 border border-white/10 bg-white/5 text-[7px] font-mono opacity-60">ID: {activeAgent.name.slice(0, 8)}</div>
               <div className="px-2 py-0.5 border border-yellow-400/20 bg-yellow-400/5 text-[7px] font-mono text-yellow-400">STATUS: SYNCED</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse"></div>
            <div className="w-16 h-16 border border-white/20 flex items-center justify-center bg-black shadow-2xl relative z-10" style={{ borderColor: themeColor }}>
              <div style={{ color: themeColor }}>
                {/* Fix: Casting activeAgent.icon to React.ReactElement<any> to allow passing 'size' prop via cloneElement */}
                {React.cloneElement(activeAgent.icon as React.ReactElement<any>, { size: 32 })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex border border-white/5 bg-black/40">
           <button 
             onClick={() => setActiveTab('agents')}
             className={`flex-1 py-3 text-[9px] font-black tracking-widest transition-all ${activeTab === 'agents' ? 'bg-white/5 text-white' : 'opacity-20 hover:opacity-100'}`}
           >
             AGENT_COLLECTION
           </button>
           <button 
             onClick={() => setActiveTab('dna')}
             className={`flex-1 py-3 text-[9px] font-black tracking-widest transition-all ${activeTab === 'dna' ? 'bg-white/5 text-white' : 'opacity-20 hover:opacity-100'}`}
           >
             PROJECT_DNA
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
        {activeTab === 'agents' ? (
          <>
            {AGENT_GROUPS.map((group) => (
              <section key={group.label} className="space-y-4">
                <div className="flex items-center gap-4">
                   <span className="text-[9px] font-black tracking-[0.4em] text-white/20 uppercase whitespace-nowrap">{group.label}</span>
                   <div className="h-[1px] flex-1 bg-white/5"></div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {group.agents.map((agent) => {
                    const isActive = selectedModel === agent.name;
                    const isLocked = agent.premium && !isSubscribed;
                    return (
                      <button
                        key={agent.name}
                        onClick={() => !isLocked && onSelect(agent.name as AIModel)}
                        className={`
                          w-full p-4 flex items-center gap-4 transition-all border text-left group relative
                          ${isActive ? 'bg-white/5 border-white/20 ring-1 ring-white/10' : 'bg-transparent border-white/5 hover:bg-white/[0.02]'}
                          ${isLocked ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <div className={`transition-all duration-500 ${isActive ? 'scale-110 text-yellow-400' : 'opacity-40'}`}>
                          {/* Fix: Casting agent.icon to React.ReactElement<any> to allow passing 'size' prop via cloneElement */}
                          {React.cloneElement(agent.icon as React.ReactElement<any>, { size: 18 })}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center justify-between">
                              <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-white/40'}`}>
                                {agent.name.replace(/_AGENT|_ESTIMATOR|_RENDERER|_VEO|_PLANNER|_ENGINEER/g, '')}
                              </span>
                              {isLocked && <Lock size={10} className="text-white/20" />}
                              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_10px_#facc15]"></div>}
                           </div>
                           <p className="text-[8px] font-mono opacity-20 uppercase tracking-widest mt-1 truncate">
                             {agent.desc}
                           </p>
                        </div>
                        {/* Selection Glow */}
                        {isActive && (
                          <div className="absolute inset-0 bg-yellow-400/[0.02] pointer-events-none"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
            {/* Upgrade to Premium Section */}
            {!isSubscribed && state.user && (
              <div className="p-8 border border-yellow-400/20 bg-yellow-400/5 text-center space-y-4">
                <ShieldAlert size={24} className="mx-auto text-yellow-400" />
                <p className="text-[10px] font-black tracking-widest uppercase text-yellow-400">ACCESS_RESTRICTED: PREMIUM_TIER_REQUIRED</p>
                <p className="text-[8px] font-mono opacity-60">Unlock advanced orchestration and specialized agents for full BID-ZONE capabilities.</p>
                <button 
                  onClick={handleUpgradeClick}
                  className="px-6 py-3 bg-yellow-400 text-black text-[9px] font-black uppercase tracking-widest hover:bg-yellow-300 transition-all active:scale-95"
                >
                  UPGRADE_TO_PREMIUM
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Workflow size={12} className="text-yellow-400" />
                <span className="text-[10px] font-black tracking-widest uppercase opacity-40">MAPPING_MANIFEST</span>
              </div>
              <button 
                onClick={handleCopyDNA}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-[9px] font-black tracking-widest hover:bg-white/10"
              >
                {dnaCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                {dnaCopied ? 'STRANDS_CLONED' : 'CLONE_DNA'}
              </button>
            </div>
            <div className="p-6 bg-black border border-white/10 font-mono text-[10px] text-yellow-500/80 leading-relaxed selection:bg-yellow-500/20 custom-scrollbar overflow-auto max-h-[500px]">
              {state.centralBrainDNA.split('\n').map((line, i) => (
                <div key={i} className="whitespace-pre-wrap py-0.5 hover:bg-white/[0.02] transition-colors">
                  <span className="opacity-10 mr-4 select-none">{(i + 1).toString().padStart(3, '0')}</span>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
         <div className="flex items-center gap-2">
            <Info size={12} className="opacity-20" />
            <span className="text-[8px] font-mono opacity-20 uppercase">Context_Depth: 128k_tokens</span>
         </div>
         <div className="text-[8px] font-mono opacity-20 uppercase">v4.2.0_SOVEREIGN</div>
      </footer>
    </div>
  );
};

export default ModelOrchestrator;