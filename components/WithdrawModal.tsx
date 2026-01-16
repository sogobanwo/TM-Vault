import * as Haptics from "expo-haptics"
import { useState } from "react"
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAppStore } from "../store/useAppStore"
import { formatCurrency, formatShares, truncateNumber } from "../utils/formatters"
import { MOCK_VAULTS } from "../utils/mockContracts"
import ConfettiAnimation from "./ConfettiAnimation"
import ErrorModal from "./ErrorModal"
import ProgressBar from "./ProgressBar"

export default function WithdrawModal({ route, navigation }: any) {
    const { vaultId } = route.params
    const vault = MOCK_VAULTS.find((v) => v.id === vaultId)

    const { positions, setPositions } = useAppStore()
    const position = positions.find((p) => p.vaultId === vaultId)

    const [amount, setAmount] = useState("")
    const [stage, setStage] = useState<"input" | "pending" | "processing" | "success">("input")
    const [showConfetti, setShowConfetti] = useState(false)
    const [showError, setShowError] = useState(false)
    const [errorTitle, setErrorTitle] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [txProgress, setTxProgress] = useState(0)

    // Store withdrawal info for success screen (survives position removal)
    const [withdrawInfo, setWithdrawInfo] = useState<{ amount: number; shares: number; vaultName: string } | null>(null)

    // Only return null if vault is missing - position can be null after successful withdrawal
    if (!vault) return null

    // For input stage, we need a valid position
    if (!position && stage === "input") {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 dark:bg-zinc-950 justify-center items-center p-4">
                <Text className="text-gray-900 dark:text-zinc-50 text-center mb-4">No position found in this vault</Text>
                <TouchableOpacity className="bg-yellow-500 px-6 py-3 rounded-lg" onPress={() => navigation.goBack()}>
                    <Text className="text-white font-semibold">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    const positionValue = position ? (vault.sharePrice || 1) * position.shares : 0
    const sharesToWithdraw = amount ? truncateNumber(Number.parseFloat(amount) / vault.sharePrice) : 0

    const handleQuickAmount = (percentage: number) => {
        Haptics.selectionAsync()
        const quickAmount = truncateNumber(positionValue * (percentage / 100))
        setAmount(quickAmount.toString())
    }

    const handleMaxAmount = () => {
        Haptics.selectionAsync()
        setAmount(positionValue.toString())
    }

    const handleWithdraw = async () => {
        if (!position) return

        try {
            const withdrawAmount = Number.parseFloat(amount || "0")

            if (withdrawAmount <= 0) {
                setErrorTitle("Invalid Amount")
                setErrorMessage("Please enter an amount greater than 0")
                setShowError(true)
                return
            }

            if (withdrawAmount > positionValue) {
                setErrorTitle("Insufficient Balance")
                setErrorMessage(`You only have ${formatCurrency(positionValue)} available in this vault`)
                setShowError(true)
                return
            }

            // Store withdrawal info before modifying positions
            const currentShares = sharesToWithdraw
            setWithdrawInfo({
                amount: withdrawAmount,
                shares: currentShares,
                vaultName: vault.name
            })

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
            setStage("pending")
            setTxProgress(0)

            // Pending state (simulates unlock period)
            const pendingInterval = setInterval(() => {
                setTxProgress((prev) => Math.min(prev + 0.1, 0.4))
            }, 400)

            await new Promise((resolve) => setTimeout(resolve, 2000))
            clearInterval(pendingInterval)

            setStage("processing")
            setTxProgress(0.5)

            const processInterval = setInterval(() => {
                setTxProgress((prev) => Math.min(prev + 0.1, 0.95))
            }, 400)

            await new Promise((resolve) => setTimeout(resolve, 3000))
            clearInterval(processInterval)

            // Update positions
            const newShares = position.shares - currentShares
            if (newShares <= 0.01) {
                // Remove position entirely
                setPositions(positions.filter((p) => p.vaultId !== vaultId))
            } else {
                setPositions(
                    positions.map((p) =>
                        p.vaultId === vaultId ? { ...p, shares: newShares } : p
                    )
                )
            }

            setTxProgress(1)
            setStage("success")
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            setShowConfetti(true)

            setTimeout(() => {
                navigation.goBack()
            }, 3000)
        } catch (error) {
            setErrorTitle("Withdrawal Failed")
            setErrorMessage("An error occurred during the withdrawal. Please try again.")
            setShowError(true)
            setStage("input")
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        }
    }

    const handleRetry = () => {
        setShowError(false)
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-zinc-950">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                {/* Header */}
                <TouchableOpacity
                    className="mb-6"
                    onPress={() => {
                        if (stage === "input") navigation.goBack()
                    }}
                    disabled={stage !== "input"}
                >
                    <Text className="text-gray-600 dark:text-zinc-400">← Back</Text>
                </TouchableOpacity>

                <Text className="text-3xl font-bold text-gray-900 dark:text-zinc-50 mb-2">Withdraw from {vault.name}</Text>
                {position && (
                    <Text className="text-gray-500 dark:text-zinc-400 mb-6">
                        Available: {formatCurrency(positionValue)} ({formatShares(position.shares)} shares)
                    </Text>
                )}

                {stage === "input" && (
                    <>
                        {/* Amount Input */}
                        <View className="bg-white dark:bg-zinc-900/50 rounded-xl p-4 mb-4 border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <Text className="text-gray-500 dark:text-zinc-400 text-xs mb-2">Amount (USD)</Text>
                            <TextInput
                                className="text-2xl font-bold text-gray-900 dark:text-zinc-50"
                                placeholder="0.00"
                                placeholderTextColor="#71717a"
                                keyboardType="decimal-pad"
                                value={amount}
                                onChangeText={(text) => {
                                    const num = Number.parseFloat(text) || 0
                                    if (num <= positionValue) setAmount(text)
                                }}
                            />
                            <Text className="text-gray-500 dark:text-zinc-400 text-xs mt-2">
                                Max: {formatCurrency(positionValue)}
                            </Text>
                        </View>

                        {/* Quick Amount Buttons */}
                        <View className="flex-row gap-2 mb-6">
                            <TouchableOpacity className="flex-1 bg-gray-200 dark:bg-zinc-800 rounded py-2" onPress={() => handleQuickAmount(25)}>
                                <Text className="text-gray-900 dark:text-zinc-200 font-semibold text-center text-sm">25%</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-1 bg-gray-200 dark:bg-zinc-800 rounded py-2" onPress={() => handleQuickAmount(50)}>
                                <Text className="text-gray-900 dark:text-zinc-200 font-semibold text-center text-sm">50%</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-1 bg-gray-200 dark:bg-zinc-800 rounded py-2" onPress={() => handleQuickAmount(75)}>
                                <Text className="text-gray-900 dark:text-zinc-200 font-semibold text-center text-sm">75%</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-1 bg-gray-200 dark:bg-zinc-800 rounded py-2" onPress={handleMaxAmount}>
                                <Text className="text-gray-900 dark:text-zinc-200 font-semibold text-center text-sm">MAX</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Preview */}
                        <View className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-6 border border-red-200 dark:border-red-800/50">
                            <Text className="text-red-800 dark:text-red-300 text-sm mb-2">Shares to Withdraw</Text>
                            <Text className="text-red-600 dark:text-red-400 font-bold text-2xl">{formatShares(sharesToWithdraw)}</Text>
                        </View>

                        {/* Withdraw Button */}
                        <TouchableOpacity
                            className="bg-red-500 dark:bg-red-600 rounded-lg py-4 mb-3 disabled:opacity-50 shadow-md"
                            onPress={handleWithdraw}
                            disabled={!amount || Number.parseFloat(amount) <= 0}
                        >
                            <Text className="text-white font-bold text-center text-lg">Request Withdrawal</Text>
                        </TouchableOpacity>
                    </>
                )}

                {(stage === "pending" || stage === "processing") && (
                    <View className="flex-1 justify-center items-center py-12">
                        <ActivityIndicator size="large" color="#ef4444" />
                        <Text className="text-gray-900 dark:text-zinc-50 mt-6 text-center font-semibold text-lg">
                            {stage === "pending" ? "Withdrawal Pending..." : "Processing Withdrawal..."}
                        </Text>
                        <Text className="text-gray-500 dark:text-zinc-400 text-sm mt-2 text-center">
                            {stage === "pending" ? "Waiting for unlock period" : "Finalizing your withdrawal"}
                        </Text>
                        <View className="mt-6 w-full">
                            <ProgressBar progress={txProgress} />
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Confetti Success Animation */}
            {showConfetti && withdrawInfo && (
                <View className="absolute inset-0">
                    <ConfettiAnimation />
                    <View className="flex-1 justify-center items-center">
                        <View className="bg-black/70 rounded-2xl p-8 items-center">
                            <Text className="text-green-400 text-3xl font-bold text-center mb-4">Withdrawal Complete!</Text>
                            <Text className="text-white text-center text-lg mb-2">
                                -{formatCurrency(withdrawInfo.amount)} from {withdrawInfo.vaultName}
                            </Text>
                            <Text className="text-zinc-400 text-sm text-center">{formatShares(withdrawInfo.shares)} shares redeemed</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Error Modal */}
            <ErrorModal
                visible={showError}
                title={errorTitle}
                message={errorMessage}
                onRetry={handleRetry}
                onDismiss={handleRetry}
            />
        </SafeAreaView>
    )
}
