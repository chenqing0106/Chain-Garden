// 环境变量集中读取层
// 所有 env var 读取统一在此处，避免散落在各 service 文件中

// Pinata IPFS（浏览器端，VITE_ 前缀由 Vite 注入）
export const PINATA_JWT = import.meta.env.VITE_PINATA_JWT as string | undefined;
export const PINATA_API_BASE = import.meta.env.VITE_PINATA_API_BASE || 'https://api.pinata.cloud';
export const PINATA_GATEWAY_BASE = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

// AI 服务（构建时由 Vite define 注入，见 vite.config.ts）
// 注意：QWEN_API_KEY 不应 fallback 到 API_KEY（API_KEY 可能是 Gemini 的 key），
// 否则 QWEN_API_KEY 会被误赋为 Gemini key，导致工厂错误选择 qwenService
export const GEMINI_API_KEY: string = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
export const QWEN_API_KEY: string = process.env.QWEN_API_KEY || '';
export const AI_SERVICE_PROVIDER: string = process.env.AI_SERVICE_PROVIDER || '';
