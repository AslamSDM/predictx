import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const {
      creatorId,
      title,
      description,
      symbol,
      direction,
      entryPrice,
      targetPrice,
      tradeImage,
      orderId,
      expiresAt,
      address, // Contract address from blockchain
      yesTokenAddress,
      noTokenAddress,
    } = await request.json();

    if (
      !creatorId ||
      !title ||
      !description ||
      !symbol ||
      !direction ||
      !expiresAt ||
      !address ||
      !yesTokenAddress ||
      !noTokenAddress
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create prediction in database
    const prediction = await prisma.prediction.create({
      data: {
        creatorId,
        title,
        description,
        symbol,
        direction,
        entryPrice: entryPrice,
        targetPrice: targetPrice,
        tradeImage,
        orderId,
        expiresAt: new Date(expiresAt),
        address, // Store prediction contract address
        yesTokenAddress: yesTokenAddress, // Store yes token address
        noTokenAddress: noTokenAddress, // Store no token address
        status: "ACTIVE",
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
    const creatorId = searchParams.get("creatorId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const whereClause: Prisma.PredictionWhereInput = {};

    // Handle special "expired" status
    if (status === "expired") {
      whereClause.status = "ACTIVE";
      whereClause.expiresAt = {
        lt: new Date(), // Expired = expiry date is less than now
      };
    } else if (status === "ACTIVE") {
      whereClause.status = "ACTIVE";
      whereClause.expiresAt = {
        gt: new Date(), // Active = not expired yet
      };
    } else if (status) {
      whereClause.status = status as any;
    }

    if (creatorId) whereClause.creatorId = creatorId;

    const [predictions, total] = await Promise.all([
      prisma.prediction.findMany({
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
        orderBy:
          status === "expired" ? { expiresAt: "desc" } : { expiresAt: "desc" }, // Show recently expired first for expired status
        take: limit,
        skip: offset,
      }),
      prisma.prediction.count({
        where: whereClause,
      }),
    ]);

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
