"use client";
import { useContract } from '@/lib/hooks/useContract';
import { getPublicClient } from '@/lib/web3';
import { PREDICTION_ABI } from '@/lib/web3/abi';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import React, { useEffect } from 'react'

type Props = {
    address: string
}

function Prediction({ address }: Props) {


    const { getWallet } = useContract();
    const { ready: readyAuth, authenticated } = usePrivy()
    const { ready: readyWallets } = useWallets();

    useEffect(() => {
        if (readyAuth && readyWallets && authenticated) {
            console.log("YOOOOOOOOOOOOOOOOOOOOOOOOOOOOO")
            const wallet = getWallet();

            const getOutComeStatus = async () => {
                const provider = await wallet.getEthereumProvider();
                const publicClient = getPublicClient(provider);

                const outcome = await publicClient.readContract({
                    address: "0x091B6b05cDaa62966dac04205d46d5519339AA2D",
                    abi: PREDICTION_ABI,
                    functionName: "outcome",
                });

                console.log("YEEEEEEEEEEEEEEEEE", outcome)
            }

            getOutComeStatus()
        }
    }, [readyAuth, readyWallets, authenticated])

    return (
        <div>Prediction Address: {address}</div>
    )
}

export default Prediction