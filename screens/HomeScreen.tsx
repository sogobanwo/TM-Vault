import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "nativewind"
import React, { useCallback, useState } from "react"
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { baseSepolia } from "viem/chains"

import VaultCardWrapper from "../components/VaultCardWrapper"
import WalletSection from "../components/WalletSection"
import { useUserPosition } from "../hooks/useTMVault"
import { VAULT_METADATA } from "../utils/vaults"

import { useWalletKit } from "../contexts/WalletKitContext"

export default function HomeScreen({ navigation }: any) {
  const { colorScheme, toggleColorScheme } = useColorScheme()
  const [refreshing, setRefreshing] = useState(false)

  const { address, isConnected, chainId } = useWalletKit()
  const isCorrectNetwork = chainId === baseSepolia.id
  const switchChain = (_: any) => console.log("Switch chain not implemented for WalletKit yet")

  // Fetch all user positions once
  const { position, refetch } = useUserPosition(address as `0x${string}` | undefined)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetch()
    } catch (e) {
      console.error(e)
    } finally {
      setRefreshing(false)
    }
  }, [refetch])

  const handleVaultTap = (vaultId: string) => {
    navigation.navigate("deposit", { vaultId })
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-zinc-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FDC700" />}
      >
        {/* Header */}
        <View className="mb-6 flex-row justify-between items-start">
          <View>
            <Text className="text-3xl font-bold text-yellow-500 dark:text-zinc-50">TM Vault</Text>
            <View className="flex-row items-center mt-2">
              <View className={`w-2 h-2 rounded-full mr-2 ${!isConnected ? "bg-gray-400" : isCorrectNetwork ? "bg-yellow-400" : "bg-red-500"}`} />
              <Text className="text-sm text-gray-600 dark:text-zinc-400">
                {!isConnected
                  ? "Not Connected"
                  : isCorrectNetwork
                    ? "Base Sepolia Connected"
                    : "Wrong Network"}
              </Text>
              {isConnected && !isCorrectNetwork && (
                <TouchableOpacity
                  className="ml-2 bg-yellow-500 px-3 py-1 rounded-full"
                  onPress={() => switchChain({ chainId: baseSepolia.id })}
                >
                  <Text className="text-xs font-bold text-white">Switch</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={toggleColorScheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800"
          >
            <Ionicons
              name={colorScheme === "dark" ? "sunny" : "moon"}
              size={24}
              color={colorScheme === "dark" ? "#FDC700" : "#333"}
            />
          </TouchableOpacity>
        </View>

        {/* Wallet Section */}
        <WalletSection />

        {/* Vault Cards Section */}
        <View className="mt-8 mb-4">
          <Text className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4">Available Vaults</Text>
          <View className="gap-4">
            {VAULT_METADATA.map((vault) => (
              <VaultCardWrapper
                key={vault.id}
                metadata={vault}
                position={position}
                onPress={() => handleVaultTap(vault.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

