# Resolver Setup Guide

This guide explains how to set up the resolver backend that handles on-chain prediction resolution.

## Overview

The resolver backend uses a dedicated wallet with a private key to submit on-chain transactions for resolving predictions. This is necessary because the resolution requires calling the `report` function on the smart contract with Pyth price feeds.

## Setup Steps

### 1. Set the Resolver Private Key

You need to set an environment variable `RESOLVER_PRIVATE_KEY` with the private key of the wallet that will be used to resolve predictions.

**Option A: Using .env.local file (Recommended for development)**

Create a `.env.local` file in the `frontend` directory:

```bash
RESOLVER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

**Option B: Using environment variables directly**

```bash
export RESOLVER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

### 2. Generate a New Wallet (if needed)

If you don't have a wallet for this purpose, you can generate one using Node.js:

```javascript
// Using viem
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log('Private Key:', privateKey);
console.log('Address:', account.address);
```

Or using a simple script:

```bash
node -e "const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts'); const pk = generatePrivateKey(); const acc = privateKeyToAccount(pk); console.log('Private Key:', pk); console.log('Address:', acc.address);"
```

### 3. Fund the Resolver Wallet

The resolver wallet needs to have:
- **ETH (Sepolia)**: For gas fees and Pyth oracle fees
- **Recommended**: At least 0.01 ETH to start
- **Per resolution cost**: 
  - Pyth oracle fees (dynamically calculated, typically ~0.0001-0.0003 ETH per price feed)
  - Gas fees for the transaction
  - Total typically ranges from 0.0005 to 0.002 ETH per resolution

**Note**: The backend automatically calculates the exact Pyth fees required by querying the Pyth contract before submitting the transaction.

You can get Sepolia ETH from these faucets:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### 4. Security Considerations

⚠️ **IMPORTANT SECURITY NOTES:**

- **Never commit the private key to version control**
- Add `.env.local` to your `.gitignore` file
- Use a dedicated wallet for the resolver (don't reuse personal wallets)
- The resolver wallet should only have enough ETH for gas fees
- Consider using a hardware wallet or key management service in production

### 5. How It Works

When a prediction is resolved:

1. **Frontend (User's Wallet)**:
   - Approves stake tokens for the prediction contract
   - Calls the backend API with the three Pyth price feeds

2. **Backend (Resolver Wallet)**:
   - Receives the price feeds from the frontend
   - Calls the `report` function on the prediction contract with the price feeds
   - Waits for the transaction to be mined
   - Reads the outcome from the contract (0 = YES, 1 = NO)
   - Returns the outcome to the frontend

3. **Frontend**:
   - Receives the outcome from the backend
   - Updates the database with the resolved prediction

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `RESOLVER_PRIVATE_KEY` | Private key of the resolver wallet | Yes | `0x0000...` |
| `SEPOLIA_RPC_URL` | Sepolia RPC endpoint URL | No | `https://rpc.ankr.com/eth_sepolia` |

### Recommended RPC Providers

For better reliability, you can use your own RPC provider:

- **Alchemy**: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
- **Infura**: `https://sepolia.infura.io/v3/YOUR_API_KEY`
- **Ankr** (Default): `https://rpc.ankr.com/eth_sepolia`
- **Public**: `https://rpc.sepolia.org` (may be slower)

## Troubleshooting

### Error: "Failed to resolve on-chain"

- Check that the resolver wallet has enough ETH for gas
- Verify the private key is correct and starts with `0x`
- Make sure the prediction contract address is correct

### Error: "Failed to read outcome from contract"

- The contract may not have resolved yet (wait a few blocks)
- The price feeds may be invalid or outdated

### Gas Estimation Errors

- Ensure the resolver wallet has sufficient ETH balance
- Check that the prediction has actually expired
- Verify the Pyth price feeds are valid for the time period

## Testing

To test the resolver setup:

1. Create a test prediction with a short expiry time
2. Wait for it to expire
3. Go to the `/resolve` page
4. Click "Resolve" on the expired prediction
5. Check the console logs for the resolution process

## API Endpoint

The resolver backend is exposed at:

```
POST /api/predictions/resolve-onchain
```

Request body:
```json
{
  "predictionAddress": "0x...",
  "highPriceData": "0x...",
  "lowPriceData": "0x...",
  "currentPriceData": "0x..."
}
```

Response:
```json
{
  "success": true,
  "transactionHash": "0x...",
  "outcome": 0,
  "message": "Prediction resolved with outcome: YES"
}
```

