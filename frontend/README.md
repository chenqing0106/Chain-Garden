# ChainGarden

**ChainGarden** is a generative, audio-reactive botanical art generator with **Risograph (Kong-Ban)** aesthetics, integrated with Web3 for NFT minting.

It uses the Gemini API to synthesize "Plant DNA" from text descriptions (vibes), generates procedural graphics and music based on that DNA, and allows users to mint their unique specimens to the Ethereum Sepolia Testnet.

## ✨ Features

### 1. Audio-Reactive Generative Art
- **Microphone & File Input:** Visualize real-time audio frequencies.
- **Procedural Growth:** Plants grow based on bass (structure) and treble (foliage) frequencies.
- **Mathematical Architectures:** Includes Fractal Trees, Fern Fronds, Organic Vines, and Radial Succulents.

### 2. AI-Powered "Vibe" Synthesis
- Uses **Google Gemini 2.5 Flash** to translate abstract text prompts (e.g., "Sad jazz in rain") into structured JSON "Plant DNA" (Growth speed, color palette, leaf shape, branching factor).

### 3. Generative Music (Sonification)
- Plants "sing" based on their DNA.
- **Algorithmic Composition:** Different plant architectures trigger different musical scales (Dorian, Lydian, Pentatonic) and synthesis techniques (FM synthesis, additive synthesis) using the Web Audio API.

### 4. Risograph Aesthetics (Zine Style)
- **Visual Style:** Custom CSS implementations of "multiply" blend modes, paper grain textures, and specific Riso ink colors (Fluorescent Pink, Green, Yellow).
- **UI:** Lo-Fi, brutalist "Zine" interface.

### 5. Web3 Integration (Sepolia Testnet)
- **Wallet Connection:** Connects to MetaMask via Ethers.js.
- **Minting Flow:** Simulates (or performs) the minting of the generated image and metadata as an ERC-721 NFT.
- **Local Gallery:** Persists your collected specimens in the browser's local storage.

---

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **AI:** Google Gemini API (`@google/genai`)
- **Blockchain:** Ethers.js v6, Solidity (ERC-721)
- **Audio:** Web Audio API (Native)
- **Styling:** CSS Modules for Grain/Blend modes

---

## 🚀 Setup & Compilation

### 1. Prerequisites
- Node.js installed.
- A Google Cloud Project with **Gemini API Key**.
- **MetaMask** browser extension installed.

### 2. Installation

```bash
# Install dependencies
npm install

# Set up Environment Variable
# Create a .env file and add:
API_KEY=your_google_gemini_api_key
```

### 3. Smart Contract Deployment (Optional for Full Web3)

To make the minting "Real", you need to deploy the Solidity contract.

1. Open [Remix IDE](https://remix.ethereum.org/).
2. Create a file `ChainGarden.sol` and paste the contract code (provided in the previous chat).
3. Compile the contract.
4. In the "Deploy" tab, select **Injected Provider - MetaMask**.
5. Deploy to **Sepolia Testnet**.
6. Copy the resulting **Contract Address**.
7. Update `services/web3Service.ts`:
   ```typescript
   const CONTRACT_ADDRESS = "0xYourCopiedAddress...";
   ```
8. Uncomment the "REAL MINTING LOGIC" block in `mintNFT` function in `web3Service.ts`.

### 4. Run the Application

```bash
npm start
# Runs on http://localhost:1234 (or similar)
```

---

## 🎨 Aesthetic Guide

The design follows the **Risograph** philosophy:
- **Colors:** Strictly limited palette (#00a651 Green, #ff48b0 Pink, #0078bf Blue, #ffe800 Yellow, #1a1a1a Black).
- **Overprinting:** Elements use `mix-blend-mode: multiply` to simulate ink layering.
- **Imperfection:** CSS Noise filters and subtle rotations (`rotate-1`) mimic misalignment and paper texture.
