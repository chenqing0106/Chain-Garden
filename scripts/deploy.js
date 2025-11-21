const hre = require("hardhat");

async function main() {
  console.log("Deploying ChainGardenNFT...");

  // Contract parameters
  const name = "Chain Garden NFT";
  const symbol = "CGNFT";
  const baseTokenURI = "https://your-metadata-server.com/api/token/"; // Update with your metadata server
  const mintPrice = hre.ethers.parseEther("0.01"); // 0.01 ETH mint price
  const maxSupply = 10000; // Set to 0 for unlimited

  const ChainGardenNFT = await hre.ethers.getContractFactory("ChainGardenNFT");
  const chainGardenNFT = await ChainGardenNFT.deploy(
    name,
    symbol,
    baseTokenURI,
    mintPrice,
    maxSupply
  );

  await chainGardenNFT.waitForDeployment();
  const address = await chainGardenNFT.getAddress();

  console.log("ChainGardenNFT deployed to:", address);
  console.log("Network:", hre.network.name);
  console.log("\nContract Details:");
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log("- Mint Price:", hre.ethers.formatEther(mintPrice), "ETH");
  console.log("- Max Supply:", maxSupply === 0 ? "Unlimited" : maxSupply);
  
  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    address: address,
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString(),
    contractName: "ChainGardenNFT",
    parameters: {
      name,
      symbol,
      baseTokenURI,
      mintPrice: hre.ethers.formatEther(mintPrice),
      maxSupply
    }
  };

  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    `${deploymentsDir}/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\nDeployment info saved to:", `${deploymentsDir}/${hre.network.name}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

