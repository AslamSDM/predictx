"use client";

import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { useUserStore } from "../store";

/**
 * Hook to automatically sync user with database when logged in
 * This will create a user in the database if they don't exist
 * or fetch their existing data if they do
 */
export function useUserSync() {
  const { authenticated, address, ready } = useAuth();
  const { user, fetchOrCreateUser, clearUser } = useUserStore();

  useEffect(() => {
    // Only proceed if Privy is ready
    if (!ready) return;

    // If authenticated and has address, sync with database
    if (authenticated && address) {
      fetchOrCreateUser(address).catch((error) => {
        console.error("Failed to sync user:", error);
      });
    } else {
      // Clear user from store if not authenticated
      clearUser();
    }
  }, [authenticated, address, ready]);

  return {
    user,
    isReady: ready && (authenticated ? !!user : true),
  };
}
