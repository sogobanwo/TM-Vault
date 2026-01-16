import { useState, useCallback } from "react"
import { useAppStore } from "../store/useAppStore"
import * as Haptics from "expo-haptics"
import type { UserPosition } from "../types"

export function useTransaction() {
  const { txState, setTxState, positions, setPositions } = useAppStore()
  const [txHash, setTxHash] = useState<string>("")

  const simulateApprove = useCallback(async () => {
    return new Promise((resolve) => {
      setTxState({ status: "approving" })
      const mockHash = "0x" + Math.random().toString(16).slice(2, 66)
      setTimeout(() => {
        setTxHash(mockHash)
        resolve(mockHash)
      }, 3000)
    })
  }, [setTxState])

  const simulateDeposit = useCallback(
    async (vaultId: string, amount: number, shares: number) => {
      return new Promise((resolve) => {
        setTxState({ status: "depositing", amount })

        const mockHash = "0x" + Math.random().toString(16).slice(2, 66)
        setTimeout(() => {
          const newPosition: UserPosition = {
            vaultId,
            balance: amount,
            shares,
            depositedAt: new Date().toISOString(),
          }

          setPositions([...positions, newPosition])
          setTxState({ status: "success" })
          setTxHash(mockHash)

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          resolve(mockHash)
        }, 5000)
      })
    },
    [positions, setPositions, setTxState],
  )

  const handleError = useCallback(
    (error: string) => {
      setTxState({
        status: "error",
        error,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    },
    [setTxState],
  )

  const resetTransaction = useCallback(() => {
    setTxState({ status: "idle" })
    setTxHash("")
  }, [setTxState])

  return {
    txState,
    txHash,
    simulateApprove,
    simulateDeposit,
    handleError,
    resetTransaction,
  }
}
