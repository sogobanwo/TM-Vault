import * as Haptics from "expo-haptics"

export const triggerSelectionHaptic = async () => {
  try {
    await Haptics.selectionAsync()
  } catch (error) {
    console.log("[v0] Selection haptic error:", error)
  }
}

export const triggerSuccessHaptic = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  } catch (error) {
    console.log("[v0] Success haptic error:", error)
  }
}

export const triggerErrorHaptic = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  } catch (error) {
    console.log("[v0] Error haptic error:", error)
  }
}

export const triggerWarningHaptic = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  } catch (error) {
    console.log("[v0] Warning haptic error:", error)
  }
}

export const triggerLightImpactHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  } catch (error) {
    console.log("[v0] Light impact haptic error:", error)
  }
}

export const triggerMediumImpactHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  } catch (error) {
    console.log("[v0] Medium impact haptic error:", error)
  }
}
