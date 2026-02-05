
import React from 'react';
import { X, Maximize2, Move, Minimize2, Square } from 'lucide-react';

interface PortWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  themeColor: string;
  className?: string;
  zIndex?: number;
  isActive?: boolean;
  isMaximized?: boolean;
  onClose?: () => void;
  onToggleMaximize?: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent) => void;
  onFocus?: () => void;
  style?: React.CSSProperties;
}

const PortWindow: React.FC<PortWindowProps> = ({ 
  title, 
  children, 
  icon, 
  className = "", 
  zIndex = 10,
  isActive = false,
  isMaximized = false,
  onClose,
  onToggleMaximize,
  onDragStart,
  onResizeStart,
  onFocus,
  style
}) => {
  return (
    <div 
      onMouseDown={onFocus}
      style={{ ...style, zIndex }}
      className={`
        absolute flex flex-col obsidian-glass border border-white/10 transition-all duration-300
        ${isMaximized ? '!inset-0 !w-full !h-full !translate-x-0 !translate-y-0 z-[1100]' : 'chrome-border'}
        ${isActive ? 'ring-1 ring-white/20 shadow-2xl' : 'opacity-80 scale-[0.99]'}
        ${className} overflow-hidden group/window
      `}
    >
      {/* Header - Razor Sharp */}
      <div 
        className={`
          flex items-center justify-between px-5 py-3 border-b border-white/10 
          ${isActive ? 'bg-white/[0.05]' : 'bg-white/[0.01]'} 
          cursor-grab active:cursor-grabbing select-none
        `}
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          onDragStart?.(e);
        }}
      >
        <div className="flex items-center gap-3">
          <div className="text-white/10 group-hover/window:text-white/40 transition-colors">
            <Move size={10} />
          </div>
          <div className={`transition-all duration-500 ${isActive ? 'text-white' : 'text-white/20'}`}>
            {icon}
          </div>
          <h3 className={`text-[9px] font-black tracking-[0.4em] uppercase transition-colors ${isActive ? 'text-white' : 'text-white/20'}`}>
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={onToggleMaximize}
            className="w-7 h-7 flex items-center justify-center border border-transparent hover:border-white/10 hover:bg-white/5 text-white/10 hover:text-white transition-all"
          >
            {isMaximized ? <Minimize2 size={10}/> : <Square size={10}/>}
          </button>
          <button 
            onClick={onClose} 
            className="w-7 h-7 flex items-center justify-center border border-transparent hover:border-red-500/20 text-white/10 hover:text-red-400 transition-all"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content Area - Square */}
      <div className="flex-1 overflow-hidden relative bg-black/40">
        {children}
      </div>

      {/* Resize Handle - Sharp */}
      {!isMaximized && onResizeStart && (
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-[100] flex items-end justify-end p-1 group/resize"
          onMouseDown={onResizeStart}
        >
          <div className="w-2 h-2 border-r border-b border-white/20 group-hover/resize:border-white/60 transition-colors"></div>
        </div>
      )}

      {/* Active Top Glow */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/40 blur-[0.5px]"></div>
      )}
    </div>
  );
};

export default PortWindow;
