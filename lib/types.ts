import { Prisma } from "@prisma/client";

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

// Prediction types
export type Prediction = Prisma.PredictionGetPayload<Record<string, never>>;
export type PredictionWithRelations = Prisma.PredictionGetPayload<{
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
