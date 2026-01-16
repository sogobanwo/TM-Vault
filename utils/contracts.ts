import Erc20Abi from "../abis/Erc20.json"
import TMVaultAbi from "../abis/TMVault.json"

export const MOCK_USDC_ADDRESS = process.env.EXPO_PUBLIC_MOCKERC20_CONTRACT_ADDRESS as `0x${string}`
export const TM_VAULT_ADDRESS = process.env.EXPO_PUBLIC_TM_VAULT_CONTRACT_ADDRESS as `0x${string}`



export const contracts = {
    mockUsdc: {
        address: MOCK_USDC_ADDRESS,
        abi: Erc20Abi,
    },
    tmVault: {
        address: TM_VAULT_ADDRESS,
        abi: TMVaultAbi,
    },
} as const
