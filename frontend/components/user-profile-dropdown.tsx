"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { User, LogOut, Wallet, Settings, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserProfileDropdown() {
  const { authenticated, address, email, logout } = useAuth();
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
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!authenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/50 border border-border hover:bg-accent transition-colors"
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="hidden md:flex flex-col items-start">
          {email && (
            <span className="text-xs text-muted-foreground">{email}</span>
          )}
          {address && (
            <span className="text-xs font-mono text-foreground">
              {formatAddress(address)}
            </span>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50"
          >
            {/* User Info */}
            <div className="p-4 border-b border-border bg-accent/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  {email && (
                    <p className="text-sm font-medium text-foreground truncate">
                      {email}
                    </p>
                  )}
                  {address && (
                    <button
                      onClick={copyAddress}
                      className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {formatAddress(address)}
                      {copied ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  // Add wallet management logic here
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 flex items-center gap-3 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <Wallet className="w-4 h-4 text-primary" />
                Manage Wallets
              </button>

              <button
                onClick={() => {
                  // Add settings logic here
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 flex items-center gap-3 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <Settings className="w-4 h-4 text-primary" />
                Settings
              </button>
            </div>

            {/* Logout */}
            <div className="p-2 border-t border-border">
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 flex items-center gap-3 text-sm text-red-500 hover:bg-red-500/10 rounded transition-colors"
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
