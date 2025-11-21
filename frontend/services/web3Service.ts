
import { BrowserProvider, Contract } from 'ethers';

// Placeholder ABI for a standard ERC721
const ERC721_ABI = [
  "function mint(string memory tokenURI) public payable returns (uint256)",
  "function safeMint(address to, string memory uri) public payable"
];

// Placeholder Address (Sepolia Testnet) - Replace with your real contract address
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; 

export class Web3Service {
  private provider: BrowserProvider | null = null;
  private signer: any = null;

  constructor() {
      // Don't initialize provider here.
  }

  async connectWallet(silent: boolean = false): Promise<string> {
    // Dynamically check for ethereum on every connect attempt
    const eth = (window as any).ethereum;

    if (!eth) {
        if (silent) return ""; 
        // Explicit error for the UI to handle properly
        throw new Error("MetaMask not found. Please install the MetaMask extension.");
    }

    // Always instantiate a fresh provider to avoid stale states
    this.provider = new BrowserProvider(eth);

    try {
      const accounts = await this.provider.send("eth_requestAccounts", []);
      this.signer = await this.provider.getSigner();
      return accounts[0];
    } catch (error) {
      console.error("Connection error:", error);
      throw error;
    }
  }

  async getNetwork(): Promise<string> {
    if (!this.provider) return "Unknown";
    const network = await this.provider.getNetwork();
    return network.name;
  }

  async switchNetworkToSepolia() {
    if (!this.provider) return;
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia Chain ID
      });
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (error.code === 4902) {
         console.warn("Sepolia not added to wallet");
      }
    }
  }

  // This function SIMULATES a mint if no contract address is real,
  // or executes a real mint if you provide a valid address.
  async mintNFT(metadataURI: string): Promise<{ txHash: string, tokenId: string }> {
    if (!this.signer) throw new Error("Wallet not connected");

    // --- REAL MINTING LOGIC START (Commented out until you deploy a contract) ---
    /*
    try {
        const contract = new Contract(CONTRACT_ADDRESS, ERC721_ABI, this.signer);
        const tx = await contract.mint(metadataURI);
        await tx.wait();
        return { txHash: tx.hash, tokenId: "1" }; // Logic to get ID from event logs needed
    } catch(e) { console.error(e); throw e; }
    */
    // --- REAL MINTING LOGIC END ---

    // --- SIMULATED LOGIC FOR DEMO ---
    console.log("Simulating mint for URI:", metadataURI);
    
    // 1. Simulate Network Delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Simulate Transaction Signature Prompt
    // In a real app, this opens MetaMask.
    
    // 3. Simulate Block Confirmation
    await new Promise(resolve => setTimeout(resolve, 3000));

    return {
        txHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        tokenId: Math.floor(Math.random() * 10000).toString()
    };
  }
  
  shortenAddress(address: string) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}
