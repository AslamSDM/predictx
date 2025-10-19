import hardhat from "hardhat";

async function main() {
  const wallet = await hardhat.viem.getWalletClient();
  const pub = await hardhat.viem.getPublicClient();

  // Deploy MockERC20
  const ercArt = await hardhat.artifacts.readArtifact("MockERC20");
  const name = process.env.MOCK_NAME || "Mock USD";
  const symbol = process.env.MOCK_SYMBOL || "mUSD";
  const initial = BigInt(process.env.MOCK_INITIAL_SUPPLY || "1000000000000000000000000"); // 1e24
  const ercHash = await wallet.deployContract({
    abi: ercArt.abi as any,
    bytecode: ercArt.bytecode as `0x${string}`,
    args: [name, symbol, initial]
  });
  const ercReceipt = await pub.waitForTransactionReceipt({ hash: ercHash });
  const erc = ercReceipt.contractAddress!;
  console.log("MockERC20:", erc);

  // Deploy MockPyth
  const pythArt = await hardhat.artifacts.readArtifact("MockPyth");
  const pythHash = await wallet.deployContract({
    abi: pythArt.abi as any,
    bytecode: pythArt.bytecode as `0x${string}`,
    args: []
  });
  const pythReceipt = await pub.waitForTransactionReceipt({ hash: pythHash });
  const pyth = pythReceipt.contractAddress!;
  console.log("MockPyth:", pyth);
}

main().catch((e) => { console.error(e); process.exit(1); });



