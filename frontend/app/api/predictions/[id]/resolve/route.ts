import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { outcome, resolvedBy } = await request.json();
    const predictionId = params.id;

    if (!outcome || !resolvedBy) {
      return NextResponse.json(
        { error: "Outcome and resolver ID are required" },
        { status: 400 }
      );
    }

    if (outcome !== "YES" && outcome !== "NO") {
      return NextResponse.json(
        { error: "Outcome must be YES or NO" },
        { status: 400 }
      );
    }

    // Get the prediction
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
      include: {
        bets: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!prediction) {
      return NextResponse.json(
        { error: "Prediction not found" },
        { status: 404 }
      );
    }

    // Check if already resolved
    if (prediction.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Prediction already resolved" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() < prediction.expiresAt) {
      return NextResponse.json(
        { error: "Prediction has not expired yet" },
        { status: 400 }
      );
    }

    // Calculate resolution fee (2% of total pool)
    const resolutionFee = prediction.totalPool.mul(new Decimal("0.02"));
    const remainingPool = prediction.totalPool.sub(resolutionFee);

    // Determine status based on outcome
    const newStatus = outcome === "YES" ? "RESOLVED_YES" : "RESOLVED_NO";

    // Update prediction status
    const resolvedPrediction = await prisma.prediction.update({
      where: { id: predictionId },
      data: {
        status: newStatus,
        resolvedAt: new Date(),
      },
      include: {
        creator: true,
        bets: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            bets: true,
          },
        },
      },
    });

    // Update bet statuses and calculate winnings
    const winningPosition = outcome;
    const winningPool = outcome === "YES" ? prediction.yesPool : prediction.noPool;
    const losingPool = outcome === "YES" ? prediction.noPool : prediction.yesPool;

    if (winningPool.gt(0)) {
      // Calculate winnings for each winning bet
      for (const bet of prediction.bets) {
        if (bet.position === winningPosition) {
          // Winner: Calculate proportional share of losing pool + original bet
          const betRatio = bet.amount.div(winningPool);
          const winnings = losingPool.mul(betRatio).add(bet.amount);

          await prisma.bet.update({
            where: { id: bet.id },
            data: {
              status: "WON",
              potentialWin: winnings, // Update with actual winnings
            },
          });
        } else {
          // Loser
          await prisma.bet.update({
            where: { id: bet.id },
            data: {
              status: "LOST",
            },
          });
        }
      }
    } else {
      // No winning bets, all bets on losing side - everyone loses
      for (const bet of prediction.bets) {
        await prisma.bet.update({
          where: { id: bet.id },
          data: {
            status: "LOST",
          },
        });
      }
    }

    // Log resolution for tracking (could be used for leaderboards)
    console.log(`✅ Prediction ${predictionId} resolved by user ${resolvedBy}`);
    console.log(`   Outcome: ${outcome}`);
    console.log(`   Resolution fee: $${resolutionFee.toString()}`);
    console.log(`   Winning pool: $${winningPool.toString()}`);
    console.log(`   Losing pool: $${losingPool.toString()}`);

    return NextResponse.json({
      prediction: resolvedPrediction,
      resolutionFee: resolutionFee.toNumber(),
      outcome,
      resolvedBy,
      winningBets: prediction.bets.filter((b) => b.position === winningPosition).length,
      losingBets: prediction.bets.filter((b) => b.position !== winningPosition).length,
    });
  } catch (error) {
    console.error("Error resolving prediction:", error);
    return NextResponse.json(
      { error: "Failed to resolve prediction" },
      { status: 500 }
    );
  }
}
