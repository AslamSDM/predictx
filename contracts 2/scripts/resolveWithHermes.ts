import { createWalletClient, createPublicClient, http, parseEther, formatEther, isAddress, decodeAbiParameters } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as fs from "fs";
import * as path from "path";

// Types for Hermes API response
interface PythPriceFeed {
  binary: {
    data: string[];
  };
}

interface HermesResponse {
  [key: string]: PythPriceFeed;
}

// Hardcoded private key - Replace with your actual private key
const PRIVATE_KEY = "0x856dc30d75efc6d4b6b2706148ef37796c3dc1fb81492b2937dfd9c7f0446ef6";

// Revert decoding helpers
const marketErrorsAbi = [
  "error PredictionMarket__PredictionAlreadyReported()",
  "error PredictionMarket__OwnerCannotCall()",
  "error PredictionMarket__PredictionNotReported()",
  "error PredictionMarket__InsufficientWinningTokens()",
  "error PredictionMarket__AmountMustBeGreaterThanZero()",
  "error PredictionMarket__InsufficientTokenReserve((uint8,uint256))",
  "error PredictionMarket__TokenTransferFailed()",
  "error PredictionMarket__InsufficientBalance((uint256,uint256))",
  "error PredictionMarket__InsufficientAllowance((uint256,uint256))",
  "error PredictionMarket__InsufficientLiquidity()",
  "error PredictionMarket__MarketNotInitialized()",
  "error PredictionMarket__MarketAlreadyInitialized()",
  "error PredictionMarket__MarketNotEnded()",
];

function decodeRevert(tag: string, err: any) {
  const raw = err?.data ?? err?.info?.error?.data;
  const msg = err?.message || String(err);
  console.log(`${tag} revert msg:`, msg);
  if (!raw || typeof raw !== "string" || !raw.startsWith("0x") || raw.length < 10) return;
  console.log(`${tag} revert raw:`, raw);
  const selector = raw.slice(0, 10);
  console.log(`${tag} selector:`, selector);
  try {
    if (selector === "0x08c379a0") {
      const reason = decodeAbiParameters([{ type: "string" }], ("0x" + raw.slice(10)) as `0x${string}`);
      console.log(`${tag} revert(string):`, reason[0]);
    }
  } catch {}
}

// Hermes API fetch function
const fetchPriceFromHermes = async (feedId: string, timestamp?: number, current: boolean = false): Promise<PythPriceFeed> => {
  try {
    // Use current timestamp if not provided      
    const hermesUrl = current 
      ? `https://hermes.pyth.network/v2/updates/price/latest?ids%5B%5D=${feedId}&encoding=hex&parsed=true` 
      : `https://hermes.pyth.network/v2/updates/price/${timestamp}?ids%5B%5D=${feedId}&encoding=hex&parsed=true`;

    console.log("🔍 Fetching price from Hermes API:", hermesUrl);

    const response = await fetch(hermesUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Hermes API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data: HermesResponse = await response.json();
    console.log("📊 Hermes API response:", data);

    // Extract the price feed data for the specific feed ID
    const priceFeedData = data[feedId];
    if (!priceFeedData) {
      // Try to find the data in the response structure
      if (data.binary && data.binary.data && data.binary.data.length > 0) {
        return {
          binary: {
            data: data.binary.data
          }
        };
      }
      throw new Error(`No price data found for feed ID: ${feedId}`);
    }

    return priceFeedData;
  } catch (error) {
    console.error("❌ Error fetching price from Hermes:", error);
    throw error;
  }
};

async function main() {
  console.log("🚀 Prediction Market Report Script with Hermes API");
  console.log("==================================================");

  // Get environment variables or use defaults
  const predictionMarketAddress = process.env.PREDICTION_MARKET_ADDRESS;
  const timestamp1Str = process.env.TIMESTAMP1;
  const timestamp2Str = process.env.TIMESTAMP2;

  if (!predictionMarketAddress || !timestamp1Str || !timestamp2Str) {
    console.error("❌ Missing required environment variables:");
    console.error("PREDICTION_MARKET_ADDRESS - The address of the prediction market contract");
    console.error("TIMESTAMP1 - First timestamp for high price data (Unix timestamp)");
    console.error("TIMESTAMP2 - Second timestamp for low price data (Unix timestamp)");
    console.error("");
    console.error("Usage:");
    console.error("PREDICTION_MARKET_ADDRESS=0x123... TIMESTAMP1=1760907050 TIMESTAMP2=1760907150 yarn hardhat run scripts/callReportWithHermes.ts --network sepolia");
    console.error("");
    console.error("Example:");
    console.error("PREDICTION_MARKET_ADDRESS=0xf54e68A985E5Adc3c99D2a078a65789fcaA1c162 TIMESTAMP1=1761156400 TIMESTAMP2=1761156500 yarn hardhat run scripts/callReportWithHermes.ts --network sepolia");
    process.exit(1);
  }
  
  // Validate inputs
  if (!isAddress(predictionMarketAddress)) {
    throw new Error("Invalid prediction market address");
  }

  const timestamp1 = parseInt(timestamp1Str);
  const timestamp2 = parseInt(timestamp2Str);
  
  if (isNaN(timestamp1) || isNaN(timestamp2)) {
    throw new Error("Invalid timestamps provided");
  }

  console.log("📋 Configuration:");
  console.log("Prediction Market Address:", predictionMarketAddress);
  console.log("Timestamp 1 (High):", timestamp1);
  console.log("Timestamp 2 (Low):", timestamp2);
  console.log("Current timestamp:", Math.floor(Date.now() / 1000));

  // Create account from private key
  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  console.log("\n👤 Using account:", account.address);

  // Create clients
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http()
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http()
  });

  // Get account balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Account balance:", formatEther(balance), "ETH");

  // Get market details using viem
  const pythPriceFeedId = await publicClient.readContract({
    address: predictionMarketAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "pythPriceFeedId",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: "pythPriceFeedId"
  });

  const startTime = await publicClient.readContract({
    address: predictionMarketAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "startTime",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: "startTime"
  });

  const endTime = await publicClient.readContract({
    address: predictionMarketAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "endTime",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: "endTime"
  });

  const isReported = await publicClient.readContract({
    address: predictionMarketAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "isReported",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: "isReported"
  });

  const status = await publicClient.readContract({
    address: predictionMarketAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "status",
        "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: "status"
  });

  console.log("\n📊 Market Details:");
  console.log("Pyth Price Feed ID:", pythPriceFeedId);
  console.log("Start Time:", startTime.toString());
  console.log("End Time:", endTime.toString());
  console.log("Is Reported:", isReported);
  console.log("Status:", status.toString());

  // Check if market has ended
  const currentTime = Math.floor(Date.now() / 1000);
  if (currentTime < Number(endTime)) {
    throw new Error(`Market not ended yet. Current time: ${currentTime}, End time: ${endTime}`);
  }

  if (isReported) {
    throw new Error("Market has already been reported");
  }

  // Load Pyth contract ABI
  const pythAbi = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../pythContractAbi.json"), "utf8")
  ).abi;
  
  const pythContractAddress = "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21";

  console.log("\n🔍 Fetching price data from Hermes API...");
  
  // Fetch price data for all three timestamps
  const [highPriceData, lowPriceData, currentPriceData] = await Promise.all([
    fetchPriceFromHermes(pythPriceFeedId, timestamp1),
    fetchPriceFromHermes(pythPriceFeedId, timestamp2),
    fetchPriceFromHermes(pythPriceFeedId, undefined, true) // current data
  ]);

  console.log("\n📊 Fetched Price Data:");
  console.log("High Price Data:", highPriceData?.binary?.data?.[0] ? "✅ Available" : "❌ Missing");
  console.log("Low Price Data:", lowPriceData?.binary?.data?.[0] ? "✅ Available" : "❌ Missing");
  console.log("Current Price Data:", currentPriceData?.binary?.data?.[0] ? "✅ Available" : "❌ Missing");

  // Prepare price update data arrays
  const highPriceUpdateData = highPriceData?.binary?.data?.[0] ? [`0x${highPriceData.binary.data[0]}`] : [];
  const lowPriceUpdateData = lowPriceData?.binary?.data?.[0] ? [`0x${lowPriceData.binary.data[0]}`] : [];
  const currentPriceUpdateData = currentPriceData?.binary?.data?.[0] ? [`0x${currentPriceData.binary.data[0]}`] : [];

  if (highPriceUpdateData.length === 0 || lowPriceUpdateData.length === 0 || currentPriceUpdateData.length === 0) {
    throw new Error("Failed to fetch all required price data from Hermes API");
  }

  console.log("\n💰 Calculating required fees...");
  
  // Calculate fees for each update using viem
  const highFees = await publicClient.readContract({
    address: pythContractAddress as `0x${string}`,
    abi: pythAbi,
    functionName: "getUpdateFee",
    args: [highPriceUpdateData]
  });

  const lowFees = await publicClient.readContract({
    address: pythContractAddress as `0x${string}`,
    abi: pythAbi,
    functionName: "getUpdateFee",
    args: [lowPriceUpdateData]
  });

  const currentFees = await publicClient.readContract({
    address: pythContractAddress as `0x${string}`,
    abi: pythAbi,
    functionName: "getUpdateFee",
    args: [currentPriceUpdateData]
  });
  
  const totalFees = (highFees as bigint) + (lowFees as bigint) + (currentFees as bigint);
  const feeWithBump = totalFees + parseEther("0.000001"); // Add small buffer

  console.log("High fees:", formatEther(highFees as bigint), "ETH");
  console.log("Low fees:", formatEther(lowFees as bigint), "ETH");
  console.log("Current fees:", formatEther(currentFees as bigint), "ETH");
  console.log("Total fees:", formatEther(totalFees), "ETH");
  console.log("Sending:", formatEther(feeWithBump), "ETH");

  // Check if we have enough ETH
  if (balance < feeWithBump) {
    throw new Error(`Insufficient ETH balance. Required: ${formatEther(feeWithBump)}, Available: ${formatEther(balance)}`);
  }

  console.log("\n🚀 Calling report function...");
  
  // Define the report function ABI
  const reportAbi = [
    {
      "inputs": [
        {"internalType": "bytes[]", "name": "_priceUpdateDataHigh", "type": "bytes[]"},
        {"internalType": "bytes[]", "name": "_priceUpdateDataLow", "type": "bytes[]"},
        {"internalType": "bytes[]", "name": "_priceUpdateData", "type": "bytes[]"}
      ],
      "name": "report",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    }
  ];

  try {
    // First do a static call to check for potential issues
    await publicClient.simulateContract({
      address: predictionMarketAddress as `0x${string}`,
      abi: reportAbi,
      functionName: "report",
      args: [highPriceUpdateData, lowPriceUpdateData, currentPriceUpdateData],
      value: feeWithBump,
      account
    });
    console.log("✅ Static call successful - no issues detected");
  } catch (error: any) {
    console.log("❌ Static call failed:");
    decodeRevert("report static", error);
    throw error;
  }

  // Execute the actual transaction
  try {
    const hash = await walletClient.writeContract({
      address: predictionMarketAddress as `0x${string}`,
      abi: reportAbi,
      functionName: "report",
      args: [highPriceUpdateData, lowPriceUpdateData, currentPriceUpdateData],
      value: feeWithBump,
      account
    });
    
    console.log("📝 Transaction hash:", hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ Transaction successful!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Check the result
    const newIsReported = await publicClient.readContract({
      address: predictionMarketAddress as `0x${string}`,
      abi: [
        {
          "inputs": [],
          "name": "isReported",
          "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
          "stateMutability": "view",
          "type": "function"
        }
      ],
      functionName: "isReported"
    });

    const outcome = await publicClient.readContract({
      address: predictionMarketAddress as `0x${string}`,
      abi: [
        {
          "inputs": [],
          "name": "outcome",
          "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
          "stateMutability": "view",
          "type": "function"
        }
      ],
      functionName: "outcome"
    });

    const winningToken = await publicClient.readContract({
      address: predictionMarketAddress as `0x${string}`,
      abi: [
        {
          "inputs": [],
          "name": "winningToken",
          "outputs": [{"internalType": "address", "name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        }
      ],
      functionName: "winningToken"
    });
    
    console.log("\n🎉 Market Report Results:");
    console.log("Is Reported:", newIsReported);
    console.log("Outcome:", outcome.toString());
    console.log("Winning Token:", winningToken);
    
    if (newIsReported) {
      console.log("🎊 Market successfully reported!");
    }
    
  } catch (error: any) {
    console.log("❌ Transaction failed:");
    decodeRevert("report tx", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
