"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "@/components/site-nav";
import Silk from "@/components/Silk";
import { usePredictionsStore } from "@/lib/store";

export default function Page() {
  const { predictions, isLoading } = usePredictionsStore();
  const [stats, setStats] = useState({
    activePredictions: 0,
    totalVolume: 0,
  });

  useEffect(() => {
    // Update stats when predictions are loaded
    if (predictions.length > 0) {
      const totalVolume = predictions.reduce(
        (sum, pred) => sum + Number(pred.totalPool || 0),
        0
      );
      setStats({
        activePredictions: predictions.length,
        totalVolume,
      });
    }
  }, [predictions]);

  return (
    <main className="relative">
      <div className="fixed inset-0 -z-10">
        <Silk
          speed={5}
          scale={1}
          color="#12a2c2ff"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-16">
        <div className="panel glow p-6 md:p-10">
          <h1 className="font-serif text-3xl md:text-5xl text-balance">
            Bet on a trader's individual call:
            <span className="block text-primary mt-2">
              Will it hit TP or not?
            </span>
          </h1>
          <p className="mt-4 text-foreground/70 text-pretty leading-relaxed">
            Post a trade image or order ID, launch a prediction, and let the
            market decide. Connect your wallet to participate.
          </p>

          {/* Live Stats */}
          {predictions.length > 0 && (
            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-foreground/60">Active Markets:</span>
                <span className="font-bold text-primary">
                  {stats.activePredictions}+
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-foreground/60">Total Volume:</span>
                <span className="font-bold text-green-500">
                  ${stats.totalVolume.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/create"
              className="px-4 py-3 rounded-md bg-primary text-primary-foreground text-center glow"
            >
              Create a Prediction
            </Link>
            <Link
              href="/discover"
              className="px-4 py-3 rounded-md border border-border text-center hover:border-primary hover:text-primary transition-colors"
            >
              Discover Markets {predictions.length > 0 && `(${predictions.length}+)`}
            </Link>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="panel p-4">
            <h3 className="font-serif text-lg">Connect</h3>
            <p className="text-sm text-foreground/70 mt-1">
              Link your wallet and profile. Privacy-first, your keys stay with
              you.
            </p>
          </div>
          <div className="panel p-4">
            <h3 className="font-serif text-lg">Launch</h3>
            <p className="text-sm text-foreground/70 mt-1">
              Use an image or order ID and set expiration. Define your market's
              rules.
            </p>
          </div>
          <div className="panel p-4">
            <h3 className="font-serif text-lg">Participate</h3>
            <p className="text-sm text-foreground/70 mt-1">
              Back TP or No-TP with stakes. Pools settle transparently.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
