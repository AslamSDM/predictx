"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { useContract } from "@/lib/hooks/useContract";
import { useUserStore, usePredictionsStore } from "@/lib/store";
import { predictionApi, uploadApi } from "@/lib/api";
import type { TradeDirection } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function PredictionForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [initialLiquidity, setInitialLiquidity] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [deadline, setDeadline] = useState("");
  const [direction, setDirection] = useState<TradeDirection>("LONG");
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUserStore();
  const { addPrediction } = usePredictionsStore();
  const { createPrediction, isLoading: isContractLoading } = useContract();

  // Helper function to get minimum allowed time (1 hour from now)
  const getMinimumTime = () => {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    return oneHourFromNow.toISOString().slice(0, 16);
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("Please login first");
      return;
    }

    // Validate expiration time (must be at least 1 hour from now)
    const selectedTime = new Date(deadline);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    if (selectedTime <= oneHourFromNow) {
      setError("Expiration time must be at least 1 hour from now");
      return;
    }

    // Validate initial liquidity
    const liquidityAmount = parseFloat(initialLiquidity);
    if (isNaN(liquidityAmount) || liquidityAmount <= 0) {
      setError("Initial liquidity must be a positive number");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Upload image if present
      let imageUrl = "";
      if (file) {
        const uploadResult = await uploadApi.uploadImage(file);
        imageUrl = uploadResult.url;
      }

      // 2. Create prediction on blockchain
      // Convert symbol to uppercase for contract (e.g., "BTCUSD", "ETHUSD")
      const pairName = symbol.toUpperCase().replace("/", "");
      const endTime = new Date(deadline);
      const initialLiquidityAmount = parseFloat(initialLiquidity);

      // TODO: This is a hook for blockchain integration
      // Uncomment when you have deployed contracts
      const contractAddresses = await createPrediction({
        pairName,
        direction,
        targetPrice: parseFloat(targetPrice),
        endTime,
        metadataURI: JSON.stringify({ title, description, imageUrl }),
        initialLiquidity: initialLiquidityAmount,
      })



      // 3. Create prediction in database
      const prediction = await predictionApi.create({
        title,
        description,
        symbol,
        direction,
        entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        tradeImage: imageUrl,
        orderId: undefined, // No longer using orderId
        expiresAt: endTime,
        // @ts-ignore - we'll pass this along with creatorId
        creatorId: user.id,
        // @ts-ignore - we'll pass this too
        address: contractAddresses[0],
        yesTokenAddress: contractAddresses[1],
        noTokenAddress: contractAddresses[2],
      });

      // 4. Add to store
      addPrediction(prediction);

      // 5. Show success and reset form
      alert("✅ Prediction created successfully!");

      // Reset form
      setTitle("");
      setDescription("");
      setSymbol("");
      setEntryPrice("");
      setTargetPrice("");
      setInitialLiquidity("");
      setFile(null);
      setPreview(null);
      setDeadline("");
      setDirection("LONG");
    } catch (err: any) {
      console.error("Error creating prediction:", err);
      setError(err.message || "Failed to create prediction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isContractLoading;

  return (
    <form onSubmit={onSubmit} className="panel p-4 md:p-6 glow space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm text-foreground/80" htmlFor="title">
          Title *
        </label>
        <input
          id="title"
          className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Will BTC hit $75k by end of week?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-foreground/80" htmlFor="description">
          Description *
        </label>
        <textarea
          id="description"
          className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
          placeholder="Strong bullish momentum with institutional buying..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-foreground/80" htmlFor="symbol">
            Trading Pair *
          </label>
          <input
            id="symbol"
            className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="BTC/USD"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            required
            disabled={isLoading}
          />
          <div className="text-xs text-foreground/60">
            Supported: BTC/USD, ETH/USD, BNB/USD, etc.
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-foreground/80" htmlFor="direction">
            Direction *
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDirection("LONG")}
              disabled={isLoading}
              className={
                direction === "LONG"
                  ? "px-4 py-2 rounded-md bg-green-500 text-white flex-1"
                  : "px-4 py-2 rounded-md border border-border text-foreground/80 hover:text-green-500 flex-1"
              }
            >
              LONG ↑
            </button>
            <button
              type="button"
              onClick={() => setDirection("SHORT")}
              disabled={isLoading}
              className={
                direction === "SHORT"
                  ? "px-4 py-2 rounded-md bg-red-500 text-white flex-1"
                  : "px-4 py-2 rounded-md border border-border text-foreground/80 hover:text-red-500 flex-1"
              }
            >
              SHORT ↓
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-foreground/80" htmlFor="entryPrice">
            Entry Price
          </label>
          <input
            id="entryPrice"
            type="number"
            step="0.00000001"
            className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="68500"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-foreground/80" htmlFor="targetPrice">
            Target Price
          </label>
          <input
            id="targetPrice"
            type="number"
            step="0.00000001"
            className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="75000"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-foreground/80" htmlFor="initialLiquidity">
            Initial Liquidity (PYUSD) *
          </label>
          <input
            id="initialLiquidity"
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="100.00"
            value={initialLiquidity}
            onChange={(e) => setInitialLiquidity(e.target.value)}
            required
            disabled={isLoading}
          />
          <div className="text-xs text-foreground/60">
            Amount of PYUSD to provide as initial liquidity
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-foreground/80" htmlFor="deadline">
            Expiration Date & Time *
          </label>
          <input
            id="deadline"
            type="datetime-local"
            className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            disabled={isLoading}
            min={getMinimumTime()} // Minimum 1 hour from now
          />
          <div className="text-xs text-foreground/60">
            When this prediction expires (minimum 1 hour from now)
            <br />
            <span className="text-primary">Earliest: {getMinimumTime().replace('T', ' ')}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-foreground/80" htmlFor="image">
          Trade image (optional)
        </label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={onFile}
          className="block text-sm text-foreground/70"
          disabled={isLoading}
        />
        {preview ? (
          <div className="mt-2 relative w-full h-48">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="rounded-md border border-border object-cover"
            />
          </div>
        ) : (
          <div className="text-xs text-foreground/50">
            PNG, JPG up to a few MB.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        <div className="text-xs text-foreground/60">* Required fields</div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground glow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? "Creating..." : "Create Prediction"}
        </button>
      </div>

      <div className="text-xs text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3">
        💡 <strong>Smart Contract Integration:</strong> This form will deploy a prediction market contract, 
        initialize YES/NO tokens, and set up the market with your initial liquidity. Make sure you have 
        enough PYUSD tokens for the initial liquidity amount.
      </div>
    </form>
  );
}
