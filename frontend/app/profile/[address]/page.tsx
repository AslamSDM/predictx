"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Clock,
  Trophy,
  Users,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import type { PredictionWithRelations, BetWithRelations } from "@/lib/types";
import { userApi, followApi } from "@/lib/api";
import FollowButton from "@/components/follow-button";
import FollowListModal from "@/components/follow-list-modal";
import { useUserStore } from "@/lib/store";

interface UserProfile {
  id: string;
  walletAddress: string;
  username: string | null;
  avatar: string | null;
  createdAt: Date | string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useUserStore();
  const address = params.address as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"predictions" | "bets">(
    "predictions"
  );
  const [predictions, setPredictions] = useState<PredictionWithRelations[]>([]);
  const [bets, setBets] = useState<BetWithRelations[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [followData, setFollowData] = useState({
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
  });
  const [showFollowModal, setShowFollowModal] = useState<
    "followers" | "following" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);

  // Fetch user by wallet address
  useEffect(() => {
    const fetchUser = async () => {
      if (!address) return;

      setIsLoadingUser(true);
      setError(null);
      try {
        const userData = await userApi.getByWallet(address);
        setUser(userData);

        // Background load predictions and bets
        loadUserData(userData.id);

        // Load follow data
        const followDataResponse = await followApi.getFollowData(
          userData.id,
          currentUser?.id
        );
        setFollowData(followDataResponse);
      } catch (err: any) {
        console.error("Error fetching user:", err);
        if (err.status === 404) {
          setError("User not found");
          // Fetch actual users to show when user is not found
          fetchRandomUsers();
        } else {
          setError("Failed to load user profile");
        }
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, [address, currentUser?.id]);

  // Background load user's predictions and bets
  const loadUserData = async (userId: string) => {
    setIsLoadingData(true);
    try {
      // Load in parallel for better performance
      const [predictionsRes, betsRes] = await Promise.all([
        fetch(`/api/predictions?creatorId=${userId}`),
        fetch(`/api/bets?userId=${userId}`),
      ]);

      if (predictionsRes.ok) {
        const data = await predictionsRes.json();
        setPredictions(data.predictions || data);
      }

      if (betsRes.ok) {
        const data = await betsRes.json();
        setBets(data.bets || data);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Handle follow state change
  const handleFollowChange = (isFollowing: boolean) => {
    setFollowData((prev) => ({
      ...prev,
      followersCount: isFollowing
        ? prev.followersCount + 1
        : prev.followersCount - 1,
      isFollowing,
    }));
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number | { toString: () => string }) => {
    const num =
      typeof amount === "number" ? amount : parseFloat(amount.toString());
    return num.toLocaleString();
  };

  const isOwnProfile = currentUser?.walletAddress === address;

  // Fetch random users when user is not found
  const fetchRandomUsers = async () => {
    try {
      const response = await fetch('/api/users?limit=6');
      if (response.ok) {
        const data = await response.json();
        setSuggestedUsers(data.users || data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Loading state
  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Error Message */}
          <div className="text-center mb-8">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {error || "User Not Found"}
            </h2>
            <p className="text-muted-foreground mb-6">
              This user profile doesn't exist or couldn't be loaded.
            </p>
            <button
              onClick={() => router.push("/discover")}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Discover
            </button>
          </div>

          {/* User Profiles */}
          {suggestedUsers.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-center">
                Explore User Profiles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestedUsers.map((profileUser) => (
                  <div
                    key={profileUser.id}
                    onClick={() =>
                      router.push(`/profile/${profileUser.walletAddress}`)
                    }
                    className="bg-gradient-to-br from-card to-card/50 rounded-xl border border-border p-6 hover:border-primary hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="text-center mb-4">
                      {profileUser.avatar ? (
                        <Image
                          src={profileUser.avatar}
                          alt={profileUser.username || "User avatar"}
                          width={64}
                          height={64}
                          className="rounded-full mx-auto mb-3 border-2 border-primary/20"
                          unoptimized
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 border-2 border-primary/20">
                          <Target className="w-8 h-8 text-primary" />
                        </div>
                      )}
                      <h4 className="font-bold text-lg group-hover:text-primary transition-colors">
                        {profileUser.username || "Anonymous"}
                      </h4>
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        {profileUser.walletAddress.slice(0, 6)}...
                        {profileUser.walletAddress.slice(-4)}
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-center">
                      <div className="text-sm text-muted-foreground">
                        Member since {formatDate(profileUser.createdAt)}
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <span className="text-xs text-primary font-medium">
                          View Profile →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 md:py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Profile Header */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/30 rounded-2xl p-4 md:p-8 mb-6 md:mb-8 border border-border">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.username || "User avatar"}
                width={96}
                height={96}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-primary shadow-lg"
                unoptimized
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary shadow-lg">
                <Target className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                  {user.username || "Anonymous"}
                </h1>
                {!isOwnProfile && (
                  <div className="mx-auto sm:mx-0">
                    <FollowButton
                      targetUserId={user.id}
                      targetUsername={user.username || undefined}
                      onFollowChange={handleFollowChange}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm font-mono text-muted-foreground mb-4">
                {user.walletAddress.slice(0, 10)}...
                {user.walletAddress.slice(-8)}
              </p>
              <div className="flex justify-center sm:justify-start gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                    {isLoadingData ? "-" : predictions.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Predictions
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                    {isLoadingData ? "-" : bets.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Bets Placed
                  </div>
                </div>
                <button
                  onClick={() => setShowFollowModal("followers")}
                  className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                    {followData.followersCount}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                    <Users className="w-3 h-3" />
                    Followers
                  </div>
                </button>
                <button
                  onClick={() => setShowFollowModal("following")}
                  className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                    {followData.followingCount}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                    <Users className="w-3 h-3" />
                    Following
                  </div>
                </button>
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                    $
                    {isLoadingData
                      ? "-"
                      : formatAmount(
                          bets.reduce(
                            (sum, bet) =>
                              sum +
                              (typeof bet.amount === "number"
                                ? bet.amount
                                : parseFloat(bet.amount.toString())),
                            0
                          )
                        )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Wagered
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-6 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab("predictions")}
            className={`px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "predictions"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1 sm:mr-2" />
            Predictions ({predictions.length})
          </button>
          <button
            onClick={() => setActiveTab("bets")}
            className={`px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "bets"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-1 sm:mr-2" />
            Bets ({bets.length})
          </button>
        </div>

        {/* Content */}
        {isLoadingData ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading {activeTab}...</p>
          </div>
        ) : activeTab === "predictions" ? (
          <div className="space-y-4">
            {predictions.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No predictions yet</p>
              </div>
            ) : (
              predictions.map((prediction) => (
                <div
                  key={prediction.id}
                  className="bg-card rounded-xl border border-border p-6 hover:border-primary transition-colors cursor-pointer"
                  onClick={() => router.push(`/discover?id=${prediction.id}`)}
                >
                  <div className="flex items-start gap-4">
                    {prediction.tradeImage && (
                      <Image
                        src={prediction.tradeImage}
                        alt={prediction.title}
                        width={120}
                        height={80}
                        className="rounded-lg object-cover"
                        unoptimized
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {prediction.direction === "LONG" ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm font-semibold text-muted-foreground">
                          {prediction.symbol}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            prediction.direction === "LONG"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {prediction.direction}
                        </span>
                        <span
                          className={`ml-auto text-xs px-2 py-1 rounded ${
                            prediction.status === "ACTIVE"
                              ? "bg-primary/20 text-primary"
                              : prediction.status === "RESOLVED_YES" ||
                                prediction.status === "RESOLVED_NO"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-gray-500/20 text-gray-500"
                          }`}
                        >
                          {prediction.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mb-2">
                        {prediction.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {prediction.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span>
                            Pool: ${formatAmount(prediction.totalPool)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          <span>{prediction._count.bets} bets</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(prediction.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bets.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No bets placed yet</p>
              </div>
            ) : (
              bets.map((bet) => (
                <div
                  key={bet.id}
                  className="bg-card rounded-xl border border-border p-6 hover:border-primary transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`px-3 py-1 rounded-full font-bold ${
                          bet.position === "YES"
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {bet.position}
                      </div>
                      <div className="text-2xl font-bold">
                        ${formatAmount(bet.amount)}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(bet.placedAt)}
                    </div>
                  </div>
                  {bet.prediction && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm font-medium mb-1">
                        {bet.prediction.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{bet.prediction.symbol}</span>
                        <span>•</span>
                        <span>{bet.prediction.direction}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Follow List Modal */}
      {showFollowModal && user && (
        <FollowListModal
          isOpen={true}
          onClose={() => setShowFollowModal(null)}
          userId={user.id}
          type={showFollowModal}
          username={user.username || undefined}
        />
      )}
    </div>
  );
}
