import { PlantDNA } from "../types";

/**
 * AI Service 接口
 * 所有 AI 服务实现都需要遵循此接口，以便轻松替换不同的 API 提供商
 */
export interface AIService {
  /**
   * 根据用户输入的 vibe 生成植物 DNA
   * @param vibe 用户输入的文本（情绪、名称、日记等）
   * @returns 生成的植物 DNA
   * @throws 如果 API 调用失败或返回无效数据
   */
  generatePlantDNA(vibe: string): Promise<PlantDNA>;

  /**
   * 根据上传的图片生成植物 DNA（多模态功能）
   * @param imageFile 用户上传的图片文件
   * @param additionalPrompt 可选的辅助文本描述
   * @returns 生成的植物 DNA
   * @throws 如果 API 调用失败、模型不支持图片分析或返回无效数据
   */
  generatePlantDNAFromImage(imageFile: File, additionalPrompt?: string): Promise<PlantDNA>;
}

