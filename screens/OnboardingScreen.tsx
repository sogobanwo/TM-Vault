import { Ionicons } from "@expo/vector-icons"
import { useWeb3Modal } from "@web3modal/wagmi-react-native"
import React from "react"
import { Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function OnboardingScreen() {
    const { open } = useWeb3Modal()

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-zinc-950 justify-between">
            <View className="flex-1 items-center justify-center px-6">
                {/* Branding / Logo Area */}
                <View className="items-center mb-12">
                    <View className="w-24 h-24 bg-yellow-400 rounded-2xl items-center justify-center mb-6 shadow-lg shadow-yellow-400/20">
                        <Ionicons name="shield-checkmark" size={48} color="black" />
                    </View>
                    <Text className="text-4xl font-bold text-gray-900 dark:text-zinc-50 text-center">
                        TM Vault
                    </Text>
                    <Text className="text-lg text-gray-500 dark:text-zinc-400 text-center mt-2">
                        Secure Yield on HyperEVM
                    </Text>
                </View>

                {/* Feature List */}
                <View className="w-full space-y-6">
                    <FeatureItem
                        icon="wallet-outline"
                        title="Connect Wallet"
                        description="Link your preferred self-custodial wallet securely."
                    />
                    <FeatureItem
                        icon="trending-up-outline"
                        title="Earn Yield"
                        description="Deposit assets into audited strategy vaults."
                    />
                    <FeatureItem
                        icon="lock-closed-outline"
                        title="Institutional Grade"
                        description="Built with security and transparency first."
                    />
                </View>
            </View>

            {/* Action Button */}
            <View className="p-6">
                <TouchableOpacity
                    onPress={() => open()}
                    className="w-full bg-yellow-400 py-4 rounded-xl items-center shadow-lg shadow-yellow-400/20 active:opacity-90"
                >
                    <Text className="text-black font-bold text-lg">
                        Connect Wallet
                    </Text>
                </TouchableOpacity>
                <Text className="text-center text-xs text-gray-400 dark:text-zinc-500 mt-4">
                    By connecting, you agree to our Terms & Privacy Policy
                </Text>
            </View>
        </SafeAreaView>
    )
}

function FeatureItem({ icon, title, description }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }) {
    return (
        <View className="flex-row items-center space-x-4">
            <View className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 items-center justify-center m-4">
                <Ionicons name={icon} size={20} color="#FDC700" />
            </View>
            <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 dark:text-zinc-100">
                    {title}
                </Text>
                <Text className="text-sm text-gray-500 dark:text-zinc-400">
                    {description}
                </Text>
            </View>
        </View>
    )
}
