#!/usr/bin/env npx tsx

import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

export async function deploySimpleNFT(opts: any) {
  try {
    const provider = new ethers.JsonRpcProvider(opts.rpc);
    const signer = new ethers.Wallet(opts.privateKey, provider);
    const network = await provider.getNetwork();
    const networkInfo = network.name ?? network.chainId;

    // Load contract artifacts
    const artifactsPath = path.join(
      process.cwd(),
      "out/ZetaChainUniversalNFT.sol/ZetaChainUniversalNFT.json"
    );

    if (!fs.existsSync(artifactsPath)) {
      throw new Error(
        `Contract artifacts not found at ${artifactsPath}. Please compile the contract first.`
      );
    }

    const artifact = JSON.parse(fs.readFileSync(artifactsPath, "utf-8"));
    const { abi, bytecode } = artifact;

    // Prepare constructor arguments
    const constructorArgs = [
      opts.tokenName || "Chain Garden NFT",
      opts.tokenSymbol || "CGNFT",
      opts.owner || signer.address,
      opts.gateway || ethers.ZeroAddress, // Can be set later
      opts.gasLimit ? parseInt(opts.gasLimit) : 1000000,
    ];

    console.log("Deploying contract with arguments:", constructorArgs);

    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    const contract = await factory.deploy(...constructorArgs, {
      gasLimit: opts.deployGasLimit ? parseInt(opts.deployGasLimit) : 5000000,
    });

    await contract.waitForDeployment();

    console.log(
      JSON.stringify({
        contractAddress: await contract.getAddress(),
        deployer: signer.address,
        network: networkInfo,
        transactionHash: contract.deploymentTransaction()?.hash,
        constructorArgs: {
          name: constructorArgs[0],
          symbol: constructorArgs[1],
          owner: constructorArgs[2],
          gateway: constructorArgs[3],
          gasLimit: constructorArgs[4],
        },
      })
    );
  } catch (err) {
    console.error(
      "Deployment failed:",
      err instanceof Error ? err.message : err
    );
    process.exit(1);
  }
}

