"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { parseEther } from "viem";
import type { TradeDirection } from "@/lib/types";

import { getPublicClient, getWalletClient } from "../web3";
import {
  ERC20_ABI,
  PREDICTION_ABI,
  PREDICTION_FACTORY_ABI,
} from "@/lib/web3/abi";
import {
  PREDICTION_FACTORY_ADDRESS,
  STAKE_TOKEN_ADDRESS,
} from "../web3/address";
import { decodeEventLog } from "viem";
import { useTransactionNotifications } from "./useTransactionNotifications";
import { TransactionType } from "../blockscout/config";

export function useContract() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { wallets, ready: readyWallets } = useWallets();
  const { ready: readyAuth, authenticated, user } = usePrivy();
  const primaryWallet = wallets[0];

  // Transaction notifications hook
  const { trackTransaction, notifySuccess, notifyError } =
    useTransactionNotifications();

  // Function to ensure wallet is created (removed manual creation to prevent multiple wallets)
  const ensureWallet = async () => {
    if (!readyAuth || !authenticated || !readyWallets) {
      return false;
    }

    // Let Privy handle wallet creation automatically
    // Don't manually create wallets to prevent multiple wallet creation
    if (wallets.length === 0) {
      return false; // Wait for Privy's automatic wallet creation
    }
    return true;
  };

  useEffect(() => {
    // Privy handles wallet initialization automatically
  }, [
    readyAuth,
    authenticated,
    readyWallets,
    wallets,
    user,
    primaryWallet,
    ensureWallet,
  ]);

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
      return num;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to get block number";
      setError(errorMsg);
      setIsLoading(false);
      throw new Error(errorMsg);
    }
  };

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
      const walletClient = getWalletClient(provider);
      const publicClient = getPublicClient(provider);
      const approveAmount = parseEther("1000");

      const allowance = await publicClient.readContract({
        address: STAKE_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [wallet.address as `0x${string}`, PREDICTION_FACTORY_ADDRESS as `0x${string}`],
      });

      if (allowance < parseEther("0.01")) {
        const approveHash = await walletClient.writeContract({
          address: STAKE_TOKEN_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [PREDICTION_FACTORY_ADDRESS as `0x${string}`, approveAmount],
          account: wallet.address as `0x${string}`,
        });

        // Track approval transaction
        const approvalTracker = trackTransaction(
          approveHash,
          TransactionType.APPROVE,
          11155111 // Sepolia chain ID
        );

        // Wait for approval confirmation
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        (await approvalTracker).success();
      }

      // Convert parameters
      const directionEnum = params.direction === "LONG" ? 0 : 1; // 0 = Up, 1 = Down

      // Add comprehensive validation before converting to BigInt
      if (!params.pairName || typeof params.pairName !== "string") {
        throw new Error("pairName is required and must be a valid string");
      }

      if (!params.direction || !["LONG", "SHORT"].includes(params.direction)) {
        throw new Error(
          "direction is required and must be either 'LONG' or 'SHORT'"
        );
      }

      if (params.targetPrice === undefined || params.targetPrice === null) {
        throw new Error("targetPrice is required and must be a valid number");
      }

      if (!params.endTime) {
        throw new Error("endTime is required");
      }

      if (
        params.initialLiquidity === undefined ||
        params.initialLiquidity === null
      ) {
        throw new Error(
          "initialLiquidity is required and must be a valid number"
        );
      }

      const hash = await walletClient.writeContract({
        address: PREDICTION_FACTORY_ADDRESS as `0x${string}`,
        abi: PREDICTION_FACTORY_ABI,
        functionName: "createPrediction",
        args: [
          params.pairName,
          directionEnum,
          {
            base: params.targetPrice,
            expo: -8,
          },
          params.endTime,
          params.metadataURI,
          params.initialLiquidity,
        ],
        account: wallet.address as `0x${string}`,
      });

      // Track create prediction transaction
      const predictionTracker = trackTransaction(
        hash,
        TransactionType.CREATE_PREDICTION,
        11155111 // Sepolia chain ID
      );

      const predictionReceipt = await publicClient.waitForTransactionReceipt({
        hash,
      });

      // Notify success
      (await predictionTracker).success();

      const PredictionContractAddressCreate2 =
        predictionReceipt.logs[0].address;

      const yesTokenAddress = await publicClient.readContract({
        address: PredictionContractAddressCreate2 as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "yesToken",
      });

      const noTokenAddress = await publicClient.readContract({
        address: PredictionContractAddressCreate2 as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "noToken",
      });

      const approvePyUsdHash = await walletClient.writeContract({
        address: STAKE_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [
          PredictionContractAddressCreate2 as `0x${string}`,
          approveAmount,
        ],
        account: wallet.address as `0x${string}`,
      });
      const pyUSDApproveTracker = trackTransaction(
        approvePyUsdHash,
        TransactionType.APPROVE,
        11155111 // Sepolia chain ID
      );
      await publicClient.waitForTransactionReceipt({ hash: approvePyUsdHash });

      const initializeMarket = await walletClient.writeContract({
        address: PredictionContractAddressCreate2 as `0x${string}`,
        abi: PREDICTION_ABI,
        functionName: "initializeMarket",
        args: [],
        account: wallet.address as `0x${string}`,
      });
      const marketInitiTracker = trackTransaction(
        initializeMarket,
        TransactionType.MARKET_INITIALIZATION,
        11155111 // Sepolia chain ID
      );
      await publicClient.waitForTransactionReceipt({ hash: initializeMarket });

      setIsLoading(false);
      return [
        String(PredictionContractAddressCreate2),
        String(yesTokenAddress),
        String(noTokenAddress),
      ]; // Return the actual deployed contract address
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
        args: [
          wallet.address as `0x${string}`,
          params.predictionAddress as `0x${string}`,
        ],
      });

      if (allowance < parseEther("1")) {
        const approveHash = await walletClient.writeContract({
          address: STAKE_TOKEN_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [params.predictionAddress as `0x${string}`, approveAmount],
          account: wallet.address as `0x${string}`,
        });
        await publicClient.waitForTransactionReceipt({
          hash: approveHash,
        });
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

      // Track bet transaction
      const betTracker = trackTransaction(
        voteHash,
        TransactionType.PLACE_BET,
        11155111 // Sepolia chain ID
      );

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash: voteHash });

      // Notify success
      (await betTracker).success();

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
    });
    const startTime = await publicClient.readContract({
      address: predictionAddress as `0x${string}`,
      abi: PREDICTION_ABI,
      functionName: "startTime",
    });
    return { endTime, startTime };
  };

  const resolvePrediction = async (params: {
    predictionAddress: string;
    highPriceData: string | null;
    lowPriceData: string | null;
    currentPriceData: string | null;
  }): Promise<number> => {
    const wallet = getWallet();

    setIsLoading(true);
    setError(null);

    try {
      const provider = await wallet.getEthereumProvider();
      const walletClient = getWalletClient(provider);
      const publicClient = getPublicClient(provider);

      // Step 1: Approve stake tokens
      const approveAmount = parseEther("1000");

      const allowance = await publicClient.readContract({
        address: STAKE_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [
          wallet.address as `0x${string}`,
          params.predictionAddress as `0x${string}`,
        ],
      });

      const approvePyUsdHash = await walletClient.writeContract({
        address: STAKE_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [params.predictionAddress as `0x${string}`, approveAmount],
        account: wallet.address as `0x${string}`,
      });
      const pyUSDApproveTracker = trackTransaction(
        approvePyUsdHash,
        TransactionType.RESOLVE_PREDICTION,
        11155111 // Sepolia chain ID
      );
      await publicClient.waitForTransactionReceipt({ hash: approvePyUsdHash });
      (await pyUSDApproveTracker).success();

      // Step 2: Call backend API to resolve on-chain
      const resolveResponse = await fetch("/api/predictions/resolve-onchain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          predictionAddress: params.predictionAddress,
          highPriceData: params.highPriceData,
          lowPriceData: params.lowPriceData,
          currentPriceData: params.currentPriceData,
        }),
      });

      if (!resolveResponse.ok) {
        const errorData = await resolveResponse.json();
        throw new Error(
          errorData.error || errorData.details || "Failed to resolve on-chain"
        );
      }

      const resolveData = await resolveResponse.json();
      const outcome = resolveData.outcome;

      setIsLoading(false);
      return outcome;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to resolve prediction";
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
      const initialTokenSupply =
        (Number(pyUSD) / Number(initialTokenValue)) * 10 ** 6;
      const yesTokenSupply = initialTokenSupply - Number(yesToken) / 10 ** 6;
      const noTokenSupply = initialTokenSupply - Number(noToken) / 10 ** 6;

      return {
        yesTokenSupply: yesTokenSupply,
        noTokenSupply: noTokenSupply,
      };
    } catch (err: any) {
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
  };

  const getWinningToken = async (
    predictionAddress: string
  ): Promise<string> => {
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
  };

  const redeemWinningTokens = async (
    predictionAddress: string,
    winningTokenAddress: string
  ) => {
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
        throw Error("User have no  Winning Token balance");
      }
      const allowance = await publicClient.readContract({
        address: winningTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [
          wallet.address as `0x${string}`,
          predictionAddress as `0x${string}`,
        ],
      });
      if (allowance < parseEther("1")) {
        const approveHash = await walletClient.writeContract({
          address: winningTokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [predictionAddress as `0x${string}`, parseEther("1000")],
          account: wallet.address as `0x${string}`,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
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
    isConnected:
      readyAuth && authenticated && readyWallets && wallets.length > 0,
    isReady: readyAuth && readyWallets,
    wallets,
    primaryWallet,
    getblockNumber,
    getWinningToken,
    redeemWinningTokens,
    getEndsAndStartTimes,
  };
}
