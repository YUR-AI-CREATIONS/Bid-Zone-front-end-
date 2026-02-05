
import React from 'react';
import { Rocket, ShieldCheck, Cpu, ShieldAlert, Fingerprint } from 'lucide-react';

export const ValidatorPanel: React.FC<{ themeColor: string }> = ({ themeColor }) => (
  <div className="p-10 flex flex-col items-center text-center space-y-10 h-full justify-center">
    <div className="relative p-12 rounded-[40px] border border-white/20 bg-black/40 shadow-2xl backdrop-blur-3xl">
      <Cpu size={70} className="text-white animate-pulse" />
    </div>
    <div className="space-y-4">
      <h2 className="text-3xl font-black tracking-[0.4em] text-white uppercase">T3 Validator</h2>
      <p className="text-[10px] text-white/40 uppercase tracking-[0.6em] font-mono">CORE_PROTOCOL_PLATINUM</p>
    </div>
  </div>
);

export const FranklinHeader: React.FC = () => (
  <div className="flex items-center gap-3 px-4 py-2 border border-white/10 rounded-full bg-white/[0.02]">
    <Rocket size={14} className="text-white/40" />
    <span className="text-white text-[10px] uppercase font-black tracking-[0.3em]">FRANKLIN</span>
  </div>
);

export const SentinelHeader: React.FC = () => (
  <div className="flex items-center gap-3 px-4 py-2 border border-white/10 rounded-full bg-white/[0.02]">
    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
    <span className="text-white text-[10px] uppercase font-black tracking-[0.3em]">SENTINEL</span>
  </div>
);
