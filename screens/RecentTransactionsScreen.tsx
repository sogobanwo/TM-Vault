import { Ionicons } from "@expo/vector-icons"

import { format } from "date-fns"
import * as Linking from "expo-linking"
import { useCallback, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, Text, TouchableOpacity, View } from "react-native"
import { baseSepolia } from "viem/chains"
import { useWalletKit } from "../contexts/WalletKitContext"
import { useVaultHistory, VaultType } from "../hooks/useTMVault"
import { formatCurrency, formatShares, fromBigInt } from "../utils/formatters"
import { useNavigation } from "@react-navigation/native"

const VaultTypeName = {
    [VaultType.Stable]: "Stable Vault",
    [VaultType.Growth]: "Growth Vault",
    [VaultType.Turbo]: "Turbo Vault",
}

export default function RecentTransactionsScreen() {
    const { address, isConnected } = useWalletKit()
    const navigation = useNavigation<any>()
    const { history, isLoading, error, refetch } = useVaultHistory(address as `0x${string}` | undefined)
    const [refreshing, setRefreshing] = useState(false)

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await refetch()
        setRefreshing(false)
    }, [refetch])

    const handleOpenTx = (hash: string) => {
        const url = `${baseSepolia.blockExplorers.default.url}/tx/${hash}`
        Linking.openURL(url)
    }

    const renderItem = ({ item }: { item: any }) => {
        const isDeposit = item.type === "Deposit"
        const isWithdraw = item.type === "Withdraw"
        const isUSDCTransfer = item.type === "USDCTransfer"

        // Determine title and amount
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
            // Withdraw event has shares and assets. Usually people care about assets (USDC) out.
            // The event args: shares, assets, fee.
            amountDisplay = `-${formatCurrency(fromBigInt(item.assets))}`
        } else if (item.type === "WithdrawalRequested") {
            title = "Withdrawal Requested"
            amountDisplay = `${formatShares(fromBigInt(item.shares))} Shares`
        } else if (item.type === "WithdrawalCancelled") {
            title = "Withdrawal Cancelled"
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

        // Format Date
        let dateStr = "Unknown Date"
        if (item.timestamp) {
            // Timestamp from contract is usually seconds, JS needs milliseconds
            const date = new Date(Number(item.timestamp) * 1000)
            dateStr = format(date, "MMM d, h:mm a")
        } else {
            // Fallback or if event doesn't have timestamp (WithdrawalRequested might not always match exactly if not in event)
            // My ABI definition logic included timestamp for Deposit/Withdraw.
            // WithdrawalRequested/Cancelled might not have timestamp in args? Check hooks impl.
            // Ah, looking at my added code, WithdrawalRequested definition has requestTime.
            if (item.requestTime) {
                const date = new Date(Number(item.requestTime) * 1000)
                dateStr = format(date, "MMM d, h:mm a")
            }
        }

        return (
            <TouchableOpacity
                onPress={() => handleOpenTx(item.hash)}
                className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
                <View className="flex-row items-center gap-3">
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${isDeposit || (isUSDCTransfer && item.direction === 'in') ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                        <Ionicons
                            name={isDeposit || (isUSDCTransfer && item.direction === 'in') ? "arrow-down" : "arrow-up"}
                            size={20}
                            color={isDeposit || (isUSDCTransfer && item.direction === 'in') ? "#16a34a" : "#dc2626"}
                        />
                    </View>
                    <View>
                        <Text className="font-semibold text-gray-900 dark:text-zinc-100">{title}</Text>
                        <Text className="text-xs text-gray-500 dark:text-zinc-400">{subTitle} • {dateStr}</Text>
                    </View>
                </View>
                <View className="items-end">
                    <Text className={`font-medium ${isDeposit || (isUSDCTransfer && item.direction === 'in') ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-zinc-100"}`}>
                        {amountDisplay}
                    </Text>
                    <Text className="text-xs text-blue-500">View on Explorer</Text>
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black">
            <View className="px-4 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">Recent Transactions</Text>
            </View>

            {!isConnected ? (
                <View className="flex-1 items-center justify-center p-6">
                    <Ionicons name="wallet-outline" size={64} color="#9ca3af" />
                    <Text className="text-gray-500 dark:text-zinc-400 text-center mt-4 mb-6">
                        Connect your wallet to view your transaction history.
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("home")}
                        className="bg-yellow-500 rounded-full py-3 px-8"
                    >
                        <Text className="text-black font-bold">Connect Wallet</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.hash + item.type + item.blockNumber}
                    contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#FDC700"
                        />
                    }
                    ListEmptyComponent={
                        !isLoading ? (
                            <View className="flex-1 items-center justify-center py-20">
                                {error ? (
                                    <>
                                        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                                        <Text className="text-red-500 text-center mt-4">Failed to load transactions</Text>
                                        <TouchableOpacity onPress={onRefresh} className="mt-4 bg-yellow-500 rounded-full py-2 px-6">
                                            <Text className="text-black font-bold">Retry</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="receipt-outline" size={48} color="#9ca3af" />
                                        <Text className="text-gray-500 dark:text-zinc-400 text-center mt-4">No transactions found</Text>
                                        <Text className="text-gray-400 dark:text-zinc-500 text-center text-sm mt-1">Pull down to refresh</Text>
                                    </>
                                )}
                            </View>
                        ) : null
                    }
                    ListFooterComponent={isLoading && !refreshing ? <ActivityIndicator className="mt-4" color="#FDC700" /> : null}
                />
            )}
        </SafeAreaView>
    )
}
