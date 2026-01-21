import * as Haptics from "expo-haptics"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { parseUnits } from "viem"

import { useToast } from "../contexts/ToastContext"
import { useApproveUSDC, useUSDCAllowance, useUSDCBalance } from "../hooks/useMockUSDC"
import { useDeposit, usePreviewDeposit } from "../hooks/useTMVault"
import { contracts } from "../utils/contracts"
import { formatError } from "../utils/errorFormatter"
import { formatCurrency, formatShares, fromBigInt } from "../utils/formatters"
import { VAULT_METADATA } from "../utils/vaults"
import ConfettiAnimation from "./ConfettiAnimation"
import ErrorModal from "./ErrorModal"
import ProgressBar from "./ProgressBar"

import { useWalletKit } from "../contexts/WalletKitContext"

// Timeout duration for transactions (2 minutes)
const TRANSACTION_TIMEOUT = 120000

export default function DepositModal({ route, navigation }: any) {
  const { vaultId } = route.params
  const vaultMeta = VAULT_METADATA.find((v) => v.id === vaultId)

  const { address } = useWalletKit()
  const { showToast } = useToast()
  const { balance: usdcBalanceBigInt } = useUSDCBalance(address as `0x${string}` | undefined)

  // Need Vault Address for allowance check
  const spenderAddress = contracts.tmVault.address
  const { allowance: allowanceBigInt, refetch: refetchAllowance } = useUSDCAllowance(address as `0x${string}` | undefined, spenderAddress)

  const { approve, isLoading: isApproving, isConfirmed: isApproveConfirmed, error: approveError, reset: resetApprove } = useApproveUSDC()
  const { deposit, isLoading: isDepositing, isConfirmed: isDepositConfirmed, error: depositError, reset: resetDeposit } = useDeposit()

  const [amount, setAmount] = useState("")
  // We can use previewDeposit to estimate shares
  const amountBigInt = amount ? parseUnits(amount, 6) : 0n
  const { preview: estimatedSharesBigInt } = usePreviewDeposit(amountBigInt, vaultMeta?.type!)

  // Stages: input -> approving -> approved -> depositing -> success
  const [stage, setStage] = useState<"input" | "approving" | "approved" | "depositing" | "success">("input")
  const [showConfetti, setShowConfetti] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorTitle, setErrorTitle] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [txProgress, setTxProgress] = useState(0)

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
  const startTransactionTimeout = useCallback((stageName: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      handleError("Transaction Timeout", { message: `${stageName} is taking too long. Please try again.` })
      resetApprove()
      resetDeposit()
    }, TRANSACTION_TIMEOUT)
  }, [handleError, resetApprove, resetDeposit])

  // Handle approval success - move to "approved" stage instead of auto-depositing
  useEffect(() => {
    if (isApproveConfirmed && stage === "approving") {
      // Clear the approval timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      // Refetch allowance and move to approved stage
      refetchAllowance().finally(() => {
        setTxProgress(0.5)
        setStage("approved")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        showToast("USDC approved! Now tap Deposit to continue.", "success")
      })
    }
  }, [isApproveConfirmed, stage, refetchAllowance, showToast])

  // Handle deposit success
  useEffect(() => {
    if (isDepositConfirmed && stage === "depositing") {
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
  }, [isDepositConfirmed, stage, navigation])

  // Handle deposit errors
  useEffect(() => {
    if (depositError && stage === "depositing") {
      handleError("Deposit Failed", depositError)
    }
  }, [depositError, stage, handleError])

  // Handle approval errors
  useEffect(() => {
    if (approveError && stage === "approving") {
      handleError("Approval Failed", approveError)
    }
  }, [approveError, stage, handleError])

  // Safety check for approving stage
  useEffect(() => {
    if (stage === "approving" && !isApproving && !isApproveConfirmed && !approveError) {
      const safetyTimeout = setTimeout(() => {
        if (stage === "approving" && !isApproving && !isApproveConfirmed) {
          handleError("Approval Failed", { message: "Transaction was interrupted. Please try again." })
          resetApprove()
        }
      }, 5000)
      return () => clearTimeout(safetyTimeout)
    }
  }, [stage, isApproving, isApproveConfirmed, approveError, handleError, resetApprove])

  // Safety check for depositing stage
  useEffect(() => {
    if (stage === "depositing" && !isDepositing && !isDepositConfirmed && !depositError) {
      const safetyTimeout = setTimeout(() => {
        if (stage === "depositing" && !isDepositing && !isDepositConfirmed) {
          handleError("Deposit Failed", { message: "Transaction was interrupted. Please try again." })
          resetDeposit()
        }
      }, 5000)
      return () => clearTimeout(safetyTimeout)
    }
  }, [stage, isDepositing, isDepositConfirmed, depositError, handleError, resetDeposit])

  if (!vaultMeta) return null

  const usdcBalance = fromBigInt(usdcBalanceBigInt)
  const estimatedShares = fromBigInt(estimatedSharesBigInt)
  const needsApproval = (allowanceBigInt || 0n) < (amount ? parseUnits(amount, 6) : 0n)

  const handleQuickAmount = (percentage: number) => {
    Haptics.selectionAsync()
    const quickAmount = Math.floor(usdcBalance * (percentage / 100) * 100) / 100
    setAmount(quickAmount.toString())
  }

  const handleMaxAmount = () => {
    Haptics.selectionAsync()
    setAmount(usdcBalance.toString())
  }

  // Handle the approve button click
  const handleApprove = async () => {
    const depositAmount = parseUnits(amount || "0", 6)
    if (depositAmount <= 0n) {
      showToast("Please enter an amount greater than 0", "error")
      return
    }

    if (depositAmount > (usdcBalanceBigInt || 0n)) {
      showToast(`Insufficient funds. You only have ${formatCurrency(usdcBalance)} available`, "error")
      return
    }

    // Reset any previous errors before starting
    resetApprove()
    resetDeposit()
    setShowError(false)

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)

    setStage("approving")
    setTxProgress(0.2)
    startTransactionTimeout("Approval")
    showToast("Requesting USDC approval...", "info")

    try {
      approve(spenderAddress, depositAmount)
    } catch (error) {
      handleError("Approval Failed", error)
    }
  }

  // Handle the deposit button click (called from approved stage or input if already approved)
  const handleDeposit = () => {
    if (!vaultMeta) return

    const depositAmount = parseUnits(amount || "0", 6)
    if (depositAmount <= 0n) {
      showToast("Please enter an amount greater than 0", "error")
      return
    }

    if (depositAmount > (usdcBalanceBigInt || 0n)) {
      showToast(`Insufficient funds. You only have ${formatCurrency(usdcBalance)} available`, "error")
      return
    }

    // Reset deposit state
    resetDeposit()
    setShowError(false)

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)

    setStage("depositing")
    setTxProgress(0.7)
    startTransactionTimeout("Deposit")
    showToast("Processing deposit...", "info")

    try {
      deposit(depositAmount, vaultMeta.type)
    } catch (error) {
      handleError("Deposit Failed", error)
    }
  }

  const handleRetry = () => {
    setShowError(false)
    setTxProgress(0)
    resetApprove()
    resetDeposit()
  }

  const handleCancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    resetApprove()
    resetDeposit()
    setStage("input")
    setTxProgress(0)
    showToast("Transaction cancelled", "info")
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black">
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

        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Deposit to {vaultMeta.name}</Text>
        <Text className="text-gray-500 dark:text-zinc-400 mb-6">
          {vaultMeta.description}
        </Text>

        {stage === "input" && (
          <>
            {/* Amount Input */}
            <View className="bg-white dark:bg-zinc-900 rounded-lg p-4 mb-4 shadow-sm">
              <Text className="text-gray-500 dark:text-zinc-400 text-xs mb-2">Amount (USD)</Text>
              <TextInput
                className="text-2xl font-bold text-gray-900 dark:text-white"
                placeholder="0.00"
                placeholderTextColor="#a1a1aa"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={(text) => {
                  setAmount(text)
                }}
              />
              <Text className="text-gray-500 dark:text-zinc-400 text-xs mt-2">
                Max: {formatCurrency(usdcBalance)}
              </Text>
            </View>

            {/* Quick Amount Buttons */}
            <View className="flex-row gap-2 mb-6">
              {[25, 50, 75].map(pct => (
                <TouchableOpacity key={pct} className="flex-1 bg-yellow-500 dark:bg-yellow-400 rounded py-2" onPress={() => handleQuickAmount(pct)}>
                  <Text className="text-white dark:text-black font-semibold text-center text-sm">{pct}%</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity className="flex-1 bg-yellow-500 dark:bg-yellow-400 rounded py-2" onPress={handleMaxAmount}>
                <Text className="text-white dark:text-black font-semibold text-center text-sm">MAX</Text>
              </TouchableOpacity>
            </View>

            {/* Preview */}
            <View className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-zinc-700">
              <Text className="text-gray-900 dark:text-yellow-500 text-sm mb-2">Estimated Shares</Text>
              <Text className="text-gray-900 dark:text-yellow-400 font-bold text-2xl">{formatShares(estimatedShares)}</Text>
            </View>

            {/* Action Button - Approve or Deposit depending on allowance */}
            {needsApproval ? (
              <TouchableOpacity
                className="bg-yellow-500 dark:bg-yellow-400 rounded-lg py-4 mb-3 disabled:opacity-50 shadow-md"
                onPress={handleApprove}
                disabled={!amount || Number.parseFloat(amount) <= 0}
              >
                <Text className="text-white dark:text-black font-bold text-center text-lg">
                  Approve USDC
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="bg-yellow-500 dark:bg-yellow-400 rounded-lg py-4 mb-3 disabled:opacity-50 shadow-md"
                onPress={handleDeposit}
                disabled={!amount || Number.parseFloat(amount) <= 0}
              >
                <Text className="text-white dark:text-black font-bold text-center text-lg">
                  Deposit
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Approving Stage */}
        {stage === "approving" && (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#FDC700" />
            <Text className="text-gray-900 dark:text-white mt-6 text-center font-semibold text-lg">
              Approving USDC...
            </Text>
            <Text className="text-gray-500 dark:text-zinc-400 text-sm mt-2 text-center">
              Confirming token approval
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

        {/* Approved Stage - User manually triggers deposit */}
        {stage === "approved" && (
          <View className="flex-1 justify-center items-center py-12">
            <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-4">
              <Text className="text-3xl">✓</Text>
            </View>
            <Text className="text-gray-900 dark:text-white mt-2 text-center font-semibold text-lg">
              USDC Approved!
            </Text>
            <Text className="text-gray-500 dark:text-zinc-400 text-sm mt-2 text-center px-8">
              Your tokens are approved. Tap the button below to complete your deposit.
            </Text>

            {/* Preview */}
            <View className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4 mt-6 w-full border border-gray-200 dark:border-zinc-700">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500 dark:text-zinc-400 text-sm">Amount</Text>
                <Text className="text-gray-900 dark:text-white font-semibold">{formatCurrency(Number.parseFloat(amount || "0"))}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500 dark:text-zinc-400 text-sm">Estimated Shares</Text>
                <Text className="text-yellow-600 dark:text-yellow-400 font-semibold">{formatShares(estimatedShares)}</Text>
              </View>
            </View>

            <View className="mt-6 w-full">
              <ProgressBar progress={txProgress} />
            </View>

            {/* Deposit Button */}
            <TouchableOpacity
              className="mt-6 w-full bg-yellow-500 dark:bg-yellow-400 rounded-lg py-4 shadow-md"
              onPress={handleDeposit}
            >
              <Text className="text-white dark:text-black font-bold text-center text-lg">
                Deposit Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 px-6 py-3 border border-gray-300 dark:border-zinc-600 rounded-lg"
              onPress={handleCancel}
            >
              <Text className="text-gray-600 dark:text-zinc-400 text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Depositing Stage */}
        {stage === "depositing" && (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#FDC700" />
            <Text className="text-gray-900 dark:text-white mt-6 text-center font-semibold text-lg">
              Processing Deposit...
            </Text>
            <Text className="text-gray-500 dark:text-zinc-400 text-sm mt-2 text-center">
              Finalizing your deposit
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
      {showConfetti && (
        <View className="absolute inset-0">
          <ConfettiAnimation />
          <View className="flex-1 justify-center items-center">
            <View className="bg-black/70 rounded-2xl p-8 items-center">
              <Text className="text-yellow-400 text-3xl font-bold text-center mb-4">Deposit Successful!</Text>
              <Text className="text-white text-center text-lg mb-2">
                +{formatCurrency(Number.parseFloat(amount || "0"))} in {vaultMeta.name}
              </Text>
              <Text className="text-yellow-500 text-sm text-center">{formatShares(estimatedShares)} shares earned</Text>
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
