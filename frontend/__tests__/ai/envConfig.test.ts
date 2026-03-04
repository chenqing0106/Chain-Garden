import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

// ──────────────────────────────────────────────────────────────────
// 环境变量配置一致性测试
// 验证 vite.config.ts 与 env.ts 使用的变量名是否匹配
// ──────────────────────────────────────────────────────────────────
describe('环境变量配置一致性', () => {
  const viteConfigPath = path.resolve(__dirname, '../../vite.config.ts');
  const envConfigPath  = path.resolve(__dirname, '../../config/env.ts');
  const rootReadmePath = path.resolve(__dirname, '../../../README.md');

  const viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');
  const envConfig  = fs.readFileSync(envConfigPath, 'utf-8');
  const rootReadme = fs.readFileSync(rootReadmePath, 'utf-8');

  it('vite.config.ts 从根目录（..）加载 env', () => {
    // loadEnv(mode, path.resolve(__dirname, '..'), '')
    expect(viteConfig).toMatch(/loadEnv.*__dirname.*\.\./);
  });

  it('AI 变量在 vite define 中使用无 VITE_ 前缀', () => {
    expect(viteConfig).toContain("process.env.QWEN_API_KEY");
    expect(viteConfig).toContain("process.env.GEMINI_API_KEY");
    expect(viteConfig).toContain("process.env.AI_SERVICE_PROVIDER");
    // 不应出现 VITE_QWEN_API_KEY
    expect(viteConfig).not.toContain("VITE_QWEN_API_KEY");
    expect(viteConfig).not.toContain("VITE_GEMINI_API_KEY");
  });

  it('env.ts 读取 AI 变量时使用 process.env（无 VITE_ 前缀）', () => {
    expect(envConfig).toContain('process.env.QWEN_API_KEY');
    expect(envConfig).toContain('process.env.GEMINI_API_KEY');
    expect(envConfig).toContain('process.env.AI_SERVICE_PROVIDER');
  });

  it('README 中 AI 变量名与 vite.config.ts 一致（无 VITE_ 前缀）', () => {
    // [BUG-001] 若 README 写成 VITE_QWEN_API_KEY，开发者会设错 .env
    expect(rootReadme).not.toMatch(/VITE_QWEN_API_KEY\s*=/);
    expect(rootReadme).not.toMatch(/VITE_GEMINI_API_KEY\s*=/);
    // 正确写法应是 QWEN_API_KEY
    expect(rootReadme).toContain('QWEN_API_KEY=');
  });

  it('README 中 .env 文件路径说明指向根目录而非 frontend/', () => {
    // [BUG-001] vite.config.ts 从根目录读 .env，README 不能说放在 frontend/ 下
    // 根目录 README 应该说明在根目录创建 .env（不是 frontend/.env）
    const aiEnvSection = rootReadme.slice(rootReadme.indexOf('QWEN_API_KEY'));
    // 应该在"根目录"或"root"的上下文中出现，而不在"frontend/"之后
    expect(rootReadme).toMatch(/根目录[\s\S]{0,200}QWEN_API_KEY/);
  });
});
