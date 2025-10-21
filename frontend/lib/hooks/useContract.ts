"use client";

import { usePrivy, useWallets, useCreateWallet } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { parseEther } from "viem";
import type { TradeDirection } from "@/lib/types";

import { getPublicClient, getWalletClient } from "../web3";
import { ERC20_ABI, PREDICTION_ABI, PREDICTION_FACTORY_ABI } from "@/lib/web3/abi";
import { PREDICTION_FACTORY_ADDRESS, STAKE_TOKEN_ADDRESS } from "../web3/address";
import { decodeEventLog } from "viem";

export function useContract() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { wallets, ready: readyWallets } = useWallets();
  const { ready: readyAuth, authenticated, user } = usePrivy();
  const { createWallet } = useCreateWallet();
  const primaryWallet = wallets[0];

  // Function to ensure wallet is created
  const ensureWallet = async () => {
    if (!readyAuth || !authenticated || !readyWallets) {
      return false;
    }

    if (wallets.length === 0) {
      console.log("🔄 No wallets found, creating embedded wallet...");
      try {
        await createWallet();
        console.log("✅ Embedded wallet created successfully");
        return true;
      } catch (error) {
        console.error("❌ Failed to create wallet:", error);
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    if (readyAuth && authenticated && readyWallets) {
      console.log("✅ Wallets loaded:", wallets);
      console.log("✅ User info:", user);
      console.log("✅ Primary wallet:", primaryWallet);
      
      // Ensure wallet exists if user is authenticated but no wallets
      if (wallets.length === 0) {
        ensureWallet();
      }

      // Log wallet address if available
      if (primaryWallet?.address) {
        console.log("✅ Primary wallet address:", primaryWallet.address);
      }
    } else {
      console.log("⏳ Waiting for wallet initialization...", { 
        readyAuth, 
        authenticated, 
        readyWallets, 
        walletsCount: wallets.length,
        user: user?.id,
        primaryWalletAddress: primaryWallet?.address
      });
    }
  }, [readyAuth, authenticated, readyWallets, wallets, user, primaryWallet, ensureWallet]);

  // Helper function to get wallet with proper error handling
  const getWallet = () => {
    if (!readyAuth || !authenticated) {
      throw new Error("Please login first");
    }
    
    if (!readyWallets) {
      throw new Error("Wallets are still loading");
    }
    
    if (wallets.length === 0) {
      throw new Error("No wallet found. Please create a wallet first.");
    }
    
    return primaryWallet;
  };

  const getblockNumber = async () => {
    const wallet = getWallet();

    try {
      const provider = await wallet.getEthereumProvider();
      const publicClient = getPublicClient(provider);
      const num = await publicClient.getBlockNumber();

      console.log(num)
    } catch (err: any) {
      const errorMsg = err.message || "Failed to create prediction";
      setError(errorMsg);
      setIsLoading(false);
      throw new Error(errorMsg);
    }


  }


  /**
   * Create a prediction market on-chain
   * Returns the contract address of the created prediction
   */
  const createPrediction = async (params: {
    pairName: string;
    direction: TradeDirection;
    targetPrice: string;
    endTime: string;
    metadataURI?: string;
    initialLiquidity: string;
  }): Promise<string[]> => {
    const wallet = getWallet();


    setIsLoading(true);
    setError(null);

    try {
      const provider = await wallet.getEthereumProvider();
      console.log("PROVIDER --------> ", provider)

      const walletClient = getWalletClient(provider);
      const publicClient = getPublicClient(provider);
      //Approve token for spending
      const approveAmount = parseEther("1000");

      const allowance = await publicClient.readContract({
        address: STAKE_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [wallet.address as `0x${string}`, PREDICTION_FACTORY_ADDRESS as `0x${string}`],
      });

      console.log("Allowance:", allowance);
      if (allowance < parseEther("0.01")) {
      const approveHash = await walletClient.writeContract({
        address: STAKE_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [PREDICTION_FACTORY_ADDRESS as `0x${string}`, approveAmount],
        account: wallet.address as `0x${string}`,
      });
      console.log("Approve transaction hash:", approveHash);
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }
    console.log("📋 Parameters received:", {
      pairName: params.pairName,
      direction: params.direction,
      targetPrice: params.targetPrice,
      endTime: params.endTime,
      metadataURI: params.metadataURI,
      initialLiquidity: params.initialLiquidity
    });

    // Convert parameters
      const directionEnum = params.direction === "LONG" ? 0 : 1; // 0 = Up, 1 = Down
      
      // Add comprehensive validation before converting to BigInt
      if (!params.pairName || typeof params.pairName !== 'string') {
        throw new Error("pairName is required and must be a valid string");
      }
      
      if (!params.direction || !['LONG', 'SHORT'].includes(params.direction)) {
        throw new Error("direction is required and must be either 'LONG' or 'SHORT'");
      }
      
      if (params.targetPrice === undefined || params.targetPrice === null) {
        throw new Error("targetPrice is required and must be a valid number");
      }
      
      if (!params.endTime) {
        throw new Error("endTime is required");
      }
      
      if (params.initialLiquidity === undefined || params.initialLiquidity === null ) {
        throw new Error("initialLiquidity is required and must be a valid number");
      }

     

      // Convert to BigInt with proper validation
      // const targetPriceWei = BigInt(Math.floor(params.targetPrice * 100000000)); // Convert to 8 decimals
      // console.log("Target price wei:", targetPriceWei);
      

      // Call createPrediction on factory
      console.log("🚀 Calling createPrediction with args:", {
        pairName: params.pairName,
        directionEnum,
        targetPriceWei: params.targetPrice,
        endTimeUnix: params.endTime,
        metadataURI: "",
        initialLiquidityWei: params.initialLiquidity
      });
      
      const hash = await walletClient.writeContract({
        address: PREDICTION_FACTORY_ADDRESS as `0x${string}`,
        abi: PREDICTION_FACTORY_ABI,
        functionName: "createPrediction",
        args: [
          params.pairName,
          directionEnum,
           params.targetPrice,
          params.endTime,
          "",
          params.initialLiquidity
        ],
        account: wallet.address as `0x${string}`,
      });
      console.log("Create prediction transaction hash:", hash);

      // Wait for transaction confirmation
      const predictionReceipt = await publicClient.waitForTransactionReceipt({ hash });

      // Method 1: Extract from contractAddress (for direct deployments)
      let PredictionContractAddress = predictionReceipt.contractAddress;

      if (!PredictionContractAddress) {
        throw new Error("Failed to get prediction contract address from transaction receipt");
      }

      console.log("✅ Prediction contract deployed at:", PredictionContractAddress);

      //deploy Yes and No tokens
      const yesTokenHash = await walletClient.writeContract({
        address: PredictionContractAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "initializeYesToken",
        args: [],
        account: wallet.address as `0x${string}`,
      });
      const yesTokenReceipt = await publicClient.waitForTransactionReceipt({ hash: yesTokenHash });
      const yesTokenAddress = yesTokenReceipt.contractAddress;
      
      if (!yesTokenAddress) {
        throw new Error("Failed to get yes token contract address from transaction receipt");
      }
      
      console.log("✅ Yes token deployed at:", yesTokenAddress);

      const noTokenHash = await walletClient.writeContract({
        address: PredictionContractAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "initializeNoToken",
        args: [],
        account: wallet.address as `0x${string}`,
      });
      const noTokenReceipt = await publicClient.waitForTransactionReceipt({ hash: noTokenHash });
      const noTokenAddress = noTokenReceipt.contractAddress;
      
      if (!noTokenAddress) {
        throw new Error("Failed to get no token contract address from transaction receipt");
      }
      
      console.log("✅ No token deployed at:", noTokenAddress);

      //initialize market
      const initializeMarketHash = await walletClient.writeContract({
        address: PredictionContractAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "initializeMarket",
        args: [],
        account: wallet.address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash: initializeMarketHash });

      console.log("Yes token transaction hash:", yesTokenHash);
      console.log("No token transaction hash:", noTokenHash);

      //Approve yes token for spending into Prediction contract
      console.log("🔐 Approving yes token:", {
        yesTokenAddress,
        predictionContractAddress: PredictionContractAddress,
        approveAmount: approveAmount.toString()
      });
      
      const approveYesTokenHash = await walletClient.writeContract({
        address: yesTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [PredictionContractAddress as `0x${string}`, approveAmount],
        account: wallet.address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveYesTokenHash });
      console.log("Approve yes token transaction hash:", approveYesTokenHash);

      //Approve no token for spending into Prediction contract
      console.log("🔐 Approving no token:", {
        noTokenAddress,
        predictionContractAddress: PredictionContractAddress,
        approveAmount: approveAmount.toString()
      });
      
      const approveNoTokenHash = await walletClient.writeContract({
        address: noTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [PredictionContractAddress as `0x${string}`, approveAmount],
        account: wallet.address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveNoTokenHash });
      console.log("Approve no token transaction hash:", approveNoTokenHash);

      setIsLoading(false);
      return [String(PredictionContractAddress), String(yesTokenAddress), String(noTokenAddress)]; // Return the actual deployed contract address
    } catch (err: any) {
      const errorMsg = err.message || "Failed to create prediction";
      setError(errorMsg);
      setIsLoading(false);
      throw new Error(errorMsg);
    }
  };

  /**
   * Place a bet (vote) on a prediction
   */
  const placeBet = async (params: {
    predictionAddress: string;
    amount: number;
    position: "YES" | "NO";
  }): Promise<string> => {
    const wallet = getWallet();

    setIsLoading(true);
    setError(null);

    try {
      const provider = await wallet.getEthereumProvider();

      const walletClient = getWalletClient(provider);
      const publicClient = getPublicClient(provider);
      const amountWei = BigInt(params.amount * 1_000_000); // Convert to 6 decimal places

      // First, approve the prediction contract to spend tokens
      const approveAmount = parseEther("1000");

      const allowance = await publicClient.readContract({
        address: STAKE_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [wallet.address as `0x${string}`, params.predictionAddress as `0x${string}`],
      });
      console.log("Allowance:", allowance);
      if (allowance < amountWei) {
      const approveHash = await walletClient.writeContract({
        address: STAKE_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [params.predictionAddress as `0x${string}`, amountWei],
        account: wallet.address as `0x${string}`,
      });
      const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
      console.log("Approve transaction hash:", approveHash);
     }


      // Then place the bet
      const votePosition = params.position === "YES" ? 0 : 1;
      const voteHash = await walletClient.writeContract({
        address: params.predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "buyTokensWithPYUSD",
        args: [votePosition, amountWei],
        account: wallet.address as `0x${string}`,
      });

      console.log("Vote transaction hash:", voteHash);

      setIsLoading(false);
      return voteHash;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to place bet";
      setError(errorMsg);
      setIsLoading(false);
      throw new Error(errorMsg);
    }
  };



  const resolvePrediction = async (params: {
    predictionAddress: string;
    highPriceData: string | null;
    lowPriceData: string | null;
    currentPriceData: string | null;
  }): Promise<string[]> => {
    const wallet = getWallet();

    setIsLoading(true);
    setError(null);

    try {
      const provider = await wallet.getEthereumProvider();

      const walletClient = getWalletClient(provider);
      const publicClient = getPublicClient(provider);

      const resolveP1Hash = await walletClient.writeContract({
        address: params.predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "report",
        args: [params.highPriceData],
        account: wallet.address as `0x${string}`,
      });
      const resolveP1Receipt = await publicClient.waitForTransactionReceipt({ hash: resolveP1Hash });
      console.log("Resolve P1 transaction hash:", resolveP1Hash);

      const resolveP2Hash = await walletClient.writeContract({
        address: params.predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "report",
        args: [params.lowPriceData],
        account: wallet.address as `0x${string}`,
      });
      const resolveP2Receipt = await publicClient.waitForTransactionReceipt({ hash: resolveP2Hash });
      console.log("Resolve P2 transaction hash:", resolveP2Hash);

      const resolveP3Hash = await walletClient.writeContract({
        address: params.predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "report",
        args: [params.currentPriceData],
        account: wallet.address as `0x${string}`,
      });
      const resolveP3Receipt = await publicClient.waitForTransactionReceipt({ hash: resolveP3Hash });
      console.log("Resolve P3 transaction hash:", resolveP3Hash);

      setIsLoading(false);
      return [String(resolveP1Hash), String(resolveP2Hash), String(resolveP3Hash)];
    } catch (err: any) {
      const errorMsg = err.message || "Failed to place bet";
      setError(errorMsg);
      setIsLoading(false);
      throw new Error(errorMsg);
    }
  };



  /**
   * Get current pools for a prediction
   */
  const getPredictionPools = async (predictionAddress: string) => {
    const wallet = getWallet();

    try {
      const provider = await wallet.getEthereumProvider();

      const walletClient = getWalletClient(provider);


      // Read yesPool and noPool
      // Note: You'll need a publicClient for read operations
      // This is a simplified version

      return {
        yesPool: 0,
        noPool: 0,
      };
    } catch (err: any) {
      console.error("Failed to get pools:", err);
      return { yesPool: 0, noPool: 0 };
    }
  };

  const getOutcome = async (predictionAddress: string): Promise<number> => {
    const wallet = getWallet();

    try {
      const provider = await wallet.getEthereumProvider();
      const publicClient = getPublicClient(provider);

      const outcome = await publicClient.readContract({
        address: predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "outcome",
      });

      return Number(outcome);
    } catch (err: any) {
      const errorMsg = err.message || "Failed to get outcome";
      setError(errorMsg);
      setIsLoading(false);
      throw new Error(errorMsg);
    }
  }
  return {
    createPrediction,
    placeBet,
    getPredictionPools,
    resolvePrediction,
    getOutcome,
    ensureWallet,
    getWallet,
    isLoading,
    error,
    isConnected: readyAuth && authenticated && readyWallets && wallets.length > 0,
    isReady: readyAuth && readyWallets,
    wallets,
    primaryWallet,
    getblockNumber
  };
}
