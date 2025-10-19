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
  const [orderId, setOrderId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [deadline, setDeadline] = useState("");
  const [direction, setDirection] = useState<TradeDirection>("LONG");
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUserStore();
  const { addPrediction } = usePredictionsStore();
  const { createPrediction, isLoading: isContractLoading } = useContract();

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

      // TODO: This is a hook for blockchain integration
      // Uncomment when you have deployed contracts
      // const contractAddress = await createPrediction({
      //   pairName,
      //   direction,
      //   targetPrice: parseFloat(targetPrice),
      //   endTime,
      //   metadataURI: JSON.stringify({ title, description, imageUrl }),
      // })

      // For now, use a placeholder address
      const contractAddress = `0x${Math.random().toString(16).slice(2, 42)}`;

      // 3. Create prediction in database
      const prediction = await predictionApi.create({
        title,
        description,
        symbol,
        direction,
        entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        tradeImage: imageUrl,
        orderId: orderId || undefined,
        expiresAt: endTime,
        // @ts-ignore - we'll pass this along with creatorId
        creatorId: user.id,
        // @ts-ignore - we'll pass this too
        address: contractAddress,
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
      setOrderId("");
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
          <label className="text-sm text-foreground/80" htmlFor="orderId">
            Order ID (optional)
          </label>
          <input
            id="orderId"
            className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. MT5-12345678"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-foreground/80" htmlFor="deadline">
            Expiration *
          </label>
          <input
            id="deadline"
            type="datetime-local"
            className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            disabled={isLoading}
          />
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
        💡 <strong>Blockchain Hook:</strong> The smart contract integration is
        ready but commented out. Deploy your contracts and update the{" "}
        <code>NEXT_PUBLIC_FACTORY_ADDRESS</code> environment variable to enable.
      </div>
    </form>
  );
}
