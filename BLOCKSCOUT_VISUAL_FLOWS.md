# Blockscout Integration - Visual Flow Diagrams

## 🎯 Transaction Notification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER CREATES PREDICTION                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              useContract.createPrediction()                      │
│  • Validate inputs                                               │
│  • Check token allowance                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   STEP 1: TOKEN APPROVAL                         │
│  const approveHash = await walletClient.writeContract(...)      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         trackTransaction(approveHash, APPROVE, chainId)          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TOAST NOTIFICATION:                                      │  │
│  │  🔄 Token Approval: Transaction submitted...              │  │
│  │  [View on Blockscout →]                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│          await publicClient.waitForTransactionReceipt()          │
│                  (Wait for confirmation)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   (await tracker).success()                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TOAST UPDATED:                                           │  │
│  │  ✅ Token Approval Successful                             │  │
│  │  Transaction confirmed successfully!                      │  │
│  │  [View →]                                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            STEP 2: CREATE PREDICTION ON FACTORY                  │
│  const hash = await walletClient.writeContract(...)             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│      trackTransaction(hash, CREATE_PREDICTION, chainId)          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TOAST NOTIFICATION:                                      │  │
│  │  🔄 Create Prediction: Transaction submitted...           │  │
│  │  [View on Blockscout →]                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│          await publicClient.waitForTransactionReceipt()          │
│                  (Wait for confirmation)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   (await tracker).success()                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TOAST UPDATED:                                           │  │
│  │  ✅ Create Prediction Successful                          │  │
│  │  Transaction confirmed successfully!                      │  │
│  │  [View →]                                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PREDICTION CREATED ✅                          │
│  • Database record created                                       │
│  • User redirected to prediction page                            │
│  • Notifications auto-dismissed                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 💬 Chat MCP Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│         USER TYPES IN CHAT: "validate 0x742d35Cc..."            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND CHAT COMPONENT                       │
│  socket.emit("validate_contract", {                              │
│    contractAddress: "0x742d35Cc...",                            │
│    chainApiUrl: "https://eth-sepolia.blockscout.com/api",      │
│    room: predictionId                                            │
│  })                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Socket.io
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CHAT SERVER                                 │
│  socket.on("validate_contract", async (data) => {               │
│    const result = await mcpTools.validateTradeIdeaContract()    │
│    socket.emit("contract_validation_result", result)            │
│  })                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKSCOUT MCP MODULE                         │
│  validateTradeIdeaContract(address, apiUrl) {                   │
│    1. Get contract ABI                                           │
│    2. Get source code                                            │
│    3. Analyze safety                                             │
│    4. Return validation result                                   │
│  }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKSCOUT API CALLS                          │
│                                                                   │
│  Call 1: GET /api?module=contract&action=getabi                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Response: { status: "1", result: "[{...ABI...}]" }      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Call 2: GET /api?module=contract&action=getsourcecode          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Response: { status: "1", result: [{...source...}] }     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   VALIDATION ANALYSIS                            │
│                                                                   │
│  ✅ isVerified: true                                             │
│  ✅ hasSource: true                                              │
│  ✅ canInteract: true                                            │
│  ✅ isProxy: false                                               │
│                                                                   │
│  Recommendation: "Contract is verified and safe to interact"     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Socket.io
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND RECEIVES                           │
│  socket.on("contract_validation_result", (result) => {          │
│    displayInChat(result)                                         │
│  })                                                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CHAT MESSAGE FROM BOT:                                   │  │
│  │  ✅ Contract Validation Complete                          │  │
│  │  • Verified: Yes                                          │  │
│  │  • Safe to interact: Yes                                  │  │
│  │  • Contract: PredictionMarket                             │  │
│  │  • Recommendation: Safe to use                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🤖 AI Contract Analysis Flow

```
┌─────────────────────────────────────────────────────────────────┐
│         USER TYPES IN CHAT: "analyze 0x742d35Cc..."             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND CHAT COMPONENT                       │
│  socket.emit("analyze_contract", {                               │
│    contractAddress: "0x742d35Cc...",                            │
│    chainApiUrl: "https://eth-sepolia.blockscout.com/api",      │
│    room: predictionId                                            │
│  })                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKSCOUT MCP MODULE                         │
│  getContractFunctionsForAI(address, apiUrl) {                   │
│    1. Get contract ABI                                           │
│    2. Parse all functions                                        │
│    3. Categorize (read/write)                                    │
│    4. Analyze for prediction compatibility                       │
│    5. Generate suggestions                                       │
│  }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FUNCTION ANALYSIS                             │
│                                                                   │
│  Total Functions: 15                                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  READ FUNCTIONS (8):                                       │ │
│  │  • getPrice()                                              │ │
│  │  • balanceOf(address)                                      │ │
│  │  • totalSupply()                                           │ │
│  │  • pricePerToken()                                         │ │
│  │  • currentRate()                                           │ │
│  │  • owner()                                                 │ │
│  │  • decimals()                                              │ │
│  │  • symbol()                                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  WRITE FUNCTIONS (7):                                      │ │
│  │  • transfer(address, uint256)                              │ │
│  │  • approve(address, uint256)                               │ │
│  │  • mint(address, uint256)                                  │ │
│  │  • burn(uint256)                                           │ │
│  │  • setPrice(uint256)                                       │ │
│  │  • updateRate(uint256)                                     │ │
│  │  • pause()                                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              PREDICTION SUGGESTIONS GENERATOR                    │
│                                                                   │
│  Detected Patterns:                                              │
│  • 3 price-related functions → Price Movement predictions        │
│  • 2 balance functions → Balance Tracking predictions            │
│  • 1 supply function → Supply Change predictions                 │
│                                                                   │
│  Generated Suggestions:                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  1. Price Movement                                         │ │
│  │     "Token price will reach $X in Y days"                 │ │
│  │     Functions: getPrice, pricePerToken, currentRate       │ │
│  │                                                            │ │
│  │  2. Balance Tracking                                       │ │
│  │     "Total supply will increase by X%"                    │ │
│  │     Functions: totalSupply, balanceOf                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI ANALYST POSTS TO CHAT                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🤖 AI Analyst:                                           │  │
│  │                                                            │  │
│  │  Contract Analysis Complete:                              │  │
│  │                                                            │  │
│  │  📊 Functions: 15                                         │  │
│  │  📖 Read: 8                                               │  │
│  │  ✍️ Write: 7                                              │  │
│  │                                                            │  │
│  │  💡 Prediction Suggestions:                               │  │
│  │  • Price Movement: Contract has 3 price-related          │  │
│  │    functions that can be tracked                          │  │
│  │  • Balance/Supply Tracking: Contract has 2               │  │
│  │    balance-related functions                              │  │
│  │                                                            │  │
│  │  Click to create prediction based on these insights →    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Complete System Architecture

```
                     ┌─────────────────────────┐
                     │                         │
                     │    USER INTERACTION     │
                     │                         │
                     └───────────┬─────────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 │               │               │
                 ▼               ▼               ▼
        ┌────────────┐  ┌────────────┐  ┌────────────┐
        │   Create   │  │Place Bet   │  │   Chat     │
        │ Prediction │  │            │  │  Commands  │
        └──────┬─────┘  └──────┬─────┘  └──────┬─────┘
               │                │                │
               │                │                │
               ▼                ▼                ▼
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                     │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐    ┌──────────────────────────┐   │
│  │  useContract     │    │ useTransactionNotifications│   │
│  │  • createPred    │◄──►│ • trackTransaction        │   │
│  │  • placeBet      │    │ • notifySuccess           │   │
│  │  • resolve       │    │ • notifyError             │   │
│  └──────────────────┘    └─────────┬────────────────┘   │
│                                     │                      │
│                                     ▼                      │
│                           ┌──────────────────┐            │
│                           │  Sonner Toaster  │            │
│                           │  • Pending       │            │
│                           │  • Success       │            │
│                           │  • Error         │            │
│                           └──────────────────┘            │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           Socket.io Client (Chat)                    │ │
│  │  • emit: validate_contract                           │ │
│  │  • emit: analyze_contract                            │ │
│  │  • emit: get_transaction_status                      │ │
│  │  • on: contract_validation_result                    │ │
│  │  • on: contract_analysis_result                      │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────┬──────────────────────────────────┘
                        │
                        │ Socket.io + HTTPS
                        │
┌───────────────────────▼──────────────────────────────────┐
│                CHAT SERVER (Node.js)                      │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │        Socket.io Event Handlers                      │ │
│  │  • on: validate_contract                             │ │
│  │  • on: get_contract_abi                              │ │
│  │  • on: get_transaction_status                        │ │
│  │  • on: analyze_contract                              │ │
│  └──────────────────┬───────────────────────────────────┘ │
│                     │                                      │
│                     ▼                                      │
│  ┌──────────────────────────────────────────────────────┐ │
│  │         BlockscoutMCP Module                         │ │
│  │  • getContractABI()                                  │ │
│  │  • getContractSource()                               │ │
│  │  • validateContract()                                │ │
│  │  • getContractFunctions()                            │ │
│  │  • generatePredictionSuggestions()                   │ │
│  └──────────────────┬───────────────────────────────────┘ │
└────────────────────┬┴───────────────────────────────────┘
                     │
                     │ HTTPS API Requests
                     │
┌────────────────────▼────────────────────────────────────┐
│          BLOCKSCOUT API (Sepolia Testnet)               │
├─────────────────────────────────────────────────────────┤
│  • GET /api?module=contract&action=getabi               │
│  • GET /api?module=contract&action=getsourcecode        │
│  • GET /api?module=transaction&action=gettxinfo         │
│  • GET /api?module=transaction&action=gettxreceiptstatus│
└─────────────────────────────────────────────────────────┘
```

## 📱 User Journey Example

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User opens app                                       │
│ ✅ Login with Privy                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Navigate to Create Prediction                        │
│ • Fill out form:                                             │
│   - Symbol: BTC/USD                                          │
│   - Direction: LONG                                          │
│   - Target Price: $50,000                                    │
│   - End Time: 7 days                                         │
│   - Initial Liquidity: $100                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Click "Create Prediction"                            │
│                                                               │
│ 🔄 Toast appears:                                            │
│    "Token Approval: Transaction submitted..."                │
│    [View on Blockscout →]                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ (15 seconds later)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Approval confirmed                                   │
│                                                               │
│ ✅ Toast updates:                                            │
│    "Token Approval Successful"                               │
│    "Transaction confirmed successfully!"                     │
│                                                               │
│ 🔄 New toast appears:                                        │
│    "Create Prediction: Transaction submitted..."             │
│    [View on Blockscout →]                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ (20 seconds later)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Prediction created                                   │
│                                                               │
│ ✅ Toast updates:                                            │
│    "Create Prediction Successful"                            │
│    "Transaction confirmed successfully!"                     │
│                                                               │
│ ✅ Redirected to prediction page                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Open chat in prediction                              │
│ • Type: "validate 0x..."                                     │
│ • Blockscout Bot responds:                                   │
│   "✅ Contract verified and safe to interact"                │
│                                                               │
│ • Type: "analyze 0x..."                                      │
│ • AI Analyst responds:                                       │
│   "🤖 Contract has price tracking functions..."              │
│   "Suggestion: Create prediction for price movement"         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎉 Visual Summary

This integration provides:

1. **Transparent blockchain interactions** - Every transaction is visible
2. **Real-time status updates** - Users always know what's happening
3. **Direct explorer links** - One click to verify on Blockscout
4. **AI-powered insights** - Smart suggestions from contract data
5. **Chat-driven validation** - Easy contract verification
6. **Beautiful UX** - Smooth toast notifications

**All working together for the best user experience!** ✨
