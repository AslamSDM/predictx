"use client";
import { useContract } from '@/lib/hooks/useContract';
import { cn } from '@/lib/utils';
import { getPublicClient } from '@/lib/web3';
import { PREDICTION_ABI } from '@/lib/web3/abi';
import { $Enums } from '@prisma/client';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import React, { useEffect, useState } from 'react'

type Props = {
    data: Prediction
}

enum Outcome {
    YES,
    NO,
    Undetermined
}

type Prediction = {
    targetPrice: string;
    entryPrice: string;
    totalPool: string;
    yesPool: string;
    noPool: string;
    symbol: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    description: string;
    tradeImage: string | null;
    orderId: string | null;
    direction: $Enums.TradeDirection;
    status: $Enums.PredictionStatus;
    address: string;
    yesTokenAddress: string | null;
    noTokenAddress: string | null;
    expiresAt: Date;
    resolvedAt: Date | null;
    creatorId: string;
}

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={cn("rounded-lg border text-card-foreground shadow-sm bg-slate-900 border-slate-800", className)} {...props} />
);
const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);
const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
    <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
);
const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={cn("p-6 pt-0", className)} {...props} />
);

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
    value?: number;
};

export const Progress = ({ className, value = 0, ...props }: ProgressProps) => (
    <div
        className={cn("relative h-3 w-full overflow-hidden rounded-full bg-slate-700", className)}
        {...props}
    >
        <div
            className="h-full w-full flex-1 bg-green-500 transition-all"
            style={{ transform: `translateX(-${100 - value}%)` }}
        />
    </div>
);

// --- Icons ---
type IconProps = React.SVGProps<SVGSVGElement>;

export const ArrowDown = (props: IconProps) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14" />
        <path d="m19 12-7 7-7-7" />
    </svg>
);

export const ArrowUp = (props: IconProps) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
    </svg>
);

function Prediction({ data }: Props) {


    const { getWallet } = useContract();
    const { ready: readyAuth, authenticated } = usePrivy()
    const { ready: readyWallets } = useWallets();

    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [winningAddress, setWinningAddress] = useState<string | null>(null);

    const { getWinningToken, getOutcome, redeemWinningTokens } = useContract()


    const predictionAddress = data.address // "0x091B6b05cDaa62966dac04205d46d5519339AA2D"

    useEffect(() => {
        if (readyAuth && readyWallets && authenticated) {
            const wallet = getWallet();

            const getOutComeStatus = async () => {

                const predictionOutCome = await getOutcome(predictionAddress);
                setOutcome(predictionOutCome)

                console.log("PREDICTION OUTCOME --------> ", predictionOutCome)

                if (predictionOutCome != 2) {
                    const wtoken = await getWinningToken(predictionAddress);
                    setWinningAddress(wtoken);
                    console.log("WINING TOKEN ---------------> ", wtoken)
                }

            }

            getOutComeStatus()
        }
    }, [readyAuth, readyWallets, authenticated])

    const yesPoolValue = parseFloat(data.yesPool.replace(/[^0-9.]/g, ''));
    const totalPoolValue = parseFloat(data.totalPool.replace(/[^0-9.]/g, ''));
    // const yesPercentage = totalPoolValue > 0 ? (yesPoolValue / totalPoolValue) * 100 : 0;
    const isShort = data.direction === "SHORT";

    const formattedExpiresAt = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    }).format(data.expiresAt);

    const handleRedeem = async () => {
        if (!winningAddress) {
            throw Error("no winning token address")
        }
        await redeemWinningTokens(predictionAddress, winningAddress);
    }

    const renderOutcome = () => {
        if (outcome === null) {
            return (
                <div className="flex items-center justify-center p-8 text-slate-400">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-lg">Fetching outcome...</span>
                </div>
            );
        }

        switch (outcome) {
            case Outcome.Undetermined:
                return (
                    <div className="text-center p-8">
                        <p className="text-lg text-amber-400 font-semibold">This prediction has not been resolved yet.</p>
                    </div>
                );
            case Outcome.YES:
            case Outcome.NO:
                const isYes = outcome === Outcome.YES;
                return (
                    <div className="p-6 text-center">
                        <p className="text-lg text-slate-300 mb-4">
                            The outcome is:
                            <span className={cn("font-bold ml-2", isYes ? "text-green-400" : "text-red-400")}>
                                {Outcome[outcome]}
                            </span>
                        </p>
                        <button
                            className={cn(
                                "w-full max-w-sm text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-300 shadow-lg",
                                isYes ? "bg-green-600 hover:bg-green-700 shadow-green-500/30" : "bg-red-600 hover:bg-red-700 shadow-red-500/30"
                            )}
                            onClick={handleRedeem}
                        >
                            Redeem your {Outcome[outcome]} tokens
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <main className="bg-slate-950 text-white p-4 md:p-8 font-sans">
            {/* Header Section */}
            <header className="mb-8">
                {data.tradeImage && (
                    <img
                        src={data.tradeImage}
                        alt={data.title}
                        className="w-full h-auto max-h-[400px] object-cover rounded-xl mb-6 border-2 border-slate-800"
                    />
                )}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <span className="text-sm text-slate-400 font-mono">
                            {data.symbol}
                        </span>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-50">{data.title}</h1>
                        <p className="text-slate-400 mt-2 max-w-3xl">
                            {data.description}
                        </p>
                    </div>
                    <div
                        className={cn(
                            "flex items-center gap-2 text-lg font-bold px-4 py-2 rounded-full w-fit mt-4 md:mt-0",
                            isShort
                                ? "bg-red-500/10 text-red-400"
                                : "bg-green-500/10 text-green-400"
                        )}
                    >
                        {isShort ? (
                            <ArrowDown className="h-5 w-5" />
                        ) : (
                            <ArrowUp className="h-5 w-5" />
                        )}
                        <span>{data.direction}</span>
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-8">
                {/* data Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-slate-100">Prediction Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-slate-400">Entry Price</span>
                            <span className="text-2xl font-bold text-slate-50">
                                {data.entryPrice}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1 p-4 rounded-lg bg-cyan-500/10 border-2 border-cyan-500">
                            <span className="text-sm text-cyan-300">Target Price (TP)</span>
                            <span className="text-2xl font-bold text-cyan-400">
                                {data.targetPrice}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-slate-400">Expires At</span>
                            <span className="text-2xl font-bold text-amber-400">
                                {formattedExpiresAt}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-slate-400">Created By</span>
                            <span className="text-lg font-mono bg-slate-700 px-3 py-1 rounded w-fit mt-1 text-slate-200">
                                {data.creatorId}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Outcome Section */}
            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-slate-100">Prediction Outcome</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderOutcome()}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

export default Prediction