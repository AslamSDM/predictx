"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
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
  const primaryWallet = wallets[0];

  // Function to ensure wallet is created (removed manual creation to prevent multiple wallets)
  const ensureWallet = async () => {
    if (!readyAuth || !authenticated || !readyWallets) {
      return false;
    }

    // Let Privy handle wallet creation automatically
    // Don't manually create wallets to prevent multiple wallet creation
    if (wallets.length === 0) {
      console.log("⏳ Waiting for Privy to create embedded wallet...");
      return false; // Wait for Privy's automatic wallet creation
    }
    return true;
  };

  useEffect(() => {
    if (readyAuth && authenticated && readyWallets) {
      console.log("✅ Wallets loaded:", wallets);
      console.log("✅ User info:", user);
      console.log("✅ Primary wallet:", primaryWallet);

      // Let Privy handle wallet creation automatically
      // Don't manually trigger wallet creation to prevent multiple wallets

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

      //   const allowance = await publicClient.readContract({
      //     address: STAKE_TOKEN_ADDRESS as `0x${string}`,
      //     abi: ERC20_ABI,
      //     functionName: "allowance",
      //     args: [wallet.address as `0x${string}`, PREDICTION_FACTORY_ADDRESS as `0x${string}`],
      //   });

      //   console.log("Allowance:", allowance);
      //   if (allowance < parseEther("0.01")) {
      //   const approveHash = await walletClient.writeContract({
      //     address: STAKE_TOKEN_ADDRESS as `0x${string}`,
      //     abi: ERC20_ABI,
      //     functionName: "approve",
      //     args: [PREDICTION_FACTORY_ADDRESS as `0x${string}`, approveAmount],
      //     account: wallet.address as `0x${string}`,
      //   });
      //   console.log("Approve transaction hash:", approveHash);
      // }
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

      if (params.initialLiquidity === undefined || params.initialLiquidity === null) {
        throw new Error("initialLiquidity is required and must be a valid number");
      }


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
          {
            base: params.targetPrice,
            expo: -8
          },
          params.endTime,
          params.metadataURI,
          params.initialLiquidity
        ],
        account: wallet.address as `0x${string}`,
      });
      console.log("Create prediction transaction hash:", hash);

      const predictionReceipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Prediction receipt:", predictionReceipt);

      const PredictionContractAddressCreate2 = predictionReceipt.logs[0].address;
      console.log("Prediction contract address:", PredictionContractAddressCreate2);

      const yesTokenAddress = await publicClient.readContract({
        address: PredictionContractAddressCreate2 as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "yesToken",
      });
      console.log("Yes token address:", yesTokenAddress);

      const noTokenAddress = await publicClient.readContract({
        address: PredictionContractAddressCreate2 as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "noToken",
      });
      console.log("No token address:", noTokenAddress);

      const approvePyUsdHash = await walletClient.writeContract({
        address: STAKE_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [PredictionContractAddressCreate2 as `0x${string}`, approveAmount],
        account: wallet.address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash: approvePyUsdHash });
      console.log("Approve PyUsd transaction hash:", approvePyUsdHash);

      const initializeMarket = await walletClient.writeContract({
        address: PredictionContractAddressCreate2 as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "initializeMarket",
        args: [],
        account: wallet.address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash: initializeMarket });
      console.log("Initialize market transaction hash:", initializeMarket);


      setIsLoading(false);
      return [String(PredictionContractAddressCreate2), String(yesTokenAddress), String(noTokenAddress)]; // Return the actual deployed contract address
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


const getEndsAndStartTimes = async (predictionAddress: string) => {
  const wallet = getWallet();
  const provider = await wallet.getEthereumProvider();
  const publicClient = getPublicClient(provider);
  const endTime = await publicClient.readContract({
    address: predictionAddress as `0x${string}`,
    abi: PREDICTION_ABI,
    functionName: "endTime",
  })
  const startTime = await publicClient.readContract({
    address: predictionAddress as `0x${string}`,
    abi: PREDICTION_ABI,
    functionName: "startTime",
  })
  return { endTime, startTime };
}

  const resolvePrediction = async (params: {
    predictionAddress: string;
    highPriceData: string | null;
    lowPriceData: string | null;
    currentPriceData: string | null;
  }): Promise<string> => {
    const wallet = getWallet();

    setIsLoading(true);
    setError(null);

    try {
      const provider = await wallet.getEthereumProvider();

      const walletClient = getWalletClient(provider);
      const publicClient = getPublicClient(provider);

      const endTime=await publicClient.readContract({
        address: params.predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "endTime",
        args: [],
      })

      console.log("END TIME --------> ", endTime)
      console.log("Price data params:", {
        highPriceData: params.highPriceData,
        lowPriceData: params.lowPriceData,
        currentPriceData: params.currentPriceData
      });

      // Validate that we have at least current price data
      if (!params.currentPriceData) {
        throw new Error("Current price data is required for resolution");
      }

      // Ensure all price data is valid hex strings and not null/undefined
      const highPriceDataArray = (params.highPriceData && typeof params.highPriceData === 'string' && params.highPriceData.startsWith('0x')) ? [params.highPriceData] : [];
      const lowPriceDataArray = (params.lowPriceData && typeof params.lowPriceData === 'string' && params.lowPriceData.startsWith('0x')) ? [params.lowPriceData] : [];
      const currentPriceDataArray = (params.currentPriceData && typeof params.currentPriceData === 'string' && params.currentPriceData.startsWith('0x')) ? [params.currentPriceData] : [];

      console.log("Final price data arrays:", {
        highPriceDataArray,
        lowPriceDataArray,
        currentPriceDataArray,
        highPriceDataLength: highPriceDataArray.length,
        lowPriceDataLength: lowPriceDataArray.length,
        currentPriceDataLength: currentPriceDataArray.length
      });

      // Additional validation to ensure arrays are properly formatted
      if (currentPriceDataArray.length === 0) {
        throw new Error("Current price data is required and must be a valid hex string");
      }

      // Validate all parameters before making the contract call
      const contractArgs = [
        highPriceDataArray,
        lowPriceDataArray,
        currentPriceDataArray
      ];

      console.log("Contract call parameters:", {
        address: params.predictionAddress,
        functionName: "report",
        args: contractArgs,
        account: wallet.address,
        value: "0.0001 ETH"
      });

      // Ensure all args are properly formatted
      contractArgs.forEach((arg, index) => {
        if (!Array.isArray(arg)) {
          throw new Error(`Argument ${index} is not an array: ${typeof arg}`);
        }
        arg.forEach((item, itemIndex) => {
          if (typeof item !== 'string' || !item.startsWith('0x')) {
            throw new Error(`Item ${itemIndex} in argument ${index} is not a valid hex string: ${item}`);
          }
        });
      });

      const resolveP1Hash = await walletClient.writeContract({
        address: params.predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "report",
        args: contractArgs,
        account: wallet.address as `0x${string}`,
        value: 100000000000000n // Use BigInt literal instead of BigInt() constructor
      });
      const resolveP1Receipt = await publicClient.waitForTransactionReceipt({ hash: resolveP1Hash });
      console.log("Resolve transaction hash:", resolveP1Hash);

      setIsLoading(false);
      return resolveP1Hash;
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
      const publicClient = getPublicClient(provider);
      const yesToken = await publicClient.readContract({
        address: predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "yesToken",
      });
      const noToken = await publicClient.readContract({
        address: predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "noToken",
      });
      const pyUSD = await publicClient.readContract({
        address: predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "pyUSD",
      });
      const initialTokenValue = await publicClient.readContract({
        address: predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "initialTokenValue",
      });
      const initialTokenSupply = (Number(pyUSD) / Number(initialTokenValue))*(10**6);
      const yesTokenSupply =  initialTokenSupply   -  (Number(yesToken)/(10**6));
      const noTokenSupply  =  initialTokenSupply   -  (Number(noToken)/(10**6));


      return {
        yesTokenSupply: yesTokenSupply,
        noTokenSupply: noTokenSupply,
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

  const getWinningToken = async (predictionAddress: string): Promise<string> => {
    const wallet = getWallet();

    try {
      const provider = await wallet.getEthereumProvider();
      const publicClient = getPublicClient(provider);

      const winningToken = await publicClient.readContract({
        address: predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "winningToken",
      });

      return String(winningToken);
    } catch (err: any) {
      const errorMsg = err.message || "Failed to get outcome";
      setError(errorMsg);
      setIsLoading(false);
      throw new Error(errorMsg);
    }
  }

  const redeemWinningTokens = async (predictionAddress: string, winningTokenAddress: string) => {
    const wallet = getWallet();

    setIsLoading(true);
    setError(null);

    try {
      const provider = await wallet.getEthereumProvider();

      const walletClient = getWalletClient(provider);
      const publicClient = getPublicClient(provider);

      const balance = await publicClient.readContract({
        address: winningTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [wallet.address as `0x${string}`],
      });

      if (balance <= BigInt(0)) {
        throw Error("User have no  Winning Token balance")
      }
      const allowance = await publicClient.readContract({
        address: winningTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [wallet.address as `0x${string}`, predictionAddress as `0x${string}`],
      });
      if (allowance < parseEther("1")) {
       console.log("User have no allowance for winning tokens")
        const approveHash = await walletClient.writeContract({
          address: winningTokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [predictionAddress as `0x${string}`, parseEther("1000")],
          account: wallet.address as `0x${string}`,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        console.log("Approve transaction hash:", approveHash);
      }
      const redeemTxn = await walletClient.writeContract({
        address: predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "redeemWinningTokens",
        args: [balance],
        account: wallet.address as `0x${string}`,
      });

      await publicClient.waitForTransactionReceipt({ hash: redeemTxn });

    } catch (err: any) {
      const errorMsg = err.message || "Failed to place bet";
      setError(errorMsg);
      setIsLoading(false);
      throw new Error(errorMsg);
    }
  };

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
    getblockNumber,
    getWinningToken,
    redeemWinningTokens,
    getEndsAndStartTimes
  };
}
