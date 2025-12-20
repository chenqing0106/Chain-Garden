#!/usr/bin/env npx tsx

import { Command } from "commander";
import {
  deploy,
  mint,
  transfer,
  transferAndCall,
} from "@zetachain/standard-contracts/nft/commands";
import { deploySimpleNFT } from "./deploy-simple";

const program = new Command()
  .addCommand(deploy)
  .addCommand(
    new Command("deploy-simple")
      .description("Deploy ZetaChainUniversalNFT contract (non-upgradeable)")
      .requiredOption("-r, --rpc <url>", "RPC URL")
      .requiredOption("-k, --private-key <key>", "Private key")
      .option("-n, --token-name <name>", "Token name", "Chain Garden NFT")
      .option("-s, --token-symbol <symbol>", "Token symbol", "CGNFT")
      .option("-o, --owner <address>", "Contract owner address (default: deployer)")
      .option("-g, --gateway <address>", "Gateway address (can be set later)")
      .option("--gas-limit <number>", "Gas limit for cross-chain operations", "1000000")
      .option("--deploy-gas-limit <number>", "Gas limit for deployment", "5000000")
      .action(deploySimpleNFT)
  )
  .addCommand(mint)
  .addCommand(transfer)
  .addCommand(transferAndCall);

program.parse();