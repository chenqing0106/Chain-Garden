import { AIService } from "./aiService.interface";
import { geminiService } from "./geminiService";
import { qwenService } from "./qwenService";
import { AI_SERVICE_PROVIDER, GEMINI_API_KEY, QWEN_API_KEY } from '../../config/env';

/**
 * AI 服务提供商类型
 */
export type AIServiceProvider = "gemini" | "qwen";

let _service: AIService | null = null;

/**
 * 获取当前配置的 AI 服务（懒加载单例）
 * 通过环境变量 AI_SERVICE_PROVIDER 来选择，默认为 "qwen"
 *
 * 环境变量优先级：
 * 1. AI_SERVICE_PROVIDER (如果设置为 "gemini" 或 "qwen")
 * 2. 如果设置了 QWEN_API_KEY，使用 qwen
 * 3. 如果设置了 GEMINI_API_KEY，使用 gemini
 * 4. 默认使用 qwen
 */
export function getAIService(): AIService {
  if (_service) return _service;

  const provider = AI_SERVICE_PROVIDER.toLowerCase() as AIServiceProvider;
  const hasQwenKey = !!QWEN_API_KEY;
  const hasGeminiKey = !!GEMINI_API_KEY;

  let result: AIService;

  if (provider === "gemini") {
    if (!hasGeminiKey) {
      console.warn("AI_SERVICE_PROVIDER is set to 'gemini' but GEMINI_API_KEY is not configured.");
    }
    result = geminiService;
  } else if (provider === "qwen") {
    if (!hasQwenKey) {
      console.warn("AI_SERVICE_PROVIDER is set to 'qwen' but QWEN_API_KEY is not configured.");
    }
    result = qwenService;
  } else if (hasQwenKey) {
    result = qwenService;
  } else if (hasGeminiKey) {
    result = geminiService;
  } else {
    console.warn("No AI service provider explicitly configured and no API keys found. Defaulting to Qwen. Set QWEN_API_KEY or GEMINI_API_KEY in .env file.");
    result = qwenService;
  }

  return (_service = result);
}

/**
 * 导出默认的 AI 服务实例
 * 这是应用应该使用的主要入口点
 */
export const aiService = getAIService();

/**
 * 为了向后兼容，导出 generatePlantDNA 函数
 */
export const generatePlantDNA = (vibe: string) => {
  return aiService.generatePlantDNA(vibe);
};

