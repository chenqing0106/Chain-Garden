import { describe, it, expect } from 'vitest';
import { parseAndValidateDNA } from '../../services/ai/parseAndValidateDNA';

// ──────────────────────────────────────────────────────────────────
// 测试基础：合法 DNA 对象
// ──────────────────────────────────────────────────────────────────
const VALID_DNA = {
  speciesName: "Solar Fern",
  description: "A sun-loving fern",
  growthArchitecture: "fern_frond",
  branchingFactor: 3,
  angleVariance: 45,
  colorPalette: ["#1a1a2e", "#16213e", "#0f3460"],
  leafShape: "fern",
  leafArrangement: "alternate",
  growthSpeed: 1.0,
  mood: "calm",
  energy: 0.5,
};

// ──────────────────────────────────────────────────────────────────
// 正常路径
// ──────────────────────────────────────────────────────────────────
describe('parseAndValidateDNA — 正常路径', () => {
  it('解析纯 JSON 字符串', () => {
    const result = parseAndValidateDNA(JSON.stringify(VALID_DNA));
    expect(result.speciesName).toBe("Solar Fern");
    expect(result.colorPalette).toHaveLength(3);
  });

  it('剥离 ```json ... ``` markdown 包裹', () => {
    const wrapped = `\`\`\`json\n${JSON.stringify(VALID_DNA)}\n\`\`\``;
    const result = parseAndValidateDNA(wrapped);
    expect(result.speciesName).toBe("Solar Fern");
  });

  it('剥离 ``` ... ``` 包裹（无 json 标注）', () => {
    const wrapped = `\`\`\`\n${JSON.stringify(VALID_DNA)}\n\`\`\``;
    const result = parseAndValidateDNA(wrapped);
    expect(result.mood).toBe("calm");
  });

  it('返回值包含所有必需字段', () => {
    const result = parseAndValidateDNA(JSON.stringify(VALID_DNA));
    const required = [
      'speciesName', 'description', 'growthArchitecture', 'branchingFactor',
      'angleVariance', 'colorPalette', 'leafShape', 'leafArrangement',
      'growthSpeed', 'mood', 'energy',
    ];
    for (const field of required) {
      expect(result).toHaveProperty(field);
    }
  });
});

// ──────────────────────────────────────────────────────────────────
// 错误路径：字段缺失
// ──────────────────────────────────────────────────────────────────
describe('parseAndValidateDNA — 必需字段缺失', () => {
  const REQUIRED_FIELDS = [
    'speciesName', 'description', 'growthArchitecture', 'branchingFactor',
    'angleVariance', 'colorPalette', 'leafShape', 'leafArrangement',
    'growthSpeed', 'mood', 'energy',
  ] as const;

  for (const field of REQUIRED_FIELDS) {
    it(`缺少 ${field} 时抛出错误`, () => {
      const broken = { ...VALID_DNA };
      delete (broken as any)[field];
      expect(() => parseAndValidateDNA(JSON.stringify(broken)))
        .toThrow(`Missing required field: ${field}`);
    });
  }
});

// ──────────────────────────────────────────────────────────────────
// 错误路径：colorPalette 校验
// ──────────────────────────────────────────────────────────────────
describe('parseAndValidateDNA — colorPalette 校验', () => {
  it('colorPalette 少于 3 个颜色时抛出错误', () => {
    const dna = { ...VALID_DNA, colorPalette: ["#1a1a2e", "#16213e"] };
    expect(() => parseAndValidateDNA(JSON.stringify(dna)))
      .toThrow("colorPalette must be an array of at least 3 hex color codes");
  });

  it('[BUG-002] colorPalette 多于 3 个颜色时自动截取前 3 个，不抛出错误', () => {
    // BUG-002 修复：AI 偶尔返回 4 个颜色时，宽松处理截取前 3 个而非拒绝
    const dna = { ...VALID_DNA, colorPalette: ["#1a1a2e", "#16213e", "#0f3460", "#extra"] };
    const result = parseAndValidateDNA(JSON.stringify(dna));
    expect(result.colorPalette).toHaveLength(3);
    expect(result.colorPalette).toEqual(["#1a1a2e", "#16213e", "#0f3460"]);
  });

  it('colorPalette 不是数组时抛出错误', () => {
    const dna = { ...VALID_DNA, colorPalette: "#1a1a2e" as any };
    expect(() => parseAndValidateDNA(JSON.stringify(dna)))
      .toThrow("colorPalette must be an array of at least 3 hex color codes");
  });
});

// ──────────────────────────────────────────────────────────────────
// 错误路径：JSON 本身无效
// ──────────────────────────────────────────────────────────────────
describe('parseAndValidateDNA — 无效 JSON', () => {
  it('非 JSON 字符串时抛出 SyntaxError', () => {
    expect(() => parseAndValidateDNA("这不是JSON"))
      .toThrow(SyntaxError);
  });

  it('空字符串时抛出 SyntaxError', () => {
    expect(() => parseAndValidateDNA(""))
      .toThrow(SyntaxError);
  });

  it('截断的 JSON 时抛出 SyntaxError', () => {
    expect(() => parseAndValidateDNA('{"speciesName": "test"'))
      .toThrow(SyntaxError);
  });

  it('markdown 包裹内容为空时抛出 SyntaxError', () => {
    expect(() => parseAndValidateDNA('```json\n```'))
      .toThrow(SyntaxError);
  });
});
