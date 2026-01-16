import AsyncStorage from "@react-native-async-storage/async-storage"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createWeb3Modal, defaultWagmiConfig, Web3Modal } from "@web3modal/wagmi-react-native"
import { Stack } from "expo-router"
import React, { useEffect, useState } from "react"
import { hyperliquidEvmTestnet } from "viem/chains"
import { WagmiProvider } from "wagmi"
import "../global.css"
import OnboardingScreen from "../screens/OnboardingScreen"

const projectId = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || ""

const metadata = {
  name: "TM Vault",
  description: "Token Metrics Vault",
  url: "https://tokenmetrics.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
  redirect: {
    native: "tmvault://",
  },
}

const chains = [hyperliquidEvmTestnet] as const

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata })

// Track if Web3Modal has been initialized (keep outside to avoid re-init on re-renders if component unmounts - though unlikely for root)
let web3ModalInitialized = false

const queryClient = new QueryClient()

// Helper to clear stale WalletConnect sessions
async function clearWalletConnectSessions() {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const wcKeys = keys.filter(key =>
      key.includes("wc@") ||
      key.includes("walletconnect") ||
      key.includes("WALLETCONNECT")
    )
    if (wcKeys.length > 0) {
      await AsyncStorage.multiRemove(wcKeys)
      console.log("Cleared stale WalletConnect sessions")
    }
  } catch (error) {
    console.warn("Failed to clear WalletConnect sessions:", error)
  }
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false)
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null)

  useEffect(() => {
    async function init() {
      // Clear stale sessions on mount to resolve "No matching key" / 403 errors
      await clearWalletConnectSessions()

      // Check first launch
      try {
        const hasLaunched = await AsyncStorage.getItem("hasLaunched")
        if (hasLaunched === null) {
          setIsFirstLaunch(true)
          await AsyncStorage.setItem("hasLaunched", "true")
        } else {
          setIsFirstLaunch(false)
        }
      } catch (error) {
        setIsFirstLaunch(false) // Default to normal flow on error
      }

      if (!web3ModalInitialized) {
        createWeb3Modal({
          projectId,
          wagmiConfig,
          defaultChain: hyperliquidEvmTestnet,
        })
        web3ModalInitialized = true
      }

      setIsReady(true)
    }

    init()
  }, [])

  if (!isReady || isFirstLaunch === null) {
    return null
  }

  if (isFirstLaunch) {
    return <OnboardingScreen />
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
        <Web3Modal />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
