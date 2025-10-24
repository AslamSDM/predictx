"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { User, LogOut, Loader2, Mail } from "lucide-react";
import LoginModal from "./login-modal";

export default function WalletConnect() {
  const { ready, authenticated, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Get the primary wallet address (from Privy embedded wallet)
  const primaryWallet = wallets[0];
  const address = primaryWallet?.address;

  // Format wallet address for display
  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <div className="flex items-center gap-2">
        <button
          disabled
          className="px-3 py-2 text-xs md:text-sm rounded-md bg-primary/50 text-primary-foreground cursor-not-allowed flex items-center gap-2"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="hidden sm:inline">Loading...</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {authenticated && user ? (
          <>
            {/* User Info - Desktop */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md bg-accent/50 border border-border">
              <User className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                {user.email?.address && (
                  <span className="text-xs text-muted-foreground">
                    {user.email.address}
                  </span>
                )}

                {address && (
                  <span className="text-xs font-mono text-foreground">
                    {formatAddress(address)}
                  </span>
                )}
              </div>
            </div>

            {/* User Info - Mobile */}
            <div className="md:hidden flex items-center gap-2 px-3 py-2 rounded-md bg-accent/50 border border-border">
              <User className="w-4 h-4 text-primary" />
              {user.email?.address ? (
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {user.email.address.split("@")[0]}
                </span>
              ) : address ? (
                <span className="text-xs font-mono text-foreground">
                  {formatAddress(address)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">User</span>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="px-3 py-2 text-xs md:text-sm rounded-md bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30 transition-colors flex items-center gap-2"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <></>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
