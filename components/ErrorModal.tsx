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
        <View className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-gray-200 dark:border-amber-800 w-full max-w-sm shadow-xl">
          <Text className="text-lg font-bold text-red-600 mb-2">{title}</Text>
          <Text className="text-gray-600 dark:text-amber-700 mb-6">{message}</Text>

          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 bg-gray-200 dark:bg-gray-800 rounded py-3" onPress={onDismiss}>
              <Text className="text-gray-800 dark:text-gray-300 font-semibold text-center">Dismiss</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-yellow-500 dark:bg-yellow-400 rounded py-3" onPress={onRetry}>
              <Text className="text-white dark:text-black font-semibold text-center">Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
