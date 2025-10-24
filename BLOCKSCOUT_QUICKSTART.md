# Blockscout Integration - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
# Chat Server
cd chat_server
npm install axios

# Frontend (sonner already installed)
cd ../frontend
# No additional packages needed
```

### Step 2: Start Servers

```bash
# Terminal 1 - Chat Server
cd chat_server
npm start

# Terminal 2 - Frontend
cd frontend
pnpm dev
```

### Step 3: Test Transaction Notifications

1. Login to the app
2. Create a new prediction
3. Watch for toast notifications:
   - "🔄 Approve: Transaction submitted..."
   - "✅ Approve Successful"
   - "🔄 Create Prediction: Transaction submitted..."
   - "✅ Create Prediction Successful"
4. Click "View on Blockscout" to see transaction details

### Step 4: Test Chat MCP Tools

1. Open any prediction chat
2. Send: `validate 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
3. Bot responds with validation result
4. Send: `analyze 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
5. AI Analyst responds with contract analysis

## ✨ Features You Get

### 1. Transaction Notifications

Every blockchain transaction now shows:

- **Pending state** with loading spinner
- **Success state** with checkmark
- **Error state** with error message
- **Direct link** to Blockscout explorer

### 2. Chat Commands

- `validate [address]` - Validate contract
- `analyze [address]` - Analyze contract functions
- `status [txHash]` - Check transaction status

### 3. AI Integration

The AI can now:

- Validate contracts automatically
- Suggest predictions based on contract functions
- Track transaction status
- Provide on-chain data

## 📁 Files Added/Modified

### Frontend

**New Files:**

- `lib/blockscout/config.ts` - Blockscout configuration
- `lib/hooks/useTransactionNotifications.ts` - Notification hook

**Modified Files:**

- `lib/hooks/useContract.ts` - Added transaction tracking
- `app/layout.tsx` - Added Toaster component

### Chat Server

**New Files:**

- `BlockscoutMCP.js` - MCP tools for blockchain data

**Modified Files:**

- `server.js` - Added MCP event handlers
- `package.json` - Added axios dependency

## 🎯 Usage Examples

### Frontend - Track Transaction

```typescript
import { useTransactionNotifications } from '@/lib/hooks/useTransactionNotifications';
import { TransactionType } from '@/lib/blockscout/config';

const { trackTransaction } = useTransactionNotifications();

// In your transaction function
const hash = await walletClient.writeContract({...});

const tracker = trackTransaction(
  hash,
  TransactionType.PLACE_BET,
  11155111
);

await publicClient.waitForTransactionReceipt({ hash });
(await tracker).success();
```

### Chat - Validate Contract

```javascript
// From frontend chat component
socket.emit("validate_contract", {
  contractAddress: "0x...",
  chainApiUrl: "https://eth-sepolia.blockscout.com/api",
  room: predictionId,
});

socket.on("contract_validation_result", (result) => {
  if (result.isValid) {
    console.log("✅ Contract is safe to use");
  }
});
```

### Chat - Get Transaction Status

```javascript
socket.emit("get_transaction_status", {
  txHash: "0x...",
  room: predictionId,
});

// Bot automatically posts to chat:
// "✅ Transaction confirmed successfully!"
```

## 🔧 Configuration

### Change Chain (e.g., to Mainnet)

Edit `frontend/lib/blockscout/config.ts`:

```typescript
export const mainnetConfig: ChainConfig = {
  chainId: 1,
  chainName: "Ethereum Mainnet",
  apiUrl: "https://eth.blockscout.com/api",
  explorerUrl: "https://eth.blockscout.com",
  rpcUrl: "https://eth.llamarpc.com",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
};

export const DEFAULT_CHAIN_CONFIG = mainnetConfig; // Change default
```

### Customize Toast Position

Edit `app/layout.tsx`:

```tsx
<Toaster
  position="bottom-right" // Change position
  expand={true}
  richColors
  closeButton
  theme="dark"
/>
```

## 🐛 Troubleshooting

### Issue: Notifications not showing

**Fix:**

```bash
# Verify sonner is installed
cd frontend
pnpm list sonner

# If not, install it
pnpm add sonner
```

### Issue: MCP tools not responding

**Fix:**

```bash
# Check chat server is running
cd chat_server
npm start

# Verify axios is installed
npm list axios

# If not, install it
npm install axios
```

### Issue: "Contract not verified" error

**Fix:**

- Contract must be verified on Blockscout first
- Use https://sepolia.etherscan.io to verify contracts
- Or use the contract verification script in `contracts/scripts/`

## 📊 What Gets Tracked

### Transaction Types

All these transactions show notifications:

1. **CREATE_PREDICTION** - Creating predictions
2. **PLACE_BET** - Betting on predictions
3. **RESOLVE_PREDICTION** - Resolving outcomes
4. **APPROVE** - Token approvals
5. **INITIALIZE_MARKET** - Market setup
6. **CLAIM_WINNINGS** - Claiming rewards

### MCP Events

All these events work in chat:

1. **validate_contract** - Check if safe
2. **get_contract_abi** - Get contract interface
3. **get_transaction_status** - Check tx status
4. **analyze_contract** - Full analysis with AI suggestions

## 🎉 You're Done!

Your app now has:

- ✅ Beautiful transaction notifications
- ✅ Blockscout explorer integration
- ✅ AI-powered contract validation
- ✅ Chat-driven blockchain interactions

## 📚 Next Steps

- Read full docs: `BLOCKSCOUT_INTEGRATION.md`
- Test all transaction types
- Try contract analysis in chat
- Customize notification styles

## 💡 Pro Tips

1. **Click notifications** to view on Blockscout
2. **Use chat commands** for quick contract checks
3. **AI suggestions** help create better predictions
4. **Track all transactions** automatically

---

**Questions?** Check the full documentation in `BLOCKSCOUT_INTEGRATION.md`
