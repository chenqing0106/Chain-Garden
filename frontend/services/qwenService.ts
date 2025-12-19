import { PlantDNA } from "../types";
import { AIService } from "./aiService.interface";

const apiKey = process.env.QWEN_API_KEY || process.env.API_KEY;

/**
 * Qwen AI 服务实现
 * 使用阿里云通义千问 API
 */
class QwenService implements AIService {
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

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

  async generatePlantDNAFromImage(imageFile: File, additionalPrompt?: string): Promise<PlantDNA> {
    if (!apiKey) {
      throw new Error("API key not configured. Please set QWEN_API_KEY in your .env file in the root directory. See ENV_SETUP.md for details.");
    }

    const imageBase64 = await this.fileToBase64(imageFile);

    const promptText = `分析这张图片并生成一个虚构植物的 DNA。

${additionalPrompt ? `用户补充描述: "${additionalPrompt}"` : ''}

请分析图片中的：
1. **颜色**：主色调、色彩和谐度、饱和度
2. **形状与形态**：有机 vs 几何、流动 vs 刚硬、图案
3. **情绪与氛围**：情感基调（快乐、忧郁、神秘、激进、平静）
4. **能量等级**：视觉能量从 0.0（静止/平和）到 1.0（混乱/动态）
5. **质感与风格**：光滑、粗糙、抽象、写实

基于你的分析，使用 Risograph/Lo-Fi 美学创建一个植物。

架构类型说明：
- "fractal_tree": 稳定、成长、历史感
- "organic_vine": 游走、灵活、流动
- "radial_succulent": 聚焦、几何、曼陀罗
- "fern_frond": 数学、精确、重复
- "weeping_willow": 悲伤、沉重、下垂
- "alien_shrub": 故障、怪异、意外
- "crystal_cactus": 尖锐、防御、棱角
- "data_blossom": 数据可视化风格、放射状、字体花朵

严格返回符合以下 schema 的 JSON，不要包含任何 markdown 代码块：
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
}`;

    try {
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'qwen-vl-max',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64
                  }
                },
                {
                  type: 'text',
                  text: promptText
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error?.message || `API request failed: ${response.status}`;
        
        if (response.status === 401 || response.status === 403 || errorMessage.includes("API key") || errorMessage.includes("Invalid")) {
          throw new Error("Invalid API key. Please check your QWEN_API_KEY in .env file. See ENV_SETUP.md for setup instructions.");
        }
        
        throw new Error(`Qwen VL API error: ${errorMessage}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("Failed to generate plant DNA from image: No content in response");
      }

      let jsonContent = content.trim();
      
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const plantDNA = JSON.parse(jsonContent) as PlantDNA;
      
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

