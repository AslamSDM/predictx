"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/store";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Clock,
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";
import type { PredictionWithRelations, BetWithRelations } from "@/lib/types";
import { followApi } from "@/lib/api";
import FollowListModal from "@/components/follow-list-modal";

export default function ProfilePage() {
  const { authenticated, ready } = useAuth();
  const { user } = useUserStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"predictions" | "bets">(
    "predictions"
  );
  const [predictions, setPredictions] = useState<PredictionWithRelations[]>([]);
  const [bets, setBets] = useState<BetWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followData, setFollowData] = useState({
    followersCount: 0,
    followingCount: 0,
  });
  const [showFollowModal, setShowFollowModal] = useState<"followers" | "following" | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/discover");
    }
  }, [authenticated, ready, router]);

  // Fetch user's predictions, bets, and follow data
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Fetch predictions created by user
        const predictionsRes = await fetch(
          `/api/predictions?creatorId=${user.id}`
        );
        if (predictionsRes.ok) {
          const data = await predictionsRes.json();
          setPredictions(data.predictions || data);
        }

        // Fetch bets placed by user
        const betsRes = await fetch(`/api/bets?userId=${user.id}`);
        if (betsRes.ok) {
          const data = await betsRes.json();
          setBets(data.bets || data);
        }

        // Fetch follow data
        const followData = await followApi.getFollowData(user.id);
        setFollowData({
          followersCount: followData.followersCount,
          followingCount: followData.followingCount,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (!ready || !authenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/30 rounded-2xl p-8 mb-8 border border-border">
          <div className="flex items-center gap-6">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.username || "User avatar"}
                width={96}
                height={96}
                className="rounded-full border-4 border-primary shadow-lg"
                unoptimized
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary shadow-lg">
                <Target className="w-12 h-12 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{user.username}</h1>
              <p className="text-sm font-mono text-muted-foreground mb-4">
                {user.walletAddress.slice(0, 10)}...
                {user.walletAddress.slice(-8)}
              </p>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {predictions.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Predictions
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {bets.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Bets Placed
                  </div>
                </div>
                <button
                  onClick={() => setShowFollowModal("followers")}
                  className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="text-2xl font-bold text-primary">
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
                  <div className="text-2xl font-bold text-primary">
                    {followData.followingCount}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                    <Users className="w-3 h-3" />
                    Following
                  </div>
                </button>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    $
                    {formatAmount(
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
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("predictions")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "predictions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            My Predictions ({predictions.length})
          </button>
          <button
            onClick={() => setActiveTab("bets")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "bets"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            My Bets ({bets.length})
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : activeTab === "predictions" ? (
          <div className="space-y-4">
            {predictions.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No predictions yet</p>
                <button
                  onClick={() => router.push("/create")}
                  className="text-primary hover:underline"
                >
                  Create your first prediction →
                </button>
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
                          className={`text-xs font-bold px-2 py-0.5 rounded ${prediction.direction === "LONG"
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                            }`}
                        >
                          {prediction.direction}
                        </span>
                        <span
                          className={`ml-auto text-xs px-2 py-1 rounded ${prediction.status === "ACTIVE"
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
                <p className="text-muted-foreground mb-2">No bets placed yet</p>
                <button
                  onClick={() => router.push("/discover")}
                  className="text-primary hover:underline"
                >
                  Explore predictions →
                </button>
              </div>
            ) : (
              bets.map((bet) => (
                <a key={bet.id} href={`/prediction/${bet.predictionId}`}>
                  <div
                    className="bg-card rounded-xl border border-border p-6 hover:border-primary transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`px-3 py-1 rounded-full font-bold ${bet.position === "YES"
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
                </a>
              ))
            )}
          </div>
        )}
      </div>

      {/* Follow List Modal */}
      {showFollowModal && (
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
