import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const {
      title,
      description,
      tradeImage,
      orderId,
      targetPrice,
      entryPrice,
      symbol,
      direction,
      expiresAt,
      creatorId,
    } = await request.json();

    if (
      !title ||
      !description ||
      !symbol ||
      !direction ||
      !expiresAt ||
      !creatorId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prediction = await prisma.prediction.create({
      data: {
        title,
        description,
        tradeImage,
        orderId,
        targetPrice,
        entryPrice,
        symbol,
        direction,
        expiresAt: new Date(expiresAt),
        creatorId,
      },
      include: {
        creator: true,
        bets: true,
      },
    });

    return NextResponse.json(prediction);
  } catch (error) {
    console.error("Error creating prediction:", error);
    return NextResponse.json(
      { error: "Failed to create prediction" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const whereClause = status ? { status: status as "ACTIVE" | "RESOLVED_YES" | "RESOLVED_NO" | "EXPIRED" | "CANCELLED" } : {};

    const predictions = await prisma.prediction.findMany({
      where: whereClause,
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
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.prediction.count({
      where: whereClause,
    });

    return NextResponse.json({
      predictions,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching predictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 }
    );
  }
}
