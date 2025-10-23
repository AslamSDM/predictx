# Resolver Implementation Summary

## Overview

This document summarizes the changes made to move the prediction resolution logic to the backend API using viem.

## Changes Made

### 1. New Backend API Route

**File**: `/app/api/predictions/resolve-onchain/route.ts`

A new backend API endpoint that:
- Uses viem to create a wallet client from a hardcoded private key (configured via `RESOLVER_PRIVATE_KEY` env variable)
- Accepts three Pyth price feeds as payload (highPriceData, lowPriceData, currentPriceData)
- **Calculates required Pyth fees** by querying the Pyth contract
- Simulates the transaction before executing to catch errors early
- Calls the `report` function on the prediction contract with the correct fees
- Waits for the transaction to be mined
- Reads the outcome from the contract (0 = YES, 1 = NO)
- Returns the outcome to the frontend

**Key Features**:
- ✅ Uses viem for blockchain interactions
- ✅ Private key loaded from environment variable
- ✅ **Automatically calculates Pyth oracle fees**
- ✅ Simulates transactions before execution
- ✅ Uses configurable RPC endpoint (SEPOLIA_RPC_URL)
- ✅ Waits for on-chain outcome resolution
- ✅ Returns outcome (1 or 0) to caller
- ✅ Proper error handling and logging
- ✅ Balance checks to ensure sufficient ETH

### 2. Modified Frontend Hook

**File**: `/lib/hooks/useContract.ts`

The `resolvePrediction` function was updated to:
- Only handle stake token approval (not the resolution transaction)
- Call the backend API at `/api/predictions/resolve-onchain` with price feeds
- Wait for the backend to complete the resolution and return the outcome
- Return the outcome value to the caller

**Flow**:
1. Check if user's wallet has sufficient allowance for stake tokens
2. If not, approve stake tokens for the prediction contract
3. Wait for approval transaction to complete
4. Call backend API with price feeds
5. Backend calls `report` function in parallel (user doesn't need to sign)
6. Wait for backend to return the outcome
7. Return outcome to caller

### 3. Updated Resolve Page

**File**: `/app/resolve/page.tsx`

Minor updates to:
- Add clearer logging for the resolution steps
- Fix type issues (changed `undefined` to `null` for optional price feeds)
- Update comments to reflect the new flow

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                                                               │
│  1. User clicks "Resolve"                                    │
│  2. Fetch Pyth price feeds                                   │
│  3. Call resolvePrediction()                                 │
│     ├─ Approve stake tokens (user wallet)                   │
│     └─ Call backend API with price feeds                    │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ POST /api/predictions/resolve-onchain
                         │ { predictionAddress, priceFeeds }
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
│                                                               │
│  1. Load resolver private key                                │
│  2. Create viem wallet client                                │
│  3. Call report() on prediction contract                     │
│  4. Wait for transaction to be mined                         │
│  5. Read outcome from contract                               │
│  6. Return outcome to frontend                               │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ { outcome: 0 or 1 }
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                                                               │
│  1. Receive outcome from backend                             │
│  2. Update database via /api/predictions/[id]/resolve       │
│  3. Show success message to user                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Set Environment Variable

Create a `.env.local` file in the `frontend` directory:

```bash
RESOLVER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

### 2. Fund the Resolver Wallet

The resolver wallet needs:
- Sepolia ETH for gas fees and Pyth oracle fees (at least 0.01 ETH recommended)
- Pyth fees are dynamically calculated per resolution (typically 0.0001-0.0003 ETH per price feed)
- Total cost per resolution: typically 0.0005-0.002 ETH (including gas)

### 3. Start the Application

```bash
npm run dev
```

### 4. Test the Resolution

1. Create a test prediction with a short expiry time
2. Wait for it to expire
3. Navigate to `/resolve` page
4. Click "Resolve" on the expired prediction
5. The resolution should complete automatically

## Benefits of This Approach

1. **Better UX**: Users only need to sign one transaction (approval), not the resolution transaction
2. **Automated Resolution**: Backend handles the resolution automatically with its own wallet
3. **No User Wallet Issues**: Users don't need ETH for the resolution transaction
4. **Parallel Execution**: After approval, backend immediately starts resolution without user interaction
5. **Reliable**: Backend waits for on-chain outcome before returning

## Security Considerations

⚠️ **Important**:
- The private key should be kept secure and never committed to version control
- Use a dedicated wallet for resolution (not a personal wallet)
- The resolver wallet should only have enough ETH for gas fees
- Consider using a key management service in production

## API Reference

### POST /api/predictions/resolve-onchain

Resolves a prediction on-chain using the backend resolver wallet.

**Request Body**:
```typescript
{
  predictionAddress: string;      // The prediction contract address
  highPriceData: string | null;   // Hex string of high price feed data
  lowPriceData: string | null;    // Hex string of low price feed data
  currentPriceData: string;       // Hex string of current price feed data (required)
}
```

**Response (Success)**:
```typescript
{
  success: true;
  transactionHash: string;        // Hash of the resolution transaction
  outcome: number;                // 0 = YES, 1 = NO
  message: string;                // Human-readable outcome message
}
```

**Response (Error)**:
```typescript
{
  error: string;                  // Error message
  details?: string;               // Additional error details
}
```

## Outcome Mapping

The smart contract returns:
- `0` = **YES** (prediction target was hit)
- `1` = **NO** (prediction target was not hit)

## Testing Checklist

- [ ] Set `RESOLVER_PRIVATE_KEY` environment variable
- [ ] Fund resolver wallet with Sepolia ETH
- [ ] Create a test prediction that expires soon
- [ ] Wait for prediction to expire
- [ ] Navigate to `/resolve` page
- [ ] Click "Resolve" button
- [ ] Check console logs for resolution flow
- [ ] Verify outcome is correct in the database
- [ ] Verify winning/losing bets are calculated correctly

## Troubleshooting

See `RESOLVER_SETUP.md` for detailed troubleshooting steps.

## Files Modified

1. ✅ Created: `/app/api/predictions/resolve-onchain/route.ts`
2. ✅ Modified: `/lib/hooks/useContract.ts` - Updated `resolvePrediction` function
3. ✅ Modified: `/app/resolve/page.tsx` - Updated resolution flow
4. ✅ Created: `RESOLVER_SETUP.md` - Setup documentation
5. ✅ Created: `RESOLVER_IMPLEMENTATION_SUMMARY.md` - This file

## Next Steps

1. Set the `RESOLVER_PRIVATE_KEY` environment variable
2. Fund the resolver wallet with Sepolia ETH
3. Test the resolution flow with a test prediction
4. Monitor the backend logs for any issues
5. Consider setting up automated monitoring for the resolver wallet balance

