import { Prisma } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

// Helper type to convert Decimal to number and keep Date as Date for client components
type DecimalToNumber<T> = T extends Decimal
  ? number | Decimal
  : T extends Date
  ? Date
  : T extends object
  ? { [K in keyof T]: DecimalToNumber<T[K]> }
  : T;

// User types
export type User = Prisma.UserGetPayload<Record<string, never>>;
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    predictions: true;
    bets: {
      include: {
        prediction: true;
      };
    };
  };
}>;

// Follow types
export interface FollowData {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface FollowUser {
  id: string;
  username: string | null;
  avatar: string | null;
  walletAddress: string;
  _count?: {
    predictions: number;
    bets: number;
  };
}

// Prediction types - server-side only
export type Prediction = Prisma.PredictionGetPayload<Record<string, never>>;
type PredictionWithRelationsServer = Prisma.PredictionGetPayload<{
  include: {
    creator: true;
    bets: {
      include: {
        user: true;
      };
    };
    _count: {
      select: {
        bets: true;
      };
    };
  };
}>;

// Client-safe version that accepts both Decimal and number
export type PredictionWithRelations =
  DecimalToNumber<PredictionWithRelationsServer>;

// Bet types
export type Bet = Prisma.BetGetPayload<Record<string, never>>;
export type BetWithRelations = Prisma.BetGetPayload<{
  include: {
    user: true;
    prediction: {
      include: {
        creator: true;
      };
    };
  };
}>;

// Enums - Import them first
import {
  TradeDirection,
  PredictionStatus,
  BetPosition,
  BetStatus,
} from "@prisma/client";

// Re-export enums
export { TradeDirection, PredictionStatus, BetPosition, BetStatus };

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  offset?: number;
  limit?: number;
}

// Form types
export interface CreatePredictionData {
  title: string;
  description: string;
  tradeImage?: string;
  orderId?: string;
  targetPrice?: number;
  entryPrice?: number;
  symbol: string;
  direction: TradeDirection;
  expiresAt: Date;
}

export interface CreateBetData {
  predictionId: string;
  amount: number;
  position: BetPosition;
}

export interface CreateUserData {
  walletAddress: string;
  username?: string;
  avatar?: string;
}

// Statistics types
export interface PlatformStats {
  totalPredictions: number;
  activePredictions: number;
  totalBets: number;
  totalUsers: number;
  totalVolume: number;
  recentPredictions: PredictionWithRelations[];
  topTraders: Array<
    UserWithRelations & {
      successRate: number;
      totalResolved: number;
    }
  >;
}
