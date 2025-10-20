import {
  CreatePredictionData,
  CreateBetData,
  CreateUserData,
  PredictionWithRelations,
  BetWithRelations,
  UserWithRelations,
  PlatformStats,
} from "@/lib/types";

const API_BASE = "/api/";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.error || "An error occurred");
  }

  return response.json();
}

// User API functions
export const userApi = {
  async create(userData: CreateUserData): Promise<UserWithRelations> {
    return apiRequest("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  async getByWallet(walletAddress: string): Promise<UserWithRelations> {
    return apiRequest(
      `/users?walletAddress=${encodeURIComponent(walletAddress)}`
    );
  },
};

// Prediction API functions
export const predictionApi = {
  async create(
    predictionData: CreatePredictionData
  ): Promise<PredictionWithRelations> {
    return apiRequest("/predictions", {
      method: "POST",
      body: JSON.stringify(predictionData),
    });
  },

  async getAll(
    params: {
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    predictions: PredictionWithRelations[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.set("status", params.status);
    if (params.limit) queryParams.set("limit", params.limit.toString());
    if (params.offset) queryParams.set("offset", params.offset.toString());

    const query = queryParams.toString();
    return apiRequest(`/predictions${query ? `?${query}` : ""}`);
  },

  async getById(id: string): Promise<PredictionWithRelations> {
    return apiRequest(`/predictions/${id}`);
  },

  async update(
    id: string,
    data: {
      status?: string;
      resolvedAt?: Date;
    }
  ): Promise<PredictionWithRelations> {
    return apiRequest(`/predictions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

// Bet API functions
export const betApi = {
  async create(
    betData: CreateBetData & { userId: string }
  ): Promise<BetWithRelations> {
    return apiRequest("/bets", {
      method: "POST",
      body: JSON.stringify(betData),
    });
  },

  async getAll(
    params: {
      userId?: string;
      predictionId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    bets: BetWithRelations[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    if (params.userId) queryParams.set("userId", params.userId);
    if (params.predictionId)
      queryParams.set("predictionId", params.predictionId);
    if (params.limit) queryParams.set("limit", params.limit.toString());
    if (params.offset) queryParams.set("offset", params.offset.toString());

    const query = queryParams.toString();
    return apiRequest(`/bets${query ? `?${query}` : ""}`);
  },
};

// Upload API functions
export const uploadApi = {
  async uploadImage(file: File): Promise<{
    success: boolean;
    url: string;
    key: string;
    originalName: string;
    size: number;
    type: string;
    fileType: "image" | "video";
  }> {
    const formData = new FormData();
    formData.append("file", file);

    // Determine file type
    const isVideo = file.type.startsWith("video/");
    formData.append("fileType", isVideo ? "video" : "image");

    const response = await fetch(`${API_BASE}upload`, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary for FormData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(response.status, error.error || "Upload failed");
    }

    return response.json();
  },

  async uploadVideo(file: File): Promise<{
    success: boolean;
    url: string;
    key: string;
    originalName: string;
    size: number;
    type: string;
    fileType: "video";
  }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", "video");

    const response = await fetch(`${API_BASE}upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(response.status, error.error || "Upload failed");
    }

    return response.json();
  },
};

// Stats API functions
export const statsApi = {
  async getPlatformStats(): Promise<PlatformStats> {
    return apiRequest("/stats");
  },
};

export { ApiError };
