import OpenAI from "openai";
import { mcpTools } from "./BlockscoutMCP";

interface LLMConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  baseURL?: string;
}

class LLMProvider {
  private client: OpenAI | null;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: LLMConfig = {}) {
    const apiKey =
      config.apiKey || process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
    console.log(
      "Using LLM API Key:",
      apiKey ? "✅ Provided" : "❌ Not Provided"
    );
    this.model = "gemini-2.5-flash";
    // ||
    // config.model ||
    // process.env.LLM_MODEL ||
    // "gpt-3.5-turbo";
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 1000;

    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        // baseURL: config.baseURL || process.env.OPENAI_BASE_URL,
      });
    } else {
      console.warn(
        "⚠️ No OpenAI API key configured. Using fallback responses."
      );
      this.client = null;
    }
  }

  async chat(
    messages: any[],
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<string> {
    if (!this.client) {
      console.warn(
        "⚠️ OpenAI client not initialized. Using fallback responses."
      );
      return this.fallbackResponse(messages);
    }
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as any,
        temperature: options.temperature || this.temperature,
        max_tokens: options.maxTokens || this.maxTokens,
      });
      console.log(
        "OpenAI Completion:",
        completion,
        completion.choices[0].message
      );
      return completion.choices[0].message.content || "";
    } catch (error: any) {
      console.error("OpenAI API Error:", error.message);
      if (error.status === 401) {
        console.error("❌ Invalid API key. Please check your OPENAI_API_KEY.");
      } else if (error.status === 429) {
        console.error("❌ Rate limit exceeded. Please try again later.");
      }
      return this.fallbackResponse(messages);
    }
  }

  private fallbackResponse(messages: any[]): string {
    const userMessage = messages[messages.length - 1]?.content || "";

    if (userMessage.toLowerCase().includes("validate")) {
      return "🤖 **Running in Fallback Mode**\n\nI'd analyze this prediction with AI, but I need an OpenAI API key to provide intelligent insights.\n\n**To enable AI features:**\n1. Get an API key from https://platform.openai.com\n2. Set `OPENAI_API_KEY` environment variable\n3. Restart the chat server\n\nFor now, I can still do basic validation checks using on-chain data!";
    }

    if (userMessage.toLowerCase().includes("summarize")) {
      return "🤖 **Running in Fallback Mode**\n\nTo provide an intelligent summary, I need access to OpenAI API.\n\n**Setup Instructions:**\n```bash\nexport OPENAI_API_KEY='your-api-key-here'\n```\n\nI can still show you the statistics and basic analysis from blockchain data!";
    }

    if (userMessage.toLowerCase().includes("analyze")) {
      return "🤖 **Running in Fallback Mode**\n\nContract analysis requires OpenAI API access.\n\n**Quick Setup:**\n1. Get API key from OpenAI\n2. Add to `.env`: `OPENAI_API_KEY=sk-...`\n3. Restart server\n\nI can still fetch contract data from Blockscout!";
    }

    return "🤖 **AI Features Unavailable**\n\nI'm running in fallback mode without OpenAI integration.\n\n**Enable AI by setting:**\n- `OPENAI_API_KEY` environment variable\n- Or use `LLM_API_KEY` for custom endpoints\n\n**Available Commands (no AI required):**\n- `@blockscout help` - Show all commands\n- Contract validation using Blockscout data\n- On-chain statistics and analysis";
  }
}

export class BlockscoutAI {
  private llm: LLMProvider;
  private systemPrompt: string;

  constructor(llmProvider?: LLMProvider) {
    this.llm = llmProvider || new LLMProvider();
    this.systemPrompt = `You are Blockscout AI, an expert blockchain analyst and prediction market advisor. You help users:

1. **Validate Predictions**: Analyze prediction markets for risks, opportunities, and on-chain validity
2. **Summarize Data**: Provide clear, actionable summaries of prediction markets with betting statistics
3. **Contract Analysis**: Interpret smart contract data and explain it in simple terms
4. **Market Insights**: Offer data-driven insights about market sentiment and trends

Your responses should be:
- Clear and concise
- Data-driven with specific numbers
- Use emojis for visual clarity (📊 📈 📉 ✅ ❌ ⚠️ 💡)
- Actionable with specific recommendations
- Professional but friendly

When analyzing predictions, consider:
- Contract verification status
- On-chain data validity
- Market sentiment from bet distribution
- Time factors and urgency
- Risk assessment

Format your responses with markdown for readability.`;
  }

  async validatePrediction(
    predictionData: any,
    blockscoutData: any = {},
    chainApiUrl = "https://eth-sepolia.blockscout.com/api"
  ): Promise<string> {
    const addresses = this.extractAddresses(predictionData.description || "");

    let contractData = blockscoutData;
    if (addresses.length > 0 && Object.keys(blockscoutData).length === 0) {
      try {
        const contractPromises = addresses
          .slice(0, 2)
          .map(async (address: string) => {
            const validation = await mcpTools.validateTradeIdeaContract(
              address,
              chainApiUrl
            );
            const functions = await mcpTools.getContractFunctionsForAI(
              address,
              chainApiUrl
            );
            return {
              address,
              validation,
              functions: functions.canAnalyze ? functions : null,
            };
          });

        const contractResults = await Promise.all(contractPromises);
        contractData = {
          contracts: contractResults,
          totalContracts: addresses.length,
        };
      } catch (error: any) {
        console.warn("Failed to fetch contract data:", error.message);
        contractData = { error: "Failed to fetch contract data" };
      }
    }

    const prompt = `Analyze this prediction market and provide a comprehensive validation:

**Prediction Details:**
- Symbol: ${predictionData.symbol}
- Direction: ${predictionData.direction}
- Target Price: $${predictionData.targetPrice}
- Current Price: $${predictionData.currentPrice || "N/A"}
- End Time: ${predictionData.endTime}
- Initial Liquidity: $${predictionData.initialLiquidity}
- Description: ${predictionData.description || "No description"}

**Contract Analysis:**
${JSON.stringify(contractData, null, 2)}

**Tasks:**
1. Validate if this prediction makes sense
2. Check if target price is realistic
3. Analyze contract data (if available) - check verification status, function analysis
4. Identify any red flags or warnings
5. Provide clear recommendations

**Format your response as:**

✅/❌ **Validation Status**: [Valid/Invalid]

**Analysis:**
[Your detailed analysis]

**Red Flags:** (if any)
• [Flag 1]
• [Flag 2]

**Recommendations:**
• [Recommendation 1]
• [Recommendation 2]

**Risk Level**: [Low/Medium/High]`;

    const messages = [
      { role: "system", content: this.systemPrompt },
      { role: "user", content: prompt },
    ];

    return await this.llm.chat(messages, { temperature: 0.3 });
  }

  async summarizePrediction(
    predictionData: any,
    bets: any[] = [],
    blockscoutData: any = {},
    chainApiUrl = "https://eth-sepolia.blockscout.com/api"
  ): Promise<string> {
    const totalBets = bets.length;
    const yesBets = bets.filter((b) => b.position === "YES").length;
    const noBets = bets.filter((b) => b.position === "NO").length;
    const totalYesAmount = bets
      .filter((b) => b.position === "YES")
      .reduce((sum, b) => sum + b.amount, 0);
    const totalNoAmount = bets
      .filter((b) => b.position === "NO")
      .reduce((sum, b) => sum + b.amount, 0);

    const addresses = this.extractAddresses(predictionData.description || "");
    let contractData = blockscoutData;
    if (addresses.length > 0 && Object.keys(blockscoutData).length === 0) {
      try {
        const contractPromises = addresses
          .slice(0, 2)
          .map(async (address: string) => {
            const validation = await mcpTools.validateTradeIdeaContract(
              address,
              chainApiUrl
            );
            const functions = await mcpTools.getContractFunctionsForAI(
              address,
              chainApiUrl
            );
            return {
              address,
              validation,
              functions: functions.canAnalyze ? functions : null,
            };
          });

        const contractResults = await Promise.all(contractPromises);
        contractData = {
          contracts: contractResults,
          totalContracts: addresses.length,
        };
      } catch (error: any) {
        console.warn("Failed to fetch contract data:", error.message);
        contractData = { error: "Failed to fetch contract data" };
      }
    }

    const prompt = `Provide an intelligent summary of this prediction market:

**Prediction:**
- Symbol: ${predictionData.symbol}
- Direction: ${
      predictionData.direction === "LONG"
        ? "📈 LONG (Bullish)"
        : "📉 SHORT (Bearish)"
    }
- Target Price: $${predictionData.targetPrice}
- Current Price: $${predictionData.currentPrice || "N/A"}
- Time Remaining: ${this.calculateTimeRemaining(predictionData.endTime)}

**Betting Statistics:**
- Total Bets: ${totalBets}
- YES Bets: ${yesBets} ($${totalYesAmount.toFixed(2)})
- NO Bets: ${noBets} ($${totalNoAmount.toFixed(2)})
- Total Pool: $${(totalYesAmount + totalNoAmount).toFixed(2)}

**Contract Analysis:**
${JSON.stringify(contractData, null, 2)}

**Tasks:**
1. Summarize the prediction in 2-3 sentences
2. Analyze market sentiment from bet distribution
3. Identify key insights from on-chain data and contract analysis
4. Provide betting recommendations based on data
5. Assess probability of outcome

**Format as:**

📊 **Market Summary**
[2-3 sentence overview]

🎯 **Sentiment Analysis**
[Sentiment with confidence level]

💡 **Key Insights**
• [Insight 1]
• [Insight 2]
• [Insight 3]

📈 **Recommendation**
[Your data-driven recommendation]

⚖️ **Probability Assessment**: [X% chance of YES winning]`;

    const messages = [
      { role: "system", content: this.systemPrompt },
      { role: "user", content: prompt },
    ];

    return await this.llm.chat(messages, { temperature: 0.7 });
  }

  async analyzeContract(
    contractAddress: string,
    contractData: any = {},
    chainApiUrl = "https://eth-sepolia.blockscout.com/api"
  ): Promise<string> {
    let enrichedContractData = contractData;
    if (Object.keys(contractData).length === 0) {
      try {
        const [validation, functions, source] = await Promise.all([
          mcpTools.validateTradeIdeaContract(contractAddress, chainApiUrl),
          mcpTools.getContractFunctionsForAI(contractAddress, chainApiUrl),
          mcpTools
            .getContractABI(contractAddress, chainApiUrl)
            .catch(() => ({ success: false })),
        ]);

        enrichedContractData = {
          validation,
          functions: functions.canAnalyze ? functions : null,
          abi: source.success ? source : null,
        };
      } catch (error: any) {
        console.warn("Failed to fetch contract data:", error.message);
        enrichedContractData = { error: "Failed to fetch contract data" };
      }
    }

    const prompt = `Analyze this smart contract and explain it in simple terms:

**Contract Address:** ${contractAddress}

**Contract Data:**
${JSON.stringify(enrichedContractData, null, 2)}

**Tasks:**
1. Explain what this contract does based on the function analysis
2. Identify key functions and their purposes
3. Assess if it's suitable for prediction markets
4. Suggest what predictions could be made about this contract
5. Highlight any risks or concerns based on verification status

**Format as:**

🔍 **Contract Overview**
[Simple explanation]

📝 **Key Functions**
• [Function 1]: [What it does]
• [Function 2]: [What it does]

💡 **Prediction Ideas**
• [Idea 1]
• [Idea 2]

⚠️ **Risk Assessment**
[Any concerns]`;

    const messages = [
      { role: "system", content: this.systemPrompt },
      { role: "user", content: prompt },
    ];

    return await this.llm.chat(messages);
  }

  async chat(userMessage: string, context: any = {}): Promise<string> {
    const contextStr =
      Object.keys(context).length > 0
        ? `\n**Context:**\n${JSON.stringify(context, null, 2)}\n\n`
        : "";

    const prompt = `${contextStr}**User Question:** ${userMessage}

Please provide a helpful response related to blockchain, predictions, or on-chain analysis.`;

    const messages = [
      { role: "system", content: this.systemPrompt },
      { role: "user", content: prompt },
    ];
    console.log("Chat Messages:", messages);
    return await this.llm.chat(messages);
  }

  private extractAddresses(text: string): string[] {
    const addressRegex = /0x[a-fA-F0-9]{40}/g;
    return text.match(addressRegex) || [];
  }

  private calculateTimeRemaining(endTime: string): string {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
}
