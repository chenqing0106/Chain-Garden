import { PlantDNA } from "../types";
import { AIService } from "./aiService.interface";

const apiKey = process.env.QWEN_API_KEY || process.env.API_KEY;

/**
 * Qwen AI 服务实现
 * 使用阿里云通义千问 API
 */
class QwenService implements AIService {
  async generatePlantDNA(vibe: string): Promise<PlantDNA> {
    if (!apiKey) {
      throw new Error("API key not configured. Please set QWEN_API_KEY in your .env file in the root directory. See ENV_SETUP.md for details.");
    }

    const prompt = `Analyze this user input: "${vibe}". It could be a mood, a name, a diary entry, or a random thought.

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

Return strictly JSON matching this schema:
{
  "speciesName": "string",
  "description": "string",
  "growthArchitecture": "fractal_tree" | "organic_vine" | "radial_succulent" | "fern_frond" | "weeping_willow" | "alien_shrub" | "crystal_cactus" | "data_blossom",
  "branchingFactor": 0.5-0.95,
  "angleVariance": 10-120,
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "leafShape": "fern" | "round" | "needle" | "abstract" | "heart" | "crystal",
  "leafArrangement": "alternate" | "opposite" | "whorled",
  "growthSpeed": 0.5-2.5,
  "mood": "happy" | "melancholic" | "mysterious" | "aggressive" | "calm",
  "energy": 0.0-1.0
}

Important: Return ONLY valid JSON, no markdown code blocks, no explanations.`;

    try {
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `API request failed: ${response.status}`;
        
        if (response.status === 401 || response.status === 403 || errorMessage.includes("API key") || errorMessage.includes("Invalid")) {
          throw new Error("Invalid API key. Please check your QWEN_API_KEY in .env file. See ENV_SETUP.md for setup instructions.");
        }
        
        throw new Error(`Qwen API error: ${errorMessage}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("Failed to generate plant DNA: No content in response");
      }

      // 解析 JSON（可能需要清理 markdown 代码块）
      let jsonContent = content.trim();
      
      // 移除可能的 markdown 代码块包装
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const plantDNA = JSON.parse(jsonContent) as PlantDNA;
      
      // 验证必需字段
      const requiredFields: (keyof PlantDNA)[] = [
        'speciesName', 'description', 'growthArchitecture', 'branchingFactor', 
        'angleVariance', 'colorPalette', 'leafShape', 'leafArrangement', 
        'growthSpeed', 'mood', 'energy'
      ];
      
      for (const field of requiredFields) {
        if (!(field in plantDNA)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // 验证 colorPalette 长度
      if (!Array.isArray(plantDNA.colorPalette) || plantDNA.colorPalette.length !== 3) {
        throw new Error("colorPalette must be an array of exactly 3 hex color codes");
      }

      return plantDNA;
    } catch (error: any) {
      if (error?.message?.includes("API key") || error?.message?.includes("Invalid")) {
        throw new Error("Invalid API key. Please check your QWEN_API_KEY in .env file. See ENV_SETUP.md for setup instructions.");
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse JSON response: ${error.message}`);
      }
      throw error;
    }
  }
}

// 导出单例实例
export const qwenService = new QwenService();

// 为了向后兼容，也可以导出函数形式
export const generatePlantDNA = (vibe: string): Promise<PlantDNA> => {
  return qwenService.generatePlantDNA(vibe);
};

