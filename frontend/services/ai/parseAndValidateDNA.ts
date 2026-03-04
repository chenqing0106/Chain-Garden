import { PlantDNA } from "../../types";

const REQUIRED_FIELDS: (keyof PlantDNA)[] = [
  "speciesName", "description", "growthArchitecture", "branchingFactor",
  "angleVariance", "colorPalette", "leafShape", "leafArrangement",
  "growthSpeed", "mood", "energy",
];

/**
 * 解析 AI 返回的 JSON 字符串并校验必需字段
 * 兼容带 markdown 代码块包装的响应（部分模型会加 ```json ... ```）
 */
export function parseAndValidateDNA(content: string): PlantDNA {
  let jsonContent = content.trim();

  if (jsonContent.startsWith("```json")) {
    jsonContent = jsonContent.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  } else if (jsonContent.startsWith("```")) {
    jsonContent = jsonContent.replace(/^```\n?/, "").replace(/\n?```$/, "");
  }

  const plantDNA = JSON.parse(jsonContent) as PlantDNA;

  for (const field of REQUIRED_FIELDS) {
    if (!(field in plantDNA)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (!Array.isArray(plantDNA.colorPalette) || plantDNA.colorPalette.length !== 3) {
    throw new Error("colorPalette must be an array of exactly 3 hex color codes");
  }

  return plantDNA;
}
