import { Text, Animated } from "react-native"
import { useEffect, useRef } from "react"

interface ToastProps {
  message: string
  visible: boolean
  duration?: number
  type?: "success" | "error" | "info"
}

export default function Toast({ message, visible, duration = 3000, type = "info" }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(duration - 600),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start()
    }
  }, [visible, duration, opacity])

  const bgColor = type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-amber-800"

  return (
    <Animated.View
      style={{
        opacity,
      }}
      className={`${bgColor} rounded-lg p-4 mx-4 absolute bottom-8 left-0 right-0`}
      pointerEvents="none"
    >
      <Text className="text-white font-semibold text-center">{message}</Text>
    </Animated.View>
  )
}
