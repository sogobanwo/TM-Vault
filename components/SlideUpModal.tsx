import type React from "react"

import { useEffect, useRef } from "react"
import { Animated, Dimensions, Modal, Text, TouchableOpacity, View } from "react-native"

interface SlideUpModalProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function SlideUpModal({ visible, onClose, children }: SlideUpModalProps) {
  const translateY = useRef(new Animated.Value(Dimensions.get("window").height)).current

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(translateY, {
        toValue: Dimensions.get("window").height,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [visible, translateY])

  return (
    <Modal visible={visible} transparent animationType="none">
      <View className="flex-1 bg-black/50" />
      <Animated.View
        style={{
          transform: [{ translateY }],
        }}
        className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6"
      >
        <TouchableOpacity className="mb-4" onPress={onClose}>
          <Text className="text-gray-600 dark:text-amber-700">← Close</Text>
        </TouchableOpacity>
        {children}
      </Animated.View>
    </Modal>
  )
}
