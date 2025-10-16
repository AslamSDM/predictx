import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, hardhat } from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'PredictX',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
    chains: [base, hardhat],
    ssr: true,
});