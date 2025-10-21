"use client";

import { useEffect } from "react";
import { usePredictionsStore } from "@/lib/store";
import { usePrefetch, usePrefetchImages, useIdleCallback } from "@/lib/hooks/usePrefetch";

/**
 * BackgroundLoader - Preloads data in the background for smoother UX
 * 
 * This component:
 * 1. Preloads predictions on app mount
 * 2. Prefetches next batch when user is browsing
 * 3. Prefetches images for smoother card transitions
 * 4. Runs silently in the background
 */
export default function BackgroundLoader() {
  const { predictions, hasMore, fetchPredictions, prefetchNext } = usePredictionsStore();

  // Prefetch critical routes and API endpoints
  usePrefetch();

  // Initial load on mount
  useEffect(() => {
    console.log("🚀 Background loader initialized");
    
    // Load initial predictions if not already loaded
    if (predictions.length === 0) {
      console.log("📦 Preloading initial predictions...");
      fetchPredictions(true);
    }
  }, []);

  // Prefetch images from loaded predictions
  const imageUrls = predictions
    .filter(p => p.tradeImage)
    .map(p => p.tradeImage as string)
    .slice(0, 10); // Limit to first 10

  usePrefetchImages(imageUrls);

  // Prefetch next batch when user has viewed some predictions
  useIdleCallback(() => {
    if (predictions.length > 0 && hasMore) {
      console.log("🔮 Triggering prefetch during idle time...");
      prefetchNext();
    }
  }, [predictions.length, hasMore]);

  // Periodic background refresh (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (predictions.length > 0 && hasMore && document.visibilityState === 'visible') {
        console.log("� Background refresh triggered");
        prefetchNext();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [predictions.length, hasMore, prefetchNext]);

  // This component doesn't render anything
  return null;
}
