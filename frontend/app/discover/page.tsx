"use client";

import { useState, useEffect } from "react";
import SiteNav from "@/components/site-nav";
import SwipeCard from "@/components/swipe-card";
import BetModal from "@/components/bet-modal";
import { predictionApi, betApi } from "@/lib/api";
import type { PredictionWithRelations, BetPosition } from "@/lib/types";
import { Loader2 } from "lucide-react";

// Dummy data for testing without database
const DUMMY_PREDICTIONS: PredictionWithRelations[] = [
  {
    id: "1",
    title: "BTC will hit $75,000 by end of week",
    description:
      "Strong bullish momentum with institutional buying. Technical analysis shows breakout pattern above key resistance. Multiple indicators aligning including golden cross on daily chart, increasing volume, and whale accumulation. RSI showing strength without being overbought.",
    symbol: "BTC/USD",
    direction: "LONG",
    entryPrice: 68500,
    targetPrice: 75000,
    tradeImage: "/images.jpg",
    orderId: "BTC-LONG-001",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    createdAt: new Date(),
    address: "",

    updatedAt: new Date(),
    resolvedAt: null,
    totalPool: 2500,
    yesPool: 1500,
    noPool: 1000,
    creatorId: "user1",
    creator: {
      id: "user1",
      walletAddress: "0x1234...5678",
      username: "CryptoKing",
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    bets: [],
    _count: {
      bets: 15,
    },
  },
  {
    id: "2",
    title: "ETH short position - bearish divergence",
    description:
      "RSI showing bearish divergence on 4H chart. Expecting pullback to $2,800 support level soon. Price action showing weakness at current levels with declining volume on upside attempts.",
    symbol: "ETH/USD",
    direction: "SHORT",
    entryPrice: 3200,
    targetPrice: 2800,
    tradeImage: "/images.jpg",
    orderId: "ETH-SHORT-002",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
    totalPool: 1800,
    yesPool: 800,
    address: "",

    noPool: 1000,
    creatorId: "user2",
    creator: {
      id: "user2",
      walletAddress: "0x8765...4321",
      username: "TradeMaster",
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    bets: [],
    _count: {
      bets: 8,
    },
  },
  {
    id: "3",
    title: "SOL breakout above resistance",
    description:
      "Solana showing strong volume and breaking key resistance at $160. Target $180 within 48 hours based on Fibonacci extension levels.",
    symbol: "SOL/USD",
    direction: "LONG",
    entryPrice: 155.2,
    targetPrice: 180.0,
    tradeImage: "/images.jpg",
    orderId: "SOL-LONG-003",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
    totalPool: 3200,
    yesPool: 2000,
    noPool: 1200,
    address: "",

    creatorId: "user3",
    creator: {
      id: "user3",
      walletAddress: "0xabcd...efgh",
      username: "SolanaGuru",
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    bets: [],
    _count: {
      bets: 22,
    },
  },
  {
    id: "4",
    title: "AAPL earnings beat - 5% upside",
    description:
      "Strong iPhone sales data and services growth. Expecting earnings beat and 5% move up post-announcement. Historical data shows positive momentum during earnings season with strong institutional support. Technical setup is bullish with break above 200-day moving average.",
    symbol: "AAPL",
    direction: "LONG",
    entryPrice: 185.5,
    targetPrice: 195.0,
    tradeImage: "/images.jpg",
    orderId: "AAPL-LONG-004",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
    address: "",

    totalPool: 5500,
    yesPool: 3200,
    noPool: 2300,
    creatorId: "user1",
    creator: {
      id: "user1",
      walletAddress: "0x1234...5678",
      username: "CryptoKing",
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    bets: [],
    _count: {
      bets: 35,
    },
  },
  {
    id: "5",
    title: "XRP pump to $0.75 incoming",
    description:
      "News catalyst expected. Strong accumulation pattern visible. Breaking out of long consolidation. On-chain metrics showing whale accumulation and reduced exchange supply. Historical pattern suggests explosive move imminent with volume confirmation building.",
    symbol: "XRP/USD",
    direction: "LONG",
    address: "",

    entryPrice: 0.62,
    targetPrice: 0.75,
    tradeImage: "/images.jpg",
    orderId: "XRP-LONG-005",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
    totalPool: 1200,
    yesPool: 700,
    noPool: 500,
    creatorId: "user2",
    creator: {
      id: "user2",
      walletAddress: "0x8765...4321",
      username: "TradeMaster",
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    bets: [],
    _count: {
      bets: 12,
    },
  },
  {
    id: "6",
    title: "TSLA gap fill play",
    description:
      "Morning gap needs to be filled. High probability trade based on historical gap fill statistics. Price action showing bullish structure with strong support at current levels. Volume profile suggests institutional buying interest with 85% historical gap fill rate on similar patterns.",
    symbol: "TSLA",
    direction: "LONG",
    entryPrice: 242.3,
    address: "",

    targetPrice: 255.0,
    tradeImage: "/images.jpg",
    orderId: "TSLA-LONG-006",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
    totalPool: 4200,
    yesPool: 2400,
    noPool: 1800,
    creatorId: "user3",
    creator: {
      id: "user3",
      walletAddress: "0xabcd...efgh",
      username: "SolanaGuru",
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    bets: [],
    _count: {
      bets: 28,
    },
  },
];

export default function DiscoverPage() {
  const [predictions, setPredictions] =
    useState<PredictionWithRelations[]>(DUMMY_PREDICTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPrediction, setSelectedPrediction] =
    useState<PredictionWithRelations | null>(null);
  const [betPosition, setBetPosition] = useState<BetPosition>("YES");

  // useEffect(() => {
  // loadPredictions();
  // }, []);

  const loadPredictions = async () => {
    try {
      setIsLoading(true);

      // Try to load from API first
      // try {
      //   const response = await predictionApi.getAll({
      //     status: "ACTIVE",
      //     limit: 20,
      //   });

      //   if (response.predictions && response.predictions.length > 0) {
      //     setPredictions(response.predictions);
      //     return;
      //   }
      // } catch (apiError) {
      //   console.log("API not available, using dummy data");
      // }

      // Fallback to dummy data
      setPredictions(DUMMY_PREDICTIONS);
    } catch (error) {
      console.error("Error loading predictions:", error);
      // Use dummy data as final fallback
      setPredictions(DUMMY_PREDICTIONS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipeLeft = (prediction: PredictionWithRelations) => {
    // Swipe left = NO
    setSelectedPrediction(prediction);
    setBetPosition("NO");
    setShowModal(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSwipeRight = (prediction: PredictionWithRelations) => {
    // Swipe right = YES
    setSelectedPrediction(prediction);
    setBetPosition("YES");
    setShowModal(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSwipeUp = (prediction: PredictionWithRelations) => {
    // Swipe up = Skip to next card (no bet)
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSwipeDown = (prediction: PredictionWithRelations) => {
    // Swipe down = Go back to previous card
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handlePlaceBet = async (amount: number) => {
    if (!selectedPrediction) return;

    try {
      // Check if using dummy data
      const isDummyBet = DUMMY_PREDICTIONS.some(
        (p) => p.id === selectedPrediction.id
      );

      if (isDummyBet) {
        // Simulate bet placement for dummy data
        console.log("Demo bet placed:", {
          prediction: selectedPrediction.title,
          amount,
          position: betPosition,
        });

        // Close modal first for better UX
        setShowModal(false);

        // Show success message
        setTimeout(() => {
          alert(
            `✅ Demo: ${betPosition} bet of $${amount} placed!\n\n(This is dummy data. Connect database to place real bets.)`
          );
        }, 300);
        return;
      }

      // Real API call for actual data
      const walletAddress = localStorage.getItem("walletAddress");
      if (!walletAddress) {
        alert("Please connect your wallet first");
        return;
      }

      const user = await fetch(
        `/api/users?walletAddress=${walletAddress}`
      ).then((r) => r.json());

      await betApi.create({
        userId: user.id,
        predictionId: selectedPrediction.id,
        amount,
        position: betPosition,
      });

      // Close modal
      setShowModal(false);

      // Show success message
      setTimeout(() => {
        alert(`Successfully placed ${betPosition} bet of $${amount}!`);
      }, 300);
    } catch (error) {
      console.error("Error placing bet:", error);
      alert("Failed to place bet. Please try again.");
    }
  };

  const currentPrediction = predictions[currentIndex];
  const nextPrediction = predictions[currentIndex + 1];
  const isDummyData =
    predictions.length > 0 &&
    DUMMY_PREDICTIONS.some((p) => p.id === predictions[0].id);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  if (predictions.length === 0) {
    return (
      <main>
        <SiteNav />
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2">No Active Predictions</h2>
            <p className="text-muted-foreground">
              Check back later for new predictions!
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (currentIndex >= predictions.length) {
    return (
      <main>
        <SiteNav />
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">🎉 All caught up!</h2>
            <p className="text-muted-foreground mb-6">
              You've seen all active predictions
            </p>
            <button
              onClick={() => {
                setCurrentIndex(0);
                loadPredictions();
              }}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Start Over
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <SiteNav />

      <section className="mx-auto max-w-2xl px-4 py-4 md:py-6 h-[calc(100vh-4rem)] flex flex-col">
        <div className="mb-4 text-center flex-shrink-0">
          <h1 className="font-serif text-2xl md:text-3xl mb-2">
            Discover Markets
          </h1>
          <p className="text-sm text-foreground/70 hidden md:block">
            ← NO • YES → • ↑ Skip • ↓ Back
          </p>
          <p className="text-sm text-foreground/70 md:hidden">
            Swipe to interact
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            {currentIndex + 1} / {predictions.length}
          </div>
        </div>

        {/* Card Stack Container */}
        <div className="relative w-full flex-1 min-h-0 max-h-[calc(100vh-12rem)] md:max-h-[700px]">
          {/* Next card (behind) */}
          {nextPrediction && (
            <div className="absolute w-full h-full">
              <div className="w-full h-full bg-card border border-border rounded-2xl overflow-hidden shadow-lg scale-95 opacity-50" />
            </div>
          )}

          {/* Current card (front) */}
          {currentPrediction && (
            <SwipeCard
              key={currentPrediction.id}
              prediction={currentPrediction}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onSwipeUp={handleSwipeUp}
              onSwipeDown={handleSwipeDown}
            />
          )}
        </div>

        {/* Action Buttons (desktop only - alternative to swipe) */}
        <div className="!hidden md:!flex md:flex-col space-y-4 mt-6 flex-shrink-0">
          {/* Up/Down Navigation */}
          <div className="flex justify-center">
            <button
              onClick={() =>
                currentPrediction && handleSwipeUp(currentPrediction)
              }
              disabled={currentIndex >= predictions.length - 1}
              className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Skip"
            >
              <span className="text-xl">↑</span>
            </button>
          </div>

          {/* Left/Right Betting */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() =>
                currentPrediction && handleSwipeLeft(currentPrediction)
              }
              className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center hover:bg-red-500/30 transition-colors"
              aria-label="Bet NO"
            >
              <span className="text-2xl">✕</span>
            </button>
            <button
              onClick={() =>
                currentPrediction && handleSwipeRight(currentPrediction)
              }
              className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center hover:bg-green-500/30 transition-colors"
              aria-label="Bet YES"
            >
              <span className="text-2xl">✓</span>
            </button>
          </div>

          {/* Down Navigation */}
          <div className="flex justify-center">
            <button
              onClick={() =>
                currentPrediction && handleSwipeDown(currentPrediction)
              }
              disabled={currentIndex === 0}
              className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Go Back"
            >
              <span className="text-xl">↓</span>
            </button>
          </div>
        </div>
      </section>

      {/* Bet Modal */}
      {selectedPrediction && (
        <BetModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          prediction={selectedPrediction}
          position={betPosition}
          onConfirm={handlePlaceBet}
        />
      )}
    </main>
  );
}
