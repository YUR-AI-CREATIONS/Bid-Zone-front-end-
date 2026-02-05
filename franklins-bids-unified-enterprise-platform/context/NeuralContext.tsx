import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { NeuralNode, AIModel, User, WindowConfig } from '../types';

interface NeuralState {
  user: User | null; // New: Authenticated user object
  neonTheme: any;
  activeNode: NeuralNode;
  nodes: NeuralNode[];
  logs: string[];
  centralBrainDNA: string;
  isPaletteOpen: boolean;
  windows: WindowConfig[];
  activeWindowId: string | null;
}

type NeuralAction =
  | { type: 'SET_THEME'; payload: any }
  | { type: 'ADD_LOG'; payload: string }
  | { type: 'UPDATE_ACTIVE_NODE'; payload: Partial<NeuralNode> }
  | { type: 'SET_DNA'; payload: string }
  | { type: 'TOGGLE_WINDOW'; id: string; open?: boolean }
  | { type: 'UPDATE_WINDOW'; id: string; payload: Partial<WindowConfig> }
  | { type: 'FOCUS_WINDOW'; id: string }
  | { type: 'SET_PALETTE'; open: boolean }
  | { type: 'SET_USER'; payload: User | null }; // New: Action to set user

const initialWindows: WindowConfig[] = [
  { id: 'vault', title: 'CONSTRUCTION_VAULT', isOpen: true, isMaximized: false, zIndex: 5, x: 40, y: 40, width: 340, height: 600, icon: 'folder' },
  { id: 'chat', title: 'TAKEOFF_ORACLE', isOpen: true, isMaximized: false, zIndex: 10, x: 400, y: 40, width: 680, height: 740, icon: 'message' },
  { id: 'oracle', title: 'DISCIPLINE_CONTROL', isOpen: true, isMaximized: false, zIndex: 5, x: 1100, y: 40, width: 340, height: 500, icon: 'cpu' },
  { id: 'live', title: 'ACOUSTIC_COORD', isOpen: false, isMaximized: false, zIndex: 5, x: 1100, y: 560, width: 340, height: 220, icon: 'radio' },
  { id: 'terminal', title: 'FRANKLIN_OS_LOGS', isOpen: false, isMaximized: false, zIndex: 5, x: 40, y: 660, width: 340, height: 250, icon: 'terminal' },
];

// Function to load initial user from localStorage
const loadInitialUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem('mockUser');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Failed to parse mock user from localStorage:", error);
    return null;
  }
};

const initialState: NeuralState = {
  user: loadInitialUser(), // Load user on initial state setup
  neonTheme: { id: 'bid-yellow', color: '#facc15', label: 'SAFETY_GOLD', type: 'neon' },
  activeNode: {
    id: 'bid_root',
    name: 'PROJECT_MASTER',
    dna: '// FRANKLIN_ORCHESTRATION_V3\n// INITIALIZING_CSI_MAPPING...',
    model: 'MASTER_FRANKLIN',
    files: [],
    history: [],
    status: 'IDLE'
  },
  nodes: [],
  logs: [`[${new Date().toLocaleTimeString()}] FRANKLIN OS: KERNEL_INITIALIZED // BID-ZONE ONLINE`],
  centralBrainDNA: '// FRANKLIN_OS_IDLE // READY_FOR_TAKEOFF',
  isPaletteOpen: false,
  windows: initialWindows,
  activeWindowId: 'chat',
};

const NeuralContext = createContext<{
  state: NeuralState;
  dispatch: React.Dispatch<NeuralAction>;
  addLog: (msg: string) => void;
} | undefined>(undefined);

function neuralReducer(state: NeuralState, action: NeuralAction): NeuralState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, neonTheme: action.payload };
    case 'ADD_LOG':
      return { ...state, logs: [...state.logs.slice(-50), `[${new Date().toLocaleTimeString()}] ${action.payload}`] };
    case 'UPDATE_ACTIVE_NODE':
      return { ...state, activeNode: { ...state.activeNode, ...action.payload } };
    case 'SET_DNA':
      return { ...state, centralBrainDNA: action.payload };
    case 'TOGGLE_WINDOW':
      return {
        ...state,
        windows: state.windows.map(w => w.id === action.id ? { ...w, isOpen: action.open ?? !w.isOpen } : w),
        activeWindowId: action.id
      };
    case 'UPDATE_WINDOW':
      return {
        ...state,
        windows: state.windows.map(w => w.id === action.id ? { ...w, ...action.payload } : w)
      };
    case 'FOCUS_WINDOW':
      const maxZ = Math.max(...state.windows.map(w => w.zIndex), 10);
      return {
        ...state,
        activeWindowId: action.id,
        windows: state.windows.map(w => w.id === action.id ? { ...w, zIndex: maxZ + 1 } : w)
      };
    case 'SET_PALETTE':
      return { ...state, isPaletteOpen: action.open };
    case 'SET_USER': // New case for setting user
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

export const NeuralProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(neuralReducer, initialState);
  const addLog = useCallback((msg: string) => dispatch({ type: 'ADD_LOG', payload: msg }), []);

  return (
    <NeuralContext.Provider value={{ state, dispatch, addLog }}>
      {children}
    </NeuralContext.Provider>
  );
};

export const useNeural = () => {
  const context = useContext(NeuralContext);
  if (!context) throw new Error('useNeural must be used within a NeuralProvider');
  return context;
};