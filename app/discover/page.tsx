import SiteNav from "@/components/site-nav"
import PredictionCard from "@/components/prediction-card"

const DEMO = [
  {
    id: "m1",
    trader: "alpha_fx",
    title: "EURUSD long: TP at 1.10300 by EOD?",
    image: "/eurusd-chart-long-setup.jpg",
    expiresIn: "6h 41m",
    yesOdds: 0.62,
    totalPool: "3,420 USDC",
    status: "open" as const,
  },
  {
    id: "m2",
    trader: "hex_trader",
    title: "BTC scalp short — TP at 64.2k?",
    image: "/btc-scalp-short-analysis.jpg",
    expiresIn: "2h 09m",
    yesOdds: 0.47,
    totalPool: "1,180 USDC",
    status: "open" as const,
  },
  {
    id: "m3",
    trader: "quanta",
    title: "TSLA bounce to fill the morning gap?",
    image: "/tsla-gap-fill-chart.jpg",
    expiresIn: "22h 15m",
    yesOdds: 0.54,
    totalPool: "8,050 USDC",
    status: "open" as const,
  },
]

export default function DiscoverPage() {
  return (
    <main>
      <SiteNav />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl">Discover Markets</h1>
            <p className="text-sm text-foreground/70">Explore live predictions and back your edge.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO.map((p) => (
            <PredictionCard key={p.id} prediction={p} />
          ))}
        </div>
      </section>
    </main>
  )
}
