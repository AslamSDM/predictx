# Prediction Resolution System 🏆

A complete system for resolving expired predictions where users can earn fees.

## Overview

Users can resolve expired predictions by determining if the target price was reached. Resolvers earn a **2% fee** from the total pool.

## Pages Created

### `/resolve` - Resolution Dashboard

**Path:** `/app/resolve/page.tsx`

Beautiful interface showing all predictions that need resolution with:

- ✅ Real-time list of expired predictions
- 💰 Stats dashboard (pending count, total pool, potential fees)
- 🎯 Detailed prediction cards with trade images
- ⚡ One-click resolution with outcome modal
- 📊 Pool distribution visualization
- 🕐 Time expired indicator

## API Routes Created

### `POST /api/predictions/[id]/resolve`

**Path:** `/app/api/predictions/[id]/resolve/route.ts`

Handles prediction resolution with:

- ✅ Validates prediction is expired and active
- 💰 Calculates 2% resolution fee
- 🏆 Updates bet statuses (WON/LOST)
- 📊 Distributes winnings proportionally
- 🔒 Prevents double resolution

**Request Body:**

```json
{
  "outcome": "YES" | "NO",
  "resolvedBy": "user-id"
}
```

**Response:**

```json
{
  "prediction": {...},
  "resolutionFee": 100.00,
  "outcome": "YES",
  "resolvedBy": "user-id",
  "winningBets": 5,
  "losingBets": 3
}
```

### Enhanced `GET /api/predictions?status=expired`

**Path:** `/app/api/predictions/route.ts`

Added support for filtering expired predictions:

- `status=expired` - Returns ACTIVE predictions past expiry date
- Orders by expiry date (oldest first)
- Includes all bet and creator data

## Features

### 🎯 Resolution Process

1. **View Expired Predictions**

   - Navigate to `/resolve`
   - See all predictions past their expiry date
   - View pool sizes and potential fees

2. **Resolve a Prediction**

   - Click "Resolve & Earn $X.XX" button
   - Modal shows outcome options:
     - ✅ **YES - Target Reached**: Prediction was correct
     - ❌ **NO - Target Not Reached**: Prediction failed
   - Confirm selection

3. **System Actions**
   - Updates prediction status to `RESOLVED_YES` or `RESOLVED_NO`
   - Calculates and awards winnings
   - Updates all bet statuses
   - Resolver earns 2% fee
   - Removes from pending list

### 💰 Fee Structure

- **Resolution Fee:** 2% of total pool
- **Example:** $5,000 pool = $100 fee
- **Payment:** Instant (in smart contract implementation)

### 🏆 Winning Distribution

**For YES Resolution:**

- YES bettors share the NO pool proportionally + their original stakes
- NO bettors lose their stakes

**For NO Resolution:**

- NO bettors share the YES pool proportionally + their original stakes
- YES bettors lose their stakes

**Example:**

```
Total Pool: $10,000
YES Pool: $6,000 (3 bets)
NO Pool: $4,000 (2 bets)

If resolved YES:
- Resolution fee: $200 (2%)
- Each YES bettor gets their stake back + proportional share of $4,000
- NO bettors lose everything

If resolved NO:
- Resolution fee: $200 (2%)
- Each NO bettor gets their stake back + proportional share of $6,000
- YES bettors lose everything
```

### 📊 Stats Dashboard

Real-time tracking of:

- **Pending Resolution:** Count of expired predictions
- **Total Pool Value:** Sum of all unresolved pools
- **Potential Fees:** Total earnings available (2% of all pools)

### 🎨 UI Features

- **Auto-refresh:** Updates every 30 seconds
- **Trade Images:** Visual context for predictions
- **Pool Visualization:** YES/NO distribution bars
- **Time Indicators:** Shows how long ago prediction expired
- **Loading States:** Smooth transitions and spinners
- **Empty State:** Clean message when no predictions need resolution
- **Responsive Design:** Works on all screen sizes

## Navigation

Added "Resolve" link to main navigation:

- Home → Discover → Create → **Resolve**
- Visible to all users
- Badge could show pending count (future enhancement)

## Usage Examples

### User Flow

```
1. User visits /resolve
   ↓
2. Sees list of expired predictions
   ↓
3. Clicks "Resolve & Earn $50.00"
   ↓
4. Modal opens with YES/NO options
   ↓
5. User clicks "YES - Target Reached ✓"
   ↓
6. System:
   - Updates prediction to RESOLVED_YES
   - Marks winning bets as WON
   - Marks losing bets as LOST
   - Awards 2% fee to resolver
   ↓
7. Success message shown
   ↓
8. Prediction removed from list
```

### Code Usage

**Check for expired predictions:**

```typescript
const res = await fetch("/api/predictions?status=expired");
const data = await res.json();
console.log(`${data.predictions.length} predictions need resolution`);
```

**Resolve a prediction:**

```typescript
const res = await fetch(`/api/predictions/${predictionId}/resolve`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    outcome: "YES",
    resolvedBy: userId,
  }),
});

const result = await res.json();
console.log(`Earned: $${result.resolutionFee}`);
```

## Security Considerations

- ✅ Validates user is logged in
- ✅ Checks prediction is actually expired
- ✅ Prevents double resolution
- ✅ Validates outcome is YES or NO only
- ⚠️ Currently anyone can resolve (no reputation system)
- ⚠️ No dispute mechanism yet

## Future Enhancements

1. **Reputation System**

   - Track resolver accuracy
   - Require stake to resolve
   - Dispute/challenge mechanism

2. **Multi-Resolver Consensus**

   - Require 2-3 resolvers to agree
   - Majority vote determines outcome
   - Split fees among agreeing resolvers

3. **Automated Price Oracles**

   - Integration with Chainlink/Pyth
   - Auto-resolve based on actual prices
   - Fallback to manual resolution

4. **Resolution History**

   - Track all resolutions per user
   - Leaderboard of top resolvers
   - Accuracy statistics

5. **Notification System**

   - Alert users of new expired predictions
   - Notify bettors when their prediction resolves

6. **Fee Tiers**
   - Higher fees for larger pools
   - Bonus for quick resolution
   - Reputation-based fee multipliers

## Testing

### Manual Testing Steps

1. **Create test prediction with short expiry:**

   ```sql
   -- In Prisma Studio or psql
   UPDATE "Prediction"
   SET "expiresAt" = NOW() - INTERVAL '1 hour'
   WHERE id = 'your-prediction-id';
   ```

2. **Visit `/resolve`**

   - Should see the expired prediction
   - Check all data displays correctly

3. **Resolve as YES:**

   - Click resolve button
   - Select YES outcome
   - Verify success message

4. **Check database:**

   - Prediction status = `RESOLVED_YES`
   - Winning bets status = `WON`
   - Losing bets status = `LOST`

5. **Visit profile page:**
   - Should see resolved prediction
   - Bets should show correct status

### Edge Cases to Test

- ✅ No expired predictions (empty state)
- ✅ Prediction already resolved (error)
- ✅ User not logged in (disabled button)
- ✅ Network error during resolution
- ✅ Multiple resolvers attempting simultaneously

## Files Modified/Created

**New Files:**

- `/app/resolve/page.tsx` - Resolution dashboard UI
- `/app/api/predictions/[id]/resolve/route.ts` - Resolution API

**Modified Files:**

- `/app/api/predictions/route.ts` - Added expired status filter
- `/components/site-nav.tsx` - Added Resolve link

## Summary

The resolution system provides:

- 🎯 Clean interface for resolving predictions
- 💰 Incentive system (2% fees)
- 🏆 Fair winning distribution
- 📊 Real-time stats and tracking
- ✅ Complete bet lifecycle management

Users can now participate in the platform not just as bettors, but as resolvers, earning fees while maintaining the integrity of the prediction market! 🚀
