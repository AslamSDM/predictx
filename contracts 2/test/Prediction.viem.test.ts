import { assert } from "chai";
import hardhat from "hardhat";

async function deployContract(name: string, args: any[] = []) {
  const wallet = await hardhat.viem.getWalletClient();
  const pub = await hardhat.viem.getPublicClient();
  const art = await hardhat.artifacts.readArtifact(name);
  const hash = await wallet.deployContract({
    abi: art.abi as any,
    bytecode: art.bytecode as `0x${string}`,
    args,
  });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  return { address: receipt.contractAddress as `0x${string}`, pub, wallet };
}

describe("Prediction (viem)", () => {
  it("Up direction YES wins when high >= target and claims", async () => {
    // Deploy mocks
    const tokenRes = await deployContract("MockERC20", ["Mock", "MOCK", 10n ** 24n]);
    const pythRes = await deployContract("MockPyth");

    // Get extra wallets
    const accounts = await hardhat.viem.getWalletClients();
    const alice = accounts[1]!;
    const bob = accounts[2]!;

    // Transfer tokens to users
    const erc20 = await hardhat.viem.getContractAt("MockERC20", tokenRes.address);
    await tokenRes.wallet.writeContract({
      address: tokenRes.address,
      abi: erc20.abi,
      functionName: "transfer",
      args: [alice.account.address, 1_000n * 10n ** 18n],
    });
    await tokenRes.wallet.writeContract({
      address: tokenRes.address,
      abi: erc20.abi,
      functionName: "transfer",
      args: [bob.account.address, 1_000n * 10n ** 18n],
    });

    // Deploy factory
    const factoryRes = await deployContract("PredictionFactory", [pythRes.address, tokenRes.address, 5]);
    const factory = await hardhat.viem.getContractAt("PredictionFactory", factoryRes.address);

    // Create prediction (ETHUSD Up)
    const now = BigInt(Math.floor(Date.now() / 1000));
    const endTime = now + 3600n;
    await factoryRes.wallet.writeContract({
      address: factoryRes.address,
      abi: factory.abi,
      functionName: "createPrediction",
      args: ["ETHUSD", 0, 3000n * 10n ** 8n, endTime, "uri"],
    });
    const predictionId = (await factoryRes.pub.readContract({ address: factoryRes.address, abi: factory.abi, functionName: "predictionCount" })) as bigint;
    const predictionAddr = (await factoryRes.pub.readContract({ address: factoryRes.address, abi: factory.abi, functionName: "predictions", args: [predictionId] })) as `0x${string}`;
    const prediction = await hardhat.viem.getContractAt("Prediction", predictionAddr);

    // Approvals and votes
    await alice.writeContract({ address: tokenRes.address, abi: erc20.abi, functionName: "approve", args: [predictionAddr, 100n * 10n ** 18n] });
    await bob.writeContract({ address: tokenRes.address, abi: erc20.abi, functionName: "approve", args: [predictionAddr, 100n * 10n ** 18n] });
    await alice.writeContract({ address: predictionAddr, abi: prediction.abi, functionName: "vote", args: [true, 100n * 10n ** 18n] });
    await bob.writeContract({ address: predictionAddr, abi: prediction.abi, functionName: "vote", args: [false, 100n * 10n ** 18n] });

    // Mock highs/lows within window
    const mockPyth = await hardhat.viem.getContractAt("MockPyth", pythRes.address);
    const feedId = (await factoryRes.pub.readContract({ address: predictionAddr, abi: prediction.abi, functionName: "pythPriceFeedId" })) as `0x${string}`;
    const within = now + 10n;
    await tokenRes.wallet.writeContract({ address: pythRes.address, abi: mockPyth.abi, functionName: "setPrice", args: [feedId, 3100n * 10n ** 8n, -8, within] });
    await tokenRes.wallet.writeContract({ address: pythRes.address, abi: mockPyth.abi, functionName: "setPrice", args: [feedId, 2900n * 10n ** 8n, -8, within] });

    // Advance time by setting next block timestamp
    await hardhat.network.provider.send("evm_setNextBlockTimestamp", [Number(endTime + 1n)]);
    await hardhat.network.provider.send("evm_mine");

    // Resolve (mock accepts any blobs; fee is zero)
    await factoryRes.wallet.writeContract({ address: predictionAddr, abi: prediction.abi, functionName: "resolvePrediction", args: [["0x"], ["0x"]] });
    const outcome = (await factoryRes.pub.readContract({ address: predictionAddr, abi: prediction.abi, functionName: "outcome" })) as bigint;
    assert.equal(outcome, 1n);

    // Claim
    await alice.writeContract({ address: predictionAddr, abi: prediction.abi, functionName: "claimWinnings", args: [] });
  });
});


