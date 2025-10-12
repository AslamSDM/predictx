import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(request: NextRequest) {
  try {
    const { userId, predictionId, amount, position } = await request.json();

    if (!userId || !predictionId || !amount || !position) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get prediction to check if it's still active
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
    });

    if (!prediction) {
      return NextResponse.json(
        { error: "Prediction not found" },
        { status: 404 }
      );
    }

    if (prediction.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Prediction is no longer active" },
        { status: 400 }
      );
    }

    if (new Date() > prediction.expiresAt) {
      return NextResponse.json(
        { error: "Prediction has expired" },
        { status: 400 }
      );
    }

    // Calculate odds and potential winnings
    const betAmount = new Decimal(amount);
    const yesPool = prediction.yesPool;
    const noPool = prediction.noPool;
    const totalPool = prediction.totalPool;

    let odds: Decimal;
    let potentialWin: Decimal;

    if (position === "YES") {
      // If betting YES, odds are based on NO pool vs total after this bet
      const newTotalPool = totalPool.add(betAmount);
      odds = newTotalPool.div(noPool.add(betAmount));
      potentialWin = betAmount.mul(odds);
    } else {
      // If betting NO, odds are based on YES pool vs total after this bet
      const newTotalPool = totalPool.add(betAmount);
      odds = newTotalPool.div(yesPool.add(betAmount));
      potentialWin = betAmount.mul(odds);
    }

    // Create the bet
    const bet = await prisma.bet.create({
      data: {
        userId,
        predictionId,
        amount: betAmount,
        position,
        odds,
        potentialWin,
      },
      include: {
        user: true,
        prediction: true,
      },
    });

    // Update prediction pools
    await prisma.prediction.update({
      where: { id: predictionId },
      data: {
        totalPool: { increment: betAmount },
        yesPool: position === "YES" ? { increment: betAmount } : undefined,
        noPool: position === "NO" ? { increment: betAmount } : undefined,
      },
    });

    return NextResponse.json(bet);
  } catch (error) {
    console.error("Error creating bet:", error);
    return NextResponse.json(
      { error: "Failed to create bet" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const predictionId = searchParams.get("predictionId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const whereClause: { userId?: string; predictionId?: string } = {};
    if (userId) whereClause.userId = userId;
    if (predictionId) whereClause.predictionId = predictionId;

    const bets = await prisma.bet.findMany({
      where: whereClause,
      include: {
        user: true,
        prediction: {
          include: {
            creator: true,
          },
        },
      },
      orderBy: { placedAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.bet.count({
      where: whereClause,
    });

    return NextResponse.json({
      bets,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching bets:", error);
    return NextResponse.json(
      { error: "Failed to fetch bets" },
      { status: 500 }
    );
  }
}
