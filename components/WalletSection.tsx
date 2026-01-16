import { useAppKit } from "@reown/appkit-react-native"
import * as Haptics from "expo-haptics"
import React, { useState } from "react"
import { Text, TouchableOpacity, View } from "react-native"
import { parseUnits } from "viem"

import { useToast } from "../contexts/ToastContext"
import { useWalletKit } from "../contexts/WalletKitContext" // Still used for getting address/balance via the bridge
import { formatAddress, formatCurrency, fromBigInt } from "../utils/formatters"

export default function WalletSection() {
  const { open } = useAppKit()
  const { address, isConnected, disconnect } = useWalletKit()
  const [balance, setBalance] = useState<bigint>(0n) // Mock balance

  const { showToast } = useToast()

  const handleMint = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    showToast("Minting 1000 USDC...", "success")
    setTimeout(() => {
      setBalance(prev => prev + parseUnits("1000", 6))
      showToast("Minted!", "success")
    }, 1000)
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
          className="bg-blue-600 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-bold">Connect Wallet</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="bg-white dark:bg-zinc-900/50 rounded-lg p-4">
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className="text-xs text-gray-400">Connected Wallet</Text>
          <Text className="font-mono text-xs">{address ? formatAddress(address) : "..."}</Text>
        </View>
      </View>

      <Text className="text-xs text-gray-400">USDC Balance (Mock)</Text>
      <Text className="text-lg font-bold mb-3">
        {formatCurrency(fromBigInt(balance))}
      </Text>

      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={handleMint}
          className="flex-1 bg-yellow-500 p-2 rounded"
        >
          <Text className="text-center font-bold text-black">
            Mint Mock USDC
          </Text>
        </TouchableOpacity>

        {/* Optional explicit disconnect if W3mButton doesn't cover it fully or for custom UI */}
        {/* <TouchableOpacity
          onPress={handleDisconnect}
          className="bg-red-100 p-2 rounded"
        >
          <Text className="text-red-500 text-xs">Disconnect</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  )
}
