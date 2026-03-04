# Chain Garden — Frontend

React + TypeScript 前端应用，生成式音频响应植物艺术 + Web3 NFT 铸造。

---

## 快速启动

```bash
npm install
npm run dev
# 访问 http://localhost:5173
```

---

## 环境变量

在 `frontend/` 目录下创建 `.env` 文件：

```env
# AI 服务（至少配置一个）
VITE_QWEN_API_KEY=your_qwen_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_AI_SERVICE_PROVIDER=qwen          # qwen 或 gemini，默认 qwen

# Pinata IPFS（铸造时必填）
VITE_PINATA_JWT=your_pinata_jwt_token
```

---

## 目录结构

```
frontend/
├── App.tsx                             # 顶层编排，纯 JSX
├── config/
│   ├── contracts.ts                    # ABI、合约地址、链 ID（合约升级只改这里）
│   └── env.ts                          # 所有 env var 集中读取
├── hooks/
│   ├── useWallet.ts                    # 钱包连接/断开/静默重连
│   ├── useAudio.ts                     # 音频录制/分析/可视化/植物音乐
│   ├── useMarket.ts                    # 市场状态与购买
│   └── useSpecimenCollection.ts        # 标本集合/铸造流程
├── components/
│   ├── PlantCanvas.tsx                 # Canvas 组件（refs/effects/JSX）
│   ├── plantCanvas/                    # Canvas 渲染子系统
│   │   ├── types.ts                    # DrawState / PhysicsRefs 接口
│   │   ├── primitives.ts               # 底层绘图原语
│   │   ├── physics.ts                  # 音频→物理状态映射
│   │   └── architectures/             # 植物生长算法（每种一个文件）
│   │       ├── fractal.ts / vine.ts / succulent.ts
│   │       ├── fern.ts / willow.ts / dataBlossom.ts
│   │       └── index.ts               # 根据 DNA 路由到对应算法
│   ├── MintModal.tsx
│   ├── Marketplace.tsx
│   ├── MusicCard.tsx
│   ├── PurchaseModal.tsx
│   ├── SpecimenDetailModal.tsx
│   └── GuideModal.tsx
├── services/
│   ├── ai/
│   │   ├── aiServiceFactory.ts         # 懒加载单例，统一入口
│   │   ├── parseAndValidateDNA.ts      # DNA 解析与校验（qwen/gemini 共用）
│   │   ├── geminiService.ts
│   │   ├── qwenService.ts
│   │   └── prompts.ts
│   ├── web3Service.ts                  # 链上交互（mint、网络切换）
│   ├── ipfsService.ts                  # IPFS 上传（图片/音频并行）
│   ├── storageService.ts               # LocalStorage 标本存储（单例）
│   ├── marketService.ts
│   ├── audioService.ts
│   ├── demoAudioService.ts
│   └── plantMusicService.ts
├── contexts/LanguageContext.tsx
├── translations.ts
└── types.ts
```

---

## 关键设计说明

### 合约配置只有一个地方

`config/contracts.ts` 集中管理合约 ABI、地址、链 ID。**部署新合约后只改这一个文件**，web3Service 和其他服务都从这里导入，不存在其他硬编码位置。

### App.tsx 是纯编排层

App.tsx 不包含业务逻辑，只负责：
1. 调用 4 个 hooks 获取状态和回调
2. 处理跨 hook 的交互函数（需要同时访问多个 hook 状态）
3. 渲染 JSX

### PlantCanvas 渲染子系统

Canvas 渲染拆分为：
- **DrawState 快照**：每帧构建一次，将所有 ref 值打包成普通对象传给绘图函数，消除隐式闭包依赖
- **PhysicsRefs 引用传递**：物理状态更新使用引用传递，与只读快照分离
- **architectures/**：每种植物算法独立文件，均为纯函数，可单独测试

### AI 服务可切换

通过 `VITE_AI_SERVICE_PROVIDER` 环境变量在 Qwen 和 Gemini 之间切换，`aiServiceFactory.ts` 懒加载并缓存单例，两个服务共享 `parseAndValidateDNA.ts` 中的解析校验逻辑。

---

## NPM Scripts

```bash
npm run dev      # 开发服务器
npm run build    # 生产构建
npm run preview  # 预览构建产物
```
