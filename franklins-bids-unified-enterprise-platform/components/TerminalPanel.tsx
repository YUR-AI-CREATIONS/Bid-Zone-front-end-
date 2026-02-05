
import React, { useEffect, useRef, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../services/fileService';

interface Props {
  logs: string[];
  themeColor: string;
  onCommand?: (cmd: string) => void;
}

const TerminalPanel: React.FC<Props> = ({ logs, themeColor, onCommand }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tempCommand, setTempCommand] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!command.trim()) return;
      
      const newHistory = [command, ...history].slice(0, 50);
      setHistory(newHistory);
      setHistoryIndex(-1);
      setTempCommand('');
      
      if (onCommand) {
        onCommand(command);
      }
      
      setCommand('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      if (historyIndex === -1) {
        setTempCommand(command);
      }
      
      setHistoryIndex(newIndex);
      setCommand(history[newIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      
      if (newIndex <= -1) {
        setHistoryIndex(-1);
        setCommand(tempCommand);
      } else {
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      }
    }
  };

  const handleCopyLogs = async () => {
    const logText = logs.join('\n');
    const success = await copyToClipboard(logText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/60 font-mono text-[11px] overflow-hidden border-x border-white/5">
      {/* Terminal Header with Copy Utility */}
      <div className="px-6 py-2 border-b border-white/5 flex items-center justify-between bg-black/40 select-none">
        <span className="text-[8px] font-black tracking-widest text-white/30 uppercase">System_Buffer</span>
        <button 
          onClick={handleCopyLogs}
          className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
          title="Copy all logs"
        >
          {copied ? <Check size={10} style={{ color: themeColor }} /> : <Copy size={10} className="text-white/40" />}
          <span className="text-[8px] font-bold text-white/40">{copied ? 'COPIED' : 'CLONE_BUFFER'}</span>
        </button>
      </div>

      <div 
        className="flex-1 p-6 overflow-y-auto custom-scrollbar cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-col gap-2 opacity-80">
          <div className="text-white/20 mb-4 border-b border-white/5 pb-2">
            PS C:\USERS\YUR_AI\SDK_CLOUD> INIT_REMOTE_SHELL
            <br />
            AUTHENTICATING WITH GOOGLE_GENAI_SERVICE... DONE.
            <br />
            NODE_VERSION: v3.1.2-PREVIEW
            <br />
            STATUS: HANDSHAKE_ESTABLISHED
          </div>
          
          {logs.map((log, i) => {
            const isError = log.includes('ERR') || log.includes('INTERRUPT');
            const isSuccess = log.includes('COMPLETE') || log.includes('SYNC');
            const isInput = log.includes('> ');
            
            return (
              <div key={i} className="flex gap-4 items-start group">
                <span className="opacity-10 shrink-0 font-bold group-hover:opacity-30 transition-opacity select-none">[{i.toString().padStart(3, '0')}]</span>
                <span className={`leading-relaxed whitespace-pre-wrap ${isInput ? 'lit-text' : isError ? 'text-red-500 font-bold' : isSuccess ? 'text-emerald-400' : 'text-white/60'}`} style={isInput ? { '--theme-color': themeColor } as any : {}}>
                  {log}
                </span>
              </div>
            );
          })}

          <div className="flex items-center gap-3 mt-4 group">
            <span style={{ color: themeColor }} className="font-black bg-white/10 px-2 py-0.5 shrink-0 select-none">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              autoFocus
              autoComplete="off"
              spellCheck="false"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/5 caret-white"
              placeholder="ENTER_CMD..."
            />
            <div ref={endRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalPanel;
