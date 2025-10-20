"use client";

import { useWallets } from "@privy-io/react-auth";
import { useState } from "react";
import { parseEther } from "viem";
import type { TradeDirection } from "@/lib/types";

import { getPublicClient, getWalletClient } from "../web3";
import { ERC20_ABI, PREDICTION_ABI, PREDICTION_FACTORY_ABI } from "@/lib/web3/abi";
import { PREDICTION_FACTORY_ADDRESS, STAKE_TOKEN_ADDRESS } from "../web3/address";

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
  }): Promise<string> => {
    if (!primaryWallet) {
      throw new Error("No wallet connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = await primaryWallet.getEthereumProvider();

      const walletClient = getWalletClient(provider);

      // Convert parameters
      const directionEnum = params.direction === "LONG" ? 0 : 1; // 0 = Up, 1 = Down
      const targetPriceWei = BigInt(Math.floor(params.targetPrice * 100000000)); // Convert to 8 decimals
      const endTimeUnix = BigInt(Math.floor(params.endTime.getTime() / 1000));

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
        ],
        account: primaryWallet.address as `0x${string}`,
      });

      // Wait for transaction confirmation
      // Note: You might want to add a publicClient to wait for the receipt
      console.log("Transaction hash:", hash);

      // For now, we'll return a placeholder
      // In production, you should parse the transaction receipt to get the actual address
      // You can emit an event from the contract and parse it here

      setIsLoading(false);
      return hash; // Temporary: return tx hash as placeholder for address
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
