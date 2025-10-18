"use client";

import { useState, useEffect } from "react";
import SiteNav from "@/components/site-nav";
import SwipeCard from "@/components/swipe-card";
import BetModal from "@/components/bet-modal";
import LoginModal from "@/components/login-modal";
import { usePredictionsStore, useUserStore } from "@/lib/store";
import type { PredictionWithRelations, BetPosition } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

export default function DiscoverPage() {
  const { authenticated } = useAuth();
  const { user } = useUserStore();
  const { predictions, isLoading, hasMore, fetchPredictions, loadMore } =
    usePredictionsStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedPrediction, setSelectedPrediction] =
    useState<PredictionWithRelations | null>(null);
  const [betPosition, setBetPosition] = useState<BetPosition>("YES");

  // Load predictions on mount
  useEffect(() => {
    fetchPredictions(true);
  }, []);

  // Preload more predictions when getting close to the end
  useEffect(() => {
    const shouldLoadMore =
      currentIndex >= predictions.length - 3 && hasMore && !isLoading;
    if (shouldLoadMore) {
      loadMore();
    }
  }, [currentIndex, predictions.length, hasMore, isLoading]);

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
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSwipeDown = (prediction: PredictionWithRelations) => {
    // Swipe down = Go back to previous card
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handlePlaceBet = async (amount: number) => {
    if (!selectedPrediction || !user) return;

    try {
      // The BetModal will handle the actual bet placement
      // This is just a callback after successful placement
      setShowModal(false);
    } catch (error) {
      console.error("Error in bet callback:", error);
    }
  };

  const currentPrediction = predictions[currentIndex];
  const nextPrediction = predictions[currentIndex + 1];

  if (isLoading && predictions.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading predictions...</p>
        </div>
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
            <p className="text-muted-foreground mb-4">
              Be the first to create a prediction market!
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

  if (currentIndex >= predictions.length && !hasMore) {
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
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading more predictions...</p>
        </div>
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
            {hasMore && " (loading more...)"}
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
              disabled={currentIndex >= predictions.length - 1 && !hasMore}
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

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </main>
  );
}
