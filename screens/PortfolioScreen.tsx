import React from "react"
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAppStore } from "../store/useAppStore"
import { formatCurrency } from "../utils/formatters"
import { MOCK_VAULTS } from "../utils/mockContracts"

export default function PortfolioScreen({ navigation }: any) {
  const { positions, wallet } = useAppStore()
  const [refreshing, setRefreshing] = React.useState(false)

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }, [])

  const totalValue = positions.reduce((sum: number, pos: { vaultId: string; shares: number }) => {
    const vault = MOCK_VAULTS.find((v) => v.id === pos.vaultId)
    return sum + (vault?.sharePrice || 1) * pos.shares
  }, 0)

  // Mock data for chart
  const weeklyPerformance = [20, 35, 45, 30, 55, 65, 50]
  const maxPerf = Math.max(...weeklyPerformance)

  // Mock data for activity
  const recentActivity = [
    { id: 1, type: "deposit", vault: "Stable Growth", amount: 500, date: "Today" },
    { id: 2, type: "interest", vault: "Yield Alpha", amount: 12.50, date: "Yesterday" },
    { id: 3, type: "withdraw", vault: "Blue Chip", amount: 200, date: "Jan 12" },
  ]

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

        {/* Performance Chart Mock */}
        <View className="mb-8 p-4 bg-white dark:bg-zinc-900/50 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4">7-Day Performance</Text>
          <View className="flex-row justify-between items-end h-32 px-2">
            {weeklyPerformance.map((val, idx) => (
              <View key={idx} className="items-center gap-2">
                <View
                  style={{ height: (val / maxPerf) * 100 }}
                  className={`w-8 rounded-t-sm ${idx === 6 ? 'bg-yellow-500 dark:bg-yellow-400' : 'bg-gray-200 dark:bg-zinc-800'}`}
                />
                <Text className="text-[10px] text-gray-400 dark:text-zinc-500">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Positions Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4">Your Vaults</Text>
          {positions.length === 0 ? (
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
              {positions.map((pos: { vaultId: string; shares: number }) => {
                const vault = MOCK_VAULTS.find((v) => v.id === pos.vaultId)
                if (!vault) return null
                const posValue = vault.sharePrice * pos.shares
                const percentage = totalValue > 0 ? (posValue / totalValue) * 100 : 0

                return (
                  <View key={vault.id} className="bg-white dark:bg-zinc-900/50 rounded-xl p-4 border border-gray-200 dark:border-zinc-800 shadow-sm">
                    <View className="flex-row justify-between items-start mb-3">
                      <View>
                        <Text className="text-base font-bold text-gray-900 dark:text-zinc-50">{vault.name}</Text>
                        <Text className="text-gray-500 dark:text-zinc-400 text-xs">{percentage.toFixed(0)}% of portfolio</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-gray-900 dark:text-zinc-50 font-semibold text-base">{formatCurrency(posValue)}</Text>
                        <Text className="text-green-600 dark:text-green-400 text-xs">+{vault.targetApy.min}% APY</Text>
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
                        onPress={() => navigation.navigate("deposit", { vaultId: vault.id })}
                      >
                        <Text className="text-white dark:text-black text-center font-semibold text-sm">Deposit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 bg-gray-200 dark:bg-zinc-800 py-2 rounded-lg"
                        onPress={() => navigation.navigate("withdraw", { vaultId: vault.id })}
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

        {/* Recent Activity */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4">Recent Activity</Text>
          <View className="bg-white dark:bg-zinc-900/50 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            {recentActivity.map((activity, idx) => (
              <View
                key={activity.id}
                className={`p-4 flex-row justify-between items-center ${idx !== recentActivity.length - 1 ? 'border-b border-gray-100 dark:border-zinc-800' : ''}`}
              >
                <View className="flex-row items-center gap-3">
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${activity.type === 'deposit' ? 'bg-green-100 dark:bg-green-900/30' :
                    activity.type === 'withdraw' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                    <Text>{activity.type === 'deposit' ? '↓' : activity.type === 'withdraw' ? '↑' : '%'}</Text>
                  </View>
                  <View>
                    <Text className="font-medium text-gray-900 dark:text-zinc-50 capitalize">{activity.type}</Text>
                    <Text className="text-xs text-gray-500 dark:text-zinc-400">{activity.vault}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className={`font-semibold ${activity.type === 'deposit' ? 'text-gray-900 dark:text-zinc-50' :
                    activity.type === 'withdraw' ? 'text-gray-900 dark:text-zinc-50' : 'text-green-600 dark:text-green-400'
                    }`}>
                    {activity.type === 'withdraw' ? '-' : '+'}{formatCurrency(activity.amount)}
                  </Text>
                  <Text className="text-xs text-gray-400 dark:text-zinc-500">{activity.date}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}
