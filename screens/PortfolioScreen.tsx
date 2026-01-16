import { Ionicons } from "@expo/vector-icons"
import { format } from "date-fns"
import * as Linking from "expo-linking"
import React, { useCallback } from "react"
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { baseSepolia } from "viem/chains"
import { useWalletKit } from "../contexts/WalletKitContext"
import { useUSDCBalance } from "../hooks/useMockUSDC"
import { useUserPosition, useVaultHistory, VaultType } from "../hooks/useTMVault"
import { formatCurrency, formatShares, fromBigInt, safeNumber } from "../utils/formatters"
import { VAULT_METADATA } from "../utils/vaults"

export default function PortfolioScreen({ navigation }: any) {
  const { address } = useWalletKit()
  const typedAddress = address as `0x${string}` | undefined
  const { position, refetch } = useUserPosition(typedAddress)
  const { balance: usdcBalance, refetch: refetchUSDC } = useUSDCBalance(typedAddress)
  const { history, isLoading: historyLoading } = useVaultHistory(typedAddress)

  const [refreshing, setRefreshing] = React.useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([refetch(), refetchUSDC()])
    } catch (e) {
      console.error(e)
    } finally {
      setRefreshing(false)
    }
  }, [refetch, refetchUSDC])

  // Calculate total value with safety
  let totalValue = 0
  if (position) {
    totalValue += safeNumber(fromBigInt(position.stableAssets))
    totalValue += safeNumber(fromBigInt(position.growthAssets))
    totalValue += safeNumber(fromBigInt(position.turboAssets))
  }
  // Add USDC balance with safety
  if (usdcBalance) {
    const usdcVal = fromBigInt(usdcBalance)
    totalValue += safeNumber(usdcVal)
    console.log(`[Portfolio] USDC Balance: ${usdcVal}, Raw: ${usdcBalance}`)
  } else {
    console.log(`[Portfolio] USDC Balance is undefined or 0`)
  }

  // Helper to get position for a vault type
  const getPositionForVault = (type: VaultType) => {
    if (!position) return { shares: 0, value: 0 }
    if (type === VaultType.Stable) return { shares: fromBigInt(position.stableShares), value: fromBigInt(position.stableAssets) }
    if (type === VaultType.Growth) return { shares: fromBigInt(position.growthShares), value: fromBigInt(position.growthAssets) }
    if (type === VaultType.Turbo) return { shares: fromBigInt(position.turboShares), value: fromBigInt(position.turboAssets) }
    return { shares: 0, value: 0 }
  }

  // Derived positions list
  const activePositions = VAULT_METADATA.map(meta => {
    const pos = getPositionForVault(meta.type)
    return { ...meta, ...pos }
  }).filter(p => p.shares > 0)

  const handleOpenTx = (hash: string) => {
    const url = `${baseSepolia.blockExplorers.default.url}/tx/${hash}`
    Linking.openURL(url)
  }

  const VaultTypeName = {
    [VaultType.Stable]: "Stable Vault",
    [VaultType.Growth]: "Growth Vault",
    [VaultType.Turbo]: "Turbo Vault",
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-zinc-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FDC700" />}
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-lg text-gray-600 dark:text-zinc-400">Total Balance</Text>
          <Text className="text-4xl font-bold text-gray-900 dark:text-zinc-50 mt-1">{formatCurrency(totalValue)}</Text>
          <View className="flex-row items-center mt-2">
            <Text className="text-green-600 dark:text-green-400 font-semibold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs">
              +2.4%
            </Text>
            <Text className="text-gray-500 dark:text-zinc-500 text-xs ml-2">past 24h</Text>
          </View>
        </View>



        {/* Positions Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4">Your Vaults</Text>
          {activePositions.length === 0 ? (
            <View className="bg-white dark:bg-zinc-900/50 rounded-xl p-8 items-center border border-gray-200 dark:border-zinc-800 border-dashed">
              <Text className="text-gray-500 dark:text-zinc-400 text-center mb-4">No active investments</Text>
              <TouchableOpacity
                className="bg-yellow-500 dark:bg-yellow-400 px-6 py-3 rounded-lg shadow-sm"
                onPress={() => navigation.navigate("home")}
              >
                <Text className="text-white dark:text-black font-semibold">Start Investing</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-4">
              {activePositions.map((pos) => {
                const percentage = totalValue > 0 ? (pos.value / totalValue) * 100 : 0
                // We'd need to fetch APY per vault here if we want to show it.
                // For simplicity, omitting APY in Portfolio view or we can use a wrapper to fetch it like in HomeScreen.
                // Or just show value.
                // The original code showed APY.
                // I will skip APY for now to keep it simple, or I'd need VaultCardWrapper equivalent here.

                return (
                  <View key={pos.id} className="bg-white dark:bg-zinc-900/50 rounded-xl p-4 border border-gray-200 dark:border-zinc-800 shadow-sm">
                    <View className="flex-row justify-between items-start mb-3">
                      <View>
                        <Text className="text-base font-bold text-gray-900 dark:text-zinc-50">{pos.name}</Text>
                        <Text className="text-gray-500 dark:text-zinc-400 text-xs">{percentage.toFixed(0)}% of portfolio</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-gray-900 dark:text-zinc-50 font-semibold text-base">{formatCurrency(pos.value)}</Text>
                      </View>
                    </View>
                    <View className="h-1 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
                      <View
                        style={{ width: `${percentage}%` }}
                        className="h-full bg-yellow-500 dark:bg-yellow-400"
                      />
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="flex-1 bg-yellow-500 dark:bg-yellow-400 py-2 rounded-lg"
                        onPress={() => navigation.navigate("deposit", { vaultId: pos.id })}
                      >
                        <Text className="text-white dark:text-black text-center font-semibold text-sm">Deposit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 bg-gray-200 dark:bg-zinc-800 py-2 rounded-lg"
                        onPress={() => navigation.navigate("withdraw", { vaultId: pos.id })}
                      >
                        <Text className="text-gray-900 dark:text-zinc-200 text-center font-semibold text-sm">Withdraw</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </View>

        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4">Recent Activity</Text>
          <View className="bg-white dark:bg-zinc-900/50 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            {(historyLoading || refreshing) && !history.length && <ActivityIndicator className="py-8" color="#FDC700" />}

            {!historyLoading && !refreshing && history.length === 0 && (
              <View className="p-8 items-center">
                <Text className="text-gray-500 dark:text-zinc-400">No recent activity</Text>
              </View>
            )}

            {history.slice(0, 10).map((item, idx) => {
              const isDeposit = item.type === "Deposit"
              const isWithdraw = item.type === "Withdraw"
              const isUSDCTransfer = item.type === "USDCTransfer"
              const isIncoming = isDeposit || (isUSDCTransfer && item.direction === 'in')

              let title = item.type
              let amountDisplay = ""
              let subTitle = ""

              if (item.vaultType !== undefined) {
                subTitle = VaultTypeName[item.vaultType as VaultType] || "Unknown Vault"
              }

              if (isDeposit) {
                title = "Deposit"
                amountDisplay = `+${formatCurrency(fromBigInt(item.assets))}`
              } else if (isWithdraw) {
                title = "Withdraw"
                amountDisplay = `-${formatCurrency(fromBigInt(item.assets))}`
              } else if (item.type === "WithdrawalRequested") {
                title = "Withdraw Request"
                amountDisplay = `${formatShares(fromBigInt(item.shares))} Shares`
              } else if (item.type === "WithdrawalCancelled") {
                title = "Withdraw Cancelled"
                amountDisplay = `${formatShares(fromBigInt(item.shares))} Shares`
              } else if (isUSDCTransfer) {
                if (item.direction === 'in') {
                  title = "Received USDC"
                  amountDisplay = `+${formatCurrency(fromBigInt(item.value))}`
                } else {
                  title = "Sent USDC"
                  amountDisplay = `-${formatCurrency(fromBigInt(item.value))}`
                }
              }

              let dateStr = "Recent"
              if (item.timestamp) {
                const date = new Date(Number(item.timestamp) * 1000)
                dateStr = format(date, "MMM d, h:mm a")
              }

              return (
                <TouchableOpacity
                  key={item.hash + item.type + idx}
                  onPress={() => handleOpenTx(item.hash)}
                  className={`p-4 flex-row justify-between items-center ${idx !== (history.length > 10 ? 9 : history.length - 1) ? 'border-b border-gray-100 dark:border-zinc-800' : ''}`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className={`w-8 h-8 rounded-full items-center justify-center ${isIncoming ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      <Ionicons
                        name={isIncoming ? "arrow-down" : "arrow-up"}
                        size={16}
                        color={isIncoming ? "#16a34a" : "#dc2626"}
                      />
                    </View>
                    <View>
                      <Text className="font-medium text-gray-900 dark:text-zinc-50">{title}</Text>
                      <Text className="text-[10px] text-gray-500 dark:text-zinc-400">{subTitle || 'Vault interaction'}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className={`font-semibold ${isIncoming ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-zinc-50'}`}>
                      {amountDisplay}
                    </Text>
                    <Text className="text-[10px] text-gray-400 dark:text-zinc-500">{dateStr}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}
