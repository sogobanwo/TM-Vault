import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { TransactionState, UserPosition, WalletState } from "../types"

interface AppState {
  wallet: WalletState
  positions: UserPosition[]
  txState: TransactionState
  setWallet: (wallet: Partial<WalletState>) => void
  setPositions: (positions: UserPosition[]) => void
  setTxState: (state: Partial<TransactionState>) => void
  resetTxState: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      wallet: {
        address: null,
        isConnected: false,
        usdcBalance: 0,
        network: "unknown",
        isCorrectNetwork: false,
      },
      positions: [],
      txState: { status: "idle" },
      setWallet: (wallet) =>
        set((state) => ({
          wallet: { ...state.wallet, ...wallet },
        })),
      setPositions: (positions) => set({ positions }),
      setTxState: (txState) =>
        set((prevState) => ({
          txState: { ...prevState.txState, ...txState },
        })),
      resetTxState: () => set({ txState: { status: "idle" } }),
    }),
    {
      name: "tm-vault-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ wallet: state.wallet, positions: state.positions }),
    }
  )
)

