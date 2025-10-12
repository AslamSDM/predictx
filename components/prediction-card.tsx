import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Prediction = {
  id: string
  trader: string
  title: string
  orderId?: string
  image?: string
  expiresIn: string
  yesOdds: number // 0 to 1
  totalPool: string
  status?: "open" | "resolved"
}

export default function PredictionCard({
  prediction,
  className,
}: {
  prediction: Prediction
  className?: string
}) {
  const { id, trader, title, orderId, image, expiresIn, yesOdds, totalPool, status = "open" } = prediction

  return (
    <article
      className={cn(
        "panel p-3 md:p-4 flex flex-col gap-3 hover:bg-card transition-colors",
        status === "open" ? "glow" : "",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs text-foreground/60">
          <span className="sr-only">Trader</span>@{trader}
        </div>
        <div className="text-xs">
          <span
            className={cn(
              "px-2 py-0.5 rounded-sm",
              status === "open" ? "bg-primary/10 text-primary" : "bg-foreground/10 text-foreground/90",
            )}
          >
            {status === "open" ? "Open" : "Resolved"}
          </span>
        </div>
      </div>

      <h3 className="font-serif text-lg leading-tight text-balance">{title}</h3>

      {image ? (
        <div className="relative w-full overflow-hidden rounded-md border border-border">
          {/* local placeholder pattern */}
          <Image
            src={image || "/placeholder.svg"}
            alt="Trade setup image"
            width={800}
            height={450}
            className="w-full h-auto"
          />
        </div>
      ) : (
        <div className="text-xs text-foreground/60">Order ID: {orderId}</div>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md border border-border p-2">
          <div className="text-foreground/60">Yes odds</div>
          <div className="font-mono">{Math.round(yesOdds * 100)}%</div>
        </div>
        <div className="rounded-md border border-border p-2">
          <div className="text-foreground/60">Pool</div>
          <div className="font-mono">{totalPool}</div>
        </div>
        <div className="rounded-md border border-border p-2">
          <div className="text-foreground/60">Time left</div>
          <div className="font-mono">{expiresIn}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/discover#${id}`}
          className="flex-1 text-center px-3 py-2 rounded-md bg-primary text-primary-foreground"
        >
          Participate
        </Link>
        <Link
          href={`/create?clone=${id}`}
          className="px-3 py-2 rounded-md border border-border hover:border-primary text-foreground/80 hover:text-primary transition-colors"
        >
          Clone
        </Link>
      </div>
    </article>
  )
}
