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
  predictions: [],
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
      set({ offset: 0, predictions: [], hasMore: true });
    }

    try {
      const response = await predictionApi.getAll({
        status: "ACTIVE",
        limit: state.limit,
        offset: reset ? 0 : state.offset,
      });

      console.log("📥 Fetched predictions:", {
        received: response.predictions.length,
        hasMore: response.hasMore,
        total: response.total,
      });

      set({
        predictions: reset
          ? response.predictions
          : [...state.predictions, ...response.predictions],
        hasMore: response.hasMore,
        offset: reset ? state.limit : state.offset,
        isLoading: false,
      });
    } catch (error: any) {
      console.error("❌ Error fetching predictions:", error);
      set({ error: error.message, isLoading: false });
    }
  },

  loadMore: async () => {
    const state = get();
    if (!state.hasMore || state.isLoadingMore || state.isLoading) {
      console.log("⏸️ Skip loadMore:", {
        hasMore: state.hasMore,
        isLoadingMore: state.isLoadingMore,
        isLoading: state.isLoading,
      });
      return;
    }

    set({ isLoadingMore: true, error: null });
    const newOffset = state.offset + state.limit;

    console.log("📥 Loading more predictions...", {
      currentCount: state.predictions.length,
      offset: newOffset,
      limit: state.limit,
    });

    try {
      const response = await predictionApi.getAll({
        status: "ACTIVE",
        limit: state.limit,
        offset: newOffset,
      });

      console.log("✅ Loaded more predictions:", {
        received: response.predictions.length,
        hasMore: response.hasMore,
        newTotal: state.predictions.length + response.predictions.length,
      });

      // Filter out duplicates by ID
      const existingIds = new Set(state.predictions.map((p) => p.id));
      const newPredictions = response.predictions.filter(
        (p) => !existingIds.has(p.id)
      );

      set({
        predictions: [...state.predictions, ...newPredictions],
        hasMore: response.hasMore,
        offset: newOffset,
        isLoadingMore: false,
      });
    } catch (error: any) {
      console.error("❌ Error loading more predictions:", error);
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
