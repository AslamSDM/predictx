import { getHighAndLow } from '@/lib/hyperliquid'
import React from 'react'

async function page() {

    const hl = await getHighAndLow({
        asset: "BTC",
        interval: "1h",
        startTime: Date.now() - 24 * 60 * 60 * 1000,
        endTime: Date.now()
    })

    console.log(hl)

    return (
        <div>page</div>
    )
}

export default page