import { EIP1193Provider } from "@privy-io/react-auth";
import { createPublicClient, createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";

export const getWalletClient = (provider: EIP1193Provider) => {
    const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(provider),
    });

    return walletClient;
}

export const getPublicClient = (provider: EIP1193Provider) => {
    const publicClient = createPublicClient({
        chain: sepolia,
        transport: custom(provider),
    });

    return publicClient;
}