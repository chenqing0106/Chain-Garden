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
    fractal_tree: "Stable, growth, history - Use for: positive growth, memories, traditions, wisdom, strength, resilience, family, legacy, achievements, or anything suggesting stability and branching development",
    organic_vine: "Wandering, confused, flexible - Use for: exploration, curiosity, uncertainty, adaptability, journey, discovery, flexibility, change, or anything suggesting organic movement and exploration",
    radial_succulent: "Focused, geometric, mandala - Use for: meditation, concentration, balance, harmony, centeredness, spiritual, zen, mindfulness, symmetry, or anything suggesting focused energy radiating outward",
    fern_frond: "Mathematical, precise, repetitive - Use for: patterns, order, logic, structure, rhythm, sequences, precision, organization, systematic thinking, or anything suggesting mathematical beauty and repetition",
    weeping_willow: "Sad, heavy, gravity-bound - Use ONLY for: deep sadness, melancholy, grief, loss, heaviness, depression, sorrow, or explicitly melancholic emotions. Do NOT use for neutral, happy, or other moods",
    alien_shrub: "Glitchy, weird, unexpected - Use for: surreal, bizarre, glitchy, digital artifacts, unexpected, strange, experimental, chaotic, unpredictable, or anything suggesting digital weirdness and surprise",
    crystal_cactus: "Sharp, defensive, rigid - Use for: protection, boundaries, defense, sharpness, rigidity, barriers, caution, guardedness, or anything suggesting defensive structures and sharp edges",
    data_blossom: "Data-visualization inspired, radial, typographic blooms - Use for: information, data, knowledge, networks, connections, digital age, information architecture, or anything suggesting data visualization and information flow"
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
    fractal_tree: "稳定、成长、历史感 - 适用于：积极成长、回忆、传统、智慧、力量、韧性、家庭、传承、成就，或任何暗示稳定和分支发展的内容",
    organic_vine: "游走、灵活、流动 - 适用于：探索、好奇心、不确定性、适应性、旅程、发现、灵活性、变化，或任何暗示有机运动和探索的内容",
    radial_succulent: "聚焦、几何、曼陀罗 - 适用于：冥想、专注、平衡、和谐、中心感、精神性、禅意、正念、对称，或任何暗示向外辐射的聚焦能量",
    fern_frond: "数学、精确、重复 - 适用于：模式、秩序、逻辑、结构、节奏、序列、精确、组织、系统思维，或任何暗示数学美和重复的内容",
    weeping_willow: "悲伤、沉重、下垂 - 仅适用于：深度悲伤、忧郁、悲痛、失落、沉重、抑郁、哀伤，或明确忧郁的情绪。不要用于中性、快乐或其他情绪",
    alien_shrub: "故障、怪异、意外 - 适用于：超现实、奇异、故障、数字艺术、意外、奇怪、实验性、混乱、不可预测，或任何暗示数字怪异和惊喜的内容",
    crystal_cactus: "尖锐、防御、棱角 - 适用于：保护、边界、防御、尖锐、刚硬、屏障、谨慎、戒备，或任何暗示防御结构和尖锐边缘的内容",
    data_blossom: "数据可视化风格、放射状、字体花朵 - 适用于：信息、数据、知识、网络、连接、数字时代、信息架构，或任何暗示数据可视化和信息流动的内容"
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

Architecture Selection Guide:
Choose the MOST APPROPRIATE architecture based on the input's mood, energy, and characteristics. Consider the following:
- Match the emotional tone and energy level to the architecture description
- Vary your selections - don't always choose the same architecture
- Consider the semantic meaning and associations of the input
- Each architecture has specific use cases - select thoughtfully

Available Architectures:
${architecturesList}

${prompts.schema.description}:
${prompts.schema.fields}

Important: 
- Return ONLY valid JSON, no markdown code blocks, no explanations.
- Choose the architecture that BEST matches the input's characteristics, not just the first one that seems partially relevant.
- Vary your architecture selections based on different input types.`;
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

  const archGuide = useChinese 
    ? "架构选择指南：根据图片的情绪、能量和特征选择最合适的架构。考虑语义含义和关联性，多样化选择，不要总是选择同一个架构。"
    : "Architecture Selection Guide: Choose the MOST APPROPRIATE architecture based on the image's mood, energy, and characteristics. Consider semantic meaning and associations. Vary your selections - don't always choose the same architecture.";

  return `${intro}${contextLine}

${analyzeTitle}
${aspectsList}

${basedOn}

${archTitle}
${archGuide}

${architecturesList}

${prompts.schema.description}:
${prompts.schema.fields}

Important: Choose the architecture that BEST matches the image's characteristics, and vary your selections based on different visual content.`;
}
