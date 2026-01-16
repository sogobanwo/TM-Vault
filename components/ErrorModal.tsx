import { Modal, Text, TouchableOpacity, View } from "react-native"

interface ErrorModalProps {
  visible: boolean
  title: string
  message: string
  onRetry: () => void
  onDismiss: () => void
}

export default function ErrorModal({ visible, title, message, onRetry, onDismiss }: ErrorModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center p-4">
        <View className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-red-200 dark:border-red-800/50 w-full max-w-sm shadow-xl">
          <View className="items-center mb-4">
            <View className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-3">
              <Text className="text-red-600 dark:text-red-400 text-2xl">!</Text>
            </View>
            <Text className="text-xl font-bold text-red-600 dark:text-red-400 text-center">{title}</Text>
          </View>
          <Text className="text-gray-600 dark:text-zinc-400 mb-6 text-center">{message}</Text>

          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 bg-gray-200 dark:bg-zinc-800 rounded-lg py-3" onPress={onDismiss}>
              <Text className="text-gray-800 dark:text-zinc-300 font-semibold text-center">Dismiss</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-red-500 dark:bg-red-600 rounded-lg py-3" onPress={onRetry}>
              <Text className="text-white font-semibold text-center">Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
