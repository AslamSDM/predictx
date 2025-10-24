# Database Seeding Guide 🌱

This guide explains how to populate your PredictX database with dummy data for testing and development.

## What Gets Created

The seed script generates:

- **10 Users** with random usernames and avatars (using DiceBear API)
- **12 Active Predictions** across various symbols (BTC, ETH, SOL, AAPL, TSLA, etc.)
- **2 Resolved Predictions** (1 YES winner, 1 NO winner)
- **Multiple Bets** per prediction (2-5 bets per active prediction, 3-5 per resolved)

## Running the Seed Script

### Prerequisites

Make sure your database is set up and connected:

```bash
# Check your .env file has DATABASE_URL
cat .env | grep DATABASE_URL

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### Method 1: Using npm script (Recommended)

```bash
cd frontend
npm run seed
```

### Method 2: Direct execution

```bash
cd frontend
npx tsx prisma/seed.ts
```

### Method 3: With Prisma CLI

```bash
cd frontend
npx prisma db seed
```

## What You'll See

The script will output progress messages:

```
🌱 Starting database seed...
🗑️  Clearing existing data...
👥 Creating users...
✅ Created 10 users
📊 Creating predictions...
✅ Created 12 predictions
🏆 Creating resolved predictions...
✅ Created 2 resolved predictions
💰 Creating bets...
✅ Created 50+ bets

🎉 Database seeded successfully!
📊 Summary:
   👥 Users: 10
   📈 Active Predictions: 12
   🏆 Resolved Predictions: 2
   💰 Bets: 50+

✨ Ready to go!
```

## Seed Data Details

### Users

- Random usernames (format: `{Adjective}{Noun}{Number}`)
  - Examples: `BraveDragon247`, `CryptoWhale892`, `SwiftTrader156`
- Random avatars from DiceBear API (6 different styles)
- Unique wallet addresses

### Predictions

#### Active Predictions:

1. **BTC/USD** - LONG to $75,000
2. **ETH/USD** - SHORT to $2,800
3. **SOL/USD** - LONG to $200
4. **AAPL** - LONG earnings play
5. **DOGE/USD** - SHORT reversal
6. **TSLA** - LONG rally to $250
7. **LINK/USD** - LONG breakout
8. **NVDA** - SHORT correction
9. **ADA/USD** - LONG ascending triangle
10. **MATIC/USD** - LONG surge
11. **GC=F (Gold)** - SHORT breakdown
12. **XRP/USD** - LONG legal clarity

#### Resolved Predictions:

1. **BTC hit $70K** - RESOLVED_YES (bulls won)
2. **ETH drop to $2800** - RESOLVED_NO (bulls won)

### Bets

- Random amounts: $50 - $550
- Random positions: YES or NO
- Realistic odds: 1.5x - 3.5x
- Active bets for ongoing predictions
- WON/LOST status for resolved predictions

## Clearing & Re-seeding

The script automatically clears existing data before seeding. If you want to keep existing data, comment out these lines in `seed.ts`:

```typescript
// Comment out these lines to keep existing data:
await prisma.bet.deleteMany({});
await prisma.prediction.deleteMany({});
await prisma.user.deleteMany({});
```

## Viewing the Data

After seeding, you can view the data in several ways:

### 1. Prisma Studio (Recommended)

```bash
cd frontend
npx prisma studio
```

Opens a web UI at http://localhost:5555

### 2. Your App

```bash
npm run dev
```

Visit http://localhost:3000/discover to see predictions

### 3. Database Client

Use any PostgreSQL client with your DATABASE_URL

## Troubleshooting

### Error: "Prisma Client not generated"

```bash
npx prisma generate
```

### Error: "Can't reach database server"

- Check your DATABASE_URL in .env
- Ensure PostgreSQL is running
- Test connection: `npx prisma db pull`

### Error: "Unique constraint failed"

- The script clears data first, but if it fails midway:

```bash
# Manually reset
npx prisma migrate reset
# Then re-seed
npm run seed
```

### Need fresh start?

```bash
# Drop everything and start over
npx prisma migrate reset --force
npm run seed
```

## Customization

Edit `prisma/seed.ts` to:

- Change number of users (line 27)
- Add more prediction templates (line 39)
- Adjust bet amounts (line 222)
- Modify pool sizes (line 205)

## Package.json Script

The seed script is configured in `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## Next Steps

After seeding:

1. ✅ Login with any user (email or OAuth)
2. 📊 Browse predictions on `/discover`
3. 💰 Place bets on predictions
4. 🎯 Create new predictions
5. 👤 View profiles to see user stats

Happy testing! 🚀
