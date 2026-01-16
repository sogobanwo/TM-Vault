import { View, ActivityIndicator, Text } from "react-native"

interface LoadingSpinnerProps {
  message?: string
  subMessage?: string
}

export default function LoadingSpinner({ message = "Loading...", subMessage }: LoadingSpinnerProps) {
  return (
    <View className="flex-1 justify-center items-center bg-black/80 p-4">
      <ActivityIndicator size="large" color="#FDC700" />
      <Text className="text-white font-semibold text-center mt-4">{message}</Text>
      {subMessage && <Text className="text-amber-700 text-sm text-center mt-2">{subMessage}</Text>}
    </View>
  )
}
