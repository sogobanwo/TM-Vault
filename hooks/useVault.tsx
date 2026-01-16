import { useState } from "react"
import { useAppStore } from "../store/useAppStore"
import { MOCK_VAULTS } from "../utils/mockContracts"

export function useVault(vaultId: string) {
  const { positions } = useAppStore()
  const [loading, setLoading] = useState(false)

  const vault = MOCK_VAULTS.find((v) => v.id === vaultId)
  const position = positions.find((p: { vaultId: string }) => p.vaultId === vaultId)

  const getBalance = () => {
    if (!position || !vault) return 0
    return vault.sharePrice * position.shares
  }

  const getAPY = () => {
    if (!vault) return "0-0"
    return `${vault.targetApy.min}-${vault.targetApy.max}`
  }

  const estimateShares = (depositAmount: number) => {
    if (!vault) return 0
    return depositAmount / vault.sharePrice
  }

  return {
    vault,
    position,
    balance: getBalance(),
    apy: getAPY(),
    estimateShares,
    loading,
  }
}
