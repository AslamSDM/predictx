# PredictX - Quick Start Guide

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (for user/prediction data)
- npm or pnpm package manager

---

## 📦 Installation

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Install Chat Server Dependencies

```bash
cd chat_server
npm install
```

### 3. Setup Environment Variables

Create `frontend/.env.local`:

```env
# Database (Required)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Privy Auth (Required)
NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id"

# Chat Server (Optional - defaults to localhost:3001)
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"

# Smart Contracts (Optional - for blockchain integration)
NEXT_PUBLIC_FACTORY_ADDRESS="0x..."
NEXT_PUBLIC_STAKE_TOKEN_ADDRESS="0x..."
```

### 4. Initialize Database

```bash
cd frontend
npx prisma generate
npx prisma db push
```

---

## ▶️ Running the Application

### Option 1: Start All Servers (Recommended)

```bash
# From the predictx root directory
chmod +x start-servers.sh
./start-servers.sh
```

### Option 2: Start Individually

**Terminal 1 - Chat Server:**

```bash
cd chat_server
node server.js
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

---

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Chat Server**: http://localhost:3001
- **Prisma Studio**: `npx prisma studio` (in frontend directory)

---

## 🎯 Features Implemented

### ✅ User Management

- Auto-creation on Privy login
- Wallet-based authentication
- User profile with wallet address

### ✅ Prediction Markets

- Create predictions with trade details
- Upload trade screenshots
- Set entry/target prices
- Expiry dates
- Smart contract integration hooks (ready to enable)

### ✅ Betting System

- Swipe YES/NO on predictions
- Dynamic odds calculation
- Pool management (yesPool, noPool, totalPool)
- Bet history tracking
- Smart contract integration hooks (ready to enable)

### ✅ Discovery Feed

- Infinite scroll
- Preloading for smooth UX
- Real-time updates from Zustand store

### ✅ Real-time Chat

- Chat room per prediction
- Emoji support
- Message history (last 100)
- Real-time message delivery
- Connection status indicator

---

## 📚 Documentation

- **`INTEGRATION_SUMMARY.md`** - Full database & smart contract integration guide
- **`CHAT_INTEGRATION.md`** - Complete chat system documentation
- **`ENV_SETUP.md`** - Environment variables reference

---

## 🔧 Development

### File Structure

```
predictx/
├── frontend/
│   ├── app/                    # Next.js pages
│   │   ├── discover/          # Discovery feed
│   │   ├── create/            # Create prediction
│   │   └── api/               # API routes
│   ├── components/            # React components
│   ├── lib/                   # Utilities & hooks
│   │   ├── hooks/            # Custom hooks
│   │   ├── store.ts          # Zustand stores
│   │   └── api.ts            # API client
│   └── prisma/               # Database schema
│
├── chat_server/
│   ├── server.js             # Socket.io server
│   └── ChatCache.js          # Message cache
│
└── contracts 2/              # Smart contracts
    ├── contracts/            # Solidity files
    └── scripts/              # Deployment scripts
```

### Key Technologies

- **Frontend**: Next.js 15, React 19, TypeScript
- **State**: Zustand
- **Database**: PostgreSQL + Prisma
- **Auth**: Privy (email/Telegram)
- **Chat**: Socket.io
- **Blockchain**: Viem + OP Sepolia
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion

---

## 🎮 Usage Guide

### For Users

1. **Login**: Click "Login" and use email or Telegram
2. **Browse**: Navigate to "Discover" to see predictions
3. **Bet**: Swipe right (YES) or left (NO) on predictions
4. **Chat**: Click 💬 icon to discuss predictions
5. **Create**: Click "Create" to make your own prediction

### For Developers

1. **Database changes**: Update `frontend/prisma/schema.prisma` then run `npx prisma db push`
2. **New API routes**: Add in `frontend/app/api/`
3. **Components**: Add in `frontend/components/`
4. **State management**: Use Zustand stores in `frontend/lib/store.ts`
5. **Smart contracts**: Deploy from `contracts 2/` directory

---

## 🚢 Deployment

### Frontend (Vercel/Netlify)

1. Connect GitHub repo
2. Set environment variables
3. Deploy main branch

### Chat Server (Railway/Render/DigitalOcean)

1. Deploy from `chat_server` directory
2. Set environment variables
3. Update `NEXT_PUBLIC_SOCKET_URL` in frontend

### Database (Vercel Postgres/Supabase)

1. Create database instance
2. Copy connection strings
3. Update `.env.local`
4. Run migrations

---

## 🐛 Common Issues

### Chat not connecting

- Make sure chat server is running on port 3001
- Check `NEXT_PUBLIC_SOCKET_URL` in `.env.local`
- Verify no firewall blocking port 3001

### Database errors

- Run `npx prisma generate` after schema changes
- Verify DATABASE_URL is correct
- Check if database is running

### Login not working

- Verify `NEXT_PUBLIC_PRIVY_APP_ID` is set
- Check Privy dashboard configuration
- Ensure localhost:3000 is in allowed domains

---

## 📞 Support & Resources

- **Prisma Docs**: https://prisma.io/docs
- **Privy Docs**: https://docs.privy.io
- **Socket.io Docs**: https://socket.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Viem Docs**: https://viem.sh

---

## 🎉 You're Ready!

Everything is set up and integrated:

- ✅ Users sync with database on login
- ✅ Predictions stored in database
- ✅ Bets tracked with pool updates
- ✅ Real-time chat per prediction
- ✅ Infinite scroll discovery feed
- ✅ Smart contract hooks ready

Start the servers and try it out! 🚀
