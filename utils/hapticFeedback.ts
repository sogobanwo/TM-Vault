import * as Haptics from "expo-haptics"

export const triggerSelectionHaptic = async () => {
  try {
    await Haptics.selectionAsync()
  } catch (error) {
  }
}

export const triggerSuccessHaptic = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  } catch (error) {
  }
}

export const triggerErrorHaptic = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  } catch (error) {
  }
}

export const triggerWarningHaptic = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  } catch (error) {
  }
}

export const triggerLightImpactHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  } catch (error) {
  }
}

export const triggerMediumImpactHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  } catch (error) {
  }
}
