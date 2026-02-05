
import React from 'react';
import { VoiceSettings } from '../types';
import { Volume2, Music, Mic, Ghost, Wind } from 'lucide-react';

interface Props {
  settings: VoiceSettings;
  onUpdate: (settings: VoiceSettings) => void;
  themeColor: string;
}

const VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'] as const;

const VoiceEqualizer: React.FC<Props> = ({ settings, onUpdate, themeColor }) => {
  const handleChange = (key: keyof VoiceSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  const sliders = [
    { key: 'speed', label: 'Velocity', min: 0.5, max: 2.0, step: 0.1, icon: <Wind size={12} /> },
    { key: 'deepness', label: 'Resonance', min: 0, max: 100, step: 1, icon: <Mic size={12} /> },
    { key: 'softness', label: 'Timbre', min: 0, max: 100, step: 1, icon: <Wind size={12} /> },
    { key: 'elegance', label: 'Elegance', min: 0, max: 100, step: 1, icon: <Ghost size={12} /> },
    { key: 'arrogance', label: 'Arrogance', min: 0, max: 100, step: 1, icon: <Ghost size={12} /> },
  ] as const;

  return (
    <div className="p-6 space-y-10 bg-black h-full overflow-y-auto custom-scrollbar">
      {/* Voice Selection */}
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] lit-text" style={{ '--theme-color': themeColor } as any}>CORE_SYNTHESIZER</label>
        <div className="grid grid-cols-1 gap-2">
          {VOICES.map(v => (
            <button
              key={v}
              onClick={() => handleChange('voiceName', v)}
              className={`w-full p-4 transition-all text-left flex items-center justify-between raised-object ${
                settings.voiceName === v ? 'raised-object-active' : ''
              }`}
              style={{ 
                borderTopColor: settings.voiceName === v ? themeColor : 'rgba(255,255,255,0.1)',
                borderLeftColor: settings.voiceName === v ? themeColor : 'rgba(255,255,255,0.1)',
                '--theme-color': themeColor
              } as any}
            >
              <span className={`text-[11px] font-black uppercase tracking-widest ${settings.voiceName === v ? 'lit-text' : 'text-white/20'}`} style={settings.voiceName === v ? { '--theme-color': themeColor } as any : {}}>
                {v}
              </span>
              <Volume2 size={14} className={settings.voiceName === v ? 'pulse-theme' : 'text-white/10'} style={{ color: settings.voiceName === v ? themeColor : undefined }} />
            </button>
          ))}
        </div>
      </div>

      {/* Sliders (The Equalizer) */}
      <div className="space-y-10 pb-10">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] lit-text" style={{ '--theme-color': themeColor } as any}>ACOUSTIC_EQUALIZER</label>
        
        {sliders.map(s => (
          <div key={s.key} className="space-y-4 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-white/20 group-hover:text-white transition-colors" style={{color: themeColor}}>
                  {s.icon}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] lit-description" style={{'--theme-color': themeColor} as any}>
                  {s.label}
                </span>
              </div>
              <span className="text-[10px] font-mono lit-text" style={{ '--theme-color': themeColor } as any}>
                {settings[s.key]}{s.key === 'speed' ? 'x' : '%'}
              </span>
            </div>
            
            <div className="relative h-1.5 bg-white/5 border border-white/10">
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={settings[s.key]}
                onChange={(e) => handleChange(s.key, parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div 
                className="absolute top-0 left-0 h-full transition-all duration-200"
                style={{ width: `${((settings[s.key] - s.min) / (s.max - s.min)) * 100}%`, backgroundColor: themeColor }}
              />
              {/* Lit Slider Thumb - Precise Sharp Square */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 border border-white bg-black transition-all duration-200 shadow-none"
                style={{ 
                  left: `calc(${((settings[s.key] - s.min) / (s.max - s.min)) * 100}% - 8px)`,
                  borderColor: themeColor,
                  borderWidth: '2px'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceEqualizer;
