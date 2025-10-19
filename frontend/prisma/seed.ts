import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

// Helper function to generate random avatars
const getRandomAvatar = (seed: string) => {
  const styles = [
    "avataaars",
    "bottts",
    "pixel-art",
    "lorelei",
    "fun-emoji",
    "thumbs",
  ];
  const style = styles[Math.floor(Math.random() * styles.length)];
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
};

// Helper function to generate random username
const generateUsername = () => {
  const adjectives = [
    "Swift",
    "Brave",
    "Clever",
    "Bold",
    "Mighty",
    "Silent",
    "Quick",
    "Lucky",
    "Smart",
    "Wise",
    "Diamond",
    "Golden",
    "Crypto",
    "Moon",
  ];
  const nouns = [
    "Tiger",
    "Dragon",
    "Eagle",
    "Wolf",
    "Lion",
    "Trader",
    "Bull",
    "Whale",
    "Shark",
    "Ninja",
    "Knight",
    "Wizard",
    "Legend",
    "Champion",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
};

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🗑️  Clearing existing data...");
  await prisma.bet.deleteMany({});
  await prisma.prediction.deleteMany({});
  await prisma.user.deleteMany({});

  // Create 10 sample users with random avatars and usernames
  console.log("👥 Creating users...");
  const users = await Promise.all(
    Array.from({ length: 10 }, (_, i) => {
      const walletAddress = `0x${i.toString().padStart(40, "0")}`;
      const username = generateUsername();
      const avatar = getRandomAvatar(walletAddress);

      return prisma.user.create({
        data: {
          walletAddress,
          username,
          avatar,
        },
      });
    })
  );

  console.log(`✅ Created ${users.length} users`);

  // Sample prediction data
  const predictionTemplates = [
    {
      title: "BTC will hit $75,000 by end of week",
      description:
        "Strong bullish momentum with institutional buying. Technical analysis shows breakout pattern above key resistance. Multiple indicators aligning including golden cross on daily chart, increasing volume, and whale accumulation. RSI showing strength without being overbought.",
      symbol: "BTC/USD",
      direction: "LONG" as const,
      entryPrice: 68500,
      targetPrice: 75000,
      tradeImage:
        "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=600&fit=crop",
      daysUntilExpiry: 7,
    },
    {
      title: "ETH short position - bearish divergence",
      description:
        "RSI showing bearish divergence on 4H chart. Expecting pullback to $2,800 support level soon. Price action showing weakness at current levels with declining volume on upside attempts.",
      symbol: "ETH/USD",
      direction: "SHORT" as const,
      entryPrice: 3200,
      targetPrice: 2800,
      tradeImage:
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop",
      daysUntilExpiry: 5,
    },
    {
      title: "SOL breakout to $200",
      description:
        "Solana showing strong volume and breaking key resistance at $155. Target $200 within next week. Network activity increasing, new DeFi protocols launching.",
      symbol: "SOL/USD",
      direction: "LONG" as const,
      entryPrice: 155.2,
      targetPrice: 200.0,
      tradeImage:
        "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=600&fit=crop",
      daysUntilExpiry: 8,
    },
    {
      title: "AAPL earnings beat incoming",
      description:
        "Strong iPhone sales data and services growth. Expecting 5% move up after earnings announcement. Supply chain data shows better than expected numbers.",
      symbol: "AAPL",
      direction: "LONG" as const,
      entryPrice: 185.5,
      targetPrice: 195.0,
      tradeImage:
        "https://images.unsplash.com/photo-1611532736570-e1e4263ce128?w=800&h=600&fit=crop",
      daysUntilExpiry: 3,
    },
    {
      title: "DOGE bearish reversal pattern",
      description:
        "Double top formation on daily chart. Expecting drop to $0.08 support. Meme coin hype cooling off, volume declining.",
      symbol: "DOGE/USD",
      direction: "SHORT" as const,
      entryPrice: 0.12,
      targetPrice: 0.08,
      tradeImage:
        "https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=800&h=600&fit=crop",
      daysUntilExpiry: 4,
    },
    {
      title: "TSLA rally to $250",
      description:
        "Tesla showing strong accumulation pattern. Production numbers beating estimates. EV market share growing. Technical breakout confirmed.",
      symbol: "TSLA",
      direction: "LONG" as const,
      entryPrice: 220.5,
      targetPrice: 250.0,
      tradeImage:
        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop",
      daysUntilExpiry: 10,
    },
    {
      title: "LINK ready for pump",
      description:
        "Chainlink breaking consolidation. New partnerships announced. Oracle demand increasing across DeFi. Target $18.",
      symbol: "LINK/USD",
      direction: "LONG" as const,
      entryPrice: 14.2,
      targetPrice: 18.0,
      tradeImage:
        "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800&h=600&fit=crop",
      daysUntilExpiry: 6,
    },
    {
      title: "NVDA correction expected",
      description:
        "Overbought conditions on multiple timeframes. Expecting healthy pullback to $450. Profit taking likely after strong run.",
      symbol: "NVDA",
      direction: "SHORT" as const,
      entryPrice: 485.0,
      targetPrice: 450.0,
      tradeImage:
        "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&h=600&fit=crop",
      daysUntilExpiry: 5,
    },
    {
      title: "ADA bullish ascending triangle",
      description:
        "Cardano forming ascending triangle pattern. Network upgrades coming. Target $0.55. Volume increasing on bounces.",
      symbol: "ADA/USD",
      direction: "LONG" as const,
      entryPrice: 0.42,
      targetPrice: 0.55,
      tradeImage:
        "https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=800&h=600&fit=crop",
      daysUntilExpiry: 9,
    },
    {
      title: "MATIC surge to $1.20",
      description:
        "Polygon showing strong fundamentals. L2 adoption growing. zkEVM gaining traction. Breaking resistance at $0.90.",
      symbol: "MATIC/USD",
      direction: "LONG" as const,
      entryPrice: 0.88,
      targetPrice: 1.2,
      tradeImage:
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop",
      daysUntilExpiry: 7,
    },
    {
      title: "Gold futures bearish breakdown",
      description:
        "Gold breaking key support at $1950. Dollar strength pressuring precious metals. Target $1850.",
      symbol: "GC=F",
      direction: "SHORT" as const,
      entryPrice: 1940,
      targetPrice: 1850,
      tradeImage:
        "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&h=600&fit=crop",
      daysUntilExpiry: 12,
    },
    {
      title: "XRP legal clarity pump",
      description:
        "Ripple case developments positive. Expecting rally on clarity. Target $0.80. Institutional interest returning.",
      symbol: "XRP/USD",
      direction: "LONG" as const,
      entryPrice: 0.58,
      targetPrice: 0.8,
      tradeImage:
        "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=600&fit=crop",
      daysUntilExpiry: 14,
    },
  ];

  // Create predictions
  console.log("📊 Creating predictions...");
  const predictions = await Promise.all(
    predictionTemplates.map((template, i) => {
      const creator = users[i % users.length];
      const basePool = Math.floor(Math.random() * 5000) + 500;
      const yesRatio = 0.3 + Math.random() * 0.4; // 30-70%

      return prisma.prediction.create({
        data: {
          title: template.title,
          description: template.description,
          symbol: template.symbol,
          direction: template.direction,
          entryPrice: new Decimal(template.entryPrice),
          targetPrice: new Decimal(template.targetPrice),
          tradeImage: template.tradeImage,
          expiresAt: new Date(
            Date.now() + template.daysUntilExpiry * 24 * 60 * 60 * 1000
          ),
          creatorId: creator.id,
          address: "",
          totalPool: new Decimal(basePool),
          yesPool: new Decimal(Math.floor(basePool * yesRatio)),
          noPool: new Decimal(Math.floor(basePool * (1 - yesRatio))),
          status: i > 10 ? "ACTIVE" : "ACTIVE", // All active for now
        },
      });
    })
  );

  console.log(`✅ Created ${predictions.length} predictions`);

  // Create 2 resolved predictions (past)
  console.log("🏆 Creating resolved predictions...");
  const resolvedPredictions = await Promise.all([
    prisma.prediction.create({
      data: {
        title: "BTC hit $70K - RESOLVED YES",
        description:
          "Bitcoin successfully broke through $70,000 resistance. Bulls won!",
        symbol: "BTC/USD",
        direction: "LONG",
        entryPrice: new Decimal(65000),
        targetPrice: new Decimal(70000),
        tradeImage:
          "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=600&fit=crop",
        status: "RESOLVED_YES",
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        creatorId: users[0].id,
        address: "",
        totalPool: new Decimal(5000),
        yesPool: new Decimal(3500),
        noPool: new Decimal(1500),
      },
    }),
    prisma.prediction.create({
      data: {
        title: "ETH drop to $2800 - RESOLVED NO",
        description: "Ethereum held support, prediction did not hit target.",
        symbol: "ETH/USD",
        direction: "SHORT",
        entryPrice: new Decimal(3200),
        targetPrice: new Decimal(2800),
        tradeImage:
          "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop",
        status: "RESOLVED_NO",
        resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        creatorId: users[1].id,
        address: "",
        totalPool: new Decimal(3000),
        yesPool: new Decimal(1000),
        noPool: new Decimal(2000),
      },
    }),
  ]);

  console.log(`✅ Created ${resolvedPredictions.length} resolved predictions`);

  // Create bets for each prediction
  console.log("💰 Creating bets...");
  const bets = [];

  for (const prediction of predictions) {
    // Create 2-5 random bets per prediction
    const numBets = Math.floor(Math.random() * 4) + 2;

    for (let i = 0; i < numBets; i++) {
      const bettor = users[Math.floor(Math.random() * users.length)];
      const amount = Math.floor(Math.random() * 500) + 50;
      const position = Math.random() > 0.5 ? "YES" : "NO";
      const odds = 1.5 + Math.random() * 2; // 1.5 to 3.5

      const bet = await prisma.bet.create({
        data: {
          userId: bettor.id,
          predictionId: prediction.id,
          amount: new Decimal(amount),
          position,
          odds: new Decimal(odds.toFixed(2)),
          potentialWin: new Decimal((amount * odds).toFixed(2)),
          status: "ACTIVE",
        },
      });

      bets.push(bet);
    }
  }

  // Create bets for resolved predictions with win/loss status
  for (const prediction of resolvedPredictions) {
    const isYesWinner = prediction.status === "RESOLVED_YES";

    // Create 3-5 bets
    const numBets = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < numBets; i++) {
      const bettor = users[Math.floor(Math.random() * users.length)];
      const amount = Math.floor(Math.random() * 500) + 100;
      const position = i % 2 === 0 ? "YES" : "NO";
      const odds = 1.5 + Math.random() * 1.5;

      const didWin =
        (position === "YES" && isYesWinner) ||
        (position === "NO" && !isYesWinner);

      const bet = await prisma.bet.create({
        data: {
          userId: bettor.id,
          predictionId: prediction.id,
          amount: new Decimal(amount),
          position,
          odds: new Decimal(odds.toFixed(2)),
          potentialWin: new Decimal((amount * odds).toFixed(2)),
          status: didWin ? "WON" : "LOST",
        },
      });

      bets.push(bet);
    }
  }

  console.log(`✅ Created ${bets.length} bets`);

  // Summary
  console.log("\n🎉 Database seeded successfully!");
  console.log("📊 Summary:");
  console.log(`   👥 Users: ${users.length}`);
  console.log(`   📈 Active Predictions: ${predictions.length}`);
  console.log(`   🏆 Resolved Predictions: ${resolvedPredictions.length}`);
  console.log(`   💰 Bets: ${bets.length}`);
  console.log("\n✨ Ready to go!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
