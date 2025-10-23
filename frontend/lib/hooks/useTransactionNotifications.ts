/**
 * Transaction Notifications Hook
 *
 * Provides real-time transaction notifications with Blockscout integration
 */

"use client";

import { useCallback, useState } from "react";
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

export function useTransactionNotifications() {
  const [pendingTransactions, setPendingTransactions] = useState<
    TransactionNotification[]
  >([]);

  /**
   * Notify about a transaction with Blockscout link
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

      // Show toast with action button to view on Blockscout
      toast.loading(`${typeLabel}: ${message}`, {
        id: txHash,
        duration: Infinity,
        description: "Transaction submitted to blockchain",
        action: {
          label: "View on Blockscout",
          onClick: () => window.open(explorerUrl, "_blank"),
        },
      });
    },
    []
  );

  /**
   * Update transaction status to success
   */
  const notifySuccess = useCallback(
    (
      txHash: string,
      type: TransactionType,
      chainId: number = DEFAULT_CHAIN_CONFIG.chainId
    ) => {
      const explorerUrl = BLOCKSCOUT_ENDPOINTS.transaction(chainId, txHash);
      const typeLabel = TX_TYPE_LABELS[type];

      setPendingTransactions((prev) =>
        prev.map((tx) =>
          tx.txHash === txHash ? { ...tx, status: "success" as const } : tx
        )
      );

      toast.success(`${typeLabel} Successful`, {
        id: txHash,
        duration: 5000,
        description: TX_STATUS_MESSAGES.success,
        action: {
          label: "View",
          onClick: () => window.open(explorerUrl, "_blank"),
        },
      });

      // Remove from pending after delay
      setTimeout(() => {
        setPendingTransactions((prev) =>
          prev.filter((tx) => tx.txHash !== txHash)
        );
      }, 5000);
    },
    []
  );

  /**
   * Update transaction status to failed
   */
  const notifyError = useCallback(
    (
      txHash: string,
      type: TransactionType,
      errorMessage: string,
      chainId: number = DEFAULT_CHAIN_CONFIG.chainId
    ) => {
      const explorerUrl = BLOCKSCOUT_ENDPOINTS.transaction(chainId, txHash);
      const typeLabel = TX_TYPE_LABELS[type];

      setPendingTransactions((prev) =>
        prev.map((tx) =>
          tx.txHash === txHash
            ? { ...tx, status: "failed" as const, message: errorMessage }
            : tx
        )
      );

      toast.error(`${typeLabel} Failed`, {
        id: txHash,
        duration: 8000,
        description: errorMessage || TX_STATUS_MESSAGES.failed,
        action: {
          label: "View",
          onClick: () => window.open(explorerUrl, "_blank"),
        },
      });

      // Remove from pending after delay
      setTimeout(() => {
        setPendingTransactions((prev) =>
          prev.filter((tx) => tx.txHash !== txHash)
        );
      }, 8000);
    },
    []
  );

  /**
   * Track a transaction through its lifecycle
   */
  const trackTransaction = useCallback(
    async (
      txHash: string,
      type: TransactionType,
      chainId: number = DEFAULT_CHAIN_CONFIG.chainId,
      onSuccess?: () => void,
      onError?: (error: Error) => void
    ) => {
      try {
        // Show initial notification
        notifyTransaction(txHash, type, chainId);

        // In a real implementation, you would poll the blockchain
        // For now, we assume the transaction will be successful
        // after the caller confirms it via waitForTransactionReceipt

        return {
          success: () => {
            notifySuccess(txHash, type, chainId);
            onSuccess?.();
          },
          error: (error: Error) => {
            notifyError(txHash, type, error.message, chainId);
            onError?.(error);
          },
        };
      } catch (error: any) {
        notifyError(txHash, type, error.message, chainId);
        onError?.(error);
        throw error;
      }
    },
    [notifyTransaction, notifySuccess, notifyError]
  );

  /**
   * Clear a transaction notification
   */
  const clearTransaction = useCallback((txHash: string) => {
    setPendingTransactions((prev) => prev.filter((tx) => tx.txHash !== txHash));
    toast.dismiss(txHash);
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    pendingTransactions.forEach((tx) => toast.dismiss(tx.txHash));
    setPendingTransactions([]);
  }, [pendingTransactions]);

  return {
    notifyTransaction,
    notifySuccess,
    notifyError,
    trackTransaction,
    pendingTransactions,
    clearTransaction,
    clearAll,
  };
}
