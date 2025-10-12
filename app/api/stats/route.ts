import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    // Get overall platform statistics
    const [
      totalPredictions,
      activePredictions,
      totalBets,
      totalUsers,
      totalVolume,
      recentPredictions,
    ] = await Promise.all([
      prisma.prediction.count(),
      prisma.prediction.count({
        where: { status: "ACTIVE" },
      }),
      prisma.bet.count(),
      prisma.user.count(),
      prisma.bet.aggregate({
        _sum: {
          amount: true,
        },
      }),
      prisma.prediction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          creator: true,
          _count: {
            select: {
              bets: true,
            },
          },
        },
      }),
    ]);

    // Get top traders by successful predictions
    const topTraders = await prisma.user.findMany({
      take: 10,
      include: {
        predictions: {
          where: {
            status: { in: ["RESOLVED_YES", "RESOLVED_NO"] },
          },
        },
        _count: {
          select: {
            predictions: true,
          },
        },
      },
      orderBy: {
        predictions: {
          _count: "desc",
        },
      },
    });

    // Define type for trader with predictions
    type TraderWithPredictions = Prisma.UserGetPayload<{
      include: {
        predictions: {
          where: {
            status: { in: ["RESOLVED_YES", "RESOLVED_NO"] };
          };
        };
        _count: {
          select: {
            predictions: true;
          };
        };
      };
    }>;

    // Calculate success rates for top traders
    const tradersWithStats = topTraders.map((trader: TraderWithPredictions) => {
      const resolvedPredictions = trader.predictions;
      const successfulPredictions = resolvedPredictions.filter(
        (p) => p.status === "RESOLVED_YES"
      ).length;
      const successRate =
        resolvedPredictions.length > 0
          ? (successfulPredictions / resolvedPredictions.length) * 100
          : 0;

      return {
        ...trader,
        successRate: Math.round(successRate),
        totalResolved: resolvedPredictions.length,
      };
    });

    return NextResponse.json({
      totalPredictions,
      activePredictions,
      totalBets,
      totalUsers,
      totalVolume: totalVolume._sum.amount || 0,
      recentPredictions,
      topTraders: tradersWithStats,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
