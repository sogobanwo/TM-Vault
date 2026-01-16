import { AlertCircle, CheckCircle, Info } from "lucide-react-native"
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { Animated, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type ToastType = "success" | "error" | "info"

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

interface ToastState {
  message: string
  type: ToastType
  visible: boolean
  duration: number
  key: number
}

const toastConfig = {
  success: {
    bgColor: "bg-emerald-500", // Used for icon circle bg
    iconColor: "#10b981", // emerald-500
    Icon: CheckCircle,
  },
  error: {
    bgColor: "bg-red-500",
    iconColor: "#ef4444", // red-500
    Icon: AlertCircle,
  },
  info: {
    bgColor: "bg-blue-500",
    iconColor: "#3b82f6", // blue-500
    Icon: Info,
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "info",
    visible: false,
    duration: 3000,
    key: 0,
  })

  // Start with +100 (below screen) for bottom positioning
  const translateY = useRef(new Animated.Value(100)).current
  const opacity = useRef(new Animated.Value(0)).current
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string, type: ToastType = "info", duration: number = 3000) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Reset to initial state (below screen)
    translateY.setValue(100)
    opacity.setValue(0)

    setToast(prev => ({
      message,
      type,
      visible: true,
      duration,
      key: prev.key + 1,
    }))
  }, [translateY, opacity])

  useEffect(() => {
    if (toast.visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()

      timeoutRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 100, // Slide back down
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setToast(prev => ({ ...prev, visible: false }))
        })
      }, toast.duration - 300)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [toast.key, toast.visible, toast.duration, translateY, opacity])

  const insets = useSafeAreaInsets()

  const config = toastConfig[toast.type]
  const IconComponent = config.Icon

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <Animated.View
          style={{
            opacity,
            transform: [{ translateY }],
            position: "absolute",
            bottom: insets.bottom + 20, // Position at bottom
            left: 20,
            right: 20,
            zIndex: 9999,
          }}
          pointerEvents="none"
        >
          <View
            className="flex-row items-center p-4 rounded-xl"
            style={{
              backgroundColor: "rgba(20, 20, 25, 0.9)", // Dark transparent background
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <View className={`mr-3 p-2 rounded-full ${config.bgColor} bg-opacity-20`}>
              <IconComponent size={20} color={config.iconColor} />
            </View>
            <Text className="text-white font-medium text-sm flex-1">{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  )
}
