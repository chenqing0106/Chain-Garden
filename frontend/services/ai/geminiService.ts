import { GoogleGenAI, Type } from "@google/genai";
import { PlantDNA } from "../../types";
import { AIService } from "./aiService.interface";
import { buildTextAnalysisPrompt, buildImageAnalysisPrompt } from "./prompts";
import { GEMINI_API_KEY as apiKey } from '../../config/env';
import { parseAndValidateDNA } from './parseAndValidateDNA';

const ai = apiKey
  ? new GoogleGenAI({ apiKey })
  : new GoogleGenAI({});

if (!apiKey) {
  console.warn("GEMINI_API_KEY not found in environment variables. Please create a .env file in the root directory with GEMINI_API_KEY=your_key");
}

/**
 * Gemini AI 服务实现
 */
class GeminiService implements AIService {
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async generatePlantDNA(vibe: string): Promise<PlantDNA> {
    const hasApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!hasApiKey) {
      throw new Error("API key not configured. Please set GEMINI_API_KEY in your .env file in the root directory. See ENV_SETUP.md for details.");
    }

    const model = "gemini-2.5-flash";
    const prompt = buildTextAnalysisPrompt(vibe);
    
    try {
      const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            speciesName: { type: Type.STRING },
            description: { type: Type.STRING },
            growthArchitecture: { type: Type.STRING, enum: ["fractal_tree", "organic_vine", "radial_succulent", "fern_frond", "weeping_willow", "alien_shrub", "crystal_cactus", "data_blossom"] },
            branchingFactor: { type: Type.NUMBER, description: "0.5 to 0.95" },
            angleVariance: { type: Type.NUMBER, description: "10 to 120. Degrees of spread." },
            colorPalette: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Array of 3 hex color codes: [StemColor, LeafPrimary, LeafAccent]"
            },
            leafShape: { type: Type.STRING, enum: ["fern", "round", "needle", "abstract", "heart", "crystal"] },
            leafArrangement: { type: Type.STRING, enum: ["alternate", "opposite", "whorled"] },
            growthSpeed: { type: Type.NUMBER, description: "Between 0.5 and 2.5" },
            mood: { type: Type.STRING, enum: ["happy", "melancholic", "mysterious", "aggressive", "calm"] },
            energy: { type: Type.NUMBER, description: "0.0 to 1.0" }
          },
          required: ["speciesName", "description", "growthArchitecture", "branchingFactor", "angleVariance", "colorPalette", "leafShape", "leafArrangement", "growthSpeed", "mood", "energy"]
        }
      }
    });

      if (response.text) {
        return parseAndValidateDNA(response.text);
      }

      throw new Error("Failed to generate plant DNA");
    } catch (error: any) {
      // Provide more helpful error messages
      if (error?.message?.includes("API key") || error?.message?.includes("INVALID_ARGUMENT")) {
        throw new Error("Invalid API key. Please check your GEMINI_API_KEY in .env file. See ENV_SETUP.md for setup instructions.");
      }
      throw error;
    }
  }

  async generatePlantDNAFromImage(imageFile: File, additionalPrompt?: string): Promise<PlantDNA> {
    const hasApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!hasApiKey) {
      throw new Error("API key not configured. Please set GEMINI_API_KEY in your .env file in the root directory. See ENV_SETUP.md for details.");
    }

    const imageBase64 = await this.fileToBase64(imageFile);
    const imagePart = {
      inlineData: {
        data: imageBase64.split(',')[1],
        mimeType: imageFile.type
      }
    };

    const promptText = buildImageAnalysisPrompt(additionalPrompt);

    const model = "gemini-2.0-flash-exp";
    
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { text: promptText },
              imagePart
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              speciesName: { type: Type.STRING },
              description: { type: Type.STRING },
              growthArchitecture: { type: Type.STRING, enum: ["fractal_tree", "organic_vine", "radial_succulent", "fern_frond", "weeping_willow", "alien_shrub", "crystal_cactus", "data_blossom"] },
              branchingFactor: { type: Type.NUMBER, description: "0.5 to 0.95" },
              angleVariance: { type: Type.NUMBER, description: "10 to 120. Degrees of spread." },
              colorPalette: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Array of 3 hex color codes: [StemColor, LeafPrimary, LeafAccent]"
              },
              leafShape: { type: Type.STRING, enum: ["fern", "round", "needle", "abstract", "heart", "crystal"] },
              leafArrangement: { type: Type.STRING, enum: ["alternate", "opposite", "whorled"] },
              growthSpeed: { type: Type.NUMBER, description: "Between 0.5 and 2.5" },
              mood: { type: Type.STRING, enum: ["happy", "melancholic", "mysterious", "aggressive", "calm"] },
              energy: { type: Type.NUMBER, description: "0.0 to 1.0" }
            },
            required: ["speciesName", "description", "growthArchitecture", "branchingFactor", "angleVariance", "colorPalette", "leafShape", "leafArrangement", "growthSpeed", "mood", "energy"]
          }
        }
      });

      if (response.text) {
        return parseAndValidateDNA(response.text);
      }

      throw new Error("Failed to generate plant DNA from image");
    } catch (error: any) {
      if (error?.message?.includes("API key") || error?.message?.includes("INVALID_ARGUMENT")) {
        throw new Error("Invalid API key. Please check your GEMINI_API_KEY in .env file. See ENV_SETUP.md for setup instructions.");
      }
      throw error;
    }
  }
}

// 导出单例实例
export const geminiService = new GeminiService();

// 为了向后兼容，保留原有的导出函数
export const generatePlantDNA = (vibe: string): Promise<PlantDNA> => {
  return geminiService.generatePlantDNA(vibe);
};
