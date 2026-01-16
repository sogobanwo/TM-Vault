import { useRef } from "react"
import { Animated, Text, TouchableOpacity } from "react-native"

interface GlowingButtonProps {
  label: string
  onPress: () => void
  disabled?: boolean
  variant?: "primary" | "secondary"
}

export default function GlowingButton({ label, onPress, disabled = false, variant = "primary" }: GlowingButtonProps) {
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start()
  }

  const bgColor = variant === "primary" ? "bg-yellow-500 dark:bg-yellow-400" : "bg-gray-200 dark:bg-amber-800"
  const textColor = variant === "primary" ? "text-white dark:text-black" : "text-gray-900 dark:text-white"

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
      }}
    >
      <TouchableOpacity
        className={`${bgColor} rounded-lg py-4 px-6 items-center justify-center shadow-md`}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text className={`${textColor} font-bold text-lg`}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}
