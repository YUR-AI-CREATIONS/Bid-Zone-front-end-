import React, { useState } from 'react';
import { User as UserIcon, Loader2, ShieldCheck, ShieldAlert, AtSign, KeyRound, ToggleLeft, ToggleRight, LogOut } from 'lucide-react';
import LiquidBackground from './LiquidBackground';
import GhostSignature from './GhostSignature'; // Fix: Corrected relative import path
import { apiService } from '../services/apiService';
import { User as UserType } from '../types'; // Alias User from types.ts to avoid conflict

interface AuthScreenProps {
  themeColor: string;
  onAuthSuccess: (user: UserType | null) => void; // Corrected: onAuthSuccess can take null
}

const AuthScreen: React.FC<AuthScreenProps> = ({ themeColor, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulatePremium, setSimulatePremium] = useState(false); // New: Toggle for premium status

  const handleAuth = async (mode: 'signin' | 'signup') => {
    setIsLoading(true);
    setError(null);
    try {
      // Pass simulatePremium flag to the (simulated) API service
      const user = await apiService.authenticate(email, password, mode, simulatePremium);
      onAuthSuccess(user); // Pass the authenticated user to App.tsx
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await apiService.signOut();
      onAuthSuccess(null); // Clear user in NeuralContext
    } catch (err: any) {
      setError(err.message || 'Sign out failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const storedUser = localStorage.getItem('mockUser');
  const loggedInMockUser = storedUser ? JSON.parse(storedUser) : null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center p-8 font-space">
      <GhostSignature themeColor={themeColor} isComputing={isLoading} />
      <LiquidBackground themeColor={themeColor} />

      <div className="max-w-xl w-full p-10 border border-white/10 obsidian-glass text-center space-y-8 relative z-10">
        <ShieldCheck size={48} className="mx-auto text-yellow-400 animate-pulse" />
        <h2 className="text-2xl font-black tracking-widest uppercase chrome-text">SOVEREIGN_AUTHENTICATION</h2>
        <p className="text-xs font-mono opacity-60 leading-relaxed uppercase tracking-wider">
          ACCESSING SIMULATED HUMAN-AI ALLIANCE NETWORK. Any credentials will work.
        </p>

        {error && (
          <div className="p-4 bg-red-900/40 border border-red-700/60 text-red-300 text-xs font-mono tracking-widest uppercase">
            {error}
          </div>
        )}

        {loggedInMockUser ? (
          <div className="space-y-4">
            <p className="text-[13px] font-black uppercase tracking-widest text-white/80">WELCOME_BACK, {loggedInMockUser.email}</p>
            <p className="text-[10px] font-mono opacity-60">STATUS: {loggedInMockUser.tier} // SUBSCRIBED: {loggedInMockUser.isSubscribed ? 'TRUE' : 'FALSE'}</p>
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full py-4 bg-red-800/60 border border-red-700/50 text-white font-black uppercase tracking-[0.3em] hover:bg-red-700/60 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
              TERMINATE_SESSION
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-5 mt-6">
              <div className="relative">
                <AtSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                <input
                  type="email"
                  placeholder="ENTER_SOVEREIGN_EMAIL"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-4 pl-12 pr-4 bg-black/40 border border-white/10 text-white placeholder:text-white/20 text-[13px] font-mono tracking-wider focus:border-yellow-400/50 transition-all"
                />
              </div>
              <div className="relative">
                <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                <input
                  type="password"
                  placeholder="ENTER_SOVEREIGN_PASSPHRASE"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-4 pl-12 pr-4 bg-black/40 border border-white/10 text-white placeholder:text-white/20 text-[13px] font-mono tracking-wider focus:border-yellow-400/50 transition-all"
                />
              </div>
            </div>

            {/* Premium Simulation Toggle */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <span className="text-[10px] font-black tracking-widest uppercase opacity-40">SIMULATE_PREMIUM_ACCOUNT</span>
              <button 
                onClick={() => setSimulatePremium(!simulatePremium)}
                className="p-2 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                {simulatePremium ? <ToggleRight size={24} color={themeColor} /> : <ToggleLeft size={24} className="opacity-40" />}
              </button>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => handleAuth('signin')}
                disabled={isLoading}
                className="flex-1 py-4 bg-white text-black font-black uppercase tracking-[0.3em] hover:bg-yellow-400 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
              >
                {isLoading && !isSigningUp ? <Loader2 size={20} className="animate-spin" /> : <UserIcon size={20} />}
                SIGN_IN
              </button>
              <button
                onClick={() => { setIsSigningUp(true); handleAuth('signup'); }}
                disabled={isLoading}
                className="flex-1 py-4 bg-yellow-400 text-black font-black uppercase tracking-[0.3em] hover:bg-yellow-300 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
              >
                {isLoading && isSigningUp ? <Loader2 size={20} className="animate-spin" /> : <UserIcon size={20} />}
                SIGN_UP
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;