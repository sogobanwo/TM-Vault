import React from "react"

import { useVaultStats, VaultType } from "../hooks/useTMVault"
import { fromBigInt, safeNumber } from "../utils/formatters"
import { VaultMetadata } from "../utils/vaults"
import VaultCard from "./VaultCard"

interface VaultCardWrapperProps {
    metadata: VaultMetadata
    position: any // Type from useUserPosition hook
    onPress: (vaultId: string) => void
}

import { useWalletKit } from "../contexts/WalletKitContext"

export default function VaultCardWrapper({ metadata, position, onPress }: VaultCardWrapperProps) {
    const { stats } = useVaultStats(metadata.type)
    const { address } = useWalletKit()

    let userBalance = 0
    let userShares = 0

    if (position) {
        if (metadata.type === VaultType.Stable) {
            userBalance = fromBigInt(position.stableAssets)
            userShares = fromBigInt(position.stableShares)
        } else if (metadata.type === VaultType.Growth) {
            userBalance = fromBigInt(position.growthAssets)
            userShares = fromBigInt(position.growthShares)
        } else if (metadata.type === VaultType.Turbo) {
            userBalance = fromBigInt(position.turboAssets)
            userShares = fromBigInt(position.turboShares)
        }
    }

    // Parse Stats with safety
    // TVL is in USDC (6 decimals)
    const tvl = stats ? fromBigInt(stats.tvl) : 0
    // APY values are in basis points (500 = 5%), so divide by 100 to get percentage
    const minApyVal = stats ? safeNumber(stats.minAPY) / 100 : 0
    const maxApyVal = stats ? safeNumber(stats.maxAPY) / 100 : 0
    // Lock period is in seconds
    const lockPeriod = stats ? safeNumber(stats.lockPeriod) : 0

    const vaultData = {
        id: metadata.id,
        name: metadata.name,
        riskLevel: metadata.riskLevel,
        targetApy: { min: minApyVal, max: maxApyVal },
        balance: userBalance,
        tvl: tvl,
        shares: userShares,
        sharePrice: 1,
        lockPeriod: lockPeriod,
    }

    return <VaultCard vault={vaultData} onPress={() => onPress(metadata.id)} />
}
