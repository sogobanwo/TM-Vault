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

export default function DepositModal({ route, navigation }: any) {
  const { vaultId } = route.params
  const vault = MOCK_VAULTS.find((v) => v.id === vaultId)

  const { wallet, setPositions, positions } = useAppStore()
  const [amount, setAmount] = useState("")
  const [stage, setStage] = useState<"input" | "approving" | "depositing" | "success">("input")
  const [showConfetti, setShowConfetti] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorTitle, setErrorTitle] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [txProgress, setTxProgress] = useState(0)

  if (!vault) return null

  const estimatedShares = amount ? truncateNumber(Number.parseFloat(amount) / vault.sharePrice) : 0

  const handleQuickAmount = (percentage: number) => {
    Haptics.selectionAsync()
    const quickAmount = truncateNumber(wallet.usdcBalance * (percentage / 100))
    setAmount(quickAmount.toString())
  }

  const handleMaxAmount = () => {
    Haptics.selectionAsync()
    setAmount(wallet.usdcBalance.toString())
  }

  const handleApprove = async () => {
    try {
      const depositAmount = Number.parseFloat(amount || "0")

      if (depositAmount <= 0) {
        setErrorTitle("Invalid Amount")
        setErrorMessage("Please enter an amount greater than 0")
        setShowError(true)
        return
      }

      if (depositAmount > wallet.usdcBalance) {
        setErrorTitle("Insufficient Funds")
        setErrorMessage(`You only have ${formatCurrency(wallet.usdcBalance)} available`)
        setShowError(true)
        return
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      setStage("approving")
      setTxProgress(0)

      const approveInterval = setInterval(() => {
        setTxProgress((prev) => Math.min(prev + 0.15, 0.5))
      }, 300)

      await new Promise((resolve) => setTimeout(resolve, 3000))
      clearInterval(approveInterval)

      setStage("depositing")
      setTxProgress(0.5)

      const depositInterval = setInterval(() => {
        setTxProgress((prev) => Math.min(prev + 0.1, 0.95))
      }, 400)

      await new Promise((resolve) => setTimeout(resolve, 5000))
      clearInterval(depositInterval)

      const newShares = estimatedShares
      const newPosition = {
        vaultId: vault.id,
        balance: depositAmount,
        shares: newShares,
        depositedAt: new Date().toISOString(),
      }

      setPositions([...positions, newPosition])
      setTxProgress(1)
      setStage("success")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setShowConfetti(true)

      setTimeout(() => {
        navigation.goBack()
      }, 3000)
    } catch (error) {
      setErrorTitle("Transaction Failed")
      setErrorMessage("An error occurred during the transaction. Please try again.")
      setShowError(true)
      setStage("input")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
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

        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Deposit to {vault.name}</Text>
        <Text className="text-gray-500 dark:text-amber-700 mb-6">
          Target APY: {vault.targetApy.min}% - {vault.targetApy.max}%
        </Text>

        {stage === "input" && (
          <>
            {/* Amount Input */}
            <View className="bg-white dark:bg-zinc-900 rounded-lg p-4 mb-4 shadow-sm">
              <Text className="text-gray-500 dark:text-amber-700 text-xs mb-2">Amount (USD)</Text>
              <TextInput
                className="text-2xl font-bold text-gray-900 dark:text-white"
                placeholder="0.00"
                placeholderTextColor="#846600"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={(text) => {
                  const num = Number.parseFloat(text) || 0
                  if (num <= 1000) setAmount(text)
                }}
              />
              <Text className="text-gray-500 dark:text-amber-700 text-xs mt-2">
                Max: {formatCurrency(Math.min(wallet.usdcBalance, 1000))}
              </Text>
            </View>

            {/* Quick Amount Buttons */}
            <View className="flex-row gap-2 mb-6">
              <TouchableOpacity className="flex-1 bg-yellow-500 dark:bg-yellow-400 rounded py-2" onPress={() => handleQuickAmount(25)}>
                <Text className="text-white dark:text-black font-semibold text-center text-sm">25%</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-yellow-500 dark:bg-yellow-400 rounded py-2" onPress={() => handleQuickAmount(50)}>
                <Text className="text-white dark:text-black font-semibold text-center text-sm">50%</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-yellow-500 dark:bg-yellow-400 rounded py-2" onPress={() => handleQuickAmount(75)}>
                <Text className="text-white dark:text-black font-semibold text-center text-sm">75%</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-yellow-500 dark:bg-yellow-400 rounded py-2" onPress={handleMaxAmount}>
                <Text className="text-white dark:text-black font-semibold text-center text-sm">MAX</Text>
              </TouchableOpacity>
            </View>

            {/* Preview */}
            <View className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-6 border border-amber-200 dark:border-amber-800">
              <Text className="text-amber-800 dark:text-amber-700 text-sm mb-2">Estimated Shares</Text>
              <Text className="text-amber-600 dark:text-yellow-400 font-bold text-2xl">{formatShares(estimatedShares)}</Text>
            </View>

            {/* Approve Button */}
            <TouchableOpacity
              className="bg-yellow-500 dark:bg-yellow-400 rounded-lg py-4 mb-3 disabled:opacity-50 shadow-md"
              onPress={handleApprove}
              disabled={!amount || Number.parseFloat(amount) <= 0}
            >
              <Text className="text-white dark:text-black font-bold text-center text-lg">Approve & Deposit</Text>
            </TouchableOpacity>
          </>
        )}

        {(stage === "approving" || stage === "depositing") && (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#FDC700" />
            <Text className="text-white mt-6 text-center font-semibold text-lg">
              {stage === "approving" ? "Approving USDC..." : "Processing Deposit..."}
            </Text>
            <Text className="text-amber-700 text-sm mt-2 text-center">
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
                +{formatCurrency(Number.parseFloat(amount || "0"))} in {vault.name}
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
