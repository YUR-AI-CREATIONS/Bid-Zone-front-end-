import { useState, useCallback, useEffect } from 'react';
import { useNeural } from '../context/NeuralContext';
import { geminiService } from '../services/geminiService';
import { handleKernelRequest, Trinity } from '../services/kernelService';
import { ChatMessage, AIModel, FileMetadata } from '../types';

export const useNeuralEngine = () => {
  const { state, dispatch, addLog } = useNeural();
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  // Define premium agents (must match agent names in ModelOrchestrator.tsx)
  const PREMIUM_AGENTS: AIModel[] = [
    'MASTER_FRANKLIN', 
    'PROJECT_MANAGER_AGENT', 
    'LAND_PROCUREMENT', 
    'DEVELOPMENT_PLANNER', 
    'GEOTECH_ENGINEER', 
    'MEP_AGENT', 
    'RISK_ANALYZER', 
    'ENVIRONMENTAL_AGENT', 
    'VISUAL_RENDERER', 
    'TEMPORAL_VEO'
  ];

  // Initialize Kernel Engines
  useEffect(() => {
    Trinity.registerEngine("gemini_core", async (task) => {
      return await geminiService.sendMessage(task.history, task.model, task.options);
    });
    Trinity.registerEngine("dna_trainer", async (task) => {
      return await geminiService.trainSynapticNode(task.files);
    });
    Trinity.registerEngine("prompt_optimizer", async (task) => {
      return await geminiService.optimizePrompt(task.prompt);
    });

    // Handle audit logs visually
    (window as any).onKernelAudit = (event: any) => {
      addLog(`[${event.layer.toUpperCase()}] ${event.action || event.intent || 'OBSERVATION'} // KERNEL:${event.kernel.slice(0,6)}`);
    };
  }, [addLog]);

  const trainSynapticNode = useCallback(async (files: FileMetadata[]) => {
    setIsTraining(true);
    addLog("FRANKLIN_OS: MAPPING_BLUEPRINT_DATA...");
    try {
      // Persist the files in state first so the engine has them
      dispatch({ 
        type: 'UPDATE_ACTIVE_NODE', 
        payload: { files: [...state.activeNode.files, ...files] } 
      });

      const result = await handleKernelRequest(
        "train_neural_dna",
        "dna_trainer",
        { files }
      );
      
      const finalDna = typeof result === 'string' ? result : (result.text || "DNA_ERROR");
      
      const mergedDNA = `// FRANKLIN_STRANDS_ENGAGED\n// CSI_MAPPING_INITIALIZED: ${new Date().toISOString()}\n${finalDna}`;
      dispatch({ type: 'SET_DNA', payload: mergedDNA });
      dispatch({ type: 'UPDATE_ACTIVE_NODE', payload: { dna: mergedDNA, status: 'ACTIVE' } });
      addLog("ESTIMATING_CORE: SHEETS_INDEXED_SUCCESSFULLY");
    } catch (e: any) {
      addLog(`MAPPING_ERR: ${e.message}`);
    } finally {
      setIsTraining(false);
    }
  }, [dispatch, addLog, state.activeNode.files]);

  const sendMessage = useCallback(async (prompt: string) => {
    if (!prompt.trim() || isChatLoading) return;

    // Check for premium agent access
    const isPremiumAgentSelected = PREMIUM_AGENTS.includes(state.activeNode.model);
    if (isPremiumAgentSelected && !state.user?.isSubscribed) {
      addLog(`ACCESS_DENIED: AGENT_LOCKOUT - ${state.activeNode.model} requires PREMIUM_TIER.`);
      // Optionally show a more prominent UI notification here
      return; 
    }
    
    setIsChatLoading(true);
    setIsOptimizing(true);
    addLog("FRANKLIN_OS: OPTIMIZING_TAKEOFF_LOGIC...");
    
    let finalPrompt = prompt;
    try {
      const optimizedRes = await handleKernelRequest(
        "optimize_intent",
        "prompt_optimizer",
        { prompt }
      );
      finalPrompt = optimizedRes._signed_by ? (optimizedRes.text || optimizedRes) : optimizedRes;
      if (typeof finalPrompt !== 'string') finalPrompt = prompt;
      addLog("TAKEOFF_OPTIMIZED: DISCIPLINE_MAPPED.");
    } catch (e) {
      addLog("OPTIMIZER_FAILED: USING_RAW_STREAM.");
    } finally {
      setIsOptimizing(false);
    }

    const userMsg: ChatMessage = { role: 'user', content: finalPrompt, timestamp: new Date() };
    const currentHistory = [...state.activeNode.history, userMsg];
    dispatch({ type: 'UPDATE_ACTIVE_NODE', payload: { history: currentHistory } });

    setIsThinking(true);
    addLog(`AGENT_ENGAGED: ${state.activeNode.model}`);
    try {
      const response = await handleKernelRequest(
        "execute_inference",
        "gemini_core",
        {
          history: currentHistory,
          model: state.activeNode.model,
          options: {
            neuralDNA: state.activeNode.dna,
            attachedFiles: state.activeNode.files // CRITICAL: This ensures uploaded plans are sent
          }
        }
      );

      const modelMsg: ChatMessage = {
        role: 'model',
        content: response.text || "NO_DATA",
        timestamp: new Date(),
        mediaUrl: response.mediaUrl,
        mediaType: response.mediaType,
        groundingUrls: response.groundingUrls,
        isSynaptic: state.activeNode.status === 'ACTIVE'
      };

      dispatch({ type: 'UPDATE_ACTIVE_NODE', payload: { history: [...currentHistory, modelMsg] } });
      addLog("TAKEOFF_COMPLETE: TRANSMISSION_OK");
    } catch (e: any) {
      addLog(`AGENT_ERR: ${e.message}`);
    } finally {
      setIsChatLoading(false);
      setIsThinking(false);
    }
  }, [state, dispatch, addLog, isChatLoading, state.user?.isSubscribed]); // Added state.user.isSubscribed as dependency

  return { sendMessage, trainSynapticNode, isChatLoading, isThinking, isOptimizing, isTraining };
};