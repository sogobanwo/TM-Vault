import * as Haptics from "expo-haptics"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { parseUnits } from "viem"

import { useToast } from "../contexts/ToastContext"
import { useApproveUSDC, useUSDCAllowance, useUSDCBalance } from "../hooks/useMockUSDC"
import { useDeposit, usePreviewDeposit } from "../hooks/useTMVault"
import { contracts } from "../utils/contracts"
import { formatCurrency, formatShares, fromBigInt } from "../utils/formatters"
import { VAULT_METADATA } from "../utils/vaults"
import ConfettiAnimation from "./ConfettiAnimation"
import ErrorModal from "./ErrorModal"
import ProgressBar from "./ProgressBar"

import { useWalletKit } from "../contexts/WalletKitContext"

export default function DepositModal({ route, navigation }: any) {
  const { vaultId } = route.params
  const vaultMeta = VAULT_METADATA.find((v) => v.id === vaultId)

  const { address } = useWalletKit()
  const { showToast } = useToast()
  const { balance: usdcBalanceBigInt } = useUSDCBalance(address as `0x${string}` | undefined)

  // Need Vault Address for allowance check. contracts.tmVault.address
  const spenderAddress = contracts.tmVault.address
  const { allowance: allowanceBigInt, refetch: refetchAllowance } = useUSDCAllowance(address as `0x${string}` | undefined, spenderAddress)

  const { approve, isLoading: isApproving, isConfirmed: isApproveConfirmed } = useApproveUSDC()
  const { deposit, isLoading: isDepositing, isConfirmed: isDepositConfirmed, error: depositError } = useDeposit()

  const [amount, setAmount] = useState("")
  // We can use previewDeposit to estimate shares
  const amountBigInt = amount ? parseUnits(amount, 6) : 0n
  const { preview: estimatedSharesBigInt } = usePreviewDeposit(amountBigInt, vaultMeta?.type!)

  const [stage, setStage] = useState<"input" | "approving" | "depositing" | "success">("input")
  const [showConfetti, setShowConfetti] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorTitle, setErrorTitle] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [txProgress, setTxProgress] = useState(0)

  // Effects for success states
  useEffect(() => {
    if (isApproveConfirmed && stage === "approving") {
      handleDeposit()
    }
  }, [isApproveConfirmed])

  useEffect(() => {
    if (isDepositConfirmed && stage === "depositing") {
      setTxProgress(1)
      setStage("success")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setShowConfetti(true)
      setTimeout(() => {
        navigation.goBack()
      }, 3000)
    }
  }, [isDepositConfirmed])

  useEffect(() => {
    if (depositError) {
      showToast("Transaction failed. Please try again.", "error")
      setErrorTitle("Transaction Failed")
      setErrorMessage(depositError.message || "An error occurred.")
      setShowError(true)
      setStage("input")
    }
  }, [depositError])

  if (!vaultMeta) return null

  const usdcBalance = fromBigInt(usdcBalanceBigInt)
  const estimatedShares = fromBigInt(estimatedSharesBigInt)

  const handleQuickAmount = (percentage: number) => {
    Haptics.selectionAsync()
    const quickAmount = Math.floor(usdcBalance * (percentage / 100) * 100) / 100
    setAmount(quickAmount.toString())
  }

  const handleMaxAmount = () => {
    Haptics.selectionAsync()
    setAmount(usdcBalance.toString())
  }

  const handleDeposit = () => {
    if (!vaultMeta) return
    const depositAmount = parseUnits(amount, 6)
    setStage("depositing")
    setTxProgress(0.5) // Indeterminate
    deposit(depositAmount, vaultMeta.type)
  }

  const handleApproveAndDeposit = async () => {
    const depositAmount = parseUnits(amount || "0", 6)
    if (depositAmount <= 0n) {
      showToast("Please enter an amount greater than 0", "error")
      return
    }

    if (depositAmount > (usdcBalanceBigInt || 0n)) {
      showToast(`Insufficient funds. You only have ${formatCurrency(usdcBalance)} available`, "error")
      return
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)

    // Check allowance
    if ((allowanceBigInt || 0n) < depositAmount) {
      setStage("approving")
      setTxProgress(0.2)
      showToast("Requesting USDC approval...", "info")
      approve(spenderAddress, depositAmount)
    } else {
      handleDeposit()
    }
  }

  const handleRetry = () => {
    setShowError(false)
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
          <Text className="text-amber-700">← Back</Text>
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

            {/* Approve Button */}
            <TouchableOpacity
              className="bg-yellow-500 dark:bg-yellow-400 rounded-lg py-4 mb-3 disabled:opacity-50 shadow-md"
              onPress={handleApproveAndDeposit}
              disabled={!amount || Number.parseFloat(amount) <= 0}
            >
              <Text className="text-white dark:text-black font-bold text-center text-lg">
                {(allowanceBigInt || 0n) < (amount ? parseUnits(amount, 6) : 0n) ? "Approve & Deposit" : "Deposit"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {(stage === "approving" || stage === "depositing") && (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#FDC700" />
            <Text className="text-white mt-6 text-center font-semibold text-lg">
              {stage === "approving" ? "Approving USDC..." : "Processing Deposit..."}
            </Text>
            <Text className="text-gray-500 dark:text-zinc-400 text-sm mt-2 text-center">
              {stage === "approving" ? "Confirming token approval" : "Finalizing your deposit"}
            </Text>
            <View className="mt-6 w-full">
              <ProgressBar progress={txProgress} />
            </View>
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
              <Text className="text-amber-700 text-sm text-center">{formatShares(estimatedShares)} shares earned</Text>
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
