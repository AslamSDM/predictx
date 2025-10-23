import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseEther, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import PredictionMarket from "@/abi/PredictionMarket.json";

// TODO: Replace with your actual private key or use environment variable
const PRIVATE_KEY = process.env.RESOLVER_PRIVATE_KEY || "0x9bcc687443649c564d7e28f78d4ced962c81c637881194f923265543fffea869";

const PREDICTION_ABI = PredictionMarket.abi;

// Pyth contract address on Sepolia
const PYTH_CONTRACT_ADDRESS = "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21";

// Pyth contract ABI (minimal - just what we need)
const PYTH_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes[]",
        "name": "updateData",
        "type": "bytes[]"
      }
    ],
    "name": "getUpdateFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "feeAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export async function POST(request: NextRequest) {
  try {
    const { predictionAddress, highPriceData, lowPriceData, currentPriceData } = await request.json();

    if (!predictionAddress) {
      return NextResponse.json(
        { error: "Prediction address is required" },
        { status: 400 }
      );
    }

    if (!currentPriceData) {
      return NextResponse.json(
        { error: "Current price data is required for resolution" },
        { status: 400 }
      );
    }

    console.log("🔐 Creating wallet client from private key...");
    
    // Create account from private key
    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    
    // Use a reliable RPC endpoint
    const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/04e42fc32fba4571b9427ce7e6e549ec";
    
    // Create wallet client for sending transactions
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    });

    // Create public client for reading contract state
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });

    console.log("📋 Resolver wallet address:", account.address);
    
    // Check account balance
    const balance = await publicClient.getBalance({ address: account.address });
    console.log("💰 Account balance:", formatEther(balance), "ETH");

    // Validate that we have at least current price data
    const highPriceDataArray = (highPriceData && typeof highPriceData === 'string' && highPriceData.startsWith('0x')) ? [highPriceData] : [];
    const lowPriceDataArray = (lowPriceData && typeof lowPriceData === 'string' && lowPriceData.startsWith('0x')) ? [lowPriceData] : [];
    const currentPriceDataArray = (currentPriceData && typeof currentPriceData === 'string' && currentPriceData.startsWith('0x')) ? [currentPriceData] : [];

    console.log("📊 Price data arrays:", {
      highPriceDataArray,
      lowPriceDataArray,
      currentPriceDataArray,
    });

    // Additional validation
    if (currentPriceDataArray.length === 0) {
      return NextResponse.json(
        { error: "Current price data is required and must be a valid hex string" },
        { status: 400 }
      );
    }

    // Prepare contract call parameters
    const contractArgs = [
      highPriceDataArray,
      lowPriceDataArray,
      currentPriceDataArray
    ];

    console.log("💰 Calculating Pyth fees...");
    
    // Calculate fees for each price update
    let totalFees = BigInt(0);
    
    try {
      if (highPriceDataArray.length > 0) {
        const highFees = await publicClient.readContract({
          address: PYTH_CONTRACT_ADDRESS as `0x${string}`,
          abi: PYTH_ABI,
          functionName: "getUpdateFee",
          args: [highPriceDataArray]
        }) as bigint;
        console.log("High price fee:", formatEther(highFees), "ETH");
        totalFees += highFees;
      }

      if (lowPriceDataArray.length > 0) {
        const lowFees = await publicClient.readContract({
          address: PYTH_CONTRACT_ADDRESS as `0x${string}`,
          abi: PYTH_ABI,
          functionName: "getUpdateFee",
          args: [lowPriceDataArray]
        }) as bigint;
        console.log("Low price fee:", formatEther(lowFees), "ETH");
        totalFees += lowFees;
      }

      if (currentPriceDataArray.length > 0) {
        const currentFees = await publicClient.readContract({
          address: PYTH_CONTRACT_ADDRESS as `0x${string}`,
          abi: PYTH_ABI,
          functionName: "getUpdateFee",
          args: [currentPriceDataArray]
        }) as bigint;
        console.log("Current price fee:", formatEther(currentFees), "ETH");
        totalFees += currentFees;
      }
    } catch (feeError: any) {
      console.error("❌ Error calculating Pyth fees:", feeError);
      return NextResponse.json(
        { error: "Failed to calculate Pyth fees", details: feeError.message },
        { status: 500 }
      );
    }
    
    // Add a small buffer to the fees
    const feeWithBump = totalFees + parseEther("0.000001");
    console.log("Total fees:", formatEther(totalFees), "ETH");
    console.log("Sending with buffer:", formatEther(feeWithBump), "ETH");
    
    // Check if we have enough ETH
    if (balance < feeWithBump) {
      return NextResponse.json(
        { 
          error: "Insufficient ETH balance in resolver wallet", 
          details: `Required: ${formatEther(feeWithBump)} ETH, Available: ${formatEther(balance)} ETH` 
        },
        { status: 500 }
      );
    }

    console.log("📞 Calling report function on contract:", predictionAddress);
    console.log("📋 Contract call parameters:", {
      address: predictionAddress,
      functionName: "report",
      args: contractArgs,
      account: account.address,
      value: formatEther(feeWithBump) + " ETH"
    });

    // First simulate the call to check for errors
    try {
      await publicClient.simulateContract({
        address: predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "report",
        args: contractArgs,
        value: feeWithBump,
        account: account.address,
      });
      console.log("✅ Simulation successful - no issues detected");
    } catch (simError: any) {
      console.error("❌ Simulation failed:", simError);
      return NextResponse.json(
        { 
          error: "Contract simulation failed", 
          details: simError.message || String(simError),
          hint: "The transaction would likely fail. Check if the prediction has expired and hasn't been reported yet."
        },
        { status: 400 }
      );
    }

    // Call the report function
    const reportHash = await walletClient.writeContract({
      address: predictionAddress as `0x${string}`,
      abi: PREDICTION_ABI,
      functionName: "report",
      args: contractArgs,
      value: feeWithBump,
    });

    console.log("✅ Report transaction hash:", reportHash);

    // Wait for the transaction to be mined
    const reportReceipt = await publicClient.waitForTransactionReceipt({ 
      hash: reportHash,
      timeout: 60_000, // 60 seconds timeout
    });

    console.log("✅ Report transaction receipt:", reportReceipt);

    // Now read the outcome from the contract
    console.log("📖 Reading outcome from contract...");
    
    let outcome: number;
    try {
      const outcomeResult = await publicClient.readContract({
        address: predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "outcome",
      });

      outcome = Number(outcomeResult);
      console.log("✅ Outcome resolved on-chain:", outcome);
    } catch (readError) {
      console.error("❌ Error reading outcome:", readError);
      // If we can't read the outcome immediately, it might not be resolved yet
      // Return error to indicate resolution failed
      return NextResponse.json(
        { error: "Failed to read outcome from contract after resolution" },
        { status: 500 }
      );
    }

    // Return success with outcome
    return NextResponse.json({
      success: true,
      transactionHash: reportHash,
      outcome: outcome,
      message: `Prediction resolved with outcome: ${outcome === 0 ? 'YES' : 'NO'}`,
    });

  } catch (error: any) {
    console.error("❌ Error resolving prediction on-chain:", error);
    return NextResponse.json(
      { 
        error: "Failed to resolve prediction on-chain", 
        details: error.message || String(error) 
      },
      { status: 500 }
    );
  }
}

