# 🚀 NFT 上链部署指南

本指南将帮助你完成从合约部署到 NFT 上链的完整流程。

---

## 第一部分：在 Remix 中部署合约到测试网

### 前置准备

1. **准备 MetaMask 钱包**
   - 安装 MetaMask 浏览器扩展
   - 创建一个新账户或使用现有账户
   - 切换到 Sepolia 测试网

2. **获取 Sepolia 测试网 ETH（用于支付 Gas 费）**
   - 访问 [Sepolia Faucet](https://sepoliafaucet.com/) 或 [Alchemy Faucet](https://sepoliafaucet.com/)
   - 输入你的钱包地址
   - 获取测试 ETH（可能需要等待几分钟）

### 步骤 1：打开 Remix IDE

1. 访问 [Remix IDE](https://remix.ethereum.org/)
2. 如果首次使用，等待页面完全加载

### 步骤 2：导入合约文件

**方法一：直接复制粘贴（推荐）**

1. 在 Remix 左侧文件浏览器中，删除默认的 `contracts/` 文件夹中的示例文件
2. 创建新文件：点击 "Create New File"
3. 文件名输入：`ChainGardenNFT.sol`
4. 从你的项目中复制 `contracts/ChainGardenNFT.sol` 的全部内容，粘贴到 Remix 编辑器

**方法二：使用 GitHub Gist**

1. 将合约代码上传到 GitHub Gist
2. 在 Remix 中使用 "Load from Gist" 功能导入

### 步骤 3：配置编译器

1. 点击左侧面板的 **"Solidity Compiler"** 图标（第二个图标）
2. **Compiler 版本**：选择 `0.8.20` 或更高版本（与合约中的 `pragma solidity ^0.8.20` 匹配）
3. **Auto compile**：勾选此选项（这样修改代码后会自动编译）
4. 点击 **"Compile ChainGardenNFT.sol"** 按钮
5. 检查编译结果，确保没有错误（应该看到绿色的 ✓ 标记）

**如果编译失败：**
- 检查编译器版本是否匹配
- 确认所有 OpenZeppelin 导入都能正确解析（Remix 会自动处理）
- 查看错误信息，根据提示修复

### 步骤 4：配置部署环境

1. 点击左侧面板的 **"Deploy & Run Transactions"** 图标（第四个图标）
2. **Environment**：选择 **"Injected Provider - MetaMask"**
   - 这会弹出 MetaMask 连接提示，点击 "连接"
   - 如果看到 "Account" 显示你的钱包地址，说明连接成功

3. **确认网络**：
   - 确保 MetaMask 中选中的是 **Sepolia Testnet**
   - 如果选中的是其他网络，在 MetaMask 中切换到 Sepolia

### 步骤 5：部署合约

1. **选择合约**：在 "Contract" 下拉菜单中选择 `ChainGardenNFT`
2. **填写构造函数参数**：
   - Remix 会显示一个表格，需要填写以下参数：
   
   | 参数 | 说明 | 示例值 |
   |------|------|--------|
   | `name` | NFT 集合名称 | `"Chain Garden NFT"` |
   | `symbol` | NFT 符号 | `"CGNFT"` |
   | `baseTokenURI` | 基础元数据 URI | 见下方详细说明 |先用ipfs://占位
   | `_mintPrice` | 铸造价格（单位：wei） | `10000000000000000` （0.01 ETH，18个0） |
   | `_maxSupply` | 最大供应量（0=无限制） | `10000` 或 `0` |

   **关于 `baseTokenURI` 的详细说明**：
   
   `baseTokenURI` 是 NFT 元数据的基础 URI。**但在这个合约中，它主要用于记录和后续管理**，因为合约在铸造时会为每个 NFT 设置完整的元数据 URI（通过 `_setTokenURI()` 函数）。
   
   **部署时可以使用以下值**：
   
   - **如果你已经知道 IPFS 的基础路径**：
     ```
     ipfs://QmYourIPFSHash/
     ```
   
   - **如果你计划使用中心化服务器**：
     ```
     https://your-metadata-server.com/api/token/
     ```
   
   - **如果暂时不确定（推荐）**：
     使用占位符，后续可以通过合约的 `setBaseTokenURI()` 函数更新：
     ```
     https://placeholder.com/
     ```
     或者：
     ```
     ipfs://
     ```
   
   **重要提示**：
   - ⚠️ 这个值在部署时**不是必须完全准确的**，因为合约在铸造 NFT 时会使用完整的 URI（由前端上传到 IPFS 后传入）
   - ✅ 如果之后需要更改，可以通过合约的 `setBaseTokenURI()` 函数（只有合约所有者可以调用）
   - 📝 建议先使用简单的占位符，等部署完成并测试铸造流程后再决定是否需要更新

   **其他参数注意事项**：
   - 价格单位是 wei，1 ETH = 10^18 wei
   - 如果需要 0.01 ETH，输入 `10000000000000000`

3. **点击 "Deploy" 按钮**
   - MetaMask 会弹出交易确认窗口
   - 检查 Gas 费用（通常在 Sepolia 测试网上很便宜）
   - 点击 "确认" 或 "Confirm"
   - 等待交易确认（通常需要 10-30 秒）

### 步骤 5.5：关于 `baseTokenURI` 的详细说明（重要）

**`baseTokenURI` 是什么？**

`baseTokenURI` 是 NFT 元数据的基础 URI，用于定位 NFT 的元数据文件。但在你的合约中，它的作用有所不同：

**在你的合约中的实际作用：**
1. ✅ **存储基础路径**：作为元数据的通用基础路径
2. ✅ **可以后续更新**：合约所有者可以通过 `setBaseTokenURI()` 函数更新
3. ⚠️ **但不直接使用**：合约在铸造时使用完整的 URI（通过 `_setTokenURI()` 为每个 NFT 单独设置）

**重要理解：**
- 你的合约使用 `ERC721URIStorage`，它会为每个 token 存储**完整的 URI**
- 铸造时传入的 `metadataURI` 参数是完整的 URI（例如：`ipfs://QmXXX...`）
- `baseTokenURI` 更像是一个配置项或占位符

**部署时应该填什么？**

**方案一：使用占位符（推荐，最简单）**
```
ipfs://
```
或者：
```
https://placeholder.com/
```

**为什么推荐占位符？**
- ✅ 部署时不需要知道具体的 IPFS 路径
- ✅ 合约在铸造时会为每个 NFT 设置完整的 URI
- ✅ 如果后续需要，可以通过 `setBaseTokenURI()` 更新

**方案二：如果你已经有 IPFS 网关**
```
ipfs://QmYourBaseHash/
```
注意：要以 `/` 结尾，这样后续的 tokenId 可以拼接上去

**方案三：如果使用中心化服务器**
```
https://your-api-server.com/api/nft/
```
注意：要以 `/` 结尾

**实际使用流程：**
1. 部署时：使用占位符（如 `ipfs://`）
2. 铸造 NFT 时：前端上传元数据到 IPFS，获得完整 URI（如 `ipfs://QmABC123...`）
3. 调用 `mint(metadataURI)` 时：传入完整的 IPFS URI
4. 合约存储：完整的 URI 被存储在链上（每个 NFT 的 URI 是独立的）

**示例：**
```javascript
// 部署时
baseTokenURI: "ipfs://"

// 铸造时（前端代码）
const metadataURI = "ipfs://QmABC123def456..."; // 完整的 IPFS URI
await contract.mint(metadataURI, { value: mintPrice });
```

**总结：**
- 🔹 **部署时**：可以简单填写 `"ipfs://"` 或任何占位符
- 🔹 **这个值不是必须准确的**，因为每个 NFT 的 URI 是在铸造时单独设置的
- 🔹 **如果需要更新**：部署后可以用 `setBaseTokenURI()` 函数更新（需要是合约所有者）

### 步骤 6：获取合约地址

1. **在 Remix 中查看**：
   - 部署成功后，在 "Deployed Contracts" 区域会显示你的合约
   - 合约地址会显示在合约名称下方，格式类似：`0x1234567890abcdef...`
   - **复制这个地址**，后续会用到

2. **在 MetaMask 中查看**：
   - 打开 MetaMask
   - 点击 "活动" 标签页
   - 找到最新的合约创建交易
   - 点击查看详情，可以看到合约地址

3. **在 Sepolia Etherscan 中查看**（可选）：
   - 访问 [Sepolia Etherscan](https://sepolia.etherscan.io/)
   - 在 MetaMask 中找到交易哈希（TxHash）
   - 在 Etherscan 中搜索这个交易哈希
   - 在交易详情页面可以看到合约地址和合约代码

### 步骤 7：验证合约（可选但推荐）

1. **在 Etherscan 上验证合约**：
   - 访问 [Sepolia Etherscan](https://sepolia.etherscan.io/)
   - 搜索你的合约地址
   - 点击 "Contract" 标签页
   - 点击 "Verify and Publish"
   - 填写合约信息：
     - Compiler Type: Solidity (Single file) 或 Standard JSON Input
     - Compiler Version: 0.8.20
     - License: MIT
   - 粘贴合约源代码（包括所有导入的 OpenZeppelin 代码）
   - 填写构造函数参数（与部署时相同）
   - 点击 "Verify and Publish"

**验证的好处**：
- 用户可以在 Etherscan 上直接与合约交互
- 提高合约透明度和可信度
- 可以查看合约源代码和函数调用

---

## 第二部分：配置前端以连接已部署的合约

获得合约地址后，需要修改前端代码以连接到真实合约。

### 步骤 1：更新合约地址

**文件位置**：`frontend/services/web3Service.ts`

**需要修改的位置**：
- 找到 `CONTRACT_ADDRESS` 常量（大约在第 11 行）
- 将占位符地址 `0x0000000000000000000000000000000000000000` 替换为你的真实合约地址

**示例**：
```typescript
const CONTRACT_ADDRESS = "0x你的合约地址"; // 例如：0x1234567890abcdef1234567890abcdef12345678
```

### 步骤 2：更新合约 ABI

**文件位置**：`frontend/services/web3Service.ts`

**需要修改的位置**：
- 找到 `CHAIN_GARDEN_NFT_ABI` 常量（大约在第 7-25 行）
- 当前的 ABI 是一个简化版本，已经包含了基本的函数定义

**什么是 ABI？**
- **ABI (Application Binary Interface)**：合约的接口定义，描述了合约的所有函数、事件和变量
- **Calldata**：这是函数调用的编码数据（你看到的那些数字），不是 ABI
  - Calldata 是 ABI 编码后的结果
  - ABI 是"接口"，Calldata 是"调用数据"
  - 这两者不是同一个东西

**获取完整 ABI 的方法**：

**方法一：从 Remix Compiler 获取（推荐）**
1. 在 Remix 中，点击左侧的 **"Solidity Compiler"** 图标（第二个图标）
2. 编译成功后，在编译器面板底部会显示编译结果
3. 找到你的合约名称（ChainGardenNFT），点击展开
4. 你会看到两个文件：
   - `ChainGardenNFT.sol`（源代码）
   - `metadata.json`（包含 ABI）
5. **点击 `metadata.json`**，会显示 JSON 内容
6. 在这个 JSON 中找到 `"output"` -> `"abi"` 字段
7. 复制整个 `abi` 数组（是一个 JSON 数组）
8. 在 `web3Service.ts` 中替换 `CHAIN_GARDEN_NFT_ABI` 常量

在实际操作中ABI在编译界面的最下面！！！直接复制即可

**注意**：Remix 中没有直接的 "ABI" 按钮，ABI 在 `metadata.json` 文件中。

**方法二：从 Hardhat 编译产物获取**
1. 在项目根目录运行 `npm run compile`
2. 编译成功后，打开 `artifacts/contracts/ChainGardenNFT.sol/ChainGardenNFT.json`
3. 在这个 JSON 文件中找到 `"abi"` 字段（通常在文件的前半部分）
4. 复制整个 `abi` 数组

**方法三：从 Etherscan 获取（如果已验证合约）**
1. 在 [Sepolia Etherscan](https://sepolia.etherscan.io/) 上搜索你的合约地址
2. 点击 "Contract" 标签页
3. 如果合约已验证，会显示源代码
4. 滚动到页面底部，找到 **"Contract ABI"** 部分
5. 点击 "Copy" 按钮复制完整的 ABI

**关于 Etherscan 上的 "Code" 部分**：
- Etherscan 上的 "Code" 标签页显示的是**合约的字节码**（Bytecode）
- 你看到的"大框显示了很多数字"可能是：
  - **Bytecode**：编译后的合约代码（十六进制格式）
  - **Constructor Arguments**：构造函数参数的编码数据
- 这些**不是 ABI**，而是编译后的代码和调用数据

**当前 ABI 说明**：
项目已经包含了一个简化版的 ABI，包含以下函数：
- `mint()` - 铸造 NFT
- `safeMint()` - 安全铸造 NFT
- `totalSupply()` - 获取总供应量
- `mintPrice()` - 获取铸造价格
- `getTokenMetadata()` - 获取元数据
- `setMintPrice()` - 设置铸造价格（仅所有者）
- `PlantMinted` 事件

**如果需要完整的 ABI**（比如需要调用其他函数），可以使用上述方法获取。

**更新 ABI 示例**（使用简化版 ABI，已包含在代码中）：
```typescript
const CHAIN_GARDEN_NFT_ABI = [
  "function mint(string memory metadataURI) public payable",
  "function safeMint(address to, string memory uri) public payable",
  "function totalSupply() public view returns (uint256)",
  "function mintPrice() public view returns (uint256)",
  "function getTokenMetadata(uint256 tokenId) public view returns (string memory)",
  "event PlantMinted(address indexed to, uint256 indexed tokenId, string metadataURI)"
];
```

### 步骤 3：启用真实的 mintNFT 函数

**文件位置**：`frontend/services/web3Service.ts`

**需要修改的位置**：
- 找到 `mintNFT` 函数（大约在第 67 行）
- 取消注释真实铸造逻辑（大约在第 70-78 行）
- 注释掉或删除模拟逻辑（大约在第 81-96 行）

**修改示例**：
```typescript
async mintNFT(metadataURI: string): Promise<{ txHash: string, tokenId: string }> {
    if (!this.signer) throw new Error("Wallet not connected");

    // 启用真实铸造逻辑
    try {
        const contract = new Contract(CONTRACT_ADDRESS, ERC721_ABI, this.signer);
        const tx = await contract.mint(metadataURI, { value: mintPrice }); // 注意：需要传入 mintPrice
        const receipt = await tx.wait();
        
        // 从事件日志中获取 tokenId（如果有事件）
        // 或者从 totalSupply() 计算
        const totalSupply = await contract.totalSupply();
        const tokenId = (Number(totalSupply) - 1).toString();
        
        return { txHash: tx.hash, tokenId };
    } catch(e) { 
        console.error(e); 
        throw e; 
    }
}
```

**注意事项**：
- 需要从合约中获取 `mintPrice`，并在调用时传入
- 需要处理 tokenId 的获取（可以从 `totalSupply()` 计算，或从事件中读取）
- 需要添加适当的错误处理

### 步骤 4：获取铸造价格（可选但推荐）

在调用 `mint` 函数之前，应该从合约中读取当前的铸造价格。

**修改建议**：
- 在 `web3Service.ts` 中添加一个 `getMintPrice()` 函数
- 在 `mintNFT()` 中调用这个函数获取价格
- 将价格传递给 `mint()` 函数

---

## 第三部分：实现元数据上传功能

NFT 铸造需要一个元数据 URI，通常需要先上传到 IPFS 或服务器。

### 步骤 1：选择元数据存储方案

**方案一：IPFS（去中心化，推荐）**
- 使用 [Pinata](https://www.pinata.cloud/)（免费套餐可用）
- 使用 [Web3.Storage](https://web3.storage/)（免费）
- 使用 [NFT.Storage](https://nft.storage/)（免费）

**方案二：中心化服务器**
- 上传到你的服务器
- 需要确保服务器稳定运行
- 不符合去中心化理念，但开发测试阶段可用

### 步骤 2：创建元数据上传服务

**文件位置**：在 `frontend/services/` 目录下创建新文件 `ipfsService.ts` 或 `metadataService.ts`

**需要实现的功能**：
1. 上传图片到 IPFS
2. 生成元数据 JSON
3. 上传元数据 JSON 到 IPFS
4. 返回 IPFS URI（格式：`ipfs://Qm...`）

**基本步骤**：
1. 安装 IPFS 客户端库（如 `ipfs-http-client` 或使用 Pinata SDK）
2. 实现图片上传函数
3. 实现元数据 JSON 生成函数（符合 OpenSea 标准）
4. 实现元数据上传函数

### 步骤 3：更新 App.tsx 中的铸造流程

**文件位置**：`frontend/App.tsx`

**需要修改的位置**：
- 找到 `confirmMint` 函数（大约在第 277 行）
- 在调用 `mintNFT` 之前，先上传元数据
- 使用返回的 IPFS URI 作为参数传递给 `mintNFT`

**修改流程**：
```typescript
const confirmMint = async () => {
    // 1. 上传图片到 IPFS
    const imageURI = await uploadImageToIPFS(specimen.imageData);
    
    // 2. 生成元数据 JSON
    const metadata = {
        name: specimen.dna.speciesName,
        description: "A unique botanical specimen from Chain Garden",
        image: imageURI,
        attributes: [
            { trait_type: "Growth Architecture", value: specimen.dna.growthArchitecture },
            // ... 其他属性
        ],
        dna: specimen.dna // 可选：包含完整 DNA
    };
    
    // 3. 上传元数据到 IPFS
    const metadataURI = await uploadMetadataToIPFS(metadata);
    
    // 4. 使用 IPFS URI 调用 mintNFT
    const result = await web3ServiceRef.current.mintNFT(metadataURI);
    
    // 5. 更新状态...
};
```

### 步骤 4：元数据格式要求

确保生成的元数据 JSON 符合 OpenSea 和其他 NFT 市场标准：

```json
{
  "name": "Plant Species Name",
  "description": "Description of the plant",
  "image": "ipfs://Qm...",
  "external_url": "https://your-website.com",
  "attributes": [
    {
      "trait_type": "Growth Architecture",
      "value": "fractal_tree"
    },
    {
      "trait_type": "Leaf Shape",
      "value": "fern"
    },
    {
      "trait_type": "Color Palette",
      "value": ["#00a651", "#0078bf"]
    }
  ]
}
```

---

## 第四部分：测试完整流程

### 测试步骤

1. **启动前端开发服务器**
   ```bash
   cd frontend
   npm run dev
   ```

2. **连接钱包**
   - 在浏览器中打开应用
   - 点击 "Connect Wallet" 按钮
   - 确认连接到 Sepolia 测试网

3. **生成植物**
   - 使用音频输入或手动参数生成一个植物
   - 保存到收藏集

4. **尝试铸造**
   - 点击植物详情
   - 点击 "Mint to Ethereum" 按钮
   - 确认 MetaMask 交易提示
   - 等待交易确认

5. **验证结果**
   - 在 MetaMask 中查看交易状态
   - 在 Sepolia Etherscan 上查看交易详情
   - 确认 NFT 已成功铸造

### 常见问题排查

**问题 1：交易失败 - "insufficient funds"**
- **原因**：钱包中没有足够的 ETH 支付 Gas 费
- **解决**：从 Sepolia Faucet 获取更多测试 ETH

**问题 2：交易失败 - "revert: Insufficient payment"**
- **原因**：发送的 ETH 金额小于合约要求的 `mintPrice`
- **解决**：确保在调用 `mint()` 时传入了足够的 ETH

**问题 3：交易失败 - "nonce too low"**
- **原因**：MetaMask 中的交易 nonce 冲突
- **解决**：重置 MetaMask 账户（Settings > Advanced > Reset Account）

**问题 4：合约地址错误**
- **原因**：前端中使用的合约地址不正确
- **解决**：检查 `web3Service.ts` 中的 `CONTRACT_ADDRESS`

**问题 5：ABI 不匹配**
- **原因**：前端使用的 ABI 与部署的合约不匹配
- **解决**：从 Remix 或编译产物中获取完整的 ABI 并更新

---

## 第五部分：可选优化

### 1. 添加交易状态监听

在 `web3Service.ts` 中添加交易确认监听，实时更新 UI 状态。

### 2. 添加 Gas 费用估算

在铸造前估算 Gas 费用，并向用户显示。

### 3. 添加错误重试机制

如果交易失败，允许用户重试。

### 4. 显示铸造进度

在 `MintModal.tsx` 中显示真实的铸造进度（上传 IPFS、签名、确认等）。

### 5. 添加合约事件监听

监听合约的 `PlantMinted` 事件，自动获取 tokenId，而不是手动计算。

---

## 总结

完成 NFT 上链功能的步骤：

1. ✅ **部署合约到 Sepolia 测试网**（在 Remix 中完成）
2. ✅ **获取合约地址**（从 Remix 或 Etherscan 获取）
3. ✅ **更新前端合约地址**（修改 `frontend/services/web3Service.ts`）
4. ✅ **更新合约 ABI**（从 Remix 获取完整 ABI）
5. ✅ **启用真实 mint 函数**（取消注释真实逻辑）
6. ✅ **实现 IPFS 上传**（创建元数据上传服务）
7. ✅ **更新铸造流程**（在 App.tsx 中集成 IPFS 上传）
8. ✅ **测试完整流程**（生成植物、上传元数据、铸造 NFT）

完成以上步骤后，你的 NFT 上链功能就可以正常工作了！

---

**需要帮助？**
- 查看 `README.md` 了解项目整体结构
- 查看 `BUGFIXES.md` 了解常见问题
- 查看 `TEAM_ROLES.md` 了解团队分工

