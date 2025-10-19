import Link from "next/link";
import SiteNav from "@/components/site-nav";

export default function Page() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-16">
        <div className="panel glow p-6 md:p-10">
          <h1 className="font-serif text-3xl md:text-5xl text-balance">
            Bet on a trader’s individual call:
            <span className="block text-primary mt-2">
              Will it hit TP or not?
            </span>
          </h1>
          <p className="mt-4 text-foreground/70 text-pretty leading-relaxed">
            Post a trade image or order ID, launch a prediction, and let the
            market decide. Connect your wallet to participate.
          </p>
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
              Discover Markets
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
              Use an image or order ID and set expiration. Define your market’s
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
