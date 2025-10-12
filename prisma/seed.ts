import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create sample users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { walletAddress: "0x1234567890123456789012345678901234567890" },
      update: {},
      create: {
        walletAddress: "0x1234567890123456789012345678901234567890",
        username: "TradeMaster",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      },
    }),
    prisma.user.upsert({
      where: { walletAddress: "0x0987654321098765432109876543210987654321" },
      update: {},
      create: {
        walletAddress: "0x0987654321098765432109876543210987654321",
        username: "CryptoGuru",
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616c04e3b9a?w=150&h=150&fit=crop&crop=face",
      },
    }),
    prisma.user.upsert({
      where: { walletAddress: "0x1111222233334444555566667777888899990000" },
      update: {},
      create: {
        walletAddress: "0x1111222233334444555566667777888899990000",
        username: "DiamondHands",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create sample predictions
  const predictions = await Promise.all([
    prisma.prediction.create({
      data: {
        title: "BTC will hit $75,000 by end of week",
        description:
          "Strong bullish momentum with institutional buying. Technical analysis shows breakout pattern.",
        symbol: "BTC/USD",
        direction: "LONG",
        entryPrice: new Decimal("68500"),
        targetPrice: new Decimal("75000"),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        creatorId: users[0].id,
        totalPool: new Decimal("2500"),
        yesPool: new Decimal("1500"),
        noPool: new Decimal("1000"),
      },
    }),
    prisma.prediction.create({
      data: {
        title: "ETH short position - bearish divergence",
        description:
          "RSI showing bearish divergence on 4H chart. Expecting pullback to $2,800 support.",
        symbol: "ETH/USD",
        direction: "SHORT",
        entryPrice: new Decimal("3200"),
        targetPrice: new Decimal("2800"),
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        creatorId: users[1].id,
        totalPool: new Decimal("1800"),
        yesPool: new Decimal("800"),
        noPool: new Decimal("1000"),
      },
    }),
    prisma.prediction.create({
      data: {
        title: "AAPL earnings play - expecting beat",
        description:
          "Strong iPhone sales data and services growth. Expecting 5% move up after earnings.",
        symbol: "AAPL",
        direction: "LONG",
        entryPrice: new Decimal("185.50"),
        targetPrice: new Decimal("195.00"),
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        creatorId: users[2].id,
        totalPool: new Decimal("3200"),
        yesPool: new Decimal("2000"),
        noPool: new Decimal("1200"),
      },
    }),
    prisma.prediction.create({
      data: {
        title: "SOL breakout above resistance",
        description:
          "Solana showing strong volume and breaking key resistance. Target $180.",
        symbol: "SOL/USD",
        direction: "LONG",
        entryPrice: new Decimal("155.20"),
        targetPrice: new Decimal("180.00"),
        status: "RESOLVED_YES",
        resolvedAt: new Date(),
        expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired yesterday
        creatorId: users[0].id,
        totalPool: new Decimal("1500"),
        yesPool: new Decimal("900"),
        noPool: new Decimal("600"),
      },
    }),
  ]);

  console.log(`✅ Created ${predictions.length} predictions`);

  // Create sample bets
  const bets = await Promise.all([
    // Bets on BTC prediction
    prisma.bet.create({
      data: {
        userId: users[1].id,
        predictionId: predictions[0].id,
        amount: new Decimal("500"),
        position: "YES",
        odds: new Decimal("1.67"),
        potentialWin: new Decimal("835"),
        status: "ACTIVE",
      },
    }),
    prisma.bet.create({
      data: {
        userId: users[2].id,
        predictionId: predictions[0].id,
        amount: new Decimal("300"),
        position: "NO",
        odds: new Decimal("2.5"),
        potentialWin: new Decimal("750"),
        status: "ACTIVE",
      },
    }),
    // Bets on ETH prediction
    prisma.bet.create({
      data: {
        userId: users[0].id,
        predictionId: predictions[1].id,
        amount: new Decimal("400"),
        position: "YES",
        odds: new Decimal("2.25"),
        potentialWin: new Decimal("900"),
        status: "ACTIVE",
      },
    }),
    // Winning bet on resolved SOL prediction
    prisma.bet.create({
      data: {
        userId: users[2].id,
        predictionId: predictions[3].id,
        amount: new Decimal("300"),
        position: "YES",
        odds: new Decimal("1.67"),
        potentialWin: new Decimal("500"),
        status: "WON",
      },
    }),
  ]);

  console.log(`✅ Created ${bets.length} bets`);
  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
