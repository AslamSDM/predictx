"use client";

import { useState, useEffect } from "react";
import SiteNav from "@/components/site-nav";
import SwipeCard from "@/components/swipe-card";
import BetModal from "@/components/bet-modal";
import LoginModal from "@/components/login-modal";
import ChatModal from "@/components/chat-modal";
import { usePredictionsStore, useUserStore } from "@/lib/store";
import {
  type PredictionWithRelations,
  type BetPosition,
  TradeDirection,
} from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useContract } from "@/lib/hooks/useContract";

export default function DiscoverPage() {
  const { authenticated } = useAuth();
  const { user } = useUserStore();
  const { predictions, isLoading, hasMore, error, fetchPredictions, loadMore } =
    usePredictionsStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedPrediction, setSelectedPrediction] =
    useState<PredictionWithRelations | null>(null);
  const [chatPrediction, setChatPrediction] =
    useState<PredictionWithRelations | null>(null);
  const [betPosition, setBetPosition] = useState<BetPosition>("YES");

  // Load predictions on mount (if not already loaded by BackgroundLoader)
  useEffect(() => {
    if (predictions.length === 0 && !isLoading) {
      console.log("🔄 Loading predictions on discover page...");
      fetchPredictions(true);
    }
  }, []);

  // Preload more predictions when getting close to the end
  useEffect(() => {
    const shouldLoadMore =
      currentIndex >= predictions.length - 5 && hasMore && !isLoading;
    if (shouldLoadMore) {
      console.log("🔄 Loading more predictions...", {
        currentIndex,
        totalPredictions: predictions.length,
        hasMore,
      });
      loadMore();
    }
  }, [currentIndex, predictions.length, hasMore, isLoading, loadMore]);

  const handleSwipeLeft = (prediction: PredictionWithRelations) => {
    // Swipe left = NO
    if (!authenticated || !user) {
      setShowLoginModal(true);
      return;
    }

    setSelectedPrediction(prediction);
    setBetPosition("NO");
    setShowModal(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSwipeRight = (prediction: PredictionWithRelations) => {
    // Swipe right = YES
    if (!authenticated || !user) {
      setShowLoginModal(true);
      return;
    }

    setSelectedPrediction(prediction);
    setBetPosition("YES");
    setShowModal(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSwipeUp = (prediction: PredictionWithRelations) => {
    // Swipe up = Skip to next card (no bet)
    if (currentIndex < predictions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (hasMore) {
      // At the end but more available - trigger load
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSwipeDown = (prediction: PredictionWithRelations) => {
    // Swipe down = Go back to previous card
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const { placeBet } = useContract();

  const handlePlaceBet = async (amount: number) => {
    if (!selectedPrediction || !user) return;

    try {
      await placeBet({
        predictionAddress: selectedPrediction.address,
        amount: amount,
        position: betPosition, // Using the betPosition state that was set in handleSwipeLeft/Right
      });
      setShowModal(false);
    } catch (error) {
      console.error("Error placing bet:", error);
    }
  };

  const handleChatClick = (prediction: PredictionWithRelations) => {
    setChatPrediction(prediction);
    setShowChatModal(true);
  };

  const currentPrediction = predictions[currentIndex];
  const nextPrediction = predictions[currentIndex + 1];

  if (isLoading && predictions.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading predictions...</p>
        </div>
      </main>
    );
  }

  // Show error state
  if (error && predictions.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="text-center py-20">
            <div className="mb-6 text-6xl">⚠️</div>
            <h2 className="text-2xl font-bold mb-4">Failed to Load</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => fetchPredictions(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </section>
      </main>
    );
  }

  // Show empty state if no predictions found
  if (!isLoading && predictions.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="text-center py-20">
            <div className="mb-6 text-6xl">🔍</div>
            <h2 className="text-2xl font-bold mb-4">No Predictions Yet</h2>
            <p className="text-muted-foreground mb-6">
              Be the first to create a prediction!
            </p>
            <a
              href="/create"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Create Prediction
            </a>
          </div>
        </section>
      </main>
    );
  }

  // Show end state when all predictions are viewed
  if (
    currentIndex >= predictions.length &&
    !hasMore &&
    predictions.length > 0
  ) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="text-center py-20">
            <div className="mb-6 text-6xl">🎉</div>
            <h2 className="text-2xl font-bold mb-4">All caught up!</h2>
            <p className="text-muted-foreground mb-6">
              You've seen all {predictions.length} active predictions
            </p>
            <button
              onClick={() => {
                setCurrentIndex(0);
                fetchPredictions(true);
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

  // Show loading if we're waiting for more predictions
  if (currentIndex >= predictions.length && hasMore) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading more predictions...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <section className="mx-auto max-w-2xl px-4 py-4 md:py-6 h-[calc(100vh-4rem)] flex flex-col">
        <div className="mb-4 text-center flex-shrink-0">
          <h1 className="font-serif text-2xl md:text-3xl mb-2">
            Discover Markets
          </h1>

          <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-sm text-foreground/70">
            <p className="md:hidden">Swipe to interact</p>
            <p className="hidden md:block">Use buttons below or arrow keys</p>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="text-xs text-muted-foreground">
              {currentIndex + 1} / {predictions.length}
              {hasMore && "+"}
            </div>
            {isLoading && predictions.length > 0 && (
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2 w-full max-w-xs mx-auto h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${Math.min(
                  ((currentIndex + 1) / Math.max(predictions.length, 1)) * 100,
                  100
                )}%`,
              }}
            />
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
              onChatClick={handleChatClick}
            />
          )}

          {/* Loading indicator for infinite scroll */}
          {isLoading && predictions.length > 0 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-lg">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-muted-foreground">
                  Loading more predictions...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons (desktop only - alternative to swipe) */}
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

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Chat Modal */}
      {chatPrediction && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          prediction={chatPrediction}
        />
      )}
    </main>
  );
}
