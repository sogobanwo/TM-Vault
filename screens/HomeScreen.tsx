
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "nativewind"
import React, { useEffect, useState } from "react"
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import VaultCard from "../components/VaultCard"
import WalletSection from "../components/WalletSection"
import { useAppStore } from "../store/useAppStore"
import { MOCK_VAULTS } from "../utils/mockContracts"

export default function HomeScreen({ navigation }: any) {
  const { wallet, setWallet } = useAppStore()
  const { colorScheme, toggleColorScheme } = useColorScheme()
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Initialize wallet from AsyncStorage
    initializeWallet()
  }, [])

  const initializeWallet = async () => {
    try {
      // Placeholder for AsyncStorage wallet restoration
      // In real implementation, restore persisted wallet
    } catch (error) {
      console.log("[v0] Wallet initialization error:", error)
    }
  }

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    // Simulate reloading balances
    setTimeout(() => {
      // Mock balance update - in real app, fetch from blockchain
      if (wallet.isConnected) {
        setWallet({ usdcBalance: wallet.usdcBalance + Math.random() * 10 })
      }
      setRefreshing(false)
    }, 1500)
  }, [wallet, setWallet])

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
              <View className={`w-2 h-2 rounded-full mr-2 ${wallet.isCorrectNetwork ? "bg-yellow-400" : "bg-red-500"}`} />
              <Text className="text-sm text-gray-600 dark:text-zinc-400">
                {wallet.isCorrectNetwork ? "HyperEVM Connected" : "Wrong Network"}
              </Text>
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
            {MOCK_VAULTS.map((vault) => (
              <VaultCard key={vault.id} vault={vault} onPress={() => handleVaultTap(vault.id)} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

