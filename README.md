# Chain Garden 🌱

Chain Garden 致力于探索 **生成式艺术 (Generative Art)**、**人工智能 (AI)** 与 **Web3 技术** 的交叉点。我们的愿景是将无形的“声音”与抽象的“情绪”转化为可视化的数字植物。

每一株植物都是独一无二的：它的 DNA 来自 AI 解析的文字意象，它的生长则是随着用户上传的声音或者音频文件变化。通过区块链技术，这些数字生命被永久确权，构建一个由社区共创的、去中心化的数字植物园。

---

### 已部署地址
https://chain-garden.vercel.app/

## 📁 项目架构

```
chain-garden/
├── contracts/                 # 智能合约代码
│   └── ChainGardenNFT.sol    # ERC-721 NFT合约
├── scripts/                   # 部署脚本
│   └── deploy.js             # 合约部署脚本
├── frontend/                  # React前端代码
│   ├── components/           # React组件
│   │   ├── MintModal.tsx
│   │   ├── PlantCanvas.tsx
│   │   └── SpecimenDetailModal.tsx
│   ├── services/             # 服务层
│   │   ├── audioService.ts   # 音频分析服务
│   │   ├── geminiService.ts  # Gemini AI服务
│   │   ├── plantMusicService.ts # 植物音乐生成
│   │   ├── ipfsService.ts # ipfs去中心化处理
│   │   └── web3Service.ts    # Web3交互服务
│   ├── App.tsx               # 主应用组件
│   ├── index.tsx             # 入口文件
│   └── types.ts              # TypeScript类型定义
├── hardhat.config.js         # Hardhat配置
├── package.json              # 项目依赖（Hardhat）
└── README.md                 # 项目文档
```
## 🔧 技术栈

- **智能合约**: Solidity 0.8.20, Hardhat, OpenZeppelin
- **前端**: React 19, TypeScript, Vite, TailwindCSS
- **Web3**: Ethers.js v6
- **AI**: Google Gemini API
- **音频**: Tone.js

---

## 🚀 本地部署步骤

### 前置要求
- Node.js >= 18
- MetaMask浏览器扩展
- Sepolia测试网ETH（用于Gas费）

```bash
# 安装Hardhat依赖（根目录）
npm install

# 安装前端依赖
cd frontend
npm install
```

### 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# Sepolia RPC URL (使用 Infura 或 Alchemy)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# 部署者私钥（不要提交到Git！）
PRIVATE_KEY=your_private_key_here

# Etherscan API Key (可选，用于合约验证)
ETHERSCAN_API_KEY=your_etherscan_key

# Gemini API Key (前端使用)
GEMINI_API_KEY=your_gemini_key
```

### 编译合约

```bash
npm run compile
```

### 部署合约

```bash
# 部署到本地Hardhat节点
npm run deploy:local

# 部署到Sepolia测试网
npm run deploy:sepolia
```

部署成功后，更新 `frontend/services/web3Service.ts` 中的 `CONTRACT_ADDRESS`。详细步骤请查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)。

### 运行前端

```bash
npm run dev
```
访问 http://localhost:3000

---

---

## 🔧 技术栈

### 1. 前端层 (Frontend)


- **框架**：React 19 + TypeScript + Vite

- **UI 组件**：TailwindCSS

- **视觉渲染**：HTML5 Canvas API (自定义渲染引擎)

- **AI 服务**：Google Gemini Pro Vision integration

- **音乐处理**：Tone.js


### 2. 逻辑与交互层 (Logic & Web3)

  
- **区块链交互**：Ethers.js v6

- **钱包连接**：MetaMask (Injected Provider)

- **状态管理**：React Hooks + LocalStorage

  

### 3. 合约与存储层 (Contract & Storage)

- **智能合约**：Solidity 0.8.20 (基于 OpenZeppelin)

- **开发框架**：Hardhat

- **网络**：Sepolia Testnet

- **元数据存储**：IPFS (InterPlanetary File System)

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

**支持的生长架构**

- **分形树 (Fractal Tree)**: 经典的递归分叉结构，适合表现树状、分支丰富的样式。`growthArchitecture` 值：`fractal_tree`。
- **有机藤蔓 (Organic Vine)**: 蜿蜒生长的曲线形态，常表现为延伸与盘绕。`growthArchitecture` 值：`organic_vine`。
- **径向多肉 (Radial)**: 从中心向四周对称扩散的几何美感，适合多肉类或放射状生长。`growthArchitecture` 值：`radial_succulent`。
- **蕨类 (Fern)**: 自相似的羽状结构，展示自然界的重复与比例。`growthArchitecture` 值：`fern_frond`。
- **垂柳样 (Weeping Willow)**: 具有下垂、垂坠感的长条生长结构，适合表现柔软挂落的枝条。`growthArchitecture` 值：`weeping_willow`。
- **异形灌木 (Alien Shrub)**: 更具抽象或科幻感的灌木状结构，支持非常规参数以产生奇异外观。`growthArchitecture` 值：`alien_shrub`。
- **晶体仙人掌 (Crystal Cactus)**: 具有几何/晶体化分叉的多肉类表现，用于生成角度分明的结构。`growthArchitecture` 值：`crystal_cactus`。
- **数据花 (Data Blossom)**: 从数值/音频数据直接映射为花瓣或辐射形态的生成式结构，适合可视化数据驱动生长。`growthArchitecture` 值：`data_blossom`。

- **示例可配置 DNA 字段**: 以下字段在 `frontend/types.ts` 的 `PlantDNA` 中定义，可用于微调不同架构的外观与行为：
	- `branchingFactor`: 分支因子（例如 2–5），控制每次分叉的子分支数量。
	- `angleVariance`: 角度偏差，用于引入随机或自然的不对称性。
	- `leafShape`: 叶片形状（例如 `fern`、`round`、`needle`、`abstract`、`heart`、`crystal`）。
	- `leafArrangement`: 叶序（`alternate`、`opposite`、`whorled`）。
	- `colorPalette`: 颜色数组（例如 `["#2b7a2b","#6bd36b","#a6f5a6"]`），分别通常映射为茎、主叶色、高光。
	- `growthSpeed`: 生长/动画速度，亦会影响生成音乐的 BPM。
	- `energy`: 0.0–1.0 的能量值，影响生长活性与节奏密度。

- **如何查看/修改**: 具体可配置字段与取值定义位于 `frontend/types.ts` 中，渲染与生长逻辑由 `frontend/components/PlantCanvas.tsx` 和相关服务（如 `plantMusicService.ts`）驱动。

---

## 📞 联系方式

如有问题，请提交 Issue 或联系项目维护者。

---

