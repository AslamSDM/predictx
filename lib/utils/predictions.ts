import { Decimal } from "@prisma/client/runtime/library";

/**
 * Calculate odds for a prediction based on current pools
 */
export function calculateOdds(
  position: "YES" | "NO",
  yesPool: Decimal,
  noPool: Decimal,
  betAmount: Decimal
): { odds: Decimal; potentialWin: Decimal } {
  const totalPool = yesPool.add(noPool);
  const newTotalPool = totalPool.add(betAmount);

  let odds: Decimal;

  if (position === "YES") {
    // Odds for YES = (total pool after bet) / (NO pool + small amount to prevent division by zero)
    const denominator = noPool.gt(0) ? noPool : new Decimal(1);
    odds = newTotalPool.div(denominator);
  } else {
    // Odds for NO = (total pool after bet) / (YES pool + small amount to prevent division by zero)
    const denominator = yesPool.gt(0) ? yesPool : new Decimal(1);
    odds = newTotalPool.div(denominator);
  }

  const potentialWin = betAmount.mul(odds);

  return { odds, potentialWin };
}

/**
 * Format currency values
 */
export function formatCurrency(
  amount: Decimal | number,
  currency = "USD"
): string {
  const numAmount = typeof amount === "number" ? amount : amount.toNumber();

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(numAmount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Calculate time remaining until expiration
 */
export function getTimeRemaining(expiresAt: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = new Date();
  const timeLeft = expiresAt.getTime() - now.getTime();

  if (timeLeft <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
  };
}

/**
 * Format time remaining as string
 */
export function formatTimeRemaining(expiresAt: Date): string {
  const { days, hours, minutes, isExpired } = getTimeRemaining(expiresAt);

  if (isExpired) {
    return "Expired";
  }

  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  return `${minutes}m remaining`;
}

/**
 * Validate wallet address format (basic validation)
 */
export function isValidWalletAddress(address: string): boolean {
  // Basic validation for common wallet formats
  // Ethereum: 42 characters starting with 0x
  // Bitcoin: 26-35 characters
  // This is a simplified validation - in production, use proper crypto libraries

  if (!address || typeof address !== "string") {
    return false;
  }

  // Ethereum address validation
  if (address.startsWith("0x") && address.length === 42) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Bitcoin address validation (simplified)
  if (address.length >= 26 && address.length <= 35) {
    return (
      /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) ||
      /^bc1[a-z0-9]{39,59}$/.test(address)
    );
  }

  return false;
}

/**
 * Shorten wallet address for display
 */
export function shortenWalletAddress(address: string, chars = 4): string {
  if (!address) return "";

  if (address.length <= chars * 2 + 2) {
    return address;
  }

  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Generate prediction share text
 */
export function generateShareText(prediction: {
  title: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  targetPrice?: Decimal | null;
}): string {
  const directionText =
    prediction.direction === "LONG" ? "📈 Long" : "📉 Short";
  const targetText = prediction.targetPrice
    ? ` Target: $${prediction.targetPrice.toString()}`
    : "";

  return `${directionText} ${prediction.symbol}${targetText} - ${prediction.title}`;
}
