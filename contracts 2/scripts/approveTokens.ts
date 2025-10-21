import { ethers } from "hardhat";

async function main() {
  console.log("🔐 Approving tokens to prediction market...");

  // Configuration - Replace these with your actual values
  const PRIVATE_KEY = "PREDICTION_PRIVATE_KEY"; // Replace with your private key
  const PYUSD_TOKEN_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9"; // PYUSD token address
  const PREDICTION_MARKET_ADDRESS = "0x3f4ce04F14395FB390285b72079c140c83Cd148C"; // Replace with actual prediction market address
  const YES_TOKEN_ADDRESS = "0x287b84837e0eae43a05256417abcb37809a74b3b"; // Replace with actual YES token address
  const NO_TOKEN_ADDRESS = "0x0ecc909384de654668627068d72eb769112afe15"; // Replace with actual NO token address

  // Create wallet from private key
  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider);
  console.log("Wallet address:", wallet.address);

  // Amount to approve (100 ETH worth in PYUSD = 100 * 1e6 = 100000000)
  const approveAmount = ethers.parseUnits("100", 6); // 100 PYUSD (6 decimals)
  
  console.log("Approving amount:", approveAmount.toString());

  // Get token contracts
  const pyusdToken = await ethers.getContractAt("IERC20", PYUSD_TOKEN_ADDRESS);
  const yesToken = await ethers.getContractAt("IERC20", YES_TOKEN_ADDRESS);
  const noToken = await ethers.getContractAt("IERC20", NO_TOKEN_ADDRESS);

  try {
    // Check current balances
    const pyusdBalance = await pyusdToken.balanceOf(wallet.address);
    const yesBalance = await yesToken.balanceOf(wallet.address);
    const noBalance = await noToken.balanceOf(wallet.address);

    console.log("\n📊 Current balances:");
    console.log("PYUSD balance:", ethers.formatUnits(pyusdBalance, 6));
    console.log("YES token balance:", ethers.formatUnits(yesBalance, 6));
    console.log("NO token balance:", ethers.formatUnits(noBalance, 6));

    // Check current allowances
    const pyusdAllowance = await pyusdToken.allowance(wallet.address, PREDICTION_MARKET_ADDRESS);
    const yesAllowance = await yesToken.allowance(wallet.address, PREDICTION_MARKET_ADDRESS);
    const noAllowance = await noToken.allowance(wallet.address, PREDICTION_MARKET_ADDRESS);

    console.log("\n🔍 Current allowances:");
    console.log("PYUSD allowance:", ethers.formatUnits(pyusdAllowance, 6));
    console.log("YES token allowance:", ethers.formatUnits(yesAllowance, 6));
    console.log("NO token allowance:", ethers.formatUnits(noAllowance, 6));

    // Approve PYUSD token
    console.log("\n✅ Approving PYUSD token...");
    const pyusdTx = await pyusdToken.connect(wallet).approve(PREDICTION_MARKET_ADDRESS, approveAmount);
    await pyusdTx.wait();
    console.log("PYUSD approval transaction:", pyusdTx.hash);

    // Approve YES token
    console.log("\n✅ Approving YES token...");
    const yesTx = await yesToken.connect(wallet).approve(PREDICTION_MARKET_ADDRESS, approveAmount);
    await yesTx.wait();
    console.log("YES token approval transaction:", yesTx.hash);

    // Approve NO token
    console.log("\n✅ Approving NO token...");
    const noTx = await noToken.connect(wallet).approve(PREDICTION_MARKET_ADDRESS, approveAmount);
    await noTx.wait();
    console.log("NO token approval transaction:", noTx.hash);

    // Verify approvals
    console.log("\n🔍 Verifying approvals...");
    const newPyusdAllowance = await pyusdToken.allowance(wallet.address, PREDICTION_MARKET_ADDRESS);
    const newYesAllowance = await yesToken.allowance(wallet.address, PREDICTION_MARKET_ADDRESS);
    const newNoAllowance = await noToken.allowance(wallet.address, PREDICTION_MARKET_ADDRESS);

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
