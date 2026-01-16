import { useEffect, useRef } from "react"
import { Animated, View } from "react-native"

interface ProgressBarProps {
  progress: number // 0-1
  duration?: number
}

export default function ProgressBar({ progress, duration = 500 }: ProgressBarProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration,
      useNativeDriver: false,
    }).start()
  }, [progress, duration, animatedProgress])

  const width = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  })

  return (
    <View className="h-2 bg-gray-200 dark:bg-amber-900/40 rounded-full overflow-hidden">
      <Animated.View style={{ width }} className="h-full bg-yellow-500 dark:bg-yellow-400" />
    </View>
  )
}
