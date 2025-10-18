import { create } from "zustand";
import type {
  User,
  PredictionWithRelations,
  BetWithRelations,
} from "@/lib/types";
import { predictionApi, userApi, betApi } from "@/lib/api";

// Random Username Generator
const adjectives = [
  "Swift",
  "Brave",
  "Clever",
  "Bold",
  "Mighty",
  "Silent",
  "Quick",
  "Lucky",
  "Smart",
  "Wise",
  "Sharp",
  "Wild",
  "Cool",
  "Epic",
  "Mega",
  "Super",
  "Crypto",
  "Moon",
  "Diamond",
  "Golden",
  "Silver",
  "Turbo",
  "Alpha",
  "Beta",
];

const nouns = [
  "Tiger",
  "Dragon",
  "Eagle",
  "Wolf",
  "Lion",
  "Bear",
  "Fox",
  "Hawk",
  "Trader",
  "Bull",
  "Whale",
  "Shark",
  "Ninja",
  "Samurai",
  "Knight",
  "Wizard",
  "Hunter",
  "Raider",
  "Master",
  "Legend",
  "Champion",
  "Hero",
  "Guru",
  "Sage",
];

function generateRandomUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999);
  return `${adjective}${noun}${number}`;
}

// Random Avatar Generator using DiceBear API
function generateRandomAvatar(): string {
  const styles = [
    "avataaars",
    "bottts",
    "pixel-art",
    "lorelei",
    "fun-emoji",
    "thumbs",
  ];
  const style = styles[Math.floor(Math.random() * styles.length)];
  const seed = Math.random().toString(36).substring(7);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

// Dummy data for testing without database
const DUMMY_PREDICTIONS: PredictionWithRelations[] = [
  {
    id: "1",
    title: "BTC will hit $75,000 by end of week",
    description:
      "Strong bullish momentum with institutional buying. Technical analysis shows breakout pattern above key resistance. Multiple indicators aligning including golden cross on daily chart, increasing volume, and whale accumulation. RSI showing strength without being overbought.",
    symbol: "BTC/USD",
    direction: "LONG",
    entryPrice: 68500,
    targetPrice: 75000,
    tradeImage: "/images.jpg",
    orderId: "BTC-LONG-001",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    createdAt: new Date(),
    address: "",

    updatedAt: new Date(),
    resolvedAt: null,
    totalPool: 2500,
    yesPool: 1500,
    noPool: 1000,
    creatorId: "user1",
    creator: {
      id: "user1",
      walletAddress: "0x1234...5678",
      username: "CryptoKing",
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    bets: [],
    _count: {
      bets: 15,
    },
  },
  {
    id: "2",
    title: "ETH short position - bearish divergence",
    description:
      "RSI showing bearish divergence on 4H chart. Expecting pullback to $2,800 support level soon. Price action showing weakness at current levels with declining volume on upside attempts.",
    symbol: "ETH/USD",
    direction: "SHORT",
    entryPrice: 3200,
    targetPrice: 2800,
    tradeImage: "/images.jpg",
    orderId: "ETH-SHORT-002",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
    totalPool: 1800,
    yesPool: 800,
    address: "",

    noPool: 1000,
    creatorId: "user2",
    creator: {
      id: "user2",
      walletAddress: "0x8765...4321",
      username: "TradeMaster",
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    bets: [],
    _count: {
      bets: 8,
    },
  },
  {
    id: "3",
    title: "SOL breakout above resistance",
    description:
      "Solana showing strong volume and breaking key resistance at $160. Target $180 within 48 hours based on Fibonacci extension levels.",
    symbol: "SOL/USD",
    direction: "LONG",
    entryPrice: 155.2,
    targetPrice: 180.0,
    tradeImage: "/images.jpg",
    orderId: "SOL-LONG-003",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
    totalPool: 3200,
    yesPool: 2000,
    noPool: 1200,
    address: "",

    creatorId: "user3",
    creator: {
      id: "user3",
      walletAddress: "0xabcd...efgh",
      username: "SolanaGuru",
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    bets: [],
    _count: {
      bets: 22,
    },
  },
  {
    id: "4",
    title: "AAPL earnings beat - 5% upside",
    description:
      "Strong iPhone sales data and services growth. Expecting earnings beat and 5% move up post-announcement. Historical data shows positive momentum during earnings season with strong institutional support. Technical setup is bullish with break above 200-day moving average.",
    symbol: "AAPL",
    direction: "LONG",
    entryPrice: 185.5,
    targetPrice: 195.0,
    tradeImage: "/images.jpg",
    orderId: "AAPL-LONG-004",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
    address: "",

    totalPool: 5500,
    yesPool: 3200,
    noPool: 2300,
    creatorId: "user1",
    creator: {
      id: "user1",
      walletAddress: "0x1234...5678",
      username: "CryptoKing",
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    bets: [],
    _count: {
      bets: 35,
    },
  },
  {
    id: "5",
    title: "XRP pump to $0.75 incoming",
    description:
      "News catalyst expected. Strong accumulation pattern visible. Breaking out of long consolidation. On-chain metrics showing whale accumulation and reduced exchange supply. Historical pattern suggests explosive move imminent with volume confirmation building.",
    symbol: "XRP/USD",
    direction: "LONG",
    address: "",

    entryPrice: 0.62,
    targetPrice: 0.75,
    tradeImage: "/images.jpg",
    orderId: "XRP-LONG-005",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
    totalPool: 1200,
    yesPool: 700,
    noPool: 500,
    creatorId: "user2",
    creator: {
      id: "user2",
      walletAddress: "0x8765...4321",
      username: "TradeMaster",
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    bets: [],
    _count: {
      bets: 12,
    },
  },
  {
    id: "6",
    title: "TSLA gap fill play",
    description:
      "Morning gap needs to be filled. High probability trade based on historical gap fill statistics. Price action showing bullish structure with strong support at current levels. Volume profile suggests institutional buying interest with 85% historical gap fill rate on similar patterns.",
    symbol: "TSLA",
    direction: "LONG",
    entryPrice: 242.3,
    address: "",

    targetPrice: 255.0,
    tradeImage: "/images.jpg",
    orderId: "TSLA-LONG-006",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
    totalPool: 4200,
    yesPool: 2400,
    noPool: 1800,
    creatorId: "user3",
    creator: {
      id: "user3",
      walletAddress: "0xabcd...efgh",
      username: "SolanaGuru",
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    bets: [],
    _count: {
      bets: 28,
    },
  },
];

// User Store
interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  fetchOrCreateUser: (walletAddress: string) => Promise<User>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, error: null }),

  fetchOrCreateUser: async (walletAddress: string) => {
    set({ isLoading: true, error: null });
    try {
      // Try to get existing user
      let user: User;
      try {
        user = await userApi.getByWallet(walletAddress);
      } catch (error: any) {
        // If user doesn't exist (404), create new user with random username and avatar
        if (error.status === 404) {
          const randomUsername = generateRandomUsername();
          const randomAvatar = generateRandomAvatar();

          user = await userApi.create({
            walletAddress,
            username: randomUsername,
            avatar: randomAvatar,
          });

          console.log("✨ Created new user:", {
            username: randomUsername,
            avatar: randomAvatar,
          });
        } else {
          throw error;
        }
      }
      set({ user, isLoading: false });
      return user;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearUser: () => set({ user: null, error: null }),
}));

// Predictions Store with Infinite Scroll
interface PredictionsState {
  predictions: PredictionWithRelations[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  offset: number;
  limit: number;
  fetchPredictions: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  addPrediction: (prediction: PredictionWithRelations) => void;
  reset: () => void;
}

export const usePredictionsStore = create<PredictionsState>((set, get) => ({
  predictions: DUMMY_PREDICTIONS,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  error: null,
  offset: 0,
  limit: 20,

  fetchPredictions: async (reset = false) => {
    const state = get();
    if (state.isLoading || state.isLoadingMore) return;

    set({ isLoading: reset, error: null });
    if (reset) {
      set({ offset: 0, predictions: [] });
    }

    try {
      const response = await predictionApi.getAll({
        status: "ACTIVE",
        limit: state.limit,
        offset: reset ? 0 : state.offset,
      });

      set({
        predictions: reset
          ? DUMMY_PREDICTIONS
          : [...state.predictions, ...response.predictions],
        hasMore: response.hasMore,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadMore: async () => {
    const state = get();
    if (!state.hasMore || state.isLoadingMore || state.isLoading) return;

    set({ isLoadingMore: true, error: null });
    const newOffset = state.offset + state.limit;

    try {
      const response = await predictionApi.getAll({
        status: "ACTIVE",
        limit: state.limit,
        offset: newOffset,
      });

      set({
        predictions: [...state.predictions, ...response.predictions],
        hasMore: response.hasMore,
        offset: newOffset,
        isLoadingMore: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoadingMore: false });
    }
  },

  addPrediction: (prediction) =>
    set((state) => ({
      predictions: [prediction, ...state.predictions],
    })),

  reset: () =>
    set({
      predictions: [],
      offset: 0,
      hasMore: true,
      error: null,
      isLoading: false,
      isLoadingMore: false,
    }),
}));

// Bets Store
interface BetsState {
  bets: BetWithRelations[];
  isLoading: boolean;
  error: string | null;
  fetchUserBets: (userId: string) => Promise<void>;
  addBet: (bet: BetWithRelations) => void;
  clearBets: () => void;
}

export const useBetsStore = create<BetsState>((set, get) => ({
  bets: [],
  isLoading: false,
  error: null,

  fetchUserBets: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await betApi.getAll({ userId, limit: 100 });
      set({ bets: response.bets, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addBet: (bet) =>
    set((state) => ({
      bets: [bet, ...state.bets],
    })),

  clearBets: () => set({ bets: [], error: null }),
}));
