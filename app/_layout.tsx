import "../utils/polyfills"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Stack } from "expo-router"
import React from "react"
import { ToastProvider } from "../contexts/ToastContext"
import "../global.css"
import { appKit, wagmiAdapter } from "../utils/AppKitConfig"
import { WagmiProvider } from "wagmi"
import { AppKit, AppKitProvider } from "@reown/appkit-react-native"
import { View } from "react-native"

import { WalletKitProvider } from "../contexts/WalletKitContext"

const queryClient = new QueryClient()

export default function RootLayout() {
  return (
    <AppKitProvider instance={appKit}>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <WalletKitProvider>
            <ToastProvider>
              <Stack screenOptions={{ headerShown: false }} />
              {/* Wrapped in View for Android Expo Router issue */}
              <View style={{ position: "absolute", height: "100%", width: "100%", pointerEvents: "box-none", zIndex: 999 }}>
                <AppKit />
              </View>
            </ToastProvider>
          </WalletKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </AppKitProvider>
  )
}
