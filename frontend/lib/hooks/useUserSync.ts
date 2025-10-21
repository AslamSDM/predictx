"use client";

import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { useUserStore } from "../store";
import { usePrivy } from "@privy-io/react-auth";

/**
 * Hook to automatically sync user with database when logged in
 * This will create a user in the database if they don't exist
 * or fetch their existing data if they do
 */
export function useUserSync() {
  const { authenticated, address, ready } = useAuth();
  const { user: privyUser } = usePrivy();
  const { user, fetchOrCreateUser, clearUser } = useUserStore();

  useEffect(() => {
    // Only proceed if Privy is ready
    if (!ready || !authenticated) {
      clearUser();
      return;
    }

    // For OAuth users without embedded wallet yet, use Privy user ID as temporary identifier
    const identifier = address || privyUser?.id;

    if (!identifier) {
      console.warn("No wallet address or user ID available yet");
      return;
    }

    console.log("🔄 Syncing user with database:", {
      authenticated,
      address,
      privyUserId: privyUser?.id,
      identifier,
    });

    // Sync with database (uses cache if available)
    fetchOrCreateUser(identifier)
      .then((user) => {
        console.log("✅ User synced successfully:", user.username);
      })
      .catch((error) => {
        console.error("❌ Failed to sync user:", error);
      });
  }, [authenticated, address, privyUser?.id, ready, fetchOrCreateUser, clearUser]);

  return {
    user,
    isReady: ready && (authenticated ? !!user : true),
  };
}
