# REFACTOR_LOG.md

> 基于 summary_layer1/2/3.json 三层摘要分析生成。
> 涉及代码证据：`App.tsx` 1238 行、`PlantCanvas.tsx` 1922 行、`web3Service.ts` ABI 硬编码于第 7 行。
> 生成时间：2026-03-03 | 分支：refactor/architecture

---

## 一、技术债清单（按严重程度分级）

### P0 · 生产阻断 / 数据风险

| ID | 文件 | 问题 | 风险 |
|----|------|------|------|
| P0-01 | `translations.ts` | 大量中文文案 Mojibake（乱码），存在直接展示给用户异常字符的风险 | 用户直接看到乱码，核心体验崩溃 |
| P0-02 | `services/ai/prompts.ts` | 中英文 prompt 文案 Mojibake，会将损坏文本发送至 AI 接口 | AI 输出质量不可预测，PlantDNA 生成结果错误 |
| P0-03 | `services/marketService.ts` | `getAllListings` 对内部数组原地 `sort`，隐式变更共享状态 | 多处调用后排序结果污染，数据不可复现 |
| P0-04 | `services/web3Service.ts` | 合约 ABI 与地址硬编码在前端（第 7 行），无多环境区分 | 合约升级必须同步改动前端代码，主网/测试网切换无保障 |
| P0-05 | `components/MintModal.tsx` | 成功态 tokenId 使用随机数回显给用户 | 用户看到虚假 tokenId，误以为铸造成功且有具体编号 |
| P0-06 | `services/ipfsService.ts` | `includeDNA=false` 时用 `{} as Specimen['dna']` 掩盖空值 | 类型系统静默放行，下游消费空对象时运行时崩溃 |
| P0-07 | `services/storageService.ts` | 同一流程多次读写 localStorage 无事务语义，异常可造成中间态持久化 | 标本数据部分写入，集合不一致，用户丢失数据 |

---

### P1 · 高维护风险 / 功能性 Bug

| ID | 文件 | 问题 | 风险 |
|----|------|------|------|
| P1-01 | `App.tsx` (1238 行) | 单文件承担音频、AI、钱包、存储、市场、UI 状态机全部领域逻辑 | 任意领域改动都要在 1200+ 行中定位，回归成本极高 |
| P1-02 | `components/PlantCanvas.tsx` (1922 行) | 渲染、物理模拟、频谱映射、交互事件全部耦合在单文件 | 画布 bug 无法隔离定位，物理与绘制逻辑互相依赖 |
| P1-03 | `contexts/LanguageContext.tsx` | 占位符替换使用 `String.replace`（单次），同一占位符多次出现只替换首个 | 含重复参数的 UI 文案显示错误 |
| P1-04 | `services/ai/geminiService.ts` | 同一服务内混用 `gemini-2.5-flash` 与 `gemini-2.0-flash-exp` 两个模型版本 | 文本与图片生成行为不一致，响应结构可能差异 |
| P1-05 | `services/ai/qwenService.ts` & `geminiService.ts` | JSON 清洗与字段校验逻辑在两个服务中重复实现 | 其中一处修复 bug 另一处被遗漏，长期分叉 |
| P1-06 | `services/ai/aiServiceFactory.ts` | 模块加载时即完成 `aiService` 初始化，运行中环境变量变更无法生效 | 开发热重载与多环境切换下服务实例不刷新 |
| P1-07 | `services/storageService.ts` | 静态类直接包裹 localStorage，无法注入替代存储 | 无法单元测试，无法服务端渲染，无法切换存储后端 |
| P1-08 | `components/PurchaseModal.tsx` | `isPlaying` 状态仅切换图标，未绑定真实音频播放逻辑 | UI 状态与实际音频脱节，用户交互无响应 |
| P1-09 | `services/plantMusicService.ts` | 通过 `(Tone.Transport.bpm as any)._defaultValue` 读写内部字段 | Tone.js 版本升级即可静默破坏音乐生成逻辑 |
| P1-10 | `services/demoAudioService.ts` | `catch` 后忽略错误（多处吞错） | 音频故障无诊断信号，线上排查困难 |
| P1-11 | `services/web3Service.ts` | `signer` 类型为 `any`；`connectWallet`/`switchNetwork`/`mintNFT` 三大流程高度耦合 | 类型安全无保障；任一流程改动影响其他两个 |

---

### P2 · 代码质量 / 可扩展性

| ID | 文件 | 问题 | 风险 |
|----|------|------|------|
| P2-01 | `types.ts` | 单一 `PlantDNA` 模型混合创作域、链上域、市场域字段 | 字段边界不清，随业务演进类型会持续膨胀 |
| P2-02 | `types.ts` | 数值范围仅通过注释约束（如 0-100、1-10） | 无编译期保障，非法值在运行时流转 |
| P2-03 | `services/ai/prompts.ts` | `AI_PROMPTS_CN` 未显式声明为 `PromptConfig`；schema 以字符串拼接维护 | 中文 prompt 结构靠隐式推断；schema 与 `PlantDNA` 类型随时漂移 |
| P2-04 | `services/ai/aiService.interface.ts` | 接口强依赖浏览器 `File` 类型 | 无法在 Node.js 测试环境或服务端复用接口 |
| P2-05 | `services/audioService.ts` | 麦克风增益硬编码 5.0；频段按数组三等分而非真实频率划分 | 不同设备表现不一；频谱分析科学性弱 |
| P2-06 | `services/marketService.ts` | localStorage 存储结构无版本号与迁移策略 | 数据格式演进时已有用户数据损坏 |
| P2-07 | `services/ipfsService.ts` | 模块顶层日志副作用（import 即打印环境配置） | 测试与生产环境引入即产生噪音日志 |
| P2-08 | `components/GuideModal.tsx` | 用 `split(':')` 解析翻译文案提取子字段 | 文案中含冒号时静默解析错误 |
| P2-09 | `components/MusicCard.tsx` | `t(specimen.dna.growthArchitecture as any)` 类型安全缺失 | 翻译键错误只在运行时暴露 |
| P2-10 | `components/SpecimenDetailModal.tsx` | 区块浏览器 URL 硬编码测试网域名 | 主网上线需搜索改多处，遗漏风险高 |
| P2-11 | `translations.ts` | 所有翻译键集中单文件；翻译对象无显式接口约束 | PR 冲突频率高；语言间键一致性靠人工维护 |
| P2-12 | `services/ai/index.ts` | barrel 全量重导出 `prompts`，扩大对外 API 暴露面 | 内部 prompt 变更被外部模块感知，变更影响面扩大 |

---

## 二、重构优先级排序与决策理由

### Phase 0 · 热修复（不影响架构，立即可做）

**目标：消灭 P0 生产 Bug，不引入结构改动。**

| 顺序 | 任务 | 为什么优先 |
|------|------|-----------|
| 0-A | 修复 `translations.ts` 及 `prompts.ts` Mojibake（P0-01, P0-02） | 乱码直接面向用户；AI prompt 损坏影响核心功能。修复代价低（重新保存为 UTF-8），不改架构。 |
| 0-B | 修复 `marketService.getAllListings` 原地排序（P0-03） | 一行 `[...this.listings].sort(...)` 即可修复，但 bug 会随时触发数据污染。 |
| 0-C | 移除 `MintModal` 随机 tokenId 回显（P0-05） | 用户可能截图、分享错误 tokenId。改为"待确认"占位符，代价极低。 |
| 0-D | 修复 `ipfsService` 空值断言（P0-06） | `{} as Specimen['dna']` 是主动蒙蔽类型系统；改为 `undefined` 并让调用方处理才是正确语义。 |
| 0-E | 修复 `LanguageContext` replace 单次替换（P1-03） | 改为 `replaceAll` 一字之差，但影响所有含占位符的 UI 文案正确性。 |

**为什么 P0-04（ABI 硬编码）和 P0-07（Storage 事务）不在 Phase 0？**
- P0-04 需要引入配置加载机制，属于架构改动，放 Phase 2。
- P0-07 需要重新设计 StorageService 接口，放 Phase 3。

---

### Phase 1 · 拆解 God Components（最高 ROI 的结构改动）

**目标：降低 App.tsx 和 PlantCanvas.tsx 的认知负担，为后续各域独立演进打基础。**

| 顺序 | 任务 | 为什么优先 |
|------|------|-----------|
| 1-A | App.tsx → 提取自定义 Hooks | App.tsx 1238 行是所有后续重构的障碍。先抽出 `useAudio`、`useWallet`、`useSpecimenCollection`、`useMarket` 四个 Hook，App.tsx 只做编排。不改行为，只移动代码，回归风险可控。 |
| 1-B | PlantCanvas.tsx → 分离物理引擎与渲染层 | 1922 行的 Canvas 组件无法独立测试。物理更新逻辑（分支、风力、重力）应提取为纯函数模块，Canvas 仅负责 draw loop。 |

**为什么先做 1-A 而不是先修 Service 层？**
App.tsx 是所有服务的调用入口。若先改 Service API，App.tsx 庞大的调用代码会是高风险改动面，极易引入回归。先瘦身 App.tsx，后续 Service 改动的影响范围才可控。

---

### Phase 2 · 配置外化 & Web3 边界

**目标：解除 web3Service 与合约实现的硬绑定，支持多环境部署。**

| 顺序 | 任务 | 为什么优先 |
|------|------|-----------|
| 2-A | 将合约 ABI 与地址提取到配置文件（P0-04） | 当前合约文件已被修改（git status 可见），说明合约迭代正在发生。每次合约升级都要同步改前端硬编码，是持续风险。建立 `config/contracts.ts` 按网络导出地址与 ABI。 |
| 2-B | 统一环境变量读取层（aiServiceFactory、web3Service、ipfsService 均各自读 process.env） | 分散的 env 读取无法集中校验，缺失 key 只在运行时暴露。建立 `config/env.ts` 集中读取并在启动期 fail-fast。 |
| 2-C | web3Service signer 类型修复（P1-11） | 合约交互是铸造主链路；any 类型在合约 ABI 更新后掩盖参数不匹配错误。 |

---

### Phase 3 · Service 层标准化

**目标：消灭重复代码、建立可测试的服务边界。**

| 顺序 | 任务 | 为什么优先 |
|------|------|-----------|
| 3-A | 提取 AI 服务共享的 JSON 解析与 PlantDNA 校验工具（P1-05） | qwenService 和 geminiService 存在相同的清洗逻辑，任意一处改动不同步另一处即埋 bug。提取为 `parseAndValidateDNA(raw: unknown): PlantDNA` 共享函数。 |
| 3-B | 建立结构化 ServiceError 类型替代字符串匹配（P1-09 相关） | 跨 AI/Web3/IPFS 服务的错误处理均依赖字符串 match，脆弱且无法机器处理。定义 `ServiceError` 枚举后可在 UI 层做精确提示。 |
| 3-C | StorageService 改为可注入实例（P0-07, P1-07） | 静态类无法测试也无法替换后端。改为接口 + 默认 LocalStorageAdapter，解决事务语义问题并开放可测试性。 |
| 3-D | aiServiceFactory 改为懒加载（P1-06） | 模块级立即初始化对热重载不友好。改为 `getAIService()` 按需初始化并缓存，保留 `reset()` 接口供测试使用。 |
| 3-E | demoAudioService / audioService 错误上报（P1-10） | 吞错是线上排查的最大障碍。最低代价：将 `catch (e) {}` 改为 `catch (e) { console.error('[AudioService]', e); }` 并在关键路径向上 throw。 |

---

### Phase 4 · 类型安全与 i18n 完整性

**目标：让编译期发现运行时才暴露的问题。**

| 顺序 | 任务 | 为什么优先 |
|------|------|-----------|
| 4-A | `AI_PROMPTS_CN` 显式声明为 `PromptConfig`；prompts schema 与 `PlantDNA` 类型联动（P2-03） | Schema 漂移只在 AI 返回错误字段时才被发现，此时已影响用户。用 `satisfies PromptConfig` 和类型工具从 `PlantDNA` 生成 schema。 |
| 4-B | 消灭组件中的 `as any` 翻译键（P2-09）；补全硬编码英文（P2-10） | 翻译键 any 转型让 TS 无法检查键是否存在，i18n 回归测试形同虚设。 |
| 4-C | `SpecimenDetailModal` 区块浏览器 URL 集中到配置（P2-10） | 主网上线时散落的硬编码 URL 会被遗漏，迁移到 Phase 2 建立的 `config/` 层。 |
| 4-D | `marketService` localStorage 结构加版本号与迁移 shim（P2-06） | 存储格式迭代是必然，早建版本机制比后期数据恢复成本低。 |

---

### Phase 5 · 架构长期演进（可选 / 按业务节奏）

| 顺序 | 任务 | 为什么后置 |
|------|------|-----------|
| 5-A | `translations.ts` 按领域拆分（P2-11） | 单文件够用时暂不拆；等翻译文件超过 500 行或出现协作冲突时再拆，过早拆分反而带来 barrel 导入复杂性。 |
| 5-B | `PlantDNA` 数值范围改用 Branded Types 或 zod（P2-02） | 依赖 zod 等 runtime validator 对整体架构有影响，需与 AI schema 生成联动，放最后做。 |
| 5-C | `AIService` 接口解耦浏览器 `File` 类型（P2-04） | 当前只在前端运行，无服务端计划；有 SSR 需求时再处理。 |

---

## 三、文件耦合关系图与高风险改动点

### 3.1 核心依赖拓扑

```
                     ┌──────────────────────────────────────────────┐
                     │                  types.ts                    │
                     │  PlantDNA · Specimen · MarketListing · ...   │
                     └──────────────┬───────────────────────────────┘
                                    │ 被 ~15 个文件直接依赖
          ┌─────────────────────────┼──────────────────────────┐
          │                         │                          │
   AI 服务层                    Services 层               Components 层
aiService.interface              audioService              PlantCanvas
prompts.ts ──→ qwenService       demoAudioService          GuideModal
              geminiService      plantMusicService         MusicCard
              aiServiceFactory   ipfsService               MintModal
              ai/index           storageService            PurchaseModal
                                 marketService             SpecimenDetailModal
                                 web3Service               Marketplace
                                    │
                     ┌─────────────▼──────────────────────────┐
                     │               App.tsx (1238 行)         │
                     │  编排以上所有服务 + 所有组件的 Props 契约  │
                     └─────────────────────────────────────────┘
                                    ↑
                     translations.ts → LanguageContext → 所有组件
```

---

### 3.2 高风险改动点（改动前必须评估影响）

#### 🔴 极高风险

| 改动点 | 被影响文件 | 注意事项 |
|--------|-----------|---------|
| `types.ts` 中 `PlantDNA` 字段改动 | `qwenService`、`geminiService`、`prompts`、`PlantCanvas`、`ipfsService`、`App.tsx`、`MusicCard`、`SpecimenDetailModal`、`storageService` ≥ 10 个文件 | 修改前需全局搜索字段名；prompts 中的 schema 字符串不会被 TS 报错，必须人工同步 |
| `types.ts` 中 `Specimen` 字段改动 | `storageService`、`marketService`、`ipfsService`、`App.tsx`、`MintModal`、`SpecimenDetailModal` | marketService 的 localStorage 序列化与 Specimen 结构强绑定，字段改名需同步迁移 shim |
| `App.tsx` 状态结构改动 | 所有子组件的 props（直接传递 state） | App.tsx 是 props 的唯一来源，状态类型变更级联到全部组件 |

#### 🟠 高风险

| 改动点 | 被影响文件 | 注意事项 |
|--------|-----------|---------|
| `web3Service.ts` ABI / 合约地址 | `App.tsx`（调用 mintNFT）；合约编译产物 | ABI 需与部署版本严格同步，不匹配时铸造会静默失败 |
| `translations.ts` 键名变更 | `LanguageContext`（TranslationKey 类型）→ 所有使用 `t()` 的组件 | TS 可检查字符串键，但含 `as any` 强转的调用点（MusicCard、SpecimenDetailModal）不受保护 |
| `marketService` listings 数据结构 | `Marketplace.tsx`、`PurchaseModal.tsx`、`MusicCard.tsx`；localStorage 已持久化数据 | 需要同时提供 v1→v2 迁移逻辑，否则旧用户数据丢失 |
| `prompts.ts` schema 字符串 | `qwenService`、`geminiService` 的 JSON 解析逻辑 | 类型系统无法检测漂移，改 schema 必须同步更新两处服务的验证逻辑 |

#### 🟡 中风险

| 改动点 | 被影响文件 | 注意事项 |
|--------|-----------|---------|
| `aiServiceFactory.ts` 工厂逻辑 | `ai/index.ts`（重导出）→ `App.tsx` | 工厂接口改动需同步 index barrel，避免旧导出残留 |
| `storageService.ts` 静态→实例化 | `App.tsx`（直接调用 StorageService.xxx） | 调用方从 `StorageService.method()` 改为 `storageService.method()`，需全局替换 |
| `PlantCanvas.tsx` 物理引擎提取 | `App.tsx` 传入的 `onBioUpdate` 回调签名 | BioState 的生成逻辑移出 Canvas 后，回调时机与数据格式需严格对齐 |

---

## 四、各阶段完成后需更新的文档

### Phase 0（热修复）完成后
- [ ] `CHANGELOG.md` —— 记录 Mojibake 修复、排序 bug、tokenId 占位符变更
- [ ] 如有用户文档中的截图含乱码，同步更新截图

### Phase 1（拆解 God Components）完成后
- [ ] `docs/architecture.md`（如无则新建）—— 更新组件责任划分图，标注 4 个新 Hook 的职责边界
- [ ] `frontend/components/README.md` —— 说明 PlantCanvas 拆分后物理引擎模块的接口契约
- [ ] `App.tsx` 内联注释 —— 删除已迁移到 Hook 的业务逻辑注释，仅保留编排说明

### Phase 2（配置外化 & Web3 边界）完成后
- [ ] `docs/deployment.md` —— 说明 `config/contracts.ts` 的多网络配置方式，列出各环境所需 env 变量
- [ ] `.env.example` —— 同步所有集中管理后的环境变量键名
- [ ] `README.md` 快速启动章节 —— 更新 env 配置步骤

### Phase 3（Service 层标准化）完成后
- [ ] `docs/services.md`（如无则新建）—— 记录 `ServiceError` 类型枚举及各服务的错误码约定
- [ ] `docs/storage.md` —— 记录 StorageService 接口定义及 LocalStorageAdapter 替换方式
- [ ] 测试目录 README —— 说明 StorageService 在测试中的 Mock 注入方式

### Phase 4（类型安全 & i18n）完成后
- [ ] `docs/i18n.md` —— 说明翻译键添加规范（必须双语同步、禁止 `as any`）
- [ ] `docs/types.md` —— 说明 `PlantDNA` 各字段的取值范围约束（此时已有编译期保障，文档与代码双重约束）

### Phase 5（长期架构演进）完成后
- [ ] `docs/architecture.md` —— 更新领域分层图（若 translations 拆分）
- [ ] `docs/contributing.md` —— 如引入 zod，说明 schema 定义规范与生成流程

---

## 五、摘要信息盲区（需补充分析）

以下内容在三层摘要中未覆盖，做出架构决策前建议补充：

| 盲区 | 影响决策 | 建议 |
|------|---------|------|
| `contracts/` 四个合约文件（ChainGardenNFT、ERC1967Proxy、EVMUniversalNFT、ZetaChainUniversalNFT）的接口与升级模式 | Phase 2 的 ABI 外化方案取决于合约是否使用代理模式（ERC1967Proxy 存在，需确认是否 UUPS/Transparent） | 补充 summary_layer_contracts.json |
| `commands/` 目录（deploy-simple.ts、index.ts 均已修改） | 部署脚本改动是否与前端配置外化联动 | 快速读一遍 deploy-simple.ts |
| `hardhat.config.js` 网络配置 | Phase 2 中 `config/contracts.ts` 的网络 ID 列表需与 hardhat 配置一致 | 读 hardhat.config.js 导出的 networks 字段 |

---

*本文档随每个 Phase 完成后同步更新，在对应 Phase 的 PR 描述中引用本文档相关条目。*
