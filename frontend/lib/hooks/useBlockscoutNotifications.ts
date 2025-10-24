/**
 * Blockscout Notifications Hook
 *
 * This hook provides a wrapper around the Blockscout SDK to show
 * real-time transaction notifications with detailed status updates.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_CHAIN_CONFIG,
  BLOCKSCOUT_ENDPOINTS,
  TX_STATUS_MESSAGES,
  TransactionType,
  TX_TYPE_LABELS,
} from "../blockscout/config";

interface TransactionNotification {
  txHash: string;
  chainId: number;
  type: TransactionType;
  status: "pending" | "success" | "failed" | "reverted";
  timestamp: number;
  message?: string;
}

interface UseBlockscoutNotificationsReturn {
  /**
   * Show a transaction notification toast
   */
  notifyTransaction: (
    txHash: string,
    type: TransactionType,
    chainId?: number,
    customMessage?: string
  ) => void;

  /**
   * Track transaction status and show updates
   */
  trackTransaction: (
    txHash: string,
    type: TransactionType,
    chainId?: number
  ) => Promise<void>;

  /**
   * Get all pending transactions
   */
  pendingTransactions: TransactionNotification[];

  /**
   * Clear a transaction from pending
   */
  clearTransaction: (txHash: string) => void;
}

export function useBlockscoutNotifications(): UseBlockscoutNotificationsReturn {
  const [pendingTransactions, setPendingTransactions] = useState<
    TransactionNotification[]
  >([]);

  /**
   * Show a transaction notification toast with Blockscout link
   */
  const notifyTransaction = useCallback(
    (
      txHash: string,
      type: TransactionType,
      chainId: number = DEFAULT_CHAIN_CONFIG.chainId,
      customMessage?: string
    ) => {
      const explorerUrl = BLOCKSCOUT_ENDPOINTS.transaction(chainId, txHash);
      const typeLabel = TX_TYPE_LABELS[type];
      const message = customMessage || TX_STATUS_MESSAGES.pending;

      // Add to pending transactions
      const notification: TransactionNotification = {
        txHash,
        chainId,
        type,
        status: "pending",
        timestamp: Date.now(),
        message,
      };

      setPendingTransactions((prev) => [...prev, notification]);

      // Show toast with clickable link
      toast.loading(`${typeLabel}: ${message}`, {
        id: txHash,
        duration: Infinity, // Keep until manually dismissed or updated
        description: `View on Blockscout: ${explorerUrl}`,
        action: {
          label: "View",
          onClick: () => window.open(explorerUrl, "_blank"),
        },
      });
    },
    []
  );

  /**
   * Track transaction and update status
   */
  const trackTransaction = useCallback(
    async (
      txHash: string,
      type: TransactionType,
      chainId: number = DEFAULT_CHAIN_CONFIG.chainId
    ) => {
      const explorerUrl = BLOCKSCOUT_ENDPOINTS.transaction(chainId, txHash);
      const typeLabel = TX_TYPE_LABELS[type];

      try {
        // In a real implementation, you would poll the Blockscout API
        // or use Web3 to check transaction status
        // For now, we'll simulate with a timeout

        // Show pending notification
        notifyTransaction(txHash, type, chainId);

        // Simulate waiting for confirmation (in production, use actual polling)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update to success
        setPendingTransactions((prev) =>
          prev.map((tx) =>
            tx.txHash === txHash ? { ...tx, status: "success" as const } : tx
          )
        );

        toast.success(`✅ ${typeLabel} Successful`, {
          id: txHash,
          duration: 5000,
          description: TX_STATUS_MESSAGES.success,
          action: {
            label: "View",
            onClick: () => window.open(explorerUrl, "_blank"),
          },
        });

        // Remove from pending after a delay
        setTimeout(() => {
          setPendingTransactions((prev) =>
            prev.filter((tx) => tx.txHash !== txHash)
          );
        }, 5000);
      } catch (error: any) {
        // Update to failed
        setPendingTransactions((prev) =>
          prev.map((tx) =>
            tx.txHash === txHash
              ? { ...tx, status: "failed" as const, message: error.message }
              : tx
          )
        );

        toast.error(`❌ ${typeLabel} Failed`, {
          id: txHash,
          duration: 8000,
          description: error.message || TX_STATUS_MESSAGES.failed,
          action: {
            label: "View",
            onClick: () => window.open(explorerUrl, "_blank"),
          },
        });

        // Remove from pending after a delay
        setTimeout(() => {
          setPendingTransactions((prev) =>
            prev.filter((tx) => tx.txHash !== txHash)
          );
        }, 8000);
      }
    },
    [notifyTransaction]
  );

  /**
   * Clear a transaction from pending
   */
  const clearTransaction = useCallback((txHash: string) => {
    setPendingTransactions((prev) => prev.filter((tx) => tx.txHash !== txHash));
    toast.dismiss(txHash);
  }, []);

  return {
    notifyTransaction,
    trackTransaction,
    pendingTransactions,
    clearTransaction,
  };
}

/**
 * Helper hook to get transaction receipt from Blockscout
 */
export function useTransactionReceipt(txHash: string | null, chainId?: number) {
  const [receipt, setReceipt] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!txHash) return;

    const fetchReceipt = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const config = chainId ? DEFAULT_CHAIN_CONFIG : DEFAULT_CHAIN_CONFIG;

        const response = await fetch(
          `${config.apiUrl}?module=transaction&action=gettxreceiptstatus&txhash=${txHash}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch transaction receipt");
        }

        const data = await response.json();
        setReceipt(data.result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceipt();
  }, [txHash, chainId]);

  return { receipt, isLoading, error };
}
