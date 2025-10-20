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

  // Expanded symbols for diverse predictions
  const cryptoSymbols = [
    "BTC/USD",
    "ETH/USD",
    "SOL/USD",
    "DOGE/USD",
    "LINK/USD",
    "ADA/USD",
    "MATIC/USD",
    "XRP/USD",
    "DOT/USD",
    "AVAX/USD",
    "UNI/USD",
    "ATOM/USD",
    "LTC/USD",
    "BCH/USD",
    "XLM/USD",
    "ALGO/USD",
    "VET/USD",
    "FIL/USD",
    "AAVE/USD",
    "MKR/USD",
    "COMP/USD",
    "SUSHI/USD",
    "CRV/USD",
    "SNX/USD",
  ];

  const stockSymbols = [
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "TSLA",
    "NVDA",
    "META",
    "NFLX",
    "AMD",
    "INTC",
    "PYPL",
    "SQ",
    "COIN",
    "DIS",
    "BA",
    "JPM",
    "GS",
    "BAC",
    "WMT",
    "TGT",
    "NKE",
    "SBUX",
    "MCD",
    "V",
  ];

  const forexPairs = [
    "EUR/USD",
    "GBP/USD",
    "USD/JPY",
    "AUD/USD",
    "USD/CAD",
    "NZD/USD",
  ];

  const commodities = ["GC=F", "SI=F", "CL=F", "NG=F"];

  const allSymbols = [
    ...cryptoSymbols,
    ...stockSymbols,
    ...forexPairs,
    ...commodities,
  ];

  const bullishDescriptions = [
    "Strong bullish momentum with institutional buying. Technical analysis shows breakout pattern above key resistance.",
    "Multiple indicators aligning including golden cross on daily chart, increasing volume, and whale accumulation.",
    "RSI showing strength without being overbought. MACD crossover confirmed on 4H timeframe.",
    "Breaking out of consolidation pattern. Volume surge indicates strong buying pressure.",
    "Ascending triangle pattern forming. Higher lows showing accumulation phase.",
    "Cup and handle formation complete. Expecting explosive move to upside.",
    "Bullish engulfing candle on daily chart. Support holding strong at key level.",
    "Moving averages showing bullish alignment. 50MA crossing above 200MA.",
    "On-chain metrics showing accumulation by smart money. Exchange outflows increasing.",
    "Network activity at all-time high. Developer activity surging.",
    "Breaking above descending trendline resistance. Momentum shifting bullish.",
    "Volume profile shows strong support zone below. Risk/reward favors longs.",
  ];

  const bearishDescriptions = [
    "RSI showing bearish divergence on 4H chart. Expecting pullback to support level soon.",
    "Price action showing weakness at current levels with declining volume on upside attempts.",
    "Double top formation on daily chart. Distribution pattern evident.",
    "Overbought conditions on multiple timeframes. Healthy pullback expected.",
    "Breaking below key support level. Momentum turning negative.",
    "Death cross forming on daily chart. 50MA about to cross below 200MA.",
    "Bearish engulfing pattern confirmed. Sellers taking control.",
    "Rising wedge pattern suggests impending breakdown. Volume declining on rallies.",
    "MACD histogram showing bearish divergence. Selling pressure building.",
    "Breaking down from head and shoulders pattern. Target measured move lower.",
    "Support level becoming resistance. Failed breakout indicates weakness.",
    "Distribution detected by volume analysis. Smart money exiting positions.",
  ];

  const images = [
    "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1611532736570-e1e4263ce128?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=600&fit=crop",
  ];

  // Generate prediction templates dynamically
  const generatePredictionTemplate = (index: number) => {
    const symbol = allSymbols[index % allSymbols.length];
    const direction = Math.random() > 0.5 ? "LONG" : "SHORT";
    const isCrypto =
      symbol.includes("/USD") &&
      !symbol.includes("EUR") &&
      !symbol.includes("GBP") &&
      !symbol.includes("AUD") &&
      !symbol.includes("NZD") &&
      !symbol.includes("JPY") &&
      !symbol.includes("CAD");

    // Generate realistic prices based on symbol type
    let entryPrice: number;
    let targetPrice: number;

    if (symbol === "BTC/USD") {
      entryPrice = 65000 + Math.random() * 10000;
      targetPrice =
        direction === "LONG" ? entryPrice * 1.08 : entryPrice * 0.92;
    } else if (symbol === "ETH/USD") {
      entryPrice = 3000 + Math.random() * 500;
      targetPrice = direction === "LONG" ? entryPrice * 1.1 : entryPrice * 0.9;
    } else if (isCrypto) {
      entryPrice = Math.random() * 100 + 1;
      targetPrice =
        direction === "LONG" ? entryPrice * 1.15 : entryPrice * 0.85;
    } else if (stockSymbols.includes(symbol)) {
      entryPrice = 100 + Math.random() * 300;
      targetPrice =
        direction === "LONG" ? entryPrice * 1.06 : entryPrice * 0.94;
    } else if (forexPairs.includes(symbol)) {
      entryPrice = 0.8 + Math.random() * 0.4;
      targetPrice =
        direction === "LONG" ? entryPrice * 1.03 : entryPrice * 0.97;
    } else {
      entryPrice = 1000 + Math.random() * 1000;
      targetPrice =
        direction === "LONG" ? entryPrice * 1.05 : entryPrice * 0.95;
    }

    const descriptions =
      direction === "LONG" ? bullishDescriptions : bearishDescriptions;
    const description =
      descriptions[Math.floor(Math.random() * descriptions.length)];

    const directionText = direction === "LONG" ? "bullish on" : "bearish on";
    const moveText = direction === "LONG" ? "rally to" : "drop to";

    return {
      title: `${symbol} ${moveText} $${targetPrice.toFixed(2)}`,
      description,
      symbol,
      direction,
      entryPrice: parseFloat(entryPrice.toFixed(2)),
      targetPrice: parseFloat(targetPrice.toFixed(2)),
      tradeImage: images[Math.floor(Math.random() * images.length)],
      daysUntilExpiry: Math.floor(Math.random() * 12) + 3, // 3-14 days
    };
  };

  // Generate 200 predictions
  const predictionTemplates = Array.from({ length: 200 }, (_, i) =>
    generatePredictionTemplate(i)
  );

  // Keep some original detailed predictions at the start
  const featuredPredictions = [
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
  ];

  // Combine featured predictions with generated ones
  const allPredictionTemplates = [
    ...featuredPredictions,
    ...predictionTemplates,
  ];

  // Create predictions
  console.log("📊 Creating predictions...");
  const predictions = await Promise.all(
    allPredictionTemplates.map((template, i) => {
      const creator = users[i % users.length];
      const basePool = Math.floor(Math.random() * 5000) + 500;
      const yesRatio = 0.3 + Math.random() * 0.4; // 30-70%

      return prisma.prediction.create({
        data: {
          title: template.title,
          description: template.description,
          symbol: template.symbol,
          direction: template.direction as "LONG" | "SHORT",
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
          status: "ACTIVE", // All active
        },
      });
    })
  );

  console.log(`✅ Created ${predictions.length} active predictions`);

  // Create 10 resolved predictions (past) for variety
  console.log("🏆 Creating resolved predictions...");
  const resolvedPredictions = await Promise.all(
    Array.from({ length: 10 }, (_, i) => {
      const template = generatePredictionTemplate(i + 1000);
      const daysAgo = Math.floor(Math.random() * 7) + 1; // 1-7 days ago
      const isYesWin = Math.random() > 0.5;
      const basePool = Math.floor(Math.random() * 8000) + 2000;
      const yesRatio = isYesWin ? 0.6 : 0.4;

      return prisma.prediction.create({
        data: {
          title: `${template.symbol} ${
            isYesWin ? "✅ HIT TARGET" : "❌ MISSED"
          } - RESOLVED`,
          description: isYesWin
            ? `Target achieved! ${
                template.symbol
              } reached $${template.targetPrice.toFixed(2)} as predicted.`
            : `Target not reached. ${
                template.symbol
              } did not hit $${template.targetPrice.toFixed(2)} before expiry.`,
          symbol: template.symbol,
          direction: template.direction as "LONG" | "SHORT",
          entryPrice: new Decimal(template.entryPrice),
          targetPrice: new Decimal(template.targetPrice),
          tradeImage: template.tradeImage,
          status: (isYesWin ? "RESOLVED_YES" : "RESOLVED_NO") as
            | "RESOLVED_YES"
            | "RESOLVED_NO",
          resolvedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() - (daysAgo + 1) * 24 * 60 * 60 * 1000),
          creatorId: users[i % users.length].id,
          address: "",
          totalPool: new Decimal(basePool),
          yesPool: new Decimal(Math.floor(basePool * yesRatio)),
          noPool: new Decimal(Math.floor(basePool * (1 - yesRatio))),
        },
      });
    })
  );

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
