# Chain Garden 🌱

Chain Garden 致力于探索 **生成式艺术 (Generative Art)**、**人工智能 (AI)** 与 **Web3 技术** 的交叉点。我们的愿景是将无形的"声音"与抽象的"情绪"转化为可视化的数字植物。

每一株植物都是独一无二的：它的 DNA 来自 AI 解析的文字意象，它的生长随着用户上传的声音或音频文件而变化。通过区块链技术，这些数字生命被永久确权，构建一个由社区共创的、去中心化的数字植物园。

---

### 已部署地址

https://chain-garden-zetachain.vercel.app/

---

## 功能特性

### AI 植物合成（Lab）

- **文字 prompt 生成 DNA**：输入任意文字描述，AI 解析意象并生成对应的 `PlantDNA`（物种名、架构、颜色、心情、能量等）
- **图片多模态输入**：上传图片（支持 JPG/PNG/GIF，≤5MB）+ 可选文字补充，AI 分析图片内容生成植物 DNA
- **手动调参模式**：跳过 AI，直接选择植物架构、心情、色盘三项核心参数，适合快速实验
- **DNA 预览与确认**：合成后展示物种名、架构、心情、色盘，可接受（进入生长）或拒绝（重新合成）

### 植物生长可视化

- **8 种生长形态**：

  | 架构值 | 形态 |
  |--------|------|
  | `fractal_tree` | 分形树——递归分叉，层次丰富 |
  | `organic_vine` | 有机藤蔓——蜿蜒曲线，随机延伸 |
  | `radial_succulent` | 径向多肉——几何对称，从中心向外扩散 |
  | `fern_frond` | 蕨类——自相似羽状结构 |
  | `weeping_willow` | 垂柳——下垂长条，柔软挂落 |
  | `alien_shrub` | 外星灌木——异形生长，不规则突变 |
  | `crystal_cactus` | 水晶仙人掌——几何棱角，晶体感 |
  | `data_blossom` | 数据花——音频数据直接映射为花瓣辐射形态 |

- **实时音频驱动**：音频信号的低频/中频/高频映射为植物的生长速度、偏转角度、枝条颤动等物理参数（`BioState.stress` / `BioState.energy`）
- **Canvas 快照**：一键捕获当前帧，自动附加 DNA、音频、语音数据保存为标本

### 音频输入系统

| 模式 | 说明 |
|------|------|
| **麦克风** | 实时采集环境声音，分析频谱驱动植物生长 |
| **音频文件** | 上传本地音乐文件（MP3/WAV 等），解析驱动植物 |
| **Demo 预设** | 内置多种预设音频模式（无需麦克风），适合演示和测试 |
| **反思录音** | 随机显示引导性问题，用户对问题录制语音答复并附加到标本中 |

底部可视化器实时显示当前音频频谱。

### 植物声音化（Sonify）

- 点击 Sonify 按钮，植物 DNA 被映射为程序化音乐（通过 Tone.js 合成）
- 音乐随 `BioState` 实时调整（植物的压力状态影响音乐的音色与节奏）
- **音乐录制**：在音乐模式下可录制生成的音乐，录音将随标本一起保存至 IPFS
- 进入音乐模式后，左侧面板切换为"唱片机"UI，展示 BPM、心情、生物压力仪表

### 标本管理（Gallery）

- **保存标本**：快照图片 + PlantDNA + 可选音乐录音 + 可选语音反思 → 本地 Gallery
- **Gallery 视图**：响应式卡片网格，显示植物图片、物种名、prompt、铸造状态
- **标本详情**：查看完整 DNA 参数、引导问题与语音回放（`<audio>` 控件）、音乐录音下载、区块链状态与交易哈希链接
- **钱包绑定集合**：连接钱包后，匿名保存的标本自动迁移到钱包地址名下；不同钱包各自独立的收藏
- **删除 / 清空**：支持单个删除和一键清空收藏

### NFT 铸造

- **资产选择**：铸造前可选择上链内容：DNA 数据 / 生成音乐 / 语音反思（任意组合）
- **IPFS 上传**：图片与音频文件并行上传至 Pinata，生成元数据 JSON
- **分步进度**：IPFS 阶段 → 钱包签名阶段，铸造过程有明确的阶段提示
- **ZetaChain 铸造**：调用 `ChainGardenNFT.sol` 合约，支持跨链互操作
- **上架选项**：铸造时可同时选择在 Marketplace 公开上架，设定每份价格与总份额

### Marketplace

- **浏览上架植物**：网格/列表两种视图模式
- **搜索与筛选**：按物种名/创作者/类型搜索，按植物类型（Tree/Vine/Succulent 等）筛选
- **排序**：最新上架 / 热门（已售份额）/ 价格升序 / 价格降序
- **购买**：选择购买份额数量，支持多链支付（PurchaseModal）
- **我的持仓（Holdings）**：查看已购买的植物份额
- **市场统计**：总上架数、总交易量、参与创作者数

### 钱包与网络

- **MetaMask 集成**：连接/断开，页面刷新后静默重连
- **ZetaChain Testnet 自动切换**：连接后自动检测并提示切换到 ZetaChain Athens 测试网（Chain ID: 7001）
- **MetaMask 安装引导**：检测到未安装时提示并跳转官方下载页

### 国际化

- 中英双语（`LanguageContext` + `translations.ts`），右上角一键切换
- 所有 UI 文本、状态提示、错误消息均已翻译

---

## 📁 项目架构

```
chain-garden/
├── contracts/                          # 智能合约 (Solidity)
│   ├── ChainGardenNFT.sol              # 核心 NFT 合约：铸造、所有权、元数据绑定
│   ├── ZetaChainUniversalNFT.sol       # ZetaChain 全链 NFT（跨链互操作）
│   ├── EVMUniversalNFT.sol             # EVM 侧链 NFT 实现
│   └── ERC1967Proxy.sol                # 可升级代理合约
├── frontend/                           # React 前端应用
│   ├── App.tsx                         # 顶层编排（纯 JSX，业务逻辑委托给 hooks）
│   ├── config/
│   │   ├── contracts.ts                # ABI、合约地址、链 ID 集中管理
│   │   └── env.ts                      # 环境变量集中读取
│   ├── hooks/                          # 业务逻辑 hooks
│   │   ├── useWallet.ts                # 钱包连接/断开/静默重连
│   │   ├── useAudio.ts                 # 音频录制/分析/可视化/植物音乐
│   │   ├── useMarket.ts                # 市场状态与购买回调
│   │   └── useSpecimenCollection.ts    # 标本集合/保存/铸造流程
│   ├── components/
│   │   ├── PlantCanvas.tsx             # Canvas 组件（refs/effects/JSX）
│   │   ├── plantCanvas/                # Canvas 渲染子系统
│   │   │   ├── types.ts                # DrawState / PhysicsRefs 接口
│   │   │   ├── primitives.ts           # 底层绘图原语（8 个通用函数）
│   │   │   ├── physics.ts              # 音频→物理状态映射
│   │   │   └── architectures/          # 6 种植物生长算法
│   │   │       ├── fractal.ts          # 分形树
│   │   │       ├── vine.ts             # 有机藤蔓
│   │   │       ├── succulent.ts        # 径向多肉
│   │   │       ├── fern.ts             # 蕨类
│   │   │       ├── willow.ts           # 垂柳
│   │   │       ├── dataBlossom.ts      # 数据花
│   │   │       └── index.ts            # 根据 DNA 路由到对应算法
│   │   ├── Marketplace.tsx
│   │   ├── MintModal.tsx
│   │   ├── MusicCard.tsx
│   │   ├── PurchaseModal.tsx
│   │   ├── SpecimenDetailModal.tsx
│   │   └── GuideModal.tsx
│   ├── services/
│   │   ├── ai/
│   │   │   ├── aiServiceFactory.ts     # 懒加载单例，统一入口
│   │   │   ├── parseAndValidateDNA.ts  # DNA JSON 解析与校验（共享工具）
│   │   │   ├── geminiService.ts        # Google Gemini 适配
│   │   │   ├── qwenService.ts          # 阿里云通义千问适配
│   │   │   └── prompts.ts              # Prompt 模板
│   │   ├── web3Service.ts              # 链上交互（合约调用、网络切换）
│   │   ├── ipfsService.ts              # IPFS 上传（Pinata，图片/音频并行）
│   │   ├── storageService.ts           # LocalStorage 标本存储（单例）
│   │   ├── marketService.ts            # 市场数据管理
│   │   ├── audioService.ts             # Web Audio API 封装
│   │   ├── demoAudioService.ts         # 演示模式音频
│   │   └── plantMusicService.ts        # 植物音乐生成（Tone.js）
│   ├── contexts/LanguageContext.tsx    # 中英文多语言
│   ├── translations.ts                 # 翻译字典
│   └── types.ts                        # 全局类型定义
├── scripts/deploy.js                   # Hardhat 部署脚本
├── hardhat.config.js                   # Hardhat 配置
├── .gitattributes                      # 统一 LF 行尾
└── README.md
```

---

## 🔧 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript + Vite |
| UI 样式 | TailwindCSS + Risograph 美学 |
| 视觉渲染 | HTML5 Canvas API（自定义生成式渲染引擎） |
| 音频处理 | Web Audio API + Tone.js |
| AI 服务 | 阿里云通义千问 (Qwen) / Google Gemini（可切换） |
| 区块链交互 | Ethers.js v6 + MetaMask |
| 网络 | ZetaChain Athens Testnet（Chain ID: 7001） |
| 元数据存储 | IPFS（Pinata） |
| 合约开发 | Solidity 0.8.20 + OpenZeppelin + Hardhat |

---

## 🚀 本地开发

### 前置要求

- Node.js >= 18
- MetaMask 浏览器扩展
- ZetaChain Athens Testnet ZETA（用于 Gas 费）

### 安装依赖

```bash
# 根目录（Hardhat 合约工具链）
npm install

# 前端
cd frontend
npm install
```

### 配置环境变量

在**根目录**创建 `.env` 文件（所有变量统一放在根目录）：

```env
# AI 服务（至少配置一个）
QWEN_API_KEY=your_qwen_api_key            # 推荐：阿里云通义千问
GEMINI_API_KEY=your_gemini_api_key        # 可选：Google Gemini
AI_SERVICE_PROVIDER=qwen                  # 可选：明确指定，默认 qwen

# Pinata IPFS（铸造时必填）
VITE_PINATA_JWT=your_pinata_jwt_token
# VITE_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs  # 可选，有默认值

# 部署者私钥（不要提交到 Git！仅合约部署时需要）
PRIVATE_KEY=your_private_key_here
```

> **注意**：AI 变量（`QWEN_API_KEY` 等）无 `VITE_` 前缀；Pinata 变量需要 `VITE_` 前缀。
> `vite.config.ts` 通过 `loadEnv` 从根目录读取所有变量并注入前端构建。

### 运行前端

```bash
# 在根目录或 frontend/ 目录均可
npm run dev
```

访问 http://localhost:5173

### 编译与部署合约

```bash
# 编译合约
npm run compile

# 部署到本地 Hardhat 节点
npm run deploy:local

# 部署到 Sepolia 测试网
npm run deploy:sepolia
```

合约部署成功后，**只需更新 `frontend/config/contracts.ts` 中的 `CONTRACT_ADDRESS`**，前端其他代码无需改动。

---

## 🌿 植物生长架构

前端 `plantCanvas/architectures/` 中每种架构对应一个独立文件，均为纯函数，接受 `DrawState`（运行时音频状态）和 `dna`（植物配置）两个参数：

| `growthArchitecture` 值 | 名称 | 描述 |
|------------------------|------|------|
| `fractal_tree` | 分形树 | 递归分叉，表现树状、分支丰富的结构 |
| `organic_vine` | 有机藤蔓 | 蜿蜒曲线，延伸与盘绕 |
| `radial_succulent` | 径向多肉 | 从中心对称扩散，几何感强 |
| `fern_frond` | 蕨类 | 自相似羽状结构 |
| `weeping_willow` | 垂柳 | 下垂长条，柔软挂落感 |
| `data_blossom` | 数据花 | 音频数据直接映射为花瓣辐射形态 |

`PlantDNA` 可配置字段（定义于 `frontend/types.ts`）：

- `branchingFactor`：分支因子（2–5），控制每次分叉的子分支数量
- `angleVariance`：角度偏差，引入自然的不对称性
- `leafShape`：叶片形状（`fern` / `round` / `needle` / `abstract` / `heart` / `crystal`）
- `colorPalette`：颜色数组，映射为茎、主叶色、高光
- `growthSpeed`：生长速度，同时影响生成音乐的 BPM
- `energy`：能量值（0.0–1.0），影响生长活性与节奏密度

---

## 📄 许可证

MIT License

---

## 📚 文档

- [贡献指南](./docs/CONTRIBUTING.md)
- [完整文档索引](./docs/README.md)
