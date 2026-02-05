import React, { useState, useEffect, useRef } from 'react';
import { 
  X, FolderArchive, Eye, Code, CloudUpload, FileArchive, Activity, Zap, Cpu, Box, FileCode, ChevronDown, ChevronUp, Grid, HardHat, LandPlot, Hammer, Ruler, Loader2
} from 'lucide-react';
import { FileMetadata } from '../types';

declare const JSZip: any;
declare const Prism: any;

interface ProcessedFile extends FileMetadata {
  status: 'uploading' | 'processing' | 'ready' | 'error';
  progress: number;
  manifest?: string[];
  previewOpen?: boolean;
}

interface Props {
  themeColor: string;
  onFileAdded?: (file: FileMetadata) => void;
}

const CodePreview: React.FC<{ content: string; fileName: string; themeColor: string }> = ({ content, fileName, themeColor }) => {
  const codeRef = useRef<HTMLElement>(null);
  
  const getLanguage = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': return 'javascript';
      case 'jsx': return 'jsx';
      case 'ts': return 'typescript';
      case 'tsx': return 'tsx';
      case 'py': return 'python';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'cpp': return 'cpp';
      case 'cs': return 'csharp';
      case 'go': return 'go';
      case 'dwg': return 'autocad'; // Specific language for DWG/DXF if Prism supports it or general text
      case 'dxf': return 'autocad';
      case 'xml': return 'xml';
      case 'txt': return 'text';
      default: return 'clike';
    }
  };

  useEffect(() => {
    if (codeRef.current && typeof Prism !== 'undefined') {
      Prism.highlightElement(codeRef.current);
    }
  }, [content]);

  const lang = getLanguage(fileName);

  return (
    <div className="mt-4 border border-white/10 bg-[#1d1f21] overflow-hidden">
      <div className="px-3 py-1 bg-black/40 border-b border-white/5 flex justify-between items-center">
        <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">{lang}</span>
        <FileCode size={10} className="text-white/20" />
      </div>
      <pre className="p-4 text-[10px] font-mono overflow-x-auto custom-scrollbar !m-0 !bg-transparent">
        <code ref={codeRef} className={`language-${lang} !bg-transparent`}>
          {content}
        </code>
      </pre>
    </div>
  );
};

const FilePort: React.FC<Props> = ({ themeColor, onFileAdded }) => {
  const [files, setFiles] = useState<ProcessedFile[]>([]
);
  const [isDragging, setIsDragging] = useState(false);

  const updateProgress = (id: string, progress: number, status?: ProcessedFile['status']) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, progress, ...(status ? { status } : {}) } : f));
  };

  const simulateProgress = (id: string, duration: number, onComplete: () => void) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(Math.round((elapsed / duration) * 100), 95);
      updateProgress(id, progress);
      if (elapsed >= duration) {
        clearInterval(interval);
        onComplete();
      }
    }, 100);
    return interval;
  };

  const processFile = async (file: File) => {
    const fileId = Math.random().toString(36).substr(2, 9);
    
    if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
      await handleZip(file, fileId);
      return;
    }

    const newFile: ProcessedFile = {
      id: fileId, name: file.name, size: file.size, type: 'raw', path: file.name, status: 'uploading', progress: 0, mimeType: file.type
    };
    setFiles(prev => [newFile, ...prev]);

    simulateProgress(fileId, 800, () => {
      const reader = new FileReader();
      const isImage = file.type.startsWith('image/');
      const isDWG_DXF = file.name.endsWith('.dwg') || file.name.endsWith('.dxf');
      
      reader.onload = () => {
        const result = reader.result as string;
        const updated = { ...newFile, status: 'ready' as const, data: result, progress: 100 };
        setFiles(prev => prev.map(f => f.id === fileId ? updated : f));
        if (onFileAdded) onFileAdded(updated);
      };

      if (isImage) {
        reader.readAsDataURL(file); // Important: for visual engine to read plans
      } else if (isDWG_DXF) {
        reader.readAsText(file, 'UTF-8'); // Attempt to read as text for preview
      }
      else {
        reader.readAsText(file);
      }
    });
  };

  const handleZip = async (file: File, id: string) => {
    const newFile: ProcessedFile = {
      id, name: file.name, size: file.size, type: 'zip', path: file.name, status: 'processing', progress: 0, mimeType: file.type
    };
    setFiles(prev => [newFile, ...prev]);

    try {
      simulateProgress(id, 2000, async () => {
        const zip = await JSZip.loadAsync(file);
        const manifest: string[] = [];
        zip.forEach((path: string) => {
          manifest.push(path);
        });
        const updated = { ...newFile, status: 'ready' as const, progress: 100, manifest };
        setFiles(prev => prev.map(f => f.id === id ? updated : f));
        if (onFileAdded) onFileAdded(updated);
      });
    } catch (e) {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error' } : f));
    }
  };

  const togglePreview = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, previewOpen: !f.previewOpen } : f));
  };

  const isCodeFile = (name: string) => {
    const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'json', 'md', 'cpp', 'cs', 'go', 'txt', 'c', 'h', 'java', 'dwg', 'dxf', 'xml', 'bim'];
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return codeExtensions.includes(ext);
  };

  return (
    <div 
      className="p-4 h-full flex flex-col gap-4 overflow-hidden"
      onDragEnter={() => setIsDragging(true)}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); Array.from(e.dataTransfer.files).forEach(processFile); }}
    >
      <label className={`border border-dashed py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all ${isDragging ? 'bg-white/10 border-white/40' : 'border-white/10'}`}>
         <CloudUpload size={24} className="mb-2 opacity-20" />
         <span className="text-[9px] font-black tracking-widest uppercase">Ingest_Blueprints_Specs</span>
         <span className="text-[7px] opacity-40 mt-1 uppercase">Supports ZIP, PDF, DWG, BIM, JPEG</span>
         <input type="file" multiple className="hidden" onChange={(e) => Array.from(e.target.files || []).forEach(processFile)} />
      </label>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
        {files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 opacity-10">
            <Ruler size={32} />
            <span className="text-[8px] font-black tracking-[0.3em] uppercase mt-4">Vault_Empty</span>
          </div>
        )}
        
        {files.map(file => (
          <div key={file.id} className={`border p-4 bg-black/40 group relative transition-all duration-300 ${file.status === 'ready' ? 'border-white/5' : 'border-white/20'}`}>
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-white/5 flex items-center justify-center bg-black/20 overflow-hidden">
                   {file.status === 'processing' || file.status === 'uploading' ? (
                     <Loader2 size={16} className="animate-spin" style={{ color: themeColor }} />
                   ) : file.mimeType?.startsWith('image/') && file.data ? (
                     <img src={file.data} className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity" alt="Plan Preview" />
                   ) : file.type === 'zip' ? (
                     <FolderArchive size={16} style={{ color: themeColor }} />
                   ) : (
                     <Box size={16} style={{ color: themeColor }} />
                   )}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold truncate uppercase tracking-widest">{file.name}</p>
                    {isCodeFile(file.name) && file.status === 'ready' && file.data && (
                      <button 
                        onClick={() => togglePreview(file.id)}
                        className="p-1 hover:bg-white/5 text-white/20 hover:text-white transition-colors"
                      >
                        {file.previewOpen ? <ChevronUp size={12} /> : <Eye size={12} />}
                      </button>
                    )}
                   </div>
                   <div className="flex items-center justify-between">
                     <p className="text-[8px] opacity-20 font-mono">{(file.size/1024).toFixed(1)}KB // {file.status.toUpperCase()}</p>
                     {file.status !== 'ready' && file.status !== 'error' && (
                       <span className="text-[8px] font-black" style={{ color: themeColor }}>{file.progress}%</span>
                     )}
                   </div>
                </div>
             </div>

             {file.previewOpen && file.data && (
               <CodePreview content={file.data} fileName={file.name} themeColor={themeColor} />
             )}

             {file.manifest && (
               <div className="mt-4 pt-4 border-t border-white/5 space-y-1">
                  <span className="text-[8px] font-black tracking-widest opacity-40 uppercase flex items-center gap-2">
                    <Grid size={8} /> Structural_Artifacts:
                  </span>
                  <div className="max-h-32 overflow-y-auto custom-scrollbar">
                     {file.manifest.slice(0, 10).map((p, i) => (
                       <div key={i} className="text-[8px] font-mono opacity-20 truncate border-l border-white/5 ml-1 pl-2 py-0.5">
                         └─ {p}
                       </div>
                     ))}
                     {file.manifest.length > 10 && (
                       <div className="text-[8px] font-mono opacity-20 mt-1 italic pl-3">
                         ... {file.manifest.length - 10} more sheets detected
                       </div>
                     )}
                  </div>
               </div>
             )}
             
             {/* Progress Bar for Uploads/Processing */}
             {file.status !== 'ready' && file.status !== 'error' && (
               <div className="mt-4 h-1.5 w-full bg-white/5 overflow-hidden border border-white/10">
                 <div 
                   className="h-full transition-all duration-300 relative" 
                   style={{ width: `${file.progress}%`, backgroundColor: themeColor }} 
                 >
                   <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                 </div>
               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilePort;