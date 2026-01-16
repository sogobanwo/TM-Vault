import { AlertCircle, CheckCircle, Info } from "lucide-react-native"
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { Animated, Text, View } from "react-native"

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
    bgColor: "bg-emerald-500",
    borderColor: "border-emerald-400",
    iconColor: "#ffffff",
    Icon: CheckCircle,
  },
  error: {
    bgColor: "bg-red-500",
    borderColor: "border-red-400",
    iconColor: "#ffffff",
    Icon: AlertCircle,
  },
  info: {
    bgColor: "bg-amber-500",
    borderColor: "border-amber-400",
    iconColor: "#ffffff",
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

  const translateY = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string, type: ToastType = "info", duration: number = 3000) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    translateY.setValue(-100)
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
            toValue: -100,
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
            top: 60,
            left: 16,
            right: 16,
            zIndex: 9999,
          }}
          pointerEvents="none"
        >
          <View
            className={`${config.bgColor} rounded-2xl px-4 py-3 flex-row items-center border ${config.borderColor}`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <View className="mr-3">
              <IconComponent size={22} color={config.iconColor} strokeWidth={2.5} />
            </View>
            <Text className="text-white font-semibold text-base flex-1">{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  )
}
