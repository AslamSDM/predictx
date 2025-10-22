"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useUserStore } from "@/lib/store";
import { getHighAndLow } from "@/lib/hyperliquid";
import { useContract } from "@/lib/hooks/useContract";
import type { PythPriceFeed } from "@/lib/types/pyth";
import { extractPriceValue, extractPriceConfidence, extractPublishTime } from "@/lib/types/pyth";
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
import { motion, AnimatePresence } from "framer-motion";
import type { PredictionWithRelations } from "@/lib/types";

export default function ResolvePage() {
  const { authenticated } = useAuth();
  const { user } = useUserStore();
  const [predictions, setPredictions] = useState<PredictionWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [selectedPrediction, setSelectedPrediction] =
    useState<PredictionWithRelations | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const { resolvePrediction,getOutcome, isLoading: isContractLoading } = useContract();

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
      const res = await fetch("/api/predictions?status=expired");
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
      "AAVEUSD":
        "0x2b9ab1e972a281585084148ba1389800799bd4be63b957507db1349314e47445",
      "BITCOINUSD":
        "0xc5e0e0c92116c0c070a242b254270441a6201af680a33e0381561c59db3266c9",
      "BNBUSD":
        "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f",
      "ETHUSD":
        "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    };

    return feedIdMap[normalizedSymbol] || null;
  };

  // Helper function to fetch price data from Hermes API
  const fetchPriceFromHermes = async (feedId: string, timestamp?: number): Promise<PythPriceFeed> => {
    try {
      // Use current timestamp if not provided      
      const hermesUrl = `https://hermes.pyth.network/v2/updates/price/${timestamp}?ids%5B%5D=${feedId}&encoding=hex&parsed=true`;

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

      const data: PythPriceFeed = await response.json();
      console.log("📊 Hermes API response:", data);

      return data;
    } catch (error) {
      console.error("❌ Error fetching price from Hermes:", error);
      throw error;
    }
  };

  const handleResolve = async (
    prediction: PredictionWithRelations,
    outcome: "YES" | "NO"
  ) => {
    if (!user) {
      alert("Please login to resolve predictions");
      return;
    }

    setResolvingId(prediction.id);

    try {
      // Step 1: Get the symbol from the prediction
      const symbol = prediction.symbol;
      console.log("📈 Resolving prediction for symbol:", symbol);

      // Step 2: Get the Pyth price feed ID for this symbol
      const feedId = getPythFeedId(symbol);

      if (!feedId) {
        throw new Error(
          `Unsupported trading pair: ${symbol}. Supported pairs: 1INCH/USD, AAVE/USD, BTC/USD, BNB/USD, ETH/USD`
        );
      }

      console.log("🔗 Using Pyth feed ID:", feedId);

      // Step 3: Fetch price data from Hermes API
      const [high, low] = await getHighAndLow({
        asset: symbol, 
        interval: "1m", 
        startTime: new Date(prediction.createdAt).getTime(), 
        endTime: new Date(prediction.expiresAt).getTime()
      });
      console.log("🔍 High and low prices:", high, low);

      let highPriceData: PythPriceFeed | null;
      let lowPriceData: PythPriceFeed | null;
      let currentPriceData: PythPriceFeed | null;
      try {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        highPriceData = await fetchPriceFromHermes(feedId, high.timestamp);
        lowPriceData = await fetchPriceFromHermes(feedId, low.timestamp);
        currentPriceData = await fetchPriceFromHermes(feedId, currentTimestamp);
        
        // Extract actual price values
        const highPrice = extractPriceValue(highPriceData);
        const lowPrice = extractPriceValue(lowPriceData);
        const currentPrice = extractPriceValue(currentPriceData);
        
        console.log("✅ Successfully fetched price data:");
        console.log("📈 High price:", highPrice);
        console.log("📉 Low price:", lowPrice);
        console.log("💰 Current price:", currentPrice);
      } catch (hermesError) {
        console.error("❌ Failed to fetch price from Hermes:", hermesError);
        // Continue with resolution even if price fetch fails
        // The backend can handle price verification separately
        highPriceData = null;
        lowPriceData = null;
        currentPriceData = null;
      }

      const [resolveP1Hash, resolveP2Hash, resolveP3Hash] = await resolvePrediction({
        predictionAddress: prediction.address,
        highPriceData: highPriceData?.binary.data[0] || null,
        lowPriceData: lowPriceData?.binary.data[0]  || null,
        currentPriceData: currentPriceData?.binary.data[0] || null
      });

      const outcome = await getOutcome(prediction.address);
      if (outcome === null || outcome === undefined) {
        throw new Error("Failed to get outcome");
      }

      // Step 4: Send resolution request to backend with price data
      const res = await fetch(`/api/predictions/${prediction.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome: outcome === 0 ? "YES" : "NO",
          resolvedBy: user.id,
          symbol,
          feedId,
          highPriceData: highPriceData ? JSON.stringify(highPriceData) : null,
          lowPriceData: lowPriceData ? JSON.stringify(lowPriceData) : null,
          currentPriceData: currentPriceData ? JSON.stringify(currentPriceData) : null,
        }),
      });

      if (res.ok) {
        const resolved = await res.json();
        console.log("✅ Prediction resolved:", resolved);

        // Remove from list
        setPredictions((prev) => prev.filter((p) => p.id !== prediction.id));
        setShowResolveModal(false);
        setSelectedPrediction(null);

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
                      onClick={() => {
                        setSelectedPrediction(prediction);
                        setShowResolveModal(true);
                      }}
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

      {/* Resolution Modal */}
      <AnimatePresence>
        {showResolveModal && selectedPrediction && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => {
                setShowResolveModal(false);
                setSelectedPrediction(null);
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-card border-2 border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border bg-gradient-to-br from-primary/10 to-accent/30">
                  <h2 className="text-2xl font-bold mb-2">
                    Resolve Prediction
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Choose the outcome based on whether the target was reached
                  </p>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="font-bold text-lg mb-2">
                      {selectedPrediction.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <span>{selectedPrediction.symbol}</span>
                      <span>•</span>
                      <span>{selectedPrediction.direction}</span>
                      <span>•</span>
                      <span>
                        ${formatAmount(selectedPrediction.entryPrice)} → $
                        {formatAmount(selectedPrediction.targetPrice)}
                      </span>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4">
                      <div className="text-sm mb-2">
                        <span className="text-muted-foreground">
                          Total Pool:
                        </span>
                        <span className="font-bold ml-2">
                          ${formatAmount(selectedPrediction.totalPool)}
                        </span>
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400 font-bold">
                        Your Resolution Fee: $
                        {calculateResolutionFee(selectedPrediction.totalPool)}
                      </div>
                    </div>
                  </div>

                  {/* Resolution Options */}
                  <div className="space-y-3">
                    <button
                      onClick={() => handleResolve(selectedPrediction, "YES")}
                      disabled={resolvingId === selectedPrediction.id}
                      className="w-full p-6 bg-green-500/10 hover:bg-green-500/20 border-2 border-green-500/30 hover:border-green-500 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">
                            YES - Target Reached ✓
                          </div>
                          <div className="text-sm text-muted-foreground">
                            The prediction was correct, target price was hit
                          </div>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
                      </div>
                    </button>

                    <button
                      onClick={() => handleResolve(selectedPrediction, "NO")}
                      disabled={resolvingId === selectedPrediction.id}
                      className="w-full p-6 bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 hover:border-red-500 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="text-lg font-bold text-red-600 dark:text-red-400 mb-1">
                            NO - Target Not Reached ✗
                          </div>
                          <div className="text-sm text-muted-foreground">
                            The prediction failed, target price was not hit
                          </div>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
                      </div>
                    </button>
                  </div>

                  {/* Cancel Button */}
                  <button
                    onClick={() => {
                      setShowResolveModal(false);
                      setSelectedPrediction(null);
                    }}
                    className="w-full mt-4 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
