/**
 * Blockscout SDK Configuration
 *
 * This file configures the Blockscout API endpoints and chain settings
 * for transaction notifications and blockchain data fetching.
 */

/**
 * Chain configuration interface
 */
export interface ChainConfig {
  chainId: number;
  chainName: string;
  apiUrl: string;
  explorerUrl: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Sepolia Testnet Configuration
 * Official Blockscout instance for Ethereum Sepolia
 */
export const sepoliaConfig: ChainConfig = {
  chainId: 11155111,
  chainName: "Sepolia Testnet",
  apiUrl: "https://eth-sepolia.blockscout.com/api",
  explorerUrl: "https://eth-sepolia.blockscout.com",
  rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
  nativeCurrency: {
    name: "Sepolia ETH",
    symbol: "ETH",
    decimals: 18,
  },
};

/**
 * Chain configurations by chain ID
 */
export const chainConfigs: Record<number, ChainConfig> = {
  11155111: sepoliaConfig,
};

/**
 * Get chain configuration by chain ID
 */
export function getChainConfig(chainId: number): ChainConfig | undefined {
  return chainConfigs[chainId];
}

/**
 * Default chain configuration (Sepolia)
 */
export const DEFAULT_CHAIN_CONFIG = sepoliaConfig;

/**
 * Blockscout API endpoints
 */
export const BLOCKSCOUT_ENDPOINTS = {
  transaction: (chainId: number, txHash: string) =>
    `${getChainConfig(chainId)?.explorerUrl}/tx/${txHash}`,

  address: (chainId: number, address: string) =>
    `${getChainConfig(chainId)?.explorerUrl}/address/${address}`,

  token: (chainId: number, tokenAddress: string) =>
    `${getChainConfig(chainId)?.explorerUrl}/token/${tokenAddress}`,

  contract: (chainId: number, contractAddress: string) =>
    `${
      getChainConfig(chainId)?.explorerUrl
    }/address/${contractAddress}?tab=contract`,
};

/**
 * Transaction status messages
 */
export const TX_STATUS_MESSAGES = {
  pending: "Transaction submitted and pending confirmation...",
  success: "Transaction confirmed successfully!",
  failed: "Transaction failed. Please try again.",
  reverted: "Transaction reverted. Check the error message.",
};

/**
 * Transaction types for notifications
 */
export enum TransactionType {
  CREATE_PREDICTION = "create_prediction",
  PLACE_BET = "place_bet",
  RESOLVE_PREDICTION = "resolve_prediction",
  APPROVE = "approve",
  INITIALIZE_MARKET = "initialize_market",
  CLAIM_WINNINGS = "claim_winnings",
  MARKET_INITIALIZATION = "market_initialization",
}

/**
 * Transaction labels for display
 */
export const TX_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.CREATE_PREDICTION]: "Create Prediction",
  [TransactionType.PLACE_BET]: "Place Bet",
  [TransactionType.RESOLVE_PREDICTION]: "Resolve Prediction",
  [TransactionType.APPROVE]: "Token Approval",
  [TransactionType.INITIALIZE_MARKET]: "Initialize Market",
  [TransactionType.CLAIM_WINNINGS]: "Claim Winnings",
  [TransactionType.MARKET_INITIALIZATION]: "Market Initialization",
};
