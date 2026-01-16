import { useWeb3Modal } from "@web3modal/wagmi-react-native"
import { useState } from "react"
import { Modal, Text, TouchableOpacity, View } from "react-native"
import { hyperliquidEvmTestnet } from "viem/chains"
import { useAccount, useChainId, useDisconnect, useSwitchChain } from "wagmi"
import { useAppStore } from "../store/useAppStore"
import { formatAddress, formatCurrency } from "../utils/formatters"

export default function WalletSection() {
  const { wallet } = useAppStore()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { open } = useWeb3Modal()
  const [showModal, setShowModal] = useState(false)

  const displayAddress = address ? formatAddress(address) : ""
  const usdcBalance = wallet.usdcBalance || 0

  // Check if we are on the correct network (Hyperliquid EVM Testnet)
  // You might want to make the target chain configurable or derived from config
  const isCorrectNetwork = chainId === hyperliquidEvmTestnet.id

  const handleDisconnect = async () => {
    try {
      disconnect()
      setShowModal(false)
    } catch (e) {
      console.error("Disconnect failed", e)
    }
  }

  const handleSwitchNetwork = () => {
    switchChain({ chainId: hyperliquidEvmTestnet.id })
  }

  // If not connected, show Connect Wallet button
  if (!isConnected) {
    return (
      <View className="bg-white dark:bg-zinc-900/50 rounded-lg p-6 border border-gray-200 dark:border-zinc-800 shadow-sm items-center">
        <Text className="text-gray-900 dark:text-zinc-100 font-semibold mb-2">Wallet Disconnected</Text>
        <Text className="text-gray-500 dark:text-zinc-400 text-sm text-center mb-4">Connect your wallet to view your vault positions and assets.</Text>
        <TouchableOpacity
          onPress={() => open()}
          className="bg-yellow-500 rounded-full py-3 px-6 w-full max-w-xs"
        >
          <Text className="text-black font-bold text-center">Connect Wallet</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="bg-white dark:bg-zinc-900/50 rounded-lg p-4 border border-gray-200 dark:border-zinc-800 shadow-sm">
      {!isCorrectNetwork && (
        <TouchableOpacity className="bg-red-100 dark:bg-red-900/20 rounded mb-3 py-2 px-3 border border-red-200 dark:border-red-900/50" onPress={handleSwitchNetwork}>
          <Text className="text-red-900 dark:text-red-100 text-center text-sm font-semibold">Wrong Network. Switch to HyperEVM</Text>
        </TouchableOpacity>
      )}

      <View className="mb-3">
        <Text className="text-gray-500 dark:text-zinc-400 text-xs">Wallet Address</Text>
        <Text className="text-gray-800 dark:text-zinc-200 font-mono text-sm">{displayAddress}</Text>
      </View>

      <View className="mb-4">
        <Text className="text-gray-500 dark:text-zinc-400 text-xs">USDC Balance</Text>
        <Text className="text-gray-800 dark:text-zinc-200 font-semibold text-lg">{formatCurrency(usdcBalance)}</Text>
      </View>

      <TouchableOpacity
        onPress={() => setShowModal(true)}
        className="bg-gray-100 dark:bg-zinc-800 rounded py-2 px-4"
      >
        <Text className="text-gray-800 dark:text-zinc-200 text-center font-medium">Manage</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View className="bg-white dark:bg-zinc-900 rounded-lg p-6 mx-6 w-80">
            <Text className="text-gray-800 dark:text-zinc-200 text-lg font-semibold mb-4">Wallet Options</Text>

            <TouchableOpacity
              onPress={handleDisconnect}
              className="bg-red-600 rounded py-3 px-4"
            >
              <Text className="text-white text-center font-medium">Disconnect Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowModal(false)}
              className="mt-3 py-3 px-4"
            >
              <Text className="text-gray-600 dark:text-zinc-400 text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}
