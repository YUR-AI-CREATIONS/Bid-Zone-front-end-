
export type AIModel = 
  | 'STRUCTURAL_AGENT' 
  | 'MEP_AGENT' 
  | 'FINISHES_AGENT'
  | 'SITE_WORK_AGENT'
  | 'LAND_PROCUREMENT'
  | 'ENVIRONMENTAL_AGENT'
  | 'ORACLE_ESTIMATOR'
  | 'VISUAL_RENDERER'
  | 'TEMPORAL_VEO'
  | 'ACOUSTIC_LIVE'
  | 'MASTER_FRANKLIN'
  | 'PROJECT_MANAGER_AGENT'
  | 'DEVELOPMENT_PLANNER' // New agent for layout generation and planning
  | 'RISK_ANALYZER'      // New agent for project risk assessment
  | 'GEOTECH_ENGINEER';   // New agent for geotechnical analysis

// Fix: Declare global window.aistudio property once directly within the global scope.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

export interface User {
  id: string;
  email: string;
  isSubscribed: boolean; // New: Indicates if user has an active premium subscription
  tier: 'BASIC' | 'PREMIUM'; // New: User's subscription tier
  credits: number; // New: Remaining API credits
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  nodes: NeuralNode[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  path: string;
  content?: string;
  data?: string;
  mimeType?: string;
  isOpen?: boolean;
  isTrained?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  mediaUrl?: string;
  mediaType?: 'video' | 'image';
  groundingUrls?: string[];
  isThinking?: boolean;
  isSynaptic?: boolean;
}

export interface VoiceSettings {
  voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  speed: number;
  deepness: number;
  softness: number;
  elegance: number;
  arrogance: number;
}

export interface NeuralNode {
  id: string;
  name: string;
  parentId?: string;
  dna: string;
  model: AIModel;
  files: FileMetadata[];
  history: ChatMessage[];
  status: 'IDLE' | 'TRAINING' | 'ACTIVE';
}

export interface WindowConfig {
  id: string;
  title: string;
  isOpen: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  icon: string;
}