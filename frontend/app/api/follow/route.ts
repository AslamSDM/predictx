import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Follow a user
export async function POST(request: NextRequest) {
  try {
    const { followerId, followingId } = await request.json();

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: "followerId and followingId are required" },
        { status: 400 }
      );
    }

    if (followerId === followingId) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 }
      );
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
            walletAddress: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, follow });
  } catch (error) {
    console.error("Error creating follow:", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

// Unfollow a user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const followerId = searchParams.get("followerId");
    const followingId = searchParams.get("followingId");

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: "followerId and followingId are required" },
        { status: 400 }
      );
    }

    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting follow:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}

// Get follow status and counts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const checkFollowerId = searchParams.get("checkFollowerId");
    const type = searchParams.get("type"); // 'followers' or 'following'

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get counts
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    // Check if checkFollowerId is following userId
    let isFollowing = false;
    if (checkFollowerId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: checkFollowerId,
            followingId: userId,
          },
        },
      });
      isFollowing = !!follow;
    }

    // Get list of followers or following if requested
    let list = null;
    if (type === "followers") {
      list = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              avatar: true,
              walletAddress: true,
              _count: {
                select: {
                  predictions: true,
                  bets: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (type === "following") {
      list = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              avatar: true,
              walletAddress: true,
              _count: {
                select: {
                  predictions: true,
                  bets: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      followersCount,
      followingCount,
      isFollowing,
      list,
    });
  } catch (error) {
    console.error("Error fetching follow data:", error);
    return NextResponse.json(
      { error: "Failed to fetch follow data" },
      { status: 500 }
    );
  }
}
