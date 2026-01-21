import * as Haptics from "expo-haptics"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { parseUnits } from "viem"

import { useToast } from "../contexts/ToastContext"
import { usePreviewDeposit, useRequestWithdrawal, useUserPosition, VaultType } from "../hooks/useTMVault"
import { formatError } from "../utils/errorFormatter"
import { formatCurrency, formatShares, fromBigInt } from "../utils/formatters"
import { VAULT_METADATA } from "../utils/vaults"
import ConfettiAnimation from "./ConfettiAnimation"
import ErrorModal from "./ErrorModal"
import ProgressBar from "./ProgressBar"

import { useWalletKit } from "../contexts/WalletKitContext"

// Timeout duration for transactions (2 minutes)
const TRANSACTION_TIMEOUT = 120000

export default function WithdrawModal({ route, navigation }: any) {
    const { vaultId } = route.params
    const vaultMeta = VAULT_METADATA.find((v) => v.id === vaultId)

    const { address } = useWalletKit()
    const { showToast } = useToast()
    const { position, refetch } = useUserPosition(address as `0x${string}` | undefined)

    const { requestWithdrawal, isLoading: isTxLoading, isConfirmed: isTxConfirmed, error: txError, reset: resetWithdrawal } = useRequestWithdrawal()

    const [amount, setAmount] = useState("")
    const [stage, setStage] = useState<"input" | "processing" | "success">("input")
    const [showConfetti, setShowConfetti] = useState(false)
    const [showError, setShowError] = useState(false)
    const [errorTitle, setErrorTitle] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [txProgress, setTxProgress] = useState(0)

    // Store withdrawal info for success screen
    const [withdrawInfo, setWithdrawInfo] = useState<{ amount: number; shares: number; vaultName: string } | null>(null)

    // Ref to track timeout for stuck transactions
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
        }
    }, [])

    // Helper to show error and reset state
    const handleError = useCallback((title: string, error: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        showToast(`${title}. Please try again.`, "error")
        setErrorTitle(title)
        setErrorMessage(formatError(error))
        setShowError(true)
        setStage("input")
        setTxProgress(0)
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
    }, [showToast])

    // Start timeout when entering loading states
    const startTransactionTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
            handleError("Transaction Timeout", { message: "Withdrawal request is taking too long. Please try again." })
            resetWithdrawal()
        }, TRANSACTION_TIMEOUT)
    }, [handleError, resetWithdrawal])

    // Get user position for this vault
    let userShares = 0
    let userValue = 0

    if (position && vaultMeta) {
        if (vaultMeta.type === VaultType.Stable) {
            userShares = fromBigInt(position.stableShares)
            userValue = fromBigInt(position.stableAssets)
        } else if (vaultMeta.type === VaultType.Growth) {
            userShares = fromBigInt(position.growthShares)
            userValue = fromBigInt(position.growthAssets)
        } else if (vaultMeta.type === VaultType.Turbo) {
            userShares = fromBigInt(position.turboShares)
            userValue = fromBigInt(position.turboAssets)
        }
    }

    // Estimate shares to withdraw based on amount (USDC)
    // To get X assets, we burn Y shares. previewDeposit(assets) gives shares.
    const amountBigInt = amount ? parseUnits(amount, 6) : 0n
    const { preview: estimatedSharesBigInt } = usePreviewDeposit(amountBigInt, vaultMeta?.type!)
    const estimatedShares = fromBigInt(estimatedSharesBigInt)

    if (!vaultMeta) return null

    // Helper to update progress
    useEffect(() => {
        if (isTxConfirmed && stage === "processing") {
            // Clear any pending timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
            setTxProgress(1)
            setStage("success")
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            setShowConfetti(true)
            setTimeout(() => {
                navigation.goBack()
            }, 3000)
        }
    }, [isTxConfirmed, stage, navigation])

    useEffect(() => {
        if (txError && stage === "processing") {
            handleError("Withdrawal Failed", txError)
        }
    }, [txError, stage, handleError])

    // Safety check: if we're in a loading state but mutation is not pending, reset
    useEffect(() => {
        if (stage === "processing" && !isTxLoading && !isTxConfirmed && !txError) {
            const safetyTimeout = setTimeout(() => {
                if (stage === "processing" && !isTxLoading && !isTxConfirmed) {
                    handleError("Withdrawal Failed", { message: "Transaction was interrupted. Please try again." })
                    resetWithdrawal()
                }
            }, 5000) // Give 5 seconds grace period
            return () => clearTimeout(safetyTimeout)
        }
    }, [stage, isTxLoading, isTxConfirmed, txError])

    const handleQuickAmount = (percentage: number) => {
        Haptics.selectionAsync()
        const quickAmount = Math.floor(userValue * (percentage / 100) * 100) / 100
        setAmount(quickAmount.toString())
    }

    const handleMaxAmount = () => {
        Haptics.selectionAsync()
        setAmount(userValue.toString())
    }

    const handleWithdraw = async () => {
        const withdrawAmount = Number.parseFloat(amount || "0")
        if (withdrawAmount <= 0) {
            showToast("Please enter an amount greater than 0", "error")
            return
        }

        // This check is approximate due to float math.
        if (withdrawAmount > userValue + 0.1) {
            showToast(`Insufficient balance. You only have ${formatCurrency(userValue)} available`, "error")
            return
        }

        // Reset any previous errors before starting
        resetWithdrawal()
        setShowError(false)

        setWithdrawInfo({
            amount: withdrawAmount,
            shares: estimatedShares,
            vaultName: vaultMeta.name
        })

        setStage("processing")
        setTxProgress(0.5)
        startTransactionTimeout()
        showToast("Processing withdrawal request...", "info")

        try {
            requestWithdrawal(estimatedSharesBigInt!, vaultMeta.type)
        } catch (error) {
            handleError("Withdrawal Failed", error)
        }
    }

    const handleRetry = () => {
        setShowError(false)
        setTxProgress(0)
        resetWithdrawal()
    }

    const handleCancel = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        resetWithdrawal()
        setStage("input")
        setTxProgress(0)
        showToast("Transaction cancelled", "info")
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

                <Text className="text-3xl font-bold text-gray-900 dark:text-zinc-50 mb-2">Withdraw from {vaultMeta.name}</Text>
                <Text className="text-gray-500 dark:text-zinc-400 mb-6">
                    Available: {formatCurrency(userValue)} ({formatShares(userShares)} shares)
                </Text>

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
                                    setAmount(text)
                                }}
                            />
                            <Text className="text-gray-500 dark:text-zinc-400 text-xs mt-2">
                                Max: {formatCurrency(userValue)}
                            </Text>
                        </View>

                        {/* Quick Amount Buttons */}
                        <View className="flex-row gap-2 mb-6">
                            {[25, 50, 75].map(pct => (
                                <TouchableOpacity key={pct} className="flex-1 bg-gray-200 dark:bg-zinc-800 rounded py-2" onPress={() => handleQuickAmount(pct)}>
                                    <Text className="text-gray-900 dark:text-zinc-200 font-semibold text-center text-sm">{pct}%</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity className="flex-1 bg-gray-200 dark:bg-zinc-800 rounded py-2" onPress={handleMaxAmount}>
                                <Text className="text-gray-900 dark:text-zinc-200 font-semibold text-center text-sm">MAX</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Preview */}
                        <View className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-6 border border-red-200 dark:border-red-800/50">
                            <Text className="text-red-800 dark:text-red-300 text-sm mb-2">Shares to Withdraw</Text>
                            <Text className="text-red-600 dark:text-red-400 font-bold text-2xl">{formatShares(estimatedShares)}</Text>
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

                {(stage === "processing" || isTxLoading) && (
                    <View className="flex-1 justify-center items-center py-12">
                        <ActivityIndicator size="large" color="#ef4444" />
                        <Text className="text-gray-900 dark:text-zinc-50 mt-6 text-center font-semibold text-lg">
                            Processing Request...
                        </Text>
                        <Text className="text-gray-500 dark:text-zinc-400 text-sm mt-2 text-center">
                            Submitting withdrawal request to vault
                        </Text>
                        <Text className="text-gray-400 dark:text-zinc-500 text-xs mt-1 text-center">
                            Please confirm in your wallet app
                        </Text>
                        <View className="mt-6 w-full">
                            <ProgressBar progress={txProgress} />
                        </View>
                        <TouchableOpacity
                            className="mt-8 px-6 py-3 border border-gray-300 dark:border-zinc-600 rounded-lg"
                            onPress={handleCancel}
                        >
                            <Text className="text-gray-600 dark:text-zinc-400 text-center">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Confetti Success Animation */}
            {showConfetti && withdrawInfo && (
                <View className="absolute inset-0">
                    <ConfettiAnimation />
                    <View className="flex-1 justify-center items-center">
                        <View className="bg-black/70 rounded-2xl p-8 items-center">
                            <Text className="text-green-400 text-3xl font-bold text-center mb-4">Request Sent!</Text>
                            <Text className="text-white text-center text-lg mb-2">
                                Requesting {formatCurrency(withdrawInfo.amount)}
                            </Text>
                            <Text className="text-zinc-400 text-sm text-center">
                                Your withdrawal of {formatShares(withdrawInfo.shares)} shares is pending processing.
                            </Text>
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
