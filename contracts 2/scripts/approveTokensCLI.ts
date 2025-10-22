import { ethers } from "hardhat";

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 5) {
    console.log("Usage: yarn hardhat run scripts/approveTokensCLI.ts --network <network> <private_key> <pyusd_address> <prediction_market_address> <yes_token_address> <no_token_address>");
    console.log("Example: yarn hardhat run scripts/approveTokensCLI.ts --network sepolia 0x123... 0xABC... 0xDEF... 0xGHI... 0xJKL...");
    process.exit(1);
  }

  const [privateKey, pyusdAddress, predictionMarketAddress, yesTokenAddress, noTokenAddress] = args;

  console.log("🔐 Approving tokens to prediction market...");
  console.log("PYUSD Token:", pyusdAddress);
  console.log("Prediction Market:", predictionMarketAddress);
  console.log("YES Token:", yesTokenAddress);
  console.log("NO Token:", noTokenAddress);

  // Create wallet from private key
  const wallet = new ethers.Wallet(privateKey, ethers.provider);
  console.log("Wallet address:", wallet.address);

  // Amount to approve (100 ETH worth in PYUSD = 100 * 1e6 = 100000000)
  const approveAmount = ethers.parseUnits("100", 6); // 100 PYUSD (6 decimals)
  
  console.log("Approving amount:", approveAmount.toString());

  // Get token contracts
  const pyusdToken = await ethers.getContractAt("IERC20", pyusdAddress);
  const yesToken = await ethers.getContractAt("IERC20", yesTokenAddress);
  const noToken = await ethers.getContractAt("IERC20", noTokenAddress);

  try {
    // Check current balances
    const pyusdBalance = await pyusdToken.balanceOf(wallet.address);
    const yesBalance = await yesToken.balanceOf(wallet.address);
    const noBalance = await noToken.balanceOf(wallet.address);

    console.log("\n📊 Current balances:");
    console.log("PYUSD balance:", ethers.formatUnits(pyusdBalance, 6));
    console.log("YES token balance:", ethers.formatUnits(yesBalance, 6));
    console.log("NO token balance:", ethers.formatUnits(noBalance, 6));

    // Approve PYUSD token
    console.log("\n✅ Approving PYUSD token...");
    const pyusdTx = await pyusdToken.connect(wallet).approve(predictionMarketAddress, approveAmount);
    await pyusdTx.wait();
    console.log("PYUSD approval transaction:", pyusdTx.hash);

    // Approve YES token
    console.log("\n✅ Approving YES token...");
    const yesTx = await yesToken.connect(wallet).approve(predictionMarketAddress, approveAmount);
    await yesTx.wait();
    console.log("YES token approval transaction:", yesTx.hash);

    // Approve NO token
    console.log("\n✅ Approving NO token...");
    const noTx = await noToken.connect(wallet).approve(predictionMarketAddress, approveAmount);
    await noTx.wait();
    console.log("NO token approval transaction:", noTx.hash);

    // Verify approvals
    console.log("\n🔍 Verifying approvals...");
    const newPyusdAllowance = await pyusdToken.allowance(wallet.address, predictionMarketAddress);
    const newYesAllowance = await yesToken.allowance(wallet.address, predictionMarketAddress);
    const newNoAllowance = await noToken.allowance(wallet.address, predictionMarketAddress);

    console.log("New PYUSD allowance:", ethers.formatUnits(newPyusdAllowance, 6));
    console.log("New YES token allowance:", ethers.formatUnits(newYesAllowance, 6));
    console.log("New NO token allowance:", ethers.formatUnits(newNoAllowance, 6));

    console.log("\n🎉 All tokens approved successfully!");

  } catch (error) {
    console.error("❌ Error during approval:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
