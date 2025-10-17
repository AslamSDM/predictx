import hardhat from "hardhat";

async function main() {
  const wallet = await hardhat.viem.getWalletClient();
  const pub = await hardhat.viem.getPublicClient();

  const PYTH = process.env.PYTH_ADDRESS as `0x${string}`;
  const STAKE_TOKEN = process.env.STAKE_TOKEN as `0x${string}`;
  const FEE_PCT = BigInt(process.env.FEE_PCT || "5");

  const art = await hardhat.artifacts.readArtifact("PredictionFactory");
  const hash = await wallet.deployContract({ abi: art.abi as any, bytecode: art.bytecode as `0x${string}`, args: [PYTH, STAKE_TOKEN, FEE_PCT] });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  console.log("PredictionFactory:", receipt.contractAddress);
}

main().catch((e) => { console.error(e); process.exit(1); });


