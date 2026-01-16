import { Text, TouchableOpacity, View } from "react-native"
import type { Vault } from "../types"
import { formatCurrency } from "../utils/formatters"

interface VaultCardProps {
  vault: Vault
  onPress: () => void
}

export default function VaultCard({ vault, onPress }: VaultCardProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-100"
      case "medium":
        return "bg-yellow-100"
      case "high":
        return "bg-red-100"
      default:
        return "bg-gray-100"
    }
  }

  const getRiskDot = (level: string) => {
    switch (level) {
      case "low":
        return "🟢"
      case "medium":
        return "🟡"
      case "high":
        return "🔴"
      default:
        return "⚪"
    }
  }

  return (
    <TouchableOpacity className="bg-white dark:bg-zinc-900/50 rounded-lg p-4 border border-gray-200 dark:border-zinc-800 active:opacity-70 shadow-sm" onPress={onPress}>
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-bold text-gray-900 dark:text-zinc-50">{vault.name}</Text>
        <Text className="text-2xl">{getRiskDot(vault.riskLevel)}</Text>
      </View>

      <View className="mb-3">
        <Text className="text-gray-500 dark:text-zinc-400 text-sm">Target APY</Text>
        <Text className="text-yellow-600 dark:text-yellow-400 font-bold">
          {vault.targetApy.min}% - {vault.targetApy.max}%
        </Text>
      </View>

      <View className="flex-row justify-between">
        <View>
          <Text className="text-gray-500 dark:text-zinc-400 text-xs">Your Balance</Text>
          <Text className="text-gray-900 dark:text-zinc-200 font-semibold">{formatCurrency(vault.balance)}</Text>
        </View>
        <View>
          <Text className="text-gray-500 dark:text-zinc-400 text-xs">TVL</Text>
          <Text className="text-gray-900 dark:text-yellow-400 font-semibold">{formatCurrency(vault.tvl)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}
