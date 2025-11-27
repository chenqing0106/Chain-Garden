# 环境变量配置指南

在项目根目录创建 `.env` 文件，并添加以下配置：

```env
# Sepolia RPC URL
# 从以下服务获取：https://infura.io 或 https://www.alchemy.com
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# 部署合约的账户私钥
# 警告：不要将包含真实私钥的文件提交到Git！
# 测试账户生成：npx hardhat node
PRIVATE_KEY=your_private_key_here

# Etherscan API Key (可选，用于合约验证)
# 从以下地址获取：https://etherscan.io/apis
ETHERSCAN_API_KEY=your_etherscan_key

# Gemini API Key (前端AI功能使用)
# 从以下地址获取：https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_key

# Pinata JWT (IPFS上传)
# 从以下地址获取：https://www.pinata.cloud/
VITE_PINATA_JWT=your_Pinata_JWT_Token（必填）
# VITE_PINATA_API_BASE=https://api.pinata.cloud（可选，代码中已设置）
# VITE_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs（可选，代码中已设置）
```

## 获取API密钥

### Sepolia RPC URL
1. 访问 [Infura](https://infura.io) 或 [Alchemy](https://www.alchemy.com)
2. 注册账户并创建新项目
3. 选择 Sepolia 测试网络
4. 复制 RPC URL

### Private Key
- **测试环境**：使用 `npx hardhat node` 生成的测试账户
- **生产环境**：使用 MetaMask 导出（仅用于部署，不要用于日常使用）

### Etherscan API Key（可选）
1. 访问 [Etherscan](https://etherscan.io/apis)
2. 注册并创建 API Key
3. 用于合约验证功能

### Gemini API Key
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录 Google 账户
3. 创建新的 API Key

### Pinata JWT
1. 访问 [Pinata](https://www.pinata.cloud/)
2. 登录 Google/GitHub 账户
3. 获取 JWT Token
- 登录后进入 Dashboard
- 点击右上角头像 → "API Keys"
- 点击 "New Key"，填写名称，勾选 "Admin"
- 复制 JWT Token（只显示一次，请保存）

## 安全提示

⚠️ **重要**：
- 永远不要将 `.env` 文件提交到 Git
- 不要在生产环境中使用主账户的私钥
- 定期轮换 API 密钥
- 使用环境变量管理工具（如 AWS Secrets Manager）存储生产密钥

