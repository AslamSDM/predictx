import { create } from "zustand";
import type {
  User,
  PredictionWithRelations,
  BetWithRelations,
} from "@/lib/types";
import { predictionApi, userApi, betApi } from "@/lib/api";

// Deterministic Username Generator based on wallet address
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

// Simple hash function for consistent randomness
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function generateDeterministicUsername(seed: string): string {
  const hash = simpleHash(seed);
  const adjective = adjectives[hash % adjectives.length];
  const noun = nouns[(hash >> 8) % nouns.length];
  const number = (hash >> 16) % 999;
  return `${adjective}${noun}${number}`;
}

// Deterministic Avatar Generator using wallet address as seed
function generateDeterministicAvatar(seed: string): string {
  const styles = [
    "avataaars",
    "bottts",
    "pixel-art",
    "lorelei",
    "fun-emoji",
    "thumbs",
  ];
  const hash = simpleHash(seed);
  const style = styles[hash % styles.length];
  // Use wallet address as seed for consistent avatar
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
      // Try to get existing user from cache first
      const cachedUser = get().user;
      if (cachedUser && cachedUser.walletAddress === walletAddress) {
        console.log("✅ Using cached user:", cachedUser.username);
        set({ isLoading: false });
        return cachedUser;
      }

      // Try to get existing user from API
      let user: User;
      try {
        user = await userApi.getByWallet(walletAddress);
        console.log("✅ Found existing user:", user.username);
      } catch (error: any) {
        // If user doesn't exist (404), create new user with deterministic username and avatar
        if (error.status === 404) {
          // Generate deterministic username and avatar based on wallet address
          const deterministicUsername =
            generateDeterministicUsername(walletAddress);
          const deterministicAvatar =
            generateDeterministicAvatar(walletAddress);

          user = await userApi.create({
            walletAddress,
            username: deterministicUsername,
            avatar: deterministicAvatar,
          });

          console.log("✨ Created new user:", {
            username: deterministicUsername,
            avatar: deterministicAvatar,
            wallet: walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4),
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
  prefetchNext: () => Promise<void>;
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

  prefetchNext: async () => {
    const state = get();
    if (!state.hasMore || state.isLoadingMore || state.isLoading) {
      return;
    }

    const nextOffset = state.offset + state.limit;

    console.log("🔮 Prefetching next batch...", {
      nextOffset,
      limit: state.limit,
    });

    try {
      const response = await predictionApi.getAll({
        status: "ACTIVE",
        limit: state.limit,
        offset: nextOffset,
      });

      console.log("✅ Prefetched predictions:", {
        received: response.predictions.length,
      });

      // Store prefetched data (will be used when loadMore is called)
      // We don't update the state here, just cache it
    } catch (error) {
      console.error("❌ Prefetch failed (non-critical):", error);
    }
  },

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
