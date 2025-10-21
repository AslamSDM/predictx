"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import type { PredictionWithRelations, BetPosition } from "@/lib/types";
import { useUserStore, useBetsStore } from "@/lib/store";
import { betApi } from "@/lib/api";
import { useContract } from "@/lib/hooks/useContract";

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  prediction: PredictionWithRelations;
  position: BetPosition;
  onConfirm: (amount: number) => void;
}

export default function BetModal({
  isOpen,
  onClose,
  prediction,
  position,
  onConfirm,
}: BetModalProps) {
  const [amount, setAmount] = useState("10");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUserStore();
  const { addBet } = useBetsStore();
  const { placeBet, isLoading: isContractLoading } = useContract();

  const isYes = position === "YES";
  const bgColor = isYes ? "bg-green-500/10" : "bg-red-500/10";
  const borderColor = isYes ? "border-green-500" : "border-red-500";
  const textColor = isYes ? "text-green-500" : "text-red-500";

  // Helper to convert Decimal or number to number
  const toNumber = (value: number | { toNumber: () => number }) => {
    return typeof value === "number" ? value : Number(value);
  };

  // Calculate potential winnings (simplified)
  const calculatePotentialWin = () => {
    const betAmount = parseFloat(amount) || 0;
    const poolValue = toNumber(isYes ? prediction.noPool : prediction.yesPool);
    const oppositePoolValue = toNumber(
      isYes ? prediction.yesPool : prediction.noPool
    );

    if (poolValue === 0) return betAmount * 2;

    const odds = (oppositePoolValue + betAmount) / (poolValue + betAmount);
    return betAmount * odds;
  };

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (!user) {
      setError("Please login first");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const betAmount = parseFloat(amount);

      // Step 1: Place bet on blockchain (if contract address exists)
      // TODO: Uncomment when contracts are deployed
      // if (prediction.address && prediction.address !== '0x0000000000000000000000000000000000000000') {
      //   try {
      //     await placeBet({
      //       predictionAddress: prediction.address,
      //       amount: betAmount,
      //       position,
      //     });
      //   } catch (contractError) {
      //     console.error("Contract error:", contractError);
      //     throw new Error("Failed to place bet on blockchain");
      //   }
      // }

      // Step 2: Create bet in database
      const bet = await betApi.create({
        userId: user.id,
        predictionId: prediction.id,
        amount: betAmount,
        position,
      });

      // Step 3: Add bet to store
      addBet(bet);

      // Step 4: Call parent callback and close modal
      await onConfirm(betAmount);

      // Reset and close
      setAmount("10");
      setError(null);

      // Show success message
      setTimeout(() => {
        alert(
          `✅ Successfully placed ${position} bet of $${betAmount.toFixed(2)}!`
        );
      }, 100);
    } catch (error: any) {
      console.error("Error placing bet:", error);
      setError(error.message || "Failed to place bet. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset amount when closing
    setAmount("10");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ x: isYes ? "100%" : "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isYes ? "100%" : "-100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed ${
              isYes ? "right-0" : "left-0"
            } top-0 bottom-0 w-full sm:w-96 ${bgColor} backdrop-blur-lg ${
              isYes ? "border-l" : "border-r"
            } ${borderColor} z-50 flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-2">
                {isYes ? (
                  <TrendingUp className={`w-6 h-6 ${textColor}`} />
                ) : (
                  <TrendingDown className={`w-6 h-6 ${textColor}`} />
                )}
                <h2 className={`text-2xl font-bold ${textColor}`}>
                  Bet {position}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-background/50 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              {/* Prediction Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{prediction.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{prediction.symbol}</span>
                  <span>•</span>
                  <span
                    className={
                      prediction.direction === "LONG"
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {prediction.direction}
                  </span>
                </div>
              </div>

              {/* Current Pool Stats */}
              <div className="bg-background/50 rounded-lg p-4 space-y-2">
                <div className="text-sm text-muted-foreground">
                  Current Pool
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-500">
                    YES: ${toNumber(prediction.yesPool).toFixed(0)}
                  </span>
                  <span className="text-red-500">
                    NO: ${toNumber(prediction.noPool).toFixed(0)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Total: ${toNumber(prediction.totalPool).toFixed(0)}
                </div>
              </div>

              {/* Bet Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Bet Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                    $
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 text-lg bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder="Enter amount"
                    autoFocus
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex gap-2">
                  {[10, 25, 50, 100].map((value) => (
                    <button
                      key={value}
                      onClick={() => setAmount(value.toString())}
                      className="flex-1 py-2 text-sm bg-background border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      ${value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Potential Winnings */}
              <div className="bg-background/50 rounded-lg p-4 space-y-2">
                <div className="text-sm text-muted-foreground">
                  Potential Winnings
                </div>
                <div className="text-2xl font-bold text-primary">
                  ${calculatePotentialWin().toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  If your prediction is correct
                </div>
              </div>

              {/* Warning */}
              <div className="text-xs text-muted-foreground bg-background/30 rounded-lg p-3">
                ⚠️ Betting involves risk. Only bet what you can afford to lose.
              </div>

              {/* Blockchain Hook Note */}
              <div className="text-xs text-blue-500/80 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                💡 <strong>Blockchain Hook:</strong> Smart contract integration
                is ready but commented out. Enable by deploying contracts and
                uncommenting the contract call in the code.
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border space-y-3">
              <button
                onClick={handleConfirm}
                disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                className={`w-full py-4 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 ${
                  isYes
                    ? "bg-green-500 hover:bg-green-600 disabled:bg-green-500"
                    : "bg-red-500 hover:bg-red-600 disabled:bg-red-500"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Placing Bet...
                  </span>
                ) : (
                  `Confirm ${position} Bet - $${parseFloat(
                    amount || "0"
                  ).toFixed(2)}`
                )}
              </button>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg font-medium bg-background/50 hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
