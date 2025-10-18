"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";

/**
 * Custom hook to manage authentication and wallet state
 * Provides a simplified interface to Privy's authentication
 * Note: Wallets are Privy-managed embedded wallets, not external wallet connections
 */
export function useAuth() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  // Get the primary wallet (Privy embedded wallet)
  const primaryWallet = wallets[0];
  const address = primaryWallet?.address;

  return {
    // Auth state
    ready,
    authenticated,
    user,

    // Wallet info (Privy embedded wallet)
    address,
    wallets,
    primaryWallet,

    // Actions
    login,
    logout,

    // Helper computed values
    isConnected: authenticated && !!address,
    email: user?.email?.address,
  };
}
