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

      const amountWei = parseEther(params.amount.toString());

      // First, approve the prediction contract to spend tokens
      const approveHash = await walletClient.writeContract({
        address: STAKE_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [params.predictionAddress as `0x${string}`, amountWei],
        account: primaryWallet.address as `0x${string}`,
      });

      console.log("Approve transaction hash:", approveHash);

      // Wait a bit for approval (in production, wait for receipt)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Then place the bet
      const voteHash = await walletClient.writeContract({
        address: params.predictionAddress as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "vote",
        args: [params.position === "YES", amountWei],
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

  return {
    createPrediction,
    placeBet,
    getPredictionPools,
    isLoading,
    error,
    isConnected: !!primaryWallet,
    getblockNumber
  };
}
