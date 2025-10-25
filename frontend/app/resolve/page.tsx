"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useUserStore } from "@/lib/store";
import { getHighAndLow } from "@/lib/hyperliquid";
import { useContract } from "@/lib/hooks/useContract";
import type { PythPriceFeed } from "@/lib/types/pyth";
import {
  extractPriceValue,
  extractPriceConfidence,
  extractPublishTime,
} from "@/lib/types/pyth";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Target,
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { PredictionWithRelations } from "@/lib/types";

export default function ResolvePage() {
  const { authenticated } = useAuth();
  const { user } = useUserStore();
  const [predictions, setPredictions] = useState<PredictionWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const {
    resolvePrediction,
    getOutcome,
    getEndsAndStartTimes,
    isLoading: isContractLoading,
  } = useContract();

  // Fetch expired predictions that need resolution
  useEffect(() => {
    fetchExpiredPredictions();

    // Refresh every 30 seconds
    const interval = setInterval(fetchExpiredPredictions, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchExpiredPredictions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/predictions?status=expired", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions || data);
      }
    } catch (error) {
      console.error("Error fetching expired predictions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get Pyth price feed ID from symbol
  const getPythFeedId = (symbol: string): string | null => {
    // Convert symbol to uppercase and remove any slashes (e.g., "BTC/USD" -> "BTCUSD")
    const normalizedSymbol = symbol.toUpperCase().replace("/", "");

    // Map symbols to their Pyth price feed IDs (from PredictionFactory.sol)
    const feedIdMap: Record<string, string> = {
      "1INCHUSD":
        "0x63f341689d98a12ef60a5cff1d7f85c70a9e17bf1575f0e7c0b2512d48b1c8b3",
      AAVEUSD:
        "0x2b9ab1e972a281585084148ba1389800799bd4be63b957507db1349314e47445",
      BITCOINUSD:
        "0xc5e0e0c92116c0c070a242b254270441a6201af680a33e0381561c59db3266c9",
      BNBUSD:
        "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f",
      ETHUSD:
        "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    };

    return feedIdMap[normalizedSymbol] || null;
  };

  // Helper function to fetch price data from Hermes API
  const fetchPriceFromHermes = async (
    feedId: string,
    timestamp?: number,
    current: boolean = false
  ): Promise<PythPriceFeed> => {
    try {
      // Use current timestamp if not provided
      const hermesUrl = current
        ? `https://hermes.pyth.network/v2/updates/price/latest?ids%5B%5D=${feedId}&encoding=hex&parsed=true`
        : `https://hermes.pyth.network/v2/updates/price/${timestamp}?ids%5B%5D=${feedId}&encoding=hex&parsed=true`;

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

      const data: PythPriceFeed = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  };

  const handleResolve = async (prediction: PredictionWithRelations) => {
    if (!user) {
      alert("Please login to resolve predictions");
      return;
    }

    // Check if prediction is actually expired
    const now = Math.floor(Date.now() / 1000);
    const expiryTime = Math.floor(
      new Date(prediction.expiresAt).getTime() / 1000
    );

    if (now < expiryTime) {
      alert(
        "This prediction has not expired yet. Please wait until after the expiry time."
      );
      return;
    }

    setResolvingId(prediction.id);

    try {
      // Step 1: Get the symbol from the prediction
      const symbol = prediction.symbol;

      // Step 2: Get the Pyth price feed ID for this symbol
      const feedId = getPythFeedId(symbol);

      if (!feedId) {
        throw new Error(
          `Unsupported trading pair: ${symbol}. Supported pairs: 1INCH/USD, AAVE/USD, BTC/USD, BNB/USD, ETH/USD`
        );
      }

      // Step 3: Fetch price data from Hermes API
      const [high, low] = await getHighAndLow({
        asset: symbol.replace("USD", ""),
        interval: "1m",
        startTime: new Date(
          new Date(prediction.createdAt).getTime() + 70000
        ).getTime(),
        endTime: new Date(
          new Date(prediction.expiresAt).getTime() - 70000
        ).getTime(),
      });

      let highPriceData: PythPriceFeed | null;
      let lowPriceData: PythPriceFeed | null;
      let currentPriceData: PythPriceFeed | null;
      try {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        highPriceData = await fetchPriceFromHermes(
          feedId,
          Math.floor((high.timestamp || 0) / 1000)
        );
        lowPriceData = await fetchPriceFromHermes(
          feedId,
          Math.floor((low.timestamp || 0) / 1000)
        );
        currentPriceData = await fetchPriceFromHermes(feedId, currentTimestamp);

        // Extract actual price values
        const highPrice = extractPriceValue(highPriceData);
        const lowPrice = extractPriceValue(lowPriceData);
        const currentPrice = extractPriceValue(currentPriceData);
      } catch (hermesError) {
        // Continue with resolution even if price fetch fails
        // The backend can handle price verification separately
        highPriceData = null;
        lowPriceData = null;
        currentPriceData = null;
      }

      // Ensure we have valid price data before calling the contract
      if (!currentPriceData?.binary.data[0]) {
        throw new Error("Failed to fetch current price data from Pyth");
      }
      if (!highPriceData?.binary.data[0]) {
        throw new Error("Failed to fetch high price data from Pyth");
      }
      if (!lowPriceData?.binary.data[0]) {
        throw new Error("Failed to fetch low price data from Pyth");
      }

      // Step 4: Call resolvePrediction which approves tokens and calls backend to resolve on-chain
      const outcome = await resolvePrediction({
        predictionAddress: prediction.address,
        highPriceData: highPriceData?.binary.data[0]
          ? `0x${highPriceData.binary.data[0]}`
          : null,
        lowPriceData: lowPriceData?.binary.data[0]
          ? `0x${lowPriceData.binary.data[0]}`
          : null,
        currentPriceData: currentPriceData?.binary.data[0]
          ? `0x${currentPriceData.binary.data[0]}`
          : null,
      });

      // Step 5: Update database with resolved outcome
      const res = await fetch(`/api/predictions/${prediction.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolvedBy: user.id,
          outcome: outcome == 1 ? "NO" : "YES", // outcome: 0 = YES, 1 = NO
        }),
      });

      if (res.ok) {
        await res.json();

        // Remove from list
        setPredictions((prev) => prev.filter((p) => p.id !== prediction.id));

        // Show success message
        alert(`Successfully resolved! You earned a resolution fee! 🎉`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to resolve prediction");
      }
    } catch (error: any) {
      console.error("Error resolving prediction:", error);
      alert(
        `Failed to resolve prediction: ${error.message || "Please try again."}`
      );
    } finally {
      setResolvingId(null);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number | { toString: () => string } | null) => {
    if (!amount) return "0";
    const num =
      typeof amount === "number" ? amount : parseFloat(amount.toString());
    return num.toLocaleString();
  };

  const getTimeExpired = (expiresAt: Date | string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = now.getTime() - expiry.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const calculateResolutionFee = (
    totalPool: number | { toString: () => string }
  ) => {
    const pool =
      typeof totalPool === "number"
        ? totalPool
        : parseFloat(totalPool.toString());
    // 2% resolution fee
    return (pool * 0.02).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Clock className="w-10 h-10 text-primary" />
            Resolve Predictions
          </h1>
          <p className="text-muted-foreground text-lg">
            Help resolve expired predictions and earn a 2% fee from the total
            pool
          </p>
          {!authenticated && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Please login to resolve predictions and earn fees
              </p>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Pending Resolution
                </p>
                <p className="text-2xl font-bold text-primary">
                  {predictions.length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Pool Value
                </p>
                <p className="text-2xl font-bold">
                  $
                  {formatAmount(
                    predictions.reduce(
                      (sum, p) =>
                        sum +
                        (typeof p.totalPool === "number"
                          ? p.totalPool
                          : parseFloat(p.totalPool.toString())),
                      0
                    )
                  )}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Potential Fees</p>
                <p className="text-2xl font-bold text-green-500">
                  $
                  {formatAmount(
                    predictions.reduce((sum, p) => {
                      const pool =
                        typeof p.totalPool === "number"
                          ? p.totalPool
                          : parseFloat(p.totalPool.toString());
                      return sum + pool * 0.02;
                    }, 0)
                  )}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Predictions List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              Loading expired predictions...
            </p>
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">
              No predictions need resolution at the moment.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back later for new opportunities to earn fees
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <motion.div
                key={prediction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-6 hover:border-primary transition-colors"
              >
                <div className="flex gap-6">
                  {/* Trade Image */}
                  {prediction.tradeImage && (
                    <div className="flex-shrink-0">
                      <Image
                        src={prediction.tradeImage}
                        alt={prediction.title}
                        width={200}
                        height={150}
                        className="rounded-lg object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {prediction.direction === "LONG" ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          )}
                          <span className="text-sm font-semibold text-muted-foreground">
                            {prediction.symbol}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              prediction.direction === "LONG"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-red-500/20 text-red-500"
                            }`}
                          >
                            {prediction.direction}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expired {getTimeExpired(prediction.expiresAt)}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">
                          {prediction.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {prediction.description}
                        </p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-background/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Entry
                        </div>
                        <div className="text-sm font-bold">
                          ${formatAmount(prediction.entryPrice)}
                        </div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Target
                        </div>
                        <div className="text-sm font-bold text-primary">
                          ${formatAmount(prediction.targetPrice)}
                        </div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Total Pool
                        </div>
                        <div className="text-sm font-bold">
                          ${formatAmount(prediction.totalPool)}
                        </div>
                      </div>
                      <div className="bg-green-500/10 rounded-lg p-3">
                        <div className="text-xs text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Your Fee (2%)
                        </div>
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">
                          ${calculateResolutionFee(prediction.totalPool)}
                        </div>
                      </div>
                    </div>

                    {/* Pool Distribution */}
                    <div className="bg-background/50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-muted-foreground">
                          Pool Distribution
                        </span>
                        <span className="font-medium">
                          {prediction._count.bets} bets placed
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded px-3 py-2 text-center">
                          <div className="text-xs font-medium">YES</div>
                          <div className="text-sm font-bold">
                            ${formatAmount(prediction.yesPool)}
                          </div>
                        </div>
                        <div className="flex-1 bg-red-500/20 text-red-600 dark:text-red-400 rounded px-3 py-2 text-center">
                          <div className="text-xs font-medium">NO</div>
                          <div className="text-sm font-bold">
                            ${formatAmount(prediction.noPool)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expiry Info */}
                    <div className="text-xs text-muted-foreground mb-4">
                      Expired on: {formatDate(prediction.expiresAt)}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleResolve(prediction)}
                      disabled={!authenticated || resolvingId === prediction.id}
                      className="w-full px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {resolvingId === prediction.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Resolving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Resolve & Earn $
                          {calculateResolutionFee(prediction.totalPool)}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
