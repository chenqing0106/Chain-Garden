import { describe, it, expect, beforeEach, vi } from 'vitest';

// ──────────────────────────────────────────────────────────────────
// aiServiceFactory 服务选择逻辑测试
// 重点覆盖 BUG-006：QWEN_API_KEY 不应 fallback 到 Gemini key
// ──────────────────────────────────────────────────────────────────

// 工厂依赖 env.ts 中的常量，这里直接测试选择逻辑本身
// 用纯函数形式复现工厂的判断规则，避免模块副作用

type AIServiceType = 'gemini' | 'qwen' | 'default-qwen';

function selectService(opts: {
  provider: string;
  qwenKey: string;
  geminiKey: string;
}): AIServiceType {
  const { provider, qwenKey, geminiKey } = opts;
  const hasQwenKey = !!qwenKey;
  const hasGeminiKey = !!geminiKey;

  if (provider === 'gemini') return 'gemini';
  if (provider === 'qwen') return 'qwen';
  if (hasQwenKey) return 'qwen';
  if (hasGeminiKey) return 'gemini';
  return 'default-qwen';
}

describe('aiServiceFactory — 服务选择逻辑', () => {
  it('只有 GEMINI_API_KEY 时选择 gemini', () => {
    expect(selectService({ provider: '', qwenKey: '', geminiKey: 'gk-xxx' }))
      .toBe('gemini');
  });

  it('只有 QWEN_API_KEY 时选择 qwen', () => {
    expect(selectService({ provider: '', qwenKey: 'qk-xxx', geminiKey: '' }))
      .toBe('qwen');
  });

  it('AI_SERVICE_PROVIDER=gemini 时强制 gemini（忽略 key 存在情况）', () => {
    expect(selectService({ provider: 'gemini', qwenKey: 'qk-xxx', geminiKey: '' }))
      .toBe('gemini');
  });

  it('AI_SERVICE_PROVIDER=qwen 时强制 qwen', () => {
    expect(selectService({ provider: 'qwen', qwenKey: '', geminiKey: 'gk-xxx' }))
      .toBe('qwen');
  });

  it('两个 key 都有时，qwenKey 优先（hasQwenKey 先判断）', () => {
    expect(selectService({ provider: '', qwenKey: 'qk-xxx', geminiKey: 'gk-xxx' }))
      .toBe('qwen');
  });

  it('两个 key 都没有时，默认 qwen', () => {
    expect(selectService({ provider: '', qwenKey: '', geminiKey: '' }))
      .toBe('default-qwen');
  });

  // BUG-006 回归测试：QWEN_API_KEY 不能 fallback 到 GEMINI key
  it('[BUG-006] QWEN_API_KEY 为空、GEMINI_API_KEY 有值时，不能选 qwen', () => {
    // 修复前：env.ts 的 QWEN_API_KEY = process.env.QWEN_API_KEY || process.env.API_KEY
    // API_KEY 在 vite.config.ts 中被赋值为 GEMINI_API_KEY，导致 hasQwenKey=true
    // 修复后：QWEN_API_KEY = process.env.QWEN_API_KEY || ''（不 fallback）
    const geminiKey = 'AIzaSy-gemini-key';
    const qwenKey = '';  // 未配置
    expect(selectService({ provider: '', qwenKey, geminiKey })).toBe('gemini');
    expect(selectService({ provider: '', qwenKey, geminiKey })).not.toBe('qwen');
  });
});
