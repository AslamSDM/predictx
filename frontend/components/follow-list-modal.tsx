"use client";

import { useState, useEffect } from "react";
import { X, Users, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { followApi } from "@/lib/api";
import FollowButton from "./follow-button";
import Link from "next/link";

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
  username?: string;
}

export default function FollowListModal({
  isOpen,
  onClose,
  userId,
  type,
  username,
}: FollowListModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        if (type === "followers") {
          const data = await followApi.getFollowers(userId);
          setUsers(data.list.map((item) => item.follower));
          setCounts({
            followers: data.followersCount,
            following: data.followingCount,
          });
        } else {
          const data = await followApi.getFollowing(userId);
          setUsers(data.list.map((item) => item.following));
          setCounts({
            followers: data.followersCount,
            following: data.followingCount,
          });
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, userId, type]);

  if (!isOpen) return null;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[600px] flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    {type === "followers" ? "Followers" : "Following"}
                  </h2>
                  {username && (
                    <p className="text-sm text-muted-foreground mt-1">
                      @{username}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No {type} yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <Link
                          href={`/profile/${user.id}`}
                          className="flex items-center gap-3 flex-1 min-w-0"
                          onClick={onClose}
                        >
                          {user.avatar ? (
                            <Image
                              src={user.avatar}
                              alt={user.username || "User"}
                              width={48}
                              height={48}
                              className="rounded-full border-2 border-primary"
                              unoptimized
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                              <Users className="w-6 h-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                              {user.username || "Anonymous"}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {formatAddress(user.walletAddress)}
                            </p>
                            {user._count && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {user._count.predictions} predictions •{" "}
                                {user._count.bets} bets
                              </p>
                            )}
                          </div>
                        </Link>
                        <FollowButton
                          targetUserId={user.id}
                          variant="compact"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer with counts */}
              <div className="p-4 border-t border-border bg-accent/20">
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg text-primary">
                      {counts.followers}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Followers
                    </div>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <div className="font-bold text-lg text-primary">
                      {counts.following}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Following
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
