import { GoogleGenAI, Type } from "@google/genai";
import { PlantDNA } from "../types";
import { AIService } from "./aiService.interface";

// The client gets the API key from the environment variable `GEMINI_API_KEY` automatically
// If not found, it will try `API_KEY` as fallback (for Vite build-time injection)
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

// Initialize GoogleGenAI - it will automatically read GEMINI_API_KEY from environment
// But we also support build-time injection via Vite's define
const ai = apiKey 
  ? new GoogleGenAI({ apiKey }) 
  : new GoogleGenAI({}); // Empty object - will try to read from process.env.GEMINI_API_KEY automatically

if (!apiKey && !process.env.GEMINI_API_KEY) {
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
    // Check if API key is available (either from build-time injection or runtime env)
    const hasApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!hasApiKey) {
      throw new Error("API key not configured. Please set GEMINI_API_KEY in your .env file in the root directory. See ENV_SETUP.md for details.");
    }

    const model = "gemini-2.5-flash";
    
    try {
      const response = await ai.models.generateContent({
      model,
      contents: `Analyze this user input: "${vibe}". It could be a mood, a name, a diary entry, or a random thought.
    
    1. Determine the emotional "Mood" (Happy, Melancholic, Mysterious, Aggressive, Calm).
    2. Determine the "Energy" level (0.0 = still/dead, 1.0 = chaotic/explosive).
    3. Generate a fictional plant based on these feelings using Risograph/Lo-Fi aesthetics.
    
    Architectures:
    - "fractal_tree": Stable, growth, history.
    - "organic_vine": Wandering, confused, flexible.
    - "radial_succulent": Focused, geometric, mandala.
    - "fern_frond": Mathematical, precise, repetitive.
    - "weeping_willow": Sad, heavy, gravity-bound.
    - "alien_shrub": Glitchy, weird, unexpected.
    - "crystal_cactus": Sharp, defensive, rigid.
    - "data_blossom": Data-visualization inspired, radial, typographic blooms.

    Return strictly JSON matching the schema.`,
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
        return JSON.parse(response.text) as PlantDNA;
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

    const promptText = `Analyze this image and generate a fictional plant DNA based on what you see.

${additionalPrompt ? `User's additional context: "${additionalPrompt}"` : ''}

Analyze the image for:
1. **Colors**: Dominant colors, color harmony, saturation
2. **Shapes & Forms**: Organic vs geometric, flowing vs rigid, patterns
3. **Mood & Atmosphere**: Emotional tone (happy, melancholic, mysterious, aggressive, calm)
4. **Energy Level**: Visual energy from 0.0 (still/peaceful) to 1.0 (chaotic/dynamic)
5. **Texture & Style**: Smooth, rough, abstract, realistic

Based on your analysis, create a plant using Risograph/Lo-Fi aesthetics.

Architectures:
- "fractal_tree": Stable, growth, history.
- "organic_vine": Wandering, flexible, flowing.
- "radial_succulent": Focused, geometric, mandala-like.
- "fern_frond": Mathematical, precise, repetitive.
- "weeping_willow": Sad, heavy, drooping.
- "alien_shrub": Glitchy, weird, unexpected.
- "crystal_cactus": Sharp, defensive, angular.
- "data_blossom": Data-viz inspired, radial, typographic.

Return strictly JSON matching the schema.`;

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
        return JSON.parse(response.text) as PlantDNA;
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
