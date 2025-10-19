import hardhat from "hardhat";

// Env:
// SEPOLIA_RPC_URL, SEPOLIA_PRIVATE_KEY (configured in hardhat.config.ts as network vars)
// PYTH_ADDRESS, STAKE_TOKEN, FEE_PCT

async function main() {
  const networkName = (await hardhat.run("config", {} as any)) as any;
  const wallet = await hardhat.viem.getWalletClient();
  const pub = await hardhat.viem.getPublicClient();

  if ((await pub.getChainId()) !== 11155111n) {
    console.warn("Warning: not connected to Sepolia (chainId 11155111)");
  }

  const PYTH = process.env.PYTH_ADDRESS as `0x${string}`;
  const STAKE_TOKEN = process.env.STAKE_TOKEN as `0x${string}`;
  const FEE_PCT = BigInt(process.env.FEE_PCT || "5");
  if (!PYTH || !STAKE_TOKEN) throw new Error("Missing PYTH_ADDRESS or STAKE_TOKEN env");

  const art = await hardhat.artifacts.readArtifact("PredictionFactory");
  const hash = await wallet.deployContract({ abi: art.abi as any, bytecode: art.bytecode as `0x${string}`, args: [PYTH, STAKE_TOKEN, FEE_PCT] });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  console.log("PredictionFactory:", receipt.contractAddress);
}

main().catch((e) => { console.error(e); process.exit(1); });



