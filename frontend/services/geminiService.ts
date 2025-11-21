import { GoogleGenAI, Type } from "@google/genai";
import { PlantDNA } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePlantDNA = async (vibe: string): Promise<PlantDNA> => {
  const model = "gemini-2.5-flash";
  
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
};