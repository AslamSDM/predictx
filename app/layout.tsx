import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Orbitron } from "next/font/google"
import { Suspense } from "react"
import { Providers } from "./providers";
import '@rainbow-me/rainbowkit/styles.css';
import "./globals.css"

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
})

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark antialiased ${orbitron.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        <Providers>
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
