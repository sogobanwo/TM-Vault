import { useAppKit } from "@reown/appkit-react-native"
import * as Haptics from "expo-haptics"
import React, { useEffect } from "react" // Removed useState
import { Text, TouchableOpacity, View } from "react-native"
import { parseUnits } from "viem"

import { useToast } from "../contexts/ToastContext"
import { useWalletKit } from "../contexts/WalletKitContext"
import { useMintUSDC, useUSDCBalance } from "../hooks/useMockUSDC" // Import hooks
import { formatAddress, formatCurrency, fromBigInt } from "../utils/formatters"
import { formatError } from "../utils/errorFormatter"

export default function WalletSection() {
  const { open } = useAppKit()
  const { address, isConnected, disconnect } = useWalletKit()
  const { balance } = useUSDCBalance(address as `0x${string}`) // distinct from local state
  const { mint, isPending, isConfirmed, error: mintError } = useMintUSDC()

  const { showToast } = useToast()

  // Handle mint transaction status
  useEffect(() => {
    if (isPending) {
      showToast("Minting 1000 USDC...", "info")
    }
  }, [isPending])

  useEffect(() => {
    if (isConfirmed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      showToast("Minted 1000 USDC successfully!", "success")
    }
  }, [isConfirmed])

  useEffect(() => {
    if (mintError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      showToast(`Minting failed: ${formatError(mintError)}`, "error")
    }
  }, [mintError])


  const handleMint = async () => {
    if (!address) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      mint(address as `0x${string}`, parseUnits("1000", 6))
    } catch (e) {
      // Error handling is managed by the hook state usually, but catching synchronous errors safe
      console.error("Mint trigger error:", e)
    }
  }

  const handleDisconnect = async () => {
    await disconnect()
    showToast("Wallet disconnected", "success")
  }

  const handleConnectWallet = async () => {
    await open()
  }

  // If not connected, show the Connect Wallet button
  if (!isConnected) {
    return (
      <View className="bg-white dark:bg-zinc-900/50 rounded-lg p-6 items-center">
        <Text className="text-gray-500 mb-4 text-center">
          Connect your wallet to access the TM Vault
        </Text>
        <TouchableOpacity
          onPress={handleConnectWallet}
          className="bg-yellow-500 dark:bg-yellow-400 px-6 py-3 rounded-full"
        >
          <Text className="text-white dark:text-black font-bold">Connect Wallet</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="bg-white dark:bg-zinc-900/50 rounded-lg p-4">
      <View className="mb-3">
        <Text className="text-gray-500 dark:text-zinc-400 text-xs">Wallet Address</Text>
        <Text className="text-gray-800 dark:text-zinc-200 font-mono text-sm">{address ? formatAddress(address) : "..."}</Text>
      </View>

      <View className="mb-4">
        <Text className="text-gray-500 dark:text-zinc-400 text-xs">USDC Balance</Text>
        <Text className="text-gray-800 dark:text-zinc-200 font-semibold text-lg">{formatCurrency(fromBigInt(balance || BigInt(0)))}</Text>
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => open()}
          className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded py-2 px-4"
        >
          <Text className="text-gray-800 dark:text-zinc-200 text-center font-medium">Manage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleMint}
          className="flex-1 bg-yellow-500 rounded py-2 px-4"
        >
          <Text className="text-black text-center font-medium">Mint</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
