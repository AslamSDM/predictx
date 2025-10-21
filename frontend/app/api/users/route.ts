import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, username, avatar } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (existingUser) {
      return NextResponse.json(existingUser);
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        walletAddress,
        username,
        avatar,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");
    const includeRelations = searchParams.get("include") === "true";

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Fast lookup without relations by default
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: includeRelations
        ? {
            predictions: {
              take: 10, // Limit to recent 10
              orderBy: { createdAt: "desc" },
            },
            bets: {
              take: 10, // Limit to recent 10
              include: {
                prediction: true,
              },
              orderBy: { placedAt: "desc" },
            },
          }
        : undefined,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
