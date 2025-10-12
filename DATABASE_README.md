# PredictX - Trading Prediction Platform

A decentralized prediction platform where traders can create predictions about their trades and users can bet on the outcomes.

## Features

- 🔗 **Wallet Integration**: Connect with popular Web3 wallets
- 📊 **Trade Predictions**: Create predictions with trade screenshots and order IDs
- 💰 **Betting System**: Bet on whether trades will hit their targets
- 📈 **Real-time Odds**: Dynamic odds calculation based on betting pools
- 🏆 **Leaderboards**: Track top performing traders
- 📱 **Responsive Design**: Works on desktop and mobile

## Database Schema

The platform uses the following main entities:

### Users

- Wallet address (unique identifier)
- Username and avatar
- Created predictions and placed bets

### Predictions

- Trade details (symbol, direction, entry/target prices)
- Trade image and order ID
- Betting pools (YES/NO positions)
- Status tracking (ACTIVE, RESOLVED_YES, RESOLVED_NO, etc.)

### Bets

- Amount and position (YES/NO)
- Odds at time of betting
- Potential winnings
- Status tracking

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd predictx
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your database URL and other configuration:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/predictx"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push the schema to database (for development)
   npm run db:push

   # Or run migrations (for production)
   npm run db:migrate

   # Seed the database with sample data
   npm run db:seed
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

### Database Management

- **View data**: `npm run db:studio` - Opens Prisma Studio
- **Reset database**: `npm run db:push --force-reset`
- **Generate client**: `npm run db:generate`

## API Endpoints

### Users

- `POST /api/users` - Create/login user with wallet
- `GET /api/users?walletAddress=<address>` - Get user profile

### Predictions

- `POST /api/predictions` - Create new prediction
- `GET /api/predictions` - Get all predictions (with pagination)
- `GET /api/predictions/[id]` - Get specific prediction
- `PATCH /api/predictions/[id]` - Update prediction status

### Bets

- `POST /api/bets` - Place a bet
- `GET /api/bets` - Get bets (filtered by user/prediction)

### Utilities

- `POST /api/upload` - Upload trade images
- `GET /api/stats` - Platform statistics

## Database Schema Details

### Enums

- `TradeDirection`: LONG | SHORT
- `PredictionStatus`: ACTIVE | RESOLVED_YES | RESOLVED_NO | EXPIRED | CANCELLED
- `BetPosition`: YES | NO
- `BetStatus`: ACTIVE | WON | LOST | REFUNDED

### Key Relationships

- User → Predictions (one-to-many)
- User → Bets (one-to-many)
- Prediction → Bets (one-to-many)

### Indexes

The schema includes indexes on:

- User wallet addresses (unique)
- Prediction status and creation date
- Bet user and prediction relationships

## Deployment

### Environment Setup

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy to your preferred platform (Vercel, Railway, etc.)

### Production Considerations

- Use connection pooling for database
- Implement proper error handling and logging
- Add rate limiting for API endpoints
- Implement proper wallet signature verification
- Add image optimization and CDN for uploads
- Set up monitoring and analytics

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
