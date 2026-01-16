export interface Vault {
  id: string
  name: string
  riskLevel: "low" | "medium" | "high"
  targetApy: { min: number; max: number }
  balance: number
  tvl: number
  shares: number
  sharePrice: number
}

export interface UserPosition {
  vaultId: string
  balance: number
  shares: number
  depositedAt: string
}

export interface TransactionState {
  status: "idle" | "approving" | "depositing" | "success" | "error"
  txHash?: string
  error?: string
  amount?: number
}

export interface WalletState {
  address: string | null
  isConnected: boolean
  usdcBalance: number
  network: string
  isCorrectNetwork: boolean
}
