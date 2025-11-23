import { GoogleGenAI, Type } from "@google/genai";
import { PlantDNA } from "../types";

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

export const generatePlantDNA = async (vibe: string): Promise<PlantDNA> => {
  // Check if API key is available (either from build-time injection or runtime env)
  const hasApiKey = apiKey || process.env.GEMINI_API_KEY;
  if (!hasApiKey) {
    throw new Error("API key not configured. Please set GEMINI_API_KEY in your .env file in the root directory. See ENV_SETUP.md for details.");
  }

  const model = "gemini-2.5-flash";
  
  try {
    const response = await ai.models.generateContent({
    model,
    contents: `Generate a fictional plant species based on this musical vibe/mood: "${vibe}". 
    The aesthetic is Risograph/Lo-Fi Botanical. 
    
    Create distinct architectures:
    - "fractal_tree": Classic majestic trees.
    - "organic_vine": Creeping, wandering, curvy lines.
    - "radial_succulent": Geometric, flower-like patterns growing from center.
    - "fern_frond": Mathematical, symmetrical, feather-like.

    Return strictly JSON matching the schema. 
    Colors should be hex codes, preferring Riso ink colors (Green #00a651, Pink #ff48b0, Blue #0078bf, Yellow #ffe800, Black #1a1a1a, Red #ff0000, Purple #765ba7, Teal #00838a) but mixed.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          speciesName: { type: Type.STRING },
          description: { type: Type.STRING },
          growthArchitecture: { type: Type.STRING, enum: ["fractal_tree", "organic_vine", "radial_succulent", "fern_frond"] },
          branchingFactor: { type: Type.NUMBER, description: "0.6 to 0.9. High for ferns, low for vines." },
          angleVariance: { type: Type.NUMBER, description: "10 to 90. Degrees of spread." },
          colorPalette: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Array of 3 hex color codes: [StemColor, LeafPrimary, LeafAccent]"
          },
          leafShape: { type: Type.STRING, enum: ["fern", "round", "needle", "abstract", "heart"] },
          leafArrangement: { type: Type.STRING, enum: ["alternate", "opposite", "whorled"] },
          growthSpeed: { type: Type.NUMBER, description: "Between 0.5 and 2.0" }
        },
        required: ["speciesName", "description", "growthArchitecture", "branchingFactor", "angleVariance", "colorPalette", "leafShape", "leafArrangement", "growthSpeed"]
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
};