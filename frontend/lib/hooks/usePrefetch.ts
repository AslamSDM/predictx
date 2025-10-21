"use client";

import { useEffect } from "react";

/**
 * Prefetch hook for optimistic data loading
 * Loads data in the background without blocking UI
 */
export function usePrefetch() {
  useEffect(() => {
    // Prefetch critical routes
    const prefetchRoutes = ['/discover', '/create', '/profile'];
    
    prefetchRoutes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });

    // Prefetch API endpoints with low priority
    const prefetchAPI = async () => {
      try {
        // Use fetch with low priority
        const controller = new AbortController();
        
        // Prefetch predictions API
        fetch('/api/predictions?status=ACTIVE&limit=20&offset=0', {
          signal: controller.signal,
          // @ts-ignore - priority is not in types but supported
          priority: 'low',
        }).catch(() => {
          // Silently fail - this is just prefetching
        });

        // Prefetch stats
        fetch('/api/stats', {
          signal: controller.signal,
          // @ts-ignore
          priority: 'low',
        }).catch(() => {});

      } catch (error) {
        // Silently fail
      }
    };

    // Delay prefetch to not interfere with initial page load
    const timer = setTimeout(prefetchAPI, 1000);

    return () => clearTimeout(timer);
  }, []);
}

/**
 * Image prefetch hook
 * Preloads images for smoother UX
 */
export function usePrefetchImages(urls: string[]) {
  useEffect(() => {
    if (!urls || urls.length === 0) return;

    // Limit to first 5 images to avoid overwhelming the browser
    const imagesToPrefetch = urls.slice(0, 5);

    imagesToPrefetch.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }, [urls]);
}

/**
 * Idle callback hook
 * Runs expensive operations during browser idle time
 */
export function useIdleCallback(callback: () => void, dependencies: any[] = []) {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(callback, {
        timeout: 2000, // Force execution after 2s if not idle
      });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      const timer = setTimeout(callback, 1000);
      return () => clearTimeout(timer);
    }
  }, dependencies);
}
