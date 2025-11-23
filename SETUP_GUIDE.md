# 项目启动和配置指南

## 📁 项目结构说明

```
chain-garden/
├── package.json          # 根目录：Hardhat 合约相关脚本
├── .env                  # 根目录：环境变量配置（在这里配置！）
├── frontend/
│   ├── package.json      # 前端目录：Vite/React 相关脚本
│   └── vite.config.ts    # Vite 配置（已配置从根目录读取 .env）
└── ...
```

## 🚀 启动方式

### 方式一：从根目录启动（推荐）

**优点：**
- 环境变量统一管理在根目录 `.env`
- 符合 monorepo 最佳实践
- 一个命令启动前端

**步骤：**

1. **在根目录创建 `.env` 文件**（如果还没有）：
   ```env
   GEMINI_API_KEY=你的API密钥
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   PRIVATE_KEY=your_private_key_here
   ```

2. **从根目录启动**：
   ```bash
   # 方式1：使用根目录的 npm run dev（推荐）
   npm run dev

   # 方式2：使用完整命令
   npm run frontend:dev
   ```

3. **访问应用**：
   - 打开浏览器访问：http://localhost:3000

### 方式二：从 frontend 目录启动

**如果从 `frontend` 目录启动：**

1. **在 `frontend` 目录创建 `.env` 文件**：
   ```env
   GEMINI_API_KEY=你的API密钥
   ```

2. **启动**：
   ```bash
   cd frontend
   npm run dev
   ```

**注意：** 如果从 `frontend` 目录启动，Vite 会优先读取 `frontend/.env`，但我们已经配置了从根目录读取，所以**推荐在根目录启动**。

---

## 🔧 环境变量配置

### 为什么要在根目录配置？

1. **统一管理**：所有环境变量在一个地方，方便管理
2. **Vite 配置**：`vite.config.ts` 已配置为从根目录（父目录）读取 `.env`
3. **符合规范**：monorepo 项目通常将环境变量放在根目录

### Vite 环境变量读取机制

**修改后的 `vite.config.ts`：**
```typescript
// 从根目录（父目录）读取 .env
const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
```

这意味着：
- ✅ `.env` 文件放在**根目录**（`chain-garden/.env`）
- ✅ Vite 会自动读取并注入到 `process.env.GEMINI_API_KEY`
- ✅ 不需要在 `frontend` 目录再创建 `.env`

---

## 🔑 Gemini API Key 配置

### 官方推荐方式

根据 `@google/genai` 官方文档，API Key 可以从环境变量自动读取：

```typescript
// 官方示例
import { GoogleGenAI } from "@google/genai";

// 空对象 - 自动从 process.env.GEMINI_API_KEY 读取
const ai = new GoogleGenAI({});
```

### 我们的实现

**文件：** `frontend/services/geminiService.ts`

```typescript
// 支持两种方式：
// 1. 构建时注入（Vite define）
// 2. 运行时从环境变量读取（官方推荐）

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

const ai = apiKey 
  ? new GoogleGenAI({ apiKey })  // 显式传入
  : new GoogleGenAI({});          // 空对象，自动读取环境变量
```

**工作原理：**
1. **开发环境**：Vite 的 `loadEnv` 从根目录 `.env` 读取 `GEMINI_API_KEY`
2. **构建时**：通过 `define` 注入到 `process.env.GEMINI_API_KEY`
3. **运行时**：如果构建时没有注入，`GoogleGenAI` 会自动从 `process.env.GEMINI_API_KEY` 读取

---

## 📝 配置步骤总结

### 第一次设置

1. **获取 Gemini API Key**：
   - 访问：https://aistudio.google.com/app/apikey
   - 登录并创建 API Key

2. **在根目录创建 `.env` 文件**：
   ```env
   GEMINI_API_KEY=AIzaSy...你的密钥
   ```

3. **从根目录启动**：
   ```bash
   npm run dev
   ```

4. **验证**：
   - 打开 http://localhost:3000
   - 输入一个 vibe（如："Techno spikes"）
   - 点击 "GENERATE FROM VIBE"
   - 应该能成功生成植物 DNA

### 如果遇到问题

**问题1：API Key 仍然无效**
- ✅ 确认 `.env` 文件在**根目录**（不是 `frontend` 目录）
- ✅ 确认 API Key 格式正确（以 `AIzaSy` 开头）
- ✅ **重启开发服务器**（修改 `.env` 后必须重启）

**问题2：找不到环境变量**
- ✅ 检查 `vite.config.ts` 中的路径配置
- ✅ 确认 `.env` 文件名称正确（不是 `.env.local` 或其他）
- ✅ 确认 `.env` 文件在根目录

**问题3：根目录 `npm run dev` 报错**
- ✅ 确认根目录 `package.json` 中有 `"dev"` 脚本
- ✅ 如果报错，使用 `npm run frontend:dev` 替代

---

## 🎯 最佳实践

1. **环境变量位置**：统一放在根目录 `.env`
2. **启动方式**：从根目录使用 `npm run dev`
3. **API Key 管理**：
   - 不要提交 `.env` 到 Git（已在 `.gitignore` 中）
   - 使用 `.env.example` 作为模板（可选）
   - 定期轮换 API Key

---

## 📚 相关文件

- `BUGFIXES.md` - 错误修复记录
- `ENV_SETUP.md` - 环境变量详细说明
- `frontend/vite.config.ts` - Vite 配置
- `frontend/services/geminiService.ts` - Gemini 服务实现

---

*最后更新：2024年*

