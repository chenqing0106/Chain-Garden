
import { BrowserProvider, Contract, Interface, JsonRpcSigner } from 'ethers';
import { CHAIN_GARDEN_NFT_ABI, CONTRACT_ADDRESS, ZETACHAIN_CHAIN_ID, ZETACHAIN_TESTNET } from '../config/contracts';

export class Web3Service {
  private provider: BrowserProvider | null = null;
  private signer: JsonRpcSigner | null = null;
  private pendingRequest: Promise<string> | null = null;

  constructor() {
      // Don't initialize provider here.
  }

  async connectWallet(silent: boolean = false): Promise<string> {
    // If there's already a pending request, return it
    if (this.pendingRequest) {
      console.log("Wallet connection already in progress, waiting...");
      return this.pendingRequest;
    }

    // Dynamically check for ethereum on every connect attempt
    const eth = (window as any).ethereum;

    if (!eth) {
        if (silent) return ""; 
        // Explicit error for the UI to handle properly
        throw new Error("MetaMask not found. Please install the MetaMask extension.");
    }

    // Always instantiate a fresh provider to avoid stale states
    this.provider = new BrowserProvider(eth);

    // Create the connection promise
    this.pendingRequest = (async () => {
      try {
        // First try to get existing accounts (doesn't trigger popup)
        // This is important - if accounts are already connected, use them
        let accounts = await this.provider!.send("eth_accounts", []);
        
        // If we already have accounts, use them directly
        if (accounts.length > 0) {
          this.signer = await this.provider!.getSigner();
          return accounts[0];
        }
        
        // If no accounts and not silent, request accounts (triggers popup)
        if (!silent) {
          // Try multiple times if we get -32002 error
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries && accounts.length === 0) {
            try {
              accounts = await this.provider!.send("eth_requestAccounts", []);
              break; // Success, exit loop
            } catch (error: any) {
              // Handle specific error codes
              if (error.code === -32002) {
                retryCount++;
                
                if (retryCount >= maxRetries) {
                  // After max retries, try to get accounts without requesting
                  // Maybe user approved in MetaMask UI
                  try {
                    accounts = await this.provider!.send("eth_accounts", []);
                    if (accounts.length > 0) {
                      // User might have approved, we got accounts
                      break;
                    }
                  } catch {
                    // Still no accounts
                  }
                  
                  // If still no accounts, throw a more helpful error
                  throw new Error(
                    "MetaMask 连接请求被阻止。\n\n" +
                    "如果 MetaMask 中没有弹窗，请尝试：\n" +
                    "1. 刷新页面\n" +
                    "2. 在 MetaMask 中点击账户图标，查看是否有待处理的请求\n" +
                    "3. 重启 MetaMask 扩展"
                  );
                }
                
                // Wait before retrying (increasing wait time)
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                
                // Try to get accounts without requesting (maybe user approved)
                try {
                  accounts = await this.provider!.send("eth_accounts", []);
                  if (accounts.length > 0) {
                    break; // Got accounts, exit loop
                  }
                } catch {
                  // Continue to retry
                }
              } else {
                // Other errors, throw immediately
                throw error;
              }
            }
          }
        }
        
        if (accounts.length > 0) {
          this.signer = await this.provider!.getSigner();
          return accounts[0];
        }
        
        return "";
      } finally {
        // Clear pending request after completion
        this.pendingRequest = null;
      }
    })();

    return this.pendingRequest;
  }

  async getNetwork(): Promise<string> {
    if (!this.provider) return "Unknown";
    const network = await this.provider.getNetwork();
    return network.name;
  }

  /**
   * @dev Disconnect wallet by clearing provider and signer
   */
  disconnectWallet(): void {
    this.provider = null;
    this.signer = null;
    this.pendingRequest = null;
  }

  /**
   * @dev Check if wallet is currently connected
   */
  isConnected(): boolean {
    return this.signer !== null && this.provider !== null;
  }

  /**
   * @dev Get current wallet address if connected
   */
  async getCurrentAddress(): Promise<string | null> {
    if (!this.signer) return null;
    try {
      return await this.signer.getAddress();
    } catch {
      return null;
    }
  }

  // 通用网络切换：switch，若 4902 且提供了 networkConfig 则先 add 再 switch，然后刷新 provider/signer
  private async switchNetwork(chainId: string, networkConfig?: object): Promise<void> {
    const eth = (window as any).ethereum;
    if (!eth) throw new Error("MetaMask not found");

    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
    } catch (error: any) {
      if (error.code === 4902 && networkConfig) {
        try {
          await eth.request({ method: 'wallet_addEthereumChain', params: [networkConfig] });
        } catch {
          throw new Error("Please add the network to MetaMask manually");
        }
      } else {
        throw error;
      }
    }

    this.provider = new BrowserProvider(eth);
    const accounts = await eth.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      this.signer = await this.provider.getSigner();
    }
  }

  async switchNetworkToZetaChain() {
    await this.switchNetwork(ZETACHAIN_TESTNET.chainId, ZETACHAIN_TESTNET);

    if (!this.signer) {
      throw new Error("No accounts found. Please connect your wallet.");
    }
    const network = await this.provider!.getNetwork();
    if (network.chainId !== ZETACHAIN_CHAIN_ID) {
      throw new Error("Network switch failed. Please switch to ZetaChain Athens Testnet manually.");
    }
  }

  // Keep old method for backward compatibility (if needed)
  async switchNetworkToSepolia() {
    if (!this.provider) return;
    try {
      await this.switchNetwork('0xaa36a7');
    } catch {
      // Sepolia not added to wallet - ignore
    }
  }

  // 获取铸造价格
  // 确保网络正确并返回合约实例
  private async ensureNetworkAndGetContract(): Promise<Contract> {
    if (!this.signer) throw new Error("Wallet not connected");
    
    // 检查网络是否正确
    const network = await this.provider!.getNetwork();
    if (network.chainId !== ZETACHAIN_CHAIN_ID) {
      // 切换到正确的网络
      await this.switchNetworkToZetaChain();
      // switchNetworkToZetaChain 已经重新创建了 provider 和 signer
      const newNetwork = await this.provider!.getNetwork();
      if (newNetwork.chainId !== ZETACHAIN_CHAIN_ID) {
        throw new Error(`请确保 MetaMask 已连接到 ZetaChain Athens Testnet (Chain ID: 7001)`);
      }
      // 重新获取 signer
      this.signer = await this.provider!.getSigner();
    }
    
    return new Contract(CONTRACT_ADDRESS, CHAIN_GARDEN_NFT_ABI, this.signer);
  }

  // 真实的 NFT 铸造函数
  async mintNFT(metadataURI: string): Promise<{ txHash: string, tokenId: string }> {
    if (!this.signer) throw new Error("Wallet not connected");

    try {
      // 1. 确保网络正确，复用返回的合约实例
      const contract = await this.ensureNetworkAndGetContract();

      // 2. 获取 mintPrice（如果失败则使用 0）
      let mintPrice = 0n;
      try {
        mintPrice = await contract.mintPrice();
      } catch (error: any) {
        mintPrice = 0n;
      }

      // 3. 调用 mint 函数，传入元数据，触发 MetaMask 弹窗
      const tx = await contract.mint(metadataURI, { value: mintPrice });

      // 4. 等待交易确认
      const receipt = await tx.wait();

      // 5. 从事件日志中获取 tokenId
      // 合约会发出 PlantMinted 事件，我们可以从中获取 tokenId
      let tokenId = "";
      
      if (receipt && receipt.logs) {
        // 解析事件日志
        const iface = new Interface(CHAIN_GARDEN_NFT_ABI);
        
        for (const log of receipt.logs) {
          try {
            const parsedLog = iface.parseLog(log);
            if (parsedLog && parsedLog.name === "PlantMinted") {
              tokenId = parsedLog.args.tokenId.toString();
              break;
            }
          } catch (e) {
            // 忽略无法解析的日志
            continue;
          }
        }
      }
      
      // 如果没有从事件中获取到 tokenId，使用 totalSupply - 1 作为备用方案
      if (!tokenId) {
        const totalSupply = await contract.totalSupply();
        tokenId = (totalSupply - 1n).toString();
      }
      
      return {
        txHash: tx.hash,
        tokenId: tokenId
      };
    } catch (error: any) {
      // 提供更友好的错误信息
      if (error.message && error.message.includes("Contract not found")) {
        throw new Error(`合约地址不正确或合约未部署。请确认地址 ${CONTRACT_ADDRESS} 是否正确，并且合约已成功部署到 ZetaChain。`);
      } else if (error.message && error.message.includes("execution reverted")) {
        // 尝试从错误数据中提取信息
        let errorMsg = "交易执行被回退";
        if (error.data) {
          try {
            // 尝试解码常见的错误
            const errorIface = new Interface([
              "error InsufficientPayment()",
              "error MaxSupplyReached()",
            ]);
            const decoded = errorIface.parseError(error.data);
            errorMsg = `交易失败: ${decoded.name}`;
          } catch (e) {
            // 如果无法解码，检查是否是字符串错误
            if (error.data.length > 2) {
              errorMsg = `交易执行被回退。可能的原因：余额不足、达到最大供应量、或合约状态异常。请检查合约地址 ${CONTRACT_ADDRESS} 是否正确。`;
            }
          }
        }
        throw new Error(errorMsg);
      } else if (error.reason) {
        throw new Error(`交易失败: ${error.reason}`);
      } else if (error.message) {
        // 检查是否是常见的错误
        if (error.message.includes("user rejected") || error.code === 4001) {
          throw new Error("交易已被用户取消");
        } else if (error.message.includes("insufficient funds") || error.message.includes("insufficient balance")) {
          throw new Error("余额不足，请确保钱包中有足够的 ZETA 代币支付 gas 费用");
        } else if (error.message.includes("nonce")) {
          throw new Error("交易 nonce 错误，请稍后重试");
        } else if (error.message.includes("missing revert data")) {
          throw new Error(`交易被回退但没有返回错误信息。请检查：1) 合约地址 ${CONTRACT_ADDRESS} 是否正确 2) 合约是否已正确部署和初始化 3) 钱包中是否有足够的 ZETA 代币`);
        }
        throw new Error(`铸造失败: ${error.message}`);
      } else {
        throw new Error("NFT 铸造失败，请检查你的钱包余额和网络连接");
      }
    }
  }
  
  shortenAddress(address: string) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}
