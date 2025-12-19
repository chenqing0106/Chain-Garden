/**
 * AI 服务 Prompt 配置
 * 集中管理所有 AI 相关的 prompt，便于维护和复用
 */

export interface PromptConfig {
  architectures: {
    fractal_tree: string;
    organic_vine: string;
    radial_succulent: string;
    fern_frond: string;
    weeping_willow: string;
    alien_shrub: string;
    crystal_cactus: string;
    data_blossom: string;
  };
  analysisAspects: {
    text: string[];
    image: string[];
  };
  schema: {
    description: string;
    fields: string;
  };
}

export const AI_PROMPTS: PromptConfig = {
  architectures: {
    fractal_tree: "Stable, growth, history",
    organic_vine: "Wandering, confused, flexible",
    radial_succulent: "Focused, geometric, mandala",
    fern_frond: "Mathematical, precise, repetitive",
    weeping_willow: "Sad, heavy, gravity-bound",
    alien_shrub: "Glitchy, weird, unexpected",
    crystal_cactus: "Sharp, defensive, rigid",
    data_blossom: "Data-visualization inspired, radial, typographic blooms"
  },
  analysisAspects: {
    text: [
      "Determine the emotional \"Mood\" (Happy, Melancholic, Mysterious, Aggressive, Calm)",
      "Determine the \"Energy\" level (0.0 = still/dead, 1.0 = chaotic/explosive)",
      "Generate a fictional plant based on these feelings using Risograph/Lo-Fi aesthetics"
    ],
    image: [
      "**Colors**: Dominant colors, color harmony, saturation",
      "**Shapes & Forms**: Organic vs geometric, flowing vs rigid, patterns",
      "**Mood & Atmosphere**: Emotional tone (happy, melancholic, mysterious, aggressive, calm)",
      "**Energy Level**: Visual energy from 0.0 (still/peaceful) to 1.0 (chaotic/dynamic)",
      "**Texture & Style**: Smooth, rough, abstract, realistic"
    ]
  },
  schema: {
    description: "Return strictly JSON matching this schema",
    fields: `{
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
}`
  }
};

export const AI_PROMPTS_CN = {
  architectures: {
    fractal_tree: "稳定、成长、历史感",
    organic_vine: "游走、灵活、流动",
    radial_succulent: "聚焦、几何、曼陀罗",
    fern_frond: "数学、精确、重复",
    weeping_willow: "悲伤、沉重、下垂",
    alien_shrub: "故障、怪异、意外",
    crystal_cactus: "尖锐、防御、棱角",
    data_blossom: "数据可视化风格、放射状、字体花朵"
  },
  analysisAspects: {
    text: [
      "确定情绪基调（快乐、忧郁、神秘、激进、平静）",
      "确定能量等级（0.0 = 静止/死寂，1.0 = 混乱/爆发）",
      "基于这些感受使用 Risograph/Lo-Fi 美学生成虚构植物"
    ],
    image: [
      "**颜色**：主色调、色彩和谐度、饱和度",
      "**形状与形态**：有机 vs 几何、流动 vs 刚硬、图案",
      "**情绪与氛围**：情感基调（快乐、忧郁、神秘、激进、平静）",
      "**能量等级**：视觉能量从 0.0（静止/平和）到 1.0（混乱/动态）",
      "**质感与风格**：光滑、粗糙、抽象、写实"
    ]
  },
  schema: {
    description: "严格返回符合以下 schema 的 JSON，不要包含任何 markdown 代码块",
    fields: AI_PROMPTS.schema.fields
  }
};

/**
 * 生成文本分析的 prompt
 */
export function buildTextAnalysisPrompt(vibe: string, useChinese = false): string {
  const prompts = useChinese ? AI_PROMPTS_CN : AI_PROMPTS;
  
  const architecturesList = Object.entries(prompts.architectures)
    .map(([key, desc]) => `- "${key}": ${desc}`)
    .join('\n');

  const aspectsList = prompts.analysisAspects.text
    .map((aspect, i) => `${i + 1}. ${aspect}`)
    .join('\n');

  return `Analyze this user input: "${vibe}". It could be a mood, a name, a diary entry, or a random thought.

${aspectsList}

Architectures:
${architecturesList}

${prompts.schema.description}:
${prompts.schema.fields}

Important: Return ONLY valid JSON, no markdown code blocks, no explanations.`;
}

/**
 * 生成图片分析的 prompt
 */
export function buildImageAnalysisPrompt(additionalPrompt?: string, useChinese = false): string {
  const prompts = useChinese ? AI_PROMPTS_CN : AI_PROMPTS;
  
  const architecturesList = Object.entries(prompts.architectures)
    .map(([key, desc]) => `- "${key}": ${desc}`)
    .join('\n');

  const aspectsList = prompts.analysisAspects.image
    .map((aspect, i) => `${i + 1}. ${aspect}`)
    .join('\n');

  const contextLine = additionalPrompt 
    ? `\n${useChinese ? '用户补充描述' : "User's additional context"}: "${additionalPrompt}"\n`
    : '';

  const intro = useChinese 
    ? "分析这张图片并生成一个虚构植物的 DNA。"
    : "Analyze this image and generate a fictional plant DNA based on what you see.";

  const analyzeTitle = useChinese ? "请分析图片中的：" : "Analyze the image for:";
  const basedOn = useChinese 
    ? "基于你的分析，使用 Risograph/Lo-Fi 美学创建一个植物。"
    : "Based on your analysis, create a plant using Risograph/Lo-Fi aesthetics.";

  const archTitle = useChinese ? "架构类型说明：" : "Architectures:";

  return `${intro}${contextLine}

${analyzeTitle}
${aspectsList}

${basedOn}

${archTitle}
${architecturesList}

${prompts.schema.description}:
${prompts.schema.fields}`;
}
