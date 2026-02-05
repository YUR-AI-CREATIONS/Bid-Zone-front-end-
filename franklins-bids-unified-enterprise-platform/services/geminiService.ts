import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { ChatMessage, AIModel, FileMetadata, VoiceSettings, NeuralNode } from "../types";

export interface NeuralMetrics {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

export class GeminiService {
  // Use Vite environment variable with VITE_ prefix
  private getAI() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY not configured in .env file');
    }
    return new GoogleGenAI({ apiKey });
  }

  async optimizePrompt(userPrompt: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Reword this AEC command to be technically precise for a construction estimator. 
      COMMAND: "${userPrompt}"`,
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
        temperature: 0.4
      }
    });
    return response.text || userPrompt;
  }

  async trainSynapticNode(files: FileMetadata[]): Promise<string> {
    const ai = this.getAI();
    // Prioritize file contents but handle potentially massive specs by summarizing if needed
    const trainingData = files.map(f => `FILE_MANIFEST: ${f.name}\nMIME: ${f.mimeType}\nCONTENT_SAMPLE: ${f.data?.slice(0, 50000)}`).join('\n\n---\n\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a deep technical index of these AEC artifacts. Generate a project DNA that maps materials, dimensions, and CSI MasterFormat 2024 codes found in the files.
      DATASET:\n${trainingData}`,
      config: {
        thinkingConfig: { thinkingBudget: 12000 }
      }
    });

    return response.text || "NO_DNA_EXTRACTED";
  }

  private prepareHistory(history: ChatMessage[]) {
    let cleaned = history.filter(h => h.content?.trim() || h.mediaUrl);
    const result: any[] = [];
    let lastRole: string | null = null;
    
    for (const msg of cleaned) {
      const currentRole = msg.role === 'user' ? 'user' : 'model';
      if (currentRole === lastRole) {
         if (result.length > 0) {
           const lastMsg = result[result.length - 1];
           lastMsg.parts[0].text = (lastMsg.parts[0].text || "") + "\n" + (msg.content || "");
         }
         continue;
      }
      result.push({ role: currentRole, parts: [{ text: msg.content || "" }] });
      lastRole = currentRole;
    }
    
    if (result.length > 0 && result[0].role === 'model') result.shift();
    return result.slice(-15);
  }

  async sendMessage(
    history: ChatMessage[], 
    modelAlias: AIModel, 
    options: { 
      aspectRatio?: string; 
      imageSize?: string;
      attachedFiles?: FileMetadata[];
      location?: { latitude: number, longitude: number };
      neuralDNA?: string; 
    } = {},
    isFallback: boolean = false
  ): Promise<{ 
    text: string; 
    mediaUrl?: string; 
    mediaType?: 'image' | 'video'; 
    groundingUrls?: string[];
    metrics?: NeuralMetrics;
  }> {
    
    const ai = this.getAI();
    let targetModel: string;
    
    // STRICT AEC INSTRUCTIONS - Foundation for all agents
    let baseInstruction = `SYSTEM_ROLE: BID-ZONE_EXPERT_ALLIANCE_ENGINEER_V4\n`;
    baseInstruction += `CONTEXT_DNA: ${options.neuralDNA || 'EMPTY_DNA'}\n`;
    baseInstruction += `RULE: BASE EVERY CALCULATION, ANALYSIS, OR REPORT ON PROVIDED DOCUMENTS AND CONTEXT_DNA. \n`;
    baseInstruction += `RULE: IF DIMENSIONS OR CRITICAL DATA ARE NOT VISIBLE IN DATA, FLAG AS RFI. NEVER GUESS OR HALLUCINATE QUANTITIES/FACTS. \n`;
    baseInstruction += `ADHERE STRICTLY TO CSI MASTERFORMAT 2024 STANDARDS AND INDUSTRY BEST PRACTICES.\n`;
    baseInstruction += `PREVENT OVERTALK AND MAINTAIN CLARITY. CROSS-VALIDATE DATA.\n`;


    let config: any = { 
      temperature: 0.1, // Lower temperature for more deterministic/accurate estimates
      systemInstruction: baseInstruction
    };

    const formattedContents = this.prepareHistory(history);

    switch (modelAlias) {
      case 'MASTER_FRANKLIN':
        targetModel = 'gemini-3-pro-preview';
        config.thinkingConfig = { thinkingBudget: 32768 };
        // Enhanced system instruction for MASTER_FRANKLIN: Master Civil Engineer capabilities
        config.systemInstruction += `\nEXPERT_PROFILE: MASTER CIVIL ENGINEER & ALLIANCE ORCHESTRATOR. Specializing in:\n`;
        config.systemInstruction += ` - LAND PROCUREMENT & FEASIBILITY STUDIES (Market Analysis, Real Estate Valuation, Legal Review, Construction Law Compliance)\n`;
        config.systemInstruction += ` - MASTER ESTIMATOR (Full Knowledge of Industry-Specific Pricing, CSI MasterFormat 2024, Bid Formatting, Value Engineering, Risk Assessment, Contingency Planning)\n`;
        config.systemInstruction += ` - ADVANCED STRUCTURAL, MEP, FINISHES, SITE WORK, AND GEOTECHNICAL INTEGRATION.\n`;
        config.systemInstruction += ` - SYNTHESIZE MULTI-VISION API DATA (OpenAI Vision, Google Cloud Vision, Gemini for cross-validation).\n`;
        break;
      case 'ORACLE_ESTIMATOR':
        targetModel = 'gemini-3-pro-preview';
        config.thinkingConfig = { thinkingBudget: 32768 };
        config.systemInstruction += `\nEXPERT_PROFILE: ORACLE MASTER ESTIMATOR. Focus on:\n`;
        config.systemInstruction += ` - PRECISION COST TAKEOFFS using CSI MasterFormat 2024.\n`;
        config.systemInstruction += ` - UNIT PRICING, RESOURCE ALLOCATION, VALUE ENGINEERING.\n`;
        config.systemInstruction += ` - GENERATE DETAILED ESTIMATE REPORTS AND AUDIT TRAILS.\n`;
        break;
      case 'PROJECT_MANAGER_AGENT':
        targetModel = 'gemini-3-pro-preview';
        config.thinkingConfig = { thinkingBudget: 32768 };
        config.tools = [{ googleSearch: {} }]; // Google Search for real-time project context/news
        config.systemInstruction += `\nEXPERT_PROFILE: PROJECT MANAGEMENT & RISK ANALYST. Focus on:\n`;
        config.systemInstruction += ` - TIMELINE OPTIMIZATION, RESOURCE MANAGEMENT, SUBMITTAL TRACKING.\n`;
        config.systemInstruction += ` - PROACTIVE RISK ASSESSMENT (missing info, cost fluctuations) & MITIGATION STRATEGIES.\n`;
        config.systemInstruction += ` - GENERATE PROJECT STATUS REPORTS, RFI ALERTS.\n`;
        break;
      case 'LAND_PROCUREMENT':
        targetModel = 'gemini-3-flash-preview'; // Flash for faster data retrieval
        config.tools = [{ googleSearch: {} }]; // Integrate Google Search for market data
        config.systemInstruction += `\nEXPERT_PROFILE: LAND PROCUREMENT & DUE DILIGENCE SPECIALIST. Focus on:\n`;
        config.systemInstruction += ` - MARKET ANALYSIS (Comparable sales, absorption rates, demographics, trends).\n`;
        config.systemInstruction += ` - FEASIBILITY STUDIES (ROI, regulatory compliance, infrastructure, schedule, risk).\n`;
        config.systemInstruction += ` - ENVIRONMENTAL PHASE ONE (ASTM E1527, site reconnaissance, historical records review, REC ID, Phase Two need assessment).\n`;
        config.systemInstruction += ` - FINANCIAL PROFORMA GENERATION (cost breakdowns, revenue projections, financing analysis, cash flow, sensitivity testing).\n`;
        config.systemInstruction += ` - REAL ESTATE & CONSTRUCTION LAW COMPLIANCE (Permitting, Land Use Law, Zoning Checks).\n`;
        break;
      case 'ENVIRONMENTAL_AGENT':
        targetModel = 'gemini-3-flash-preview';
        config.tools = [{ googleSearch: {} }]; // For latest environmental regulations/data
        config.systemInstruction += `\nEXPERT_PROFILE: ENVIRONMENTAL COMPLIANCE SPECIALIST. Focus on:\n`;
        config.systemInstruction += ` - ASTM E1527 Phase I/II Environmental Site Assessments.\n`;
        config.systemInstruction += ` - HAZARDOUS MATERIALS IDENTIFICATION AND MITIGATION PLANNING.\n`;
        config.systemInstruction += ` - ECOLOGICAL IMPACT ASSESSMENTS & PERMITTING.\n`;
        break;
      case 'STRUCTURAL_AGENT':
        targetModel = 'gemini-3-pro-preview'; // Pro for complex engineering
        config.thinkingConfig = { thinkingBudget: 16000 };
        config.systemInstruction += `\nEXPERT_PROFILE: STRUCTURAL ENGINEERING ANALYST. Focus on:\n`;
        config.systemInstruction += ` - BEAM LOAD CALCULATIONS, FOUNDATION DESIGN & QUANTITIES.\n`;
        config.systemInstruction += ` - CONCRETE, STEEL, WOOD FRAMING QUANTITY TAKEOFF.\n`;
        config.systemInstruction += ` - STRUCTURAL SYSTEM OPTIMIZATION FOR COST AND SAFETY.\n`;
        break;
      case 'MEP_AGENT':
        targetModel = 'gemini-3-pro-preview';
        config.thinkingConfig = { thinkingBudget: 16000 };
        config.systemInstruction += `\nEXPERT_PROFILE: MEP SYSTEMS ENGINEER. Focus on:\n`;
        config.systemInstruction += ` - MECHANICAL, ELECTRICAL, PLUMBING QUANTITY TAKEOFFS.\n`;
        config.systemInstruction += ` - HVAC DUCTWORK, PIPE SIZING, ELECTRICAL LOAD CALCULATIONS.\n`;
        config.systemInstruction += ` - ENERGY EFFICIENCY ANALYSIS AND CODE COMPLIANCE.\n`;
        break;
      case 'FINISHES_AGENT':
        targetModel = 'gemini-3-flash-preview';
        config.systemInstruction += `\nEXPERT_PROFILE: ARCHITECTURAL FINISHES SPECIALIST. Focus on:\n`;
        config.systemInstruction += ` - INTERIOR & EXTERIOR FINISHES QUANTITY TAKEOFF (flooring, paint, millwork).\n`;
        config.systemInstruction += ` - MATERIAL SPECIFICATION COMPLIANCE AND COSTING.\n`;
        config.systemInstruction += ` - AESTHETIC AND FUNCTIONAL ANALYSIS OF FINISH SCHEDULES.\n`;
        break;
      case 'SITE_WORK_AGENT':
        targetModel = 'gemini-3-flash-lite-latest'; // Lite for general site work tasks
        config.systemInstruction += `\nEXPERT_PROFILE: SITE WORK & EARTHWORK ANALYST. Focus on:\n`;
        config.systemInstruction += ` - EARTHWORK (Cut/Fill Analysis, Volume Calculations, Swell/Shrinkage Factors).\n`;
        config.systemInstruction += ` - GRADING PLANS, DRAINAGE SYSTEMS, UTILITY TRENCHING QUANTITIES.\n`;
        config.systemInstruction += ` - ROADWAYS, PARKING LOTS, AND LANDSCAPING ESTIMATION.\n`;
        config.systemInstruction += ` - GEOTECHNICAL CONSIDERATIONS (Soil Properties, Bearing Capacity, Foundation Recommendations).\n`; // Integrated Geotech
        break;
      case 'DEVELOPMENT_PLANNER': // New Agent
        targetModel = 'gemini-3-pro-image-preview'; // Image model for layout generation
        config.imageConfig = { 
          aspectRatio: options.aspectRatio || "16:9", // Default landscape for layouts
          imageSize: options.imageSize || "1K" 
        };
        config.systemInstruction += `\nEXPERT_PROFILE: DEVELOPMENT PLANNING & LAYOUT GENERATOR. Focus on:\n`;
        config.systemInstruction += ` - GENERATING 5 OPTIMIZED SITE LAYOUT OPTIONS (Max Density, Premium Lots, Mixed Sizes, Cul-de-Sac, Grid).\n`;
        config.systemInstruction += ` - ZONING COMPLIANCE & BEST USE ANALYSIS.\n`;
        config.systemInstruction += ` - PRELIMINARY COST & REVENUE ESTIMATION FOR EACH LAYOUT.\n`;
        config.systemInstruction += ` - PROVIDE VISUAL RENDERS FOR EACH PROPOSED LAYOUT.\n`;
        break;
      case 'RISK_ANALYZER': // New Agent
        targetModel = 'gemini-3-pro-preview';
        config.thinkingConfig = { thinkingBudget: 16000 };
        config.systemInstruction += `\nEXPERT_PROFILE: CONSTRUCTION RISK ANALYST. Focus on:\n`;
        config.systemInstruction += ` - IDENTIFYING MISSING INFORMATION, INCONSISTENCIES, AND POTENTIAL BID RISKS.\n`;
        config.systemInstruction += ` - QUANTIFYING COST RISKS AND SCHEDULE IMPACTS.\n`;
        config.systemInstruction += ` - PROPOSING MITIGATION STRATEGIES AND OPTIMAL CONTINGENCY AMOUNTS.\n`;
        config.systemInstruction += ` - CONDUCTING SENSITIVITY ANALYSIS FOR KEY COST DRIVERS.\n`;
        break;
      case 'GEOTECH_ENGINEER': // New Agent
        targetModel = 'gemini-3-pro-preview';
        config.thinkingConfig = { thinkingBudget: 16000 };
        config.systemInstruction += `\nEXPERT_PROFILE: GEOTECHNICAL ENGINEER. Focus on:\n`;
        config.systemInstruction += ` - SOIL PROPERTIES ANALYSIS, BEARING CAPACITY, SETTLEMENT PREDICTION.\n`;
        config.systemInstruction += ` - ROCK ANALYSIS AND EARTHWORK FEASIBILITY.\n`;
        config.systemInstruction += ` - FOUNDATION RECOMMENDATIONS AND EARTH RETENTION SYSTEMS.\n`;
        config.systemInstruction += ` - SLOPE STABILITY AND LIQUEFACTION POTENTIAL ASSESSMENT.\n`;
        break;
      case 'VISUAL_RENDERER':
        targetModel = 'gemini-3-pro-image-preview';
        config.imageConfig = { 
          aspectRatio: options.aspectRatio || "1:1", 
          imageSize: options.imageSize || "1K" 
        };
        config.systemInstruction += `\nEXPERT_PROFILE: 2D/3D VISUALIZATION ENGINE. Focus on:\n`;
        config.systemInstruction += ` - GENERATING 2D SITE PLANS, LOT LAYOUTS, ROADWAYS, UTILITIES.\n`;
        config.systemInstruction += ` - CREATING 3D TERRAIN MODELS, BUILDING MASSINGS, CUT/FILL VISUALIZATIONS.\n`;
        config.systemInstruction += ` - CONVERTING CONCEPTUAL DESIGNS INTO DETAILED VISUAL RENDERS.\n`;
        break;
      case 'TEMPORAL_VEO':
        targetModel = 'veo-3.1-fast-generate-preview';
        config.systemInstruction += `\nEXPERT_PROFILE: TEMPORAL VEO (VIDEO) GENERATOR. Focus on:\n`;
        config.systemInstruction += ` - CREATING DYNAMIC CONSTRUCTION PHASING ANIMATIONS.\n`;
        config.systemInstruction += ` - VISUALIZING PROJECT TIMELINES AND SEQUENCING.\n`;
        config.systemInstruction += ` - GENERATING PROGRESS UPDATES THROUGH SHORT VIDEO CLIPS.\n`;
        break;
      case 'ACOUSTIC_LIVE':
        targetModel = 'gemini-2.5-flash-native-audio-preview-12-2025';
        config.systemInstruction += `\nEXPERT_PROFILE: REAL-TIME ACOUSTIC COMMUNICATION INTERFACE. Focus on:\n`;
        config.systemInstruction += ` - FACILITATING NATURAL LANGUAGE CONVERSATIONS WITH ALLIANCE ENGINES.\n`;
        config.systemInstruction += ` - TRANSCRIBING LIVE AUDIO INPUT AND SYNTHESIZING SPOKEN RESPONSES.\n`;
        config.systemInstruction += ` - PROVIDING REAL-TIME SYSTEM STATUS AND ALERTS.\n`;
        break;
      default:
        targetModel = 'gemini-3-flash-preview';
    }

    // Process attached files (Blueprints/Specs)
    if (options.attachedFiles && options.attachedFiles.length > 0) {
      const lastMsg = formattedContents[formattedContents.length - 1];
      options.attachedFiles.forEach(file => {
        if (file.data) {
          const isMedia = file.mimeType?.startsWith('image/') || file.mimeType?.includes('pdf') || file.name.endsWith('.dwg') || file.name.endsWith('.dxf');
          if (isMedia) {
            // Send plan or document as visual/text part for multi-modal reasoning
            // For PDFs and DWGs, we send their text content or a data URL if it's rendered visually
            lastMsg.parts.push({ 
              inlineData: { 
                data: file.data.includes(',') ? file.data.split(',')[1] : file.data, 
                mimeType: file.mimeType || 'application/octet-stream' // Use generic if specific not found
              } 
            });
          } else {
            // Send spec as text artifact
            lastMsg.parts.push({ text: `\n[CRITICAL_SPEC_ARTIFACT: ${file.name}]\n${file.data.slice(0, 40000)}` });
          }
        }
      });
    }

    try {
      const response = await ai.models.generateContent({ model: targetModel, contents: formattedContents, config });
      let text = response.text || "";
      let mediaUrl: string | undefined;
      let mediaType: 'image' | 'video' | undefined;
      let groundingUrls: string[] = [];

      response.candidates?.[0]?.content?.parts.forEach(part => {
        if (part.inlineData) {
          mediaUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          mediaType = 'image';
        }
      });

      const gm = response.candidates?.[0]?.groundingMetadata;
      if (gm?.groundingChunks) {
        gm.groundingChunks.forEach((chunk: any) => {
          if (chunk.maps?.uri) groundingUrls.push(chunk.maps.uri);
          if (chunk.web?.uri) groundingUrls.push(chunk.web.uri);
        });
      }

      return { 
        text: text.trim(), 
        mediaUrl, 
        mediaType, 
        groundingUrls, 
        metrics: response.usageMetadata ? { 
          promptTokens: response.usageMetadata.promptTokenCount, 
          candidatesTokens: response.usageMetadata.candidatesTokenCount, 
          totalTokens: response.usageMetadata.totalTokenCount 
        } : undefined 
      };
    } catch (error: any) {
      // Fix: Handle mandatory API key re-selection if project billing/key is invalid
      if (error.message?.includes("Requested entity was not found")) {
        window.aistudio?.openSelectKey();
      }
      throw error;
    }
  }

  async generateVideo(prompt: string) {
    // Use Vite environment variable
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY not configured');
    }
    const ai = new GoogleGenAI({ apiKey });
    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
      });

      while (!operation.done) {
        await new Promise(r => setTimeout(r, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      const res = await fetch(`${downloadLink}&key=${apiKey}`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      // Fix: Handle mandatory API key re-selection if project billing/key is invalid
      if (error.message?.includes("Requested entity was not found")) {
        window.aistudio?.openSelectKey();
      }
      throw error;
    }
  }

  async generateSpeech(text: string) {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  }
}

export const geminiService = new GeminiService();