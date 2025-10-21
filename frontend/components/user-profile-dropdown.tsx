"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useUserStore } from "@/lib/store";
import { useState, useRef, useEffect } from "react";
import {
  User,
  LogOut,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function UserProfileDropdown() {
  const { authenticated, logout } = useAuth();
  const { user, isLoading } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format wallet address
  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!user?.walletAddress) return;
    await navigator.clipboard.writeText(user.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!authenticated) return null;

  // Show loading state while user is being fetched
  if (isLoading || !user) {
    return (
      <div className="flex items-center gap-2 px-2 py-2 rounded-full">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary animate-pulse">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
        <span className="hidden md:block text-sm font-medium text-muted-foreground">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-2 rounded-full hover:bg-accent transition-colors"
        aria-label="User menu"
      >
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={user.username || "User avatar"}
            width={36}
            height={36}
            className="rounded-full border-2 border-primary"
            unoptimized
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
            <User className="w-5 h-5 text-primary" />
          </div>
        )}
        <span className="hidden md:block text-sm font-medium">
          {user.username}
        </span>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* User Info Header */}
            <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/30 border-b border-border">
              <div className="flex items-center gap-3 mb-3">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.username || "User avatar"}
                    width={48}
                    height={48}
                    className="rounded-full border-2 border-primary"
                    unoptimized
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-foreground truncate">
                    {user.username}
                  </p>
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {formatAddress(user.walletAddress)}
                    {copied ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-3 flex items-center gap-3 text-sm text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-primary" />
                <div className="flex-1">
                  <div className="font-medium">View Profile</div>
                  <div className="text-xs text-muted-foreground">
                    Predictions & Bets
                  </div>
                </div>
              </Link>

              <div className="px-4 py-2 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Predictions
                  </span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Bets Placed
                  </span>
                  <span className="font-semibold">0</span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="p-2 border-t border-border bg-accent/20">
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
