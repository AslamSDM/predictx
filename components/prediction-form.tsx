"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";

export default function PredictionForm() {
  const [title, setTitle] = useState("");
  const [orderId, setOrderId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [deadline, setDeadline] = useState("");
  const [stake, setStake] = useState("10");
  const [outcome, setOutcome] = useState<"tp" | "notp">("tp");
  const [preview, setPreview] = useState<string | null>(null);

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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Stub: integrate with smart contract / backend later
    console.log("[v0] New prediction payload:", {
      title,
      orderId,
      deadline,
      stake,
      outcome,
      hasImage: !!file,
    });
    alert(
      "Prediction created (stub). Replace with on-chain or API integration."
    );
  };

  return (
    <form onSubmit={onSubmit} className="panel p-4 md:p-6 glow space-y-4">
      <div className="space-y-1">
        <label className="text-sm text-foreground/80" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Will @trader hit TP on this EURUSD long?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
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
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-foreground/80" htmlFor="deadline">
            Expiration
          </label>
          <input
            id="deadline"
            type="datetime-local"
            className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <span className="text-sm text-foreground/80">Outcome</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOutcome("tp")}
              className={
                outcome === "tp"
                  ? "px-3 py-2 rounded-md bg-primary text-primary-foreground"
                  : "px-3 py-2 rounded-md border border-border text-foreground/80 hover:text-primary"
              }
              aria-pressed={outcome === "tp"}
            >
              Hit TP
            </button>
            <button
              type="button"
              onClick={() => setOutcome("notp")}
              className={
                outcome === "notp"
                  ? "px-3 py-2 rounded-md bg-accent text-accent-foreground"
                  : "px-3 py-2 rounded-md border border-border text-foreground/80 hover:text-accent"
              }
              aria-pressed={outcome === "notp"}
            >
              Miss TP
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-foreground/80" htmlFor="stake">
            Min Stake
          </label>
          <input
            id="stake"
            type="number"
            min={0}
            step="0.01"
            className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            required
          />
          <div className="text-xs text-foreground/60">
            Token selection coming later.
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-sm text-foreground/80">Payout</span>
          <div className="rounded-md border border-border p-3 text-sm">
            Winner takes pool — exact odds and fees to be defined via contract.
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground glow"
        >
          Create Prediction
        </button>
      </div>
    </form>
  );
}
