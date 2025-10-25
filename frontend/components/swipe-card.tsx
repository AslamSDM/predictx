"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import Image from "next/image";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from "lucide-react";
import type { PredictionWithRelations } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SwipeCardProps {
  prediction: PredictionWithRelations;
  onSwipeLeft: (prediction: PredictionWithRelations) => void;
  onSwipeRight: (prediction: PredictionWithRelations) => void;
  onSwipeUp?: (prediction: PredictionWithRelations) => void;
  onSwipeDown?: (prediction: PredictionWithRelations) => void;
  onChatClick?: (prediction: PredictionWithRelations) => void;
  style?: React.CSSProperties;
}

export default function SwipeCard({
  prediction,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onChatClick,
  style,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [exitX, setExitX] = useState(0);
  const [exitY, setExitY] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const router = useRouter();
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // Overlay colors for swipe indicators
  const yesOpacity = useTransform(x, [-100, 0], [1, 0]);
  const noOpacity = useTransform(x, [0, 100], [0, 1]);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const horizontalThreshold = 80;
    const verticalThreshold = 60;

    const absOffsetX = Math.abs(info.offset.x);
    const absOffsetY = Math.abs(info.offset.y);

    // Determine if swipe is primarily horizontal or vertical
    if (absOffsetX > absOffsetY) {
      // Horizontal swipe - for betting (Left/Right)
      if (info.offset.x > horizontalThreshold) {
        // Swipe Right - NO
        setExitX(200);
        setTimeout(() => onSwipeLeft(prediction), 150);
      } else if (info.offset.x < -horizontalThreshold) {
        // Swipe Left - YES
        setExitX(-200);
        setTimeout(() => onSwipeRight(prediction), 150);
      }
    } else {
      // Vertical swipe - for navigation (Up/Down)
      if (info.offset.y < -verticalThreshold && onSwipeUp) {
        // Swipe Up - Next card
        setExitY(-200);
        setTimeout(() => onSwipeUp(prediction), 150);
      } else if (info.offset.y > verticalThreshold && onSwipeDown) {
        // Swipe Down - Previous card
        setExitY(200);
        setTimeout(() => onSwipeDown(prediction), 150);
      }
    }
  };

  const formatTimeRemaining = (expiresAt: Date | string) => {
    const now = new Date();
    const expiry =
      typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
    const diff = expiry.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h`;
    return "Expiring soon";
  };

  const formatExpiryDate = (expiresAt: Date | string) => {
    const expiry =
      typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
    return expiry.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toNumber = (value: number | { toString: () => string }) => {
    return typeof value === "number" ? value : parseFloat(value.toString());
  };

  // Check if description is long enough to need truncation
  const isLongDescription = prediction.description.length > 120;

  return (
    <motion.div
      style={{
        x,
        y,
        rotate,
        opacity,
        ...style,
      }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      animate={
        exitX !== 0
          ? { x: exitX * 2, opacity: 0 }
          : exitY !== 0
          ? { y: exitY * 2, opacity: 0 }
          : {}
      }
      transition={{ duration: 0.3 }}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
    >
      <div className="relative w-full h-full bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
        {/* Swipe Indicators */}
        <motion.div
          style={{ opacity: yesOpacity }}
          className="absolute inset-0 bg-green-500/20 z-10 flex items-center justify-center"
        >
          <div className="text-6xl font-bold text-green-500 rotate-12 border-4 border-green-500 px-8 py-4 rounded-xl">
            YES
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: noOpacity }}
          className="absolute inset-0 bg-red-500/20 z-10 flex items-center justify-center"
        >
          <div className="text-6xl font-bold text-red-500 -rotate-12 border-4 border-red-500 px-8 py-4 rounded-xl">
            NO
          </div>
        </motion.div>

        {/* Card Content */}
        <div className="w-full h-full flex flex-col">
          {/* Trade Image */}
          {prediction.tradeImage && (
            <div className="relative flex-shrink-0 bg-gray-900 min-h-[250px] max-h-[40vh] md:max-h-[350px]">
              <Image
                src={prediction.tradeImage}
                alt={prediction.title}
                fill
                className="object-cover md:object-contain"
                priority
                sizes="(max-width: 768px) 100vw, 600px"
                unoptimized
              />
              {/* Image overlay label */}
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-medium z-10">
                📊 Trade Chart
              </div>
            </div>
          )}

          {/* Chat Button */}
          {/* <div
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 z-10"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChatClick?.(prediction);
              }}
              className="bg-primary/90 backdrop-blur-sm hover:bg-primary text-primary-foreground p-2 rounded-full transition-all active:scale-95 shadow-lg cursor-pointer touch-manipulation"
              aria-label="Open chat"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div> */}
          {/* Info Section */}
          <div className="flex-1 p-4 md:p-6 flex flex-col min-h-0 overflow-y-auto relative">
            {/* Chat Button (when no image) */}
            <>
              <div
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute top-4 right-4 z-10 "
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChatClick?.(prediction);
                  }}
                  className="bg-primary/90 backdrop-blur-sm hover:bg-primary text-primary-foreground p-2 rounded-full transition-all active:scale-95 shadow-lg cursor-pointer touch-manipulation"
                  aria-label="Open chat"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute bottom-5 right-4 z-10 ">
                <button
                  onClick={(e) => {
                    router.push(`/profile/${prediction.creator.username}`);
                  }}
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer group touch-manipulation"
                >
                  {prediction.creator.avatar && (
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={prediction.creator.avatar}
                        alt={"Creator"}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">
                      Created by
                    </div>
                    <div className="font-medium group-hover:underline">
                      @{prediction.creator.username || "Anonymous"}
                    </div>
                  </div>
                </button>
              </div>
            </>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              {prediction.direction === "LONG" ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm font-semibold text-muted-foreground">
                {prediction.symbol}
              </span>
              <span
                className={`text-sm font-bold px-2 py-0.5 rounded ${
                  prediction.direction === "LONG"
                    ? "bg-green-500/20 text-green-500"
                    : "bg-red-500/20 text-red-500"
                }`}
              >
                {prediction.direction}
              </span>
            </div>{" "}
            <h2 className="text-xl md:text-2xl font-bold mb-3 line-clamp-2">
              {prediction.title}
            </h2>
            {/* Description with Read More */}
            <div className="mb-4">
              <p
                className={`text-sm text-muted-foreground ${
                  !showFullDescription && isLongDescription
                    ? "line-clamp-3"
                    : ""
                }`}
              >
                {prediction.description}
              </p>
              {isLongDescription && (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullDescription(!showFullDescription);
                    }}
                    className="text-xs text-primary hover:underline mt-1 flex items-center gap-1 cursor-pointer touch-manipulation"
                  >
                    {showFullDescription ? (
                      <>
                        Show less <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        Read more <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            {/* Price Targets - Highlighted */}
            {prediction.entryPrice && prediction.targetPrice && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-background/50 border border-border rounded-lg p-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Target className="w-3 h-3" />
                    Entry Price
                  </div>
                  <div className="text-base font-bold">
                    ${toNumber(prediction.entryPrice).toLocaleString()}
                  </div>
                </div>
                <div className="bg-primary/10 border-2 border-primary rounded-lg p-3">
                  <div className="flex items-center gap-1 text-xs text-primary mb-1">
                    <Target className="w-3 h-3" />
                    Target (TP)
                  </div>
                  <div className="text-base font-bold text-primary">
                    ${toNumber(prediction.targetPrice).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
            {/* Expiry Time - Highlighted */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <div>
                    <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                      Expires in {formatTimeRemaining(prediction.expiresAt)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatExpiryDate(prediction.expiresAt)}
                    </div>
                  </div>
                </div>
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            {/* Pool Info */}
            <div className="bg-background/30 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Total Pool
                </span>
                <span className="font-semibold">
                  ${toNumber(prediction.totalPool).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2 text-xs">
                <div className="flex-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded px-2 py-1 text-center font-medium">
                  YES ${toNumber(prediction.yesPool).toLocaleString()}
                </div>
                <div className="flex-1 bg-red-500/20 text-red-600 dark:text-red-400 rounded px-2 py-1 text-center font-medium">
                  NO ${toNumber(prediction.noPool).toLocaleString()}
                </div>
              </div>
            </div>
            {/* Creator Info - At Bottom */}
          </div>

          {/* Swipe Instructions */}
        </div>
      </div>
    </motion.div>
  );
}
