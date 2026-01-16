import React, { createContext, useContext, useEffect, useState } from "react"
import { PublicClient, WalletClient } from "viem"
import { useAccount, usePublicClient, useWalletClient, useDisconnect } from "wagmi"

interface WalletKitContextType {
    address: string | undefined
    isConnected: boolean
    chainId: number | undefined
    isInitializing: boolean
    publicClient?: PublicClient
    walletClient?: WalletClient
    pair: (uri: string) => Promise<void>
    disconnect: () => Promise<void>
    reset: () => Promise<void>
}

const WalletKitContext = createContext<WalletKitContextType>({} as WalletKitContextType)

export function WalletKitProvider({ children }: { children: React.ReactNode }) {
    const { address, isConnected, chainId } = useAccount()
    const { data: walletClient } = useWalletClient()
    const publicClient = usePublicClient()
    const { disconnect: wagmiDisconnect } = useDisconnect()

    // Deprecated but kept for compatibility
    const pair = async (uri: string) => {
        console.warn("WalletKit: pair() is deprecated. Use Web3Modal to connect.")
    }

    const disconnect = async () => {
        await wagmiDisconnect()
    }

    const reset = async () => {
        await wagmiDisconnect()
    }

    return (
        <WalletKitContext.Provider
            value={{
                address,
                isConnected,
                chainId,
                isInitializing: false, // Wagmi handles this internally usually
                publicClient: publicClient as PublicClient,
                walletClient: walletClient as WalletClient,
                pair,
                disconnect,
                reset
            }}
        >
            {children}
        </WalletKitContext.Provider>
    )
}

export const useWalletKit = () => useContext(WalletKitContext)
