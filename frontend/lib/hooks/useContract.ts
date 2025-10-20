"use client";

import { useWallets } from "@privy-io/react-auth";
import { useState } from "react";
import { parseEther } from "viem";
import type { TradeDirection } from "@/lib/types";

import { getPublicClient, getWalletClient } from "../web3";
import { ERC20_ABI, PREDICTION_ABI, PREDICTION_FACTORY_ABI } from "@/lib/web3/abi";
import { PREDICTION_FACTORY_ADDRESS, STAKE_TOKEN_ADDRESS } from "../web3/address";
import { decodeEventLog } from "viem";

export function useContract() {
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const primaryWallet = wallets[0];


  const getblockNumber = async () => {

    if (!primaryWallet) {
      throw new Error("No wallet connected");
    }

    try {
      const provider = await primaryWallet.getEthereumProvider();
      const wallet = getPublicClient(provider);
      const num = await wallet.getBlockNumber();

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
    targetPrice: number;
    endTime: Date;
    metadataURI?: string;
    initialLiquidity: number;
  }): Promise<string[]> => {
    if (!primaryWallet) {
      throw new Error("No wallet connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = await primaryWallet.getEthereumProvider();

      const walletClient = getWalletClient(provider);
      const publicClient = getPublicClient(provider);
      //Approve token for spending
      const approveAmount = parseEther("1000");
      const approveHash = await walletClient.writeContract({
        address: STAKE_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [PREDICTION_FACTORY_ADDRESS as `0x${string}`, approveAmount],
        account: primaryWallet.address as `0x${string}`,
      });
      console.log("Approve transaction hash:", approveHash);

      await publicClient.waitForTransactionReceipt({ hash: approveHash });


      // Convert parameters
      const directionEnum = params.direction === "LONG" ? 0 : 1; // 0 = Up, 1 = Down
      const targetPriceWei = BigInt(Math.floor(params.targetPrice * 100000000)); // Convert to 8 decimals
      const endTimeUnix = BigInt(Math.floor(params.endTime.getTime() / 1000));
      const initialLiquidityWei = BigInt(Math.floor(params.initialLiquidity * 1000000));

      // Call createPrediction on factory
      const hash = await walletClient.writeContract({
        address: PREDICTION_FACTORY_ADDRESS as `0x${string}`,
        abi: PREDICTION_FACTORY_ABI,
        functionName: "createPrediction",
        args: [
          params.pairName,
          directionEnum,
          targetPriceWei,
          endTimeUnix,
          params.metadataURI || "",
          initialLiquidityWei
        ],
        account: primaryWallet.address as `0x${string}`,
      });
      console.log("Create prediction transaction hash:", hash);

      // Wait for transaction confirmation
      const predictionReceipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Method 1: Extract from contractAddress (for direct deployments)
      let  PredictionContractAddress = predictionReceipt.contractAddress;
      
      
      console.log("✅ Prediction contract deployed at:", PredictionContractAddress);

      //deploy Yes and No tokens
      const yesTokenHash = await walletClient.writeContract({
        address: PredictionContractAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "initializeYesToken",
        args: [],
        account: primaryWallet.address as `0x${string}`,
      });
      const yesTokenReceipt = await publicClient.waitForTransactionReceipt({ hash: yesTokenHash });
      const yesTokenAddress = yesTokenReceipt.contractAddress;
      console.log("✅ Yes token deployed at:", yesTokenAddress);

      const noTokenHash = await walletClient.writeContract({
        address: PredictionContractAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "initializeNoToken",
        args: [],
        account: primaryWallet.address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash: noTokenHash });
      const noTokenReceipt = await publicClient.waitForTransactionReceipt({ hash: yesTokenHash });
      const noTokenAddress= noTokenReceipt.contractAddress;
      console.log("✅ No token deployed at:", noTokenAddress);

      //initialize market
      const initializeMarketHash = await walletClient.writeContract({
        address: PredictionContractAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "initializeMarket",
        args: [],
        account: primaryWallet.address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash: initializeMarketHash });

      console.log("Yes token transaction hash:", yesTokenHash);
      console.log("No token transaction hash:", noTokenHash);

      //Approve yes token for spending into Prediction contract
      const approveYesTokenHash = await walletClient.writeContract({
        address: yesTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [PredictionContractAddress as `0x${string}`, approveAmount],
        account: primaryWallet.address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveYesTokenHash });
      console.log("Approve yes token transaction hash:", approveYesTokenHash);

      //Approve no token for spending into Prediction contract
      const approveNoTokenHash = await walletClient.writeContract({
        address: noTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [PredictionContractAddress as `0x${string}`, approveAmount],
        account: primaryWallet.address as `0x${string}`,
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
    if (!primaryWallet) {
      throw new Error("No wallet connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = await primaryWallet.getEthereumProvider();

      const walletClient = getWalletClient(provider);
      const publicClient = getPublicClient(provider);
      const amountWei = BigInt(params.amount * 1_000_000); // Convert to 6 decimal places

        // First, approve the prediction contract to spend tokens
        const approveHash = await walletClient.writeContract({
          address: STAKE_TOKEN_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [params.predictionAddress as `0x${string}`, amountWei],
          account: primaryWallet.address as `0x${string}`,
        });
      const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
      console.log("Approve transaction hash:", approveHash);


      // Then place the bet
      const votePosition = params.position === "YES" ? 0 : 1;
      const voteHash = await walletClient.writeContract({
        address: params.predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "buyTokensWithPYUSD",
        args: [votePosition, amountWei],
        account: primaryWallet.address as `0x${string}`,
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
    if (!primaryWallet) {
      throw new Error("No wallet connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = await primaryWallet.getEthereumProvider();

      const walletClient = getWalletClient(provider);
      const publicClient = getPublicClient(provider);

      const resolveP1Hash = await walletClient.writeContract({
        address: params.predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "report",
        args: [params.highPriceData],
        account: primaryWallet.address as `0x${string}`,
      });
      const resolveP1Receipt = await publicClient.waitForTransactionReceipt({ hash: resolveP1Hash });
      console.log("Resolve P1 transaction hash:", resolveP1Hash);

      const resolveP2Hash = await walletClient.writeContract({
        address: params.predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "report",
        args: [params.lowPriceData],
        account: primaryWallet.address as `0x${string}`,
      });
      const resolveP2Receipt = await publicClient.waitForTransactionReceipt({ hash: resolveP2Hash });
      console.log("Resolve P2 transaction hash:", resolveP2Hash);

      const resolveP3Hash = await walletClient.writeContract({
        address: params.predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "report",
        args: [params.currentPriceData],
        account: primaryWallet.address as `0x${string}`,
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
    if (!primaryWallet) {
      throw new Error("No wallet connected");
    }

    try {
      const provider = await primaryWallet.getEthereumProvider();

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
    if (!primaryWallet) {
      throw new Error("No wallet connected");
    }

    try {
      const provider = await primaryWallet.getEthereumProvider();
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
    isLoading,
    error,
    isConnected: !!primaryWallet,
    getblockNumber
  };
}
