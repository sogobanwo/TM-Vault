import { VaultType } from "../hooks/useTMVault"

export interface VaultMetadata {
    type: VaultType
    id: string
    name: string
    riskLevel: "low" | "medium" | "high"
    description: string
}

export const VAULT_METADATA: VaultMetadata[] = [
    {
        type: VaultType.Stable,
        id: "stable",
        name: "Stable Vault",
        riskLevel: "low",
        description: "Low risk, stable returns using blue-chip assets.",
    },
    {
        type: VaultType.Growth,
        id: "growth",
        name: "Growth Vault",
        riskLevel: "medium",
        description: "Medium risk, balanced exposure to growth assets.",
    },
    {
        type: VaultType.Turbo,
        id: "turbo",
        name: "Turbo Vault",
        riskLevel: "high",
        description: "High risk, leverage boosted returns.",
    },
]
