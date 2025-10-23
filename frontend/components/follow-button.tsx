"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { followApi } from "@/lib/api";
import { useUserStore } from "@/lib/store";
import { useAuth } from "@/lib/hooks/useAuth";

interface FollowButtonProps {
  targetUserId: string;
  targetUsername?: string;
  variant?: "default" | "compact";
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({
  targetUserId,
  targetUsername,
  variant = "default",
  onFollowChange,
}: FollowButtonProps) {
  const { authenticated } = useAuth();
  const { user } = useUserStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingFollow, setIsCheckingFollow] = useState(true);

  // Don't show follow button for own profile
  if (user?.id === targetUserId) {
    return null;
  }

  // Don't show if not authenticated
  if (!authenticated || !user) {
    return null;
  }

  // Check follow status on mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user?.id) return;

      setIsCheckingFollow(true);
      try {
        const data = await followApi.getFollowData(targetUserId, user.id);
        setIsFollowing(data.isFollowing);
      } catch (error) {
        console.error("Failed to check follow status:", error);
      } finally {
        setIsCheckingFollow(false);
      }
    };

    checkFollowStatus();
  }, [targetUserId, user?.id]);

  const handleFollow = async () => {
    if (!user?.id || isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await followApi.unfollow(user.id, targetUserId);
        setIsFollowing(false);
        onFollowChange?.(false);
        console.log("✅ Unfollowed user");
      } else {
        await followApi.follow(user.id, targetUserId);
        setIsFollowing(true);
        onFollowChange?.(true);
        console.log("✅ Followed user");
      }
    } catch (error: any) {
      console.error("Follow action failed:", error);
      alert(error.message || "Failed to update follow status");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingFollow) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground ${
          variant === "compact" ? "text-xs" : "text-sm"
        }`}
      >
        <Loader2
          className={`${
            variant === "compact" ? "w-3 h-3" : "w-4 h-4"
          } animate-spin`}
        />
        {variant === "default" && "Loading..."}
      </button>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        variant === "compact" ? "text-xs" : "text-sm"
      } ${
        isFollowing
          ? "bg-accent text-foreground hover:bg-accent/80 border border-border"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? (
        <>
          <Loader2
            className={`${
              variant === "compact" ? "w-3 h-3" : "w-4 h-4"
            } animate-spin`}
          />
          {variant === "default" &&
            (isFollowing ? "Unfollowing..." : "Following...")}
        </>
      ) : (
        <>
          {isFollowing ? (
            <>
              <UserMinus
                className={`${variant === "compact" ? "w-3 h-3" : "w-4 h-4"}`}
              />
              {variant === "default" && "Unfollow"}
            </>
          ) : (
            <>
              <UserPlus
                className={`${variant === "compact" ? "w-3 h-3" : "w-4 h-4"}`}
              />
              {variant === "default" && "Follow"}
            </>
          )}
        </>
      )}
    </button>
  );
}
