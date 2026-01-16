import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { parseAbiItem } from "viem"
import { baseSepolia } from "viem/chains"
import { contracts } from "../utils/contracts"

export enum VaultType {
    Stable = 0,
    Growth = 1,
    Turbo = 2,
}

// --- Types ---
export interface VaultStats {
    name: string
    minAPY: bigint
    maxAPY: bigint
    tvl: bigint
    totalShares: bigint
    totalDeposits: bigint
    totalWithdrawals_: bigint
    lockPeriod: bigint
}

export interface UserPositionData {
    stableShares: bigint
    stableAssets: bigint
    growthShares: bigint
    growthAssets: bigint
    turboShares: bigint
    turboAssets: bigint
    canWithdrawStable: boolean
    canWithdrawGrowth: boolean
    canWithdrawTurbo: boolean
}

// --- Read Hooks ---

import { useWalletKit } from "../contexts/WalletKitContext"

export function useVaultStats(vaultType: VaultType) {
    console.log("[useVaultStats] VaultType:", vaultType, "Contract:", contracts.tmVault.address)
    const { publicClient } = useWalletKit()

    const { data: rawStats, isLoading, error, refetch } = useQuery({
        queryKey: ["vaultStats", vaultType],
        queryFn: async () => {
            if (!publicClient) return null
            return await publicClient.readContract({
                ...contracts.tmVault,
                functionName: "getVaultStats",
                args: [vaultType],
            })
        },
        enabled: !!publicClient
    })

    let stats: VaultStats | undefined
    if (rawStats && Array.isArray(rawStats)) {
        stats = {
            name: rawStats[0] as string,
            minAPY: rawStats[1] as bigint,
            maxAPY: rawStats[2] as bigint,
            tvl: rawStats[3] as bigint,
            totalShares: rawStats[4] as bigint,
            totalDeposits: rawStats[5] as bigint,
            totalWithdrawals_: rawStats[6] as bigint,
            lockPeriod: rawStats[7] as bigint,
        }
    }

    console.log("[useVaultStats] Result:", { stats, isLoading, error: error?.message })

    return { stats, isLoading, error, refetch }
}

export function useUserPosition(userAddress?: `0x${string}`) {
    console.log("[useUserPosition] Address:", userAddress, "Contract:", contracts.tmVault.address)
    const { publicClient } = useWalletKit()

    const { data: rawPosition, isLoading, error, refetch } = useQuery({
        queryKey: ["userPosition", userAddress],
        queryFn: async () => {
            if (!publicClient) return null
            return await publicClient.readContract({
                ...contracts.tmVault,
                functionName: "getUserPosition",
                args: [userAddress || "0x0000000000000000000000000000000000000000"],
            })
        },
        enabled: !!publicClient && !!userAddress,
    })

    // Parse the raw position data from the contract
    let position: UserPositionData | undefined
    if (rawPosition && Array.isArray(rawPosition)) {
        position = {
            stableShares: rawPosition[0] as bigint,
            stableAssets: rawPosition[1] as bigint,
            growthShares: rawPosition[2] as bigint,
            growthAssets: rawPosition[3] as bigint,
            turboShares: rawPosition[4] as bigint,
            turboAssets: rawPosition[5] as bigint,
            canWithdrawStable: rawPosition[6] as boolean,
            canWithdrawGrowth: rawPosition[7] as boolean,
            canWithdrawTurbo: rawPosition[8] as boolean,
        }
    }

    console.log("[useUserPosition] Raw:", rawPosition)
    console.log("[useUserPosition] Parsed:", position)
    console.log("[useUserPosition] Result:", { position, isLoading, error: error?.message })

    return { position, isLoading, error, refetch }
}

export function useAllTVL() {
    console.log("[useAllTVL] Contract:", contracts.tmVault.address)
    const { publicClient } = useWalletKit()

    const { data: tvlData, isLoading, error, refetch } = useQuery({
        queryKey: ["allTVL"],
        queryFn: async () => {
            if (!publicClient) return null
            return await publicClient.readContract({
                ...contracts.tmVault,
                functionName: "getAllTVL",
            })
        },
        enabled: !!publicClient,
    })

    console.log("[useAllTVL] Result:", { tvlData, isLoading, error: error?.message })

    return { tvlData: tvlData as bigint[] | undefined, isLoading, error, refetch }
}

export function useVaultTVL(vaultType: VaultType) {
    console.log("[useVaultTVL] VaultType:", vaultType)
    const { publicClient } = useWalletKit()

    const { data: tvl, isLoading, error, refetch } = useQuery({
        queryKey: ["vaultTVL", vaultType],
        queryFn: async () => {
            if (!publicClient) return null
            return await publicClient.readContract({
                ...contracts.tmVault,
                functionName: "getTVL",
                args: [vaultType],
            })
        },
        enabled: !!publicClient,
    })

    console.log("[useVaultTVL] Result:", { tvl: tvl?.toString(), isLoading, error: error?.message })

    return { tvl: tvl as bigint | undefined, isLoading, error, refetch }
}

export function usePreviewDeposit(assets: bigint, vaultType: VaultType) {
    console.log("[usePreviewDeposit] Assets:", assets?.toString(), "VaultType:", vaultType)
    const { publicClient } = useWalletKit()

    const { data: preview, isLoading, error } = useQuery({
        queryKey: ["previewDeposit", assets.toString(), vaultType],
        queryFn: async () => {
            if (!publicClient) return null
            return await publicClient.readContract({
                ...contracts.tmVault,
                functionName: "previewDeposit",
                args: [assets, vaultType],
            })
        },
        enabled: !!publicClient && assets > 0n,
    })

    console.log("[usePreviewDeposit] Result:", { preview: preview?.toString(), isLoading, error: error?.message })

    let parsedPreview: bigint | undefined
    if (preview !== undefined && preview !== null) {
        if (Array.isArray(preview)) {
            parsedPreview = BigInt(preview[0].toString())
        } else {
            parsedPreview = BigInt(preview.toString())
        }
    }

    return { preview: parsedPreview, isLoading, error }
}

export function usePreviewWithdraw(shares: bigint, vaultType: VaultType) {
    console.log("[usePreviewWithdraw] Shares:", shares?.toString(), "VaultType:", vaultType)
    const { publicClient } = useWalletKit()

    const { data: preview, isLoading, error } = useQuery({
        queryKey: ["previewWithdraw", shares.toString(), vaultType],
        queryFn: async () => {
            if (!publicClient) return null
            return await publicClient.readContract({
                ...contracts.tmVault,
                functionName: "previewWithdraw",
                args: [shares, vaultType],
            })
        },
        enabled: !!publicClient && shares > 0n,
    })

    console.log("[usePreviewWithdraw] Result:", { preview: preview?.toString(), isLoading, error: error?.message })

    let parsedPreview: bigint | undefined
    if (preview !== undefined && preview !== null) {
        if (Array.isArray(preview)) {
            parsedPreview = BigInt(preview[0].toString())
        } else {
            parsedPreview = BigInt(preview.toString())
        }
    }

    return { preview: parsedPreview, isLoading, error }
}

export function usePendingWithdrawals(userAddress?: `0x${string}`) {
    console.log("[usePendingWithdrawals] Address:", userAddress)
    const { publicClient } = useWalletKit()

    const { data: pending, isLoading, error, refetch } = useQuery({
        queryKey: ["pendingWithdrawals", userAddress],
        queryFn: async () => {
            if (!publicClient || !userAddress) return null
            return await publicClient.readContract({
                ...contracts.tmVault,
                functionName: "pendingWithdrawals",
                args: [userAddress],
            })
        },
        enabled: !!publicClient && !!userAddress,
    })

    console.log("[usePendingWithdrawals] Result:", { pending, isLoading, error: error?.message })

    return { pending, isLoading, error, refetch }
}

// --- Write Hooks with Transaction Receipt Waiting ---

export function useDeposit() {
    const queryClient = useQueryClient()
    const { walletClient, publicClient, address } = useWalletKit()

    const mutation = useMutation({
        mutationFn: async ({ assets, vaultType }: { assets: bigint, vaultType: VaultType }) => {
            if (!walletClient || !publicClient || !address) throw new Error("Wallet not connected")
            console.log("[useDeposit] Initiating deposit:", assets.toString(), "VaultType:", vaultType)

            const hash = await walletClient.writeContract({
                ...contracts.tmVault,
                functionName: "deposit",
                args: [assets, vaultType],
                account: address as `0x${string}`,
                chain: baseSepolia
            })

            console.log("[useDeposit] Tx hash:", hash)
            const receipt = await publicClient.waitForTransactionReceipt({ hash })
            return { hash, receipt }
        },
        onSuccess: () => {
            console.log("[useDeposit] Transaction confirmed, invalidating queries...")
            queryClient.invalidateQueries()
        }
    })

    const deposit = (assets: bigint, vaultType: VaultType) => {
        mutation.mutate({ assets, vaultType })
    }

    return {
        deposit,
        hash: mutation.data?.hash,
        isPending: mutation.isPending,
        isConfirming: mutation.isPending,
        isConfirmed: mutation.isSuccess,
        isLoading: mutation.isPending,
        error: mutation.error,
        reset: mutation.reset
    }
}

export function useRequestWithdrawal() {
    const queryClient = useQueryClient()
    const { walletClient, publicClient, address } = useWalletKit()

    const mutation = useMutation({
        mutationFn: async ({ shares, vaultType }: { shares: bigint, vaultType: VaultType }) => {
            if (!walletClient || !publicClient || !address) throw new Error("Wallet not connected")
            console.log("[useRequestWithdrawal] Initiating withdrawal request:", shares.toString(), "VaultType:", vaultType)

            const hash = await walletClient.writeContract({
                ...contracts.tmVault,
                functionName: "requestWithdrawal",
                args: [shares, vaultType],
                account: address as `0x${string}`,
                chain: baseSepolia
            })

            console.log("[useRequestWithdrawal] Tx hash:", hash)
            const receipt = await publicClient.waitForTransactionReceipt({ hash })
            return { hash, receipt }
        },
        onSuccess: () => {
            console.log("[useRequestWithdrawal] Transaction confirmed, invalidating queries...")
            queryClient.invalidateQueries()
        }
    })

    const requestWithdrawal = (shares: bigint, vaultType: VaultType) => {
        mutation.mutate({ shares, vaultType })
    }

    return {
        requestWithdrawal,
        hash: mutation.data?.hash,
        isPending: mutation.isPending,
        isConfirming: mutation.isPending,
        isConfirmed: mutation.isSuccess,
        isLoading: mutation.isPending,
        error: mutation.error,
        reset: mutation.reset
    }
}

export function useExecuteWithdrawal() {
    const queryClient = useQueryClient()
    const { walletClient, publicClient, address } = useWalletKit()

    const mutation = useMutation({
        mutationFn: async () => {
            if (!walletClient || !publicClient || !address) throw new Error("Wallet not connected")
            console.log("[useExecuteWithdrawal] Executing withdrawal")

            const hash = await walletClient.writeContract({
                ...contracts.tmVault,
                functionName: "executeWithdrawal",
                account: address as `0x${string}`,
                chain: baseSepolia
            })

            console.log("[useExecuteWithdrawal] Tx hash:", hash)
            const receipt = await publicClient.waitForTransactionReceipt({ hash })
            return { hash, receipt }
        },
        onSuccess: () => {
            console.log("[useExecuteWithdrawal] Transaction confirmed, invalidating queries...")
            queryClient.invalidateQueries()
        }
    })

    return {
        executeWithdrawal: mutation.mutate,
        hash: mutation.data?.hash,
        isPending: mutation.isPending,
        isConfirming: mutation.isPending,
        isConfirmed: mutation.isSuccess,
        isLoading: mutation.isPending,
        error: mutation.error,
        reset: mutation.reset
    }
}

export function useCancelWithdrawal() {
    const queryClient = useQueryClient()
    const { walletClient, publicClient, address } = useWalletKit()

    const mutation = useMutation({
        mutationFn: async () => {
            if (!walletClient || !publicClient || !address) throw new Error("Wallet not connected")
            console.log("[useCancelWithdrawal] Cancelling withdrawal")

            const hash = await walletClient.writeContract({
                ...contracts.tmVault,
                functionName: "cancelWithdrawal",
                account: address as `0x${string}`,
                chain: baseSepolia
            })

            console.log("[useCancelWithdrawal] Tx hash:", hash)
            const receipt = await publicClient.waitForTransactionReceipt({ hash })
            return { hash, receipt }
        },
        onSuccess: () => {
            console.log("[useCancelWithdrawal] Transaction confirmed, invalidating queries...")
            queryClient.invalidateQueries()
        }
    })

    return {
        cancelWithdrawal: mutation.mutate,
        hash: mutation.data?.hash,
        isPending: mutation.isPending,
        isConfirming: mutation.isPending,
        isConfirmed: mutation.isSuccess,
        isLoading: mutation.isPending,
        error: mutation.error,
        reset: mutation.reset
    }
}

export function useVaultHistory(userAddress?: `0x${string}`) {
    const { publicClient } = useWalletKit()

    const { data: history = [], isLoading, error, refetch } = useQuery({
        queryKey: ["vaultHistory", userAddress],
        queryFn: async () => {
            if (!userAddress || !publicClient) return []

            console.log("[useVaultHistory] Fetching history for:", userAddress)
            const currentBlock = await publicClient.getBlockNumber()
            const fromBlock = currentBlock - 50000n > 0n ? currentBlock - 50000n : 0n

            const [depositLogs, withdrawLogs, requestedLogs, cancelledLogs, incomingLogs, outgoingLogs] = await Promise.all([
                publicClient.getLogs({
                    address: contracts.tmVault.address,
                    event: parseAbiItem('event Deposit(address indexed user, uint8 indexed vaultType, uint256 assets, uint256 shares, uint256 fee, uint256 timestamp)'),
                    args: { user: userAddress },
                    fromBlock
                }),
                publicClient.getLogs({
                    address: contracts.tmVault.address,
                    event: parseAbiItem('event Withdraw(address indexed user, uint8 indexed vaultType, uint256 shares, uint256 assets, uint256 fee, uint256 timestamp)'),
                    args: { user: userAddress },
                    fromBlock
                }),
                publicClient.getLogs({
                    address: contracts.tmVault.address,
                    event: parseAbiItem('event WithdrawalRequested(address indexed user, uint8 indexed vaultType, uint256 shares, uint256 requestTime)'),
                    args: { user: userAddress },
                    fromBlock
                }),
                publicClient.getLogs({
                    address: contracts.tmVault.address,
                    event: parseAbiItem('event WithdrawalCancelled(address indexed user, uint8 indexed vaultType, uint256 shares)'),
                    args: { user: userAddress },
                    fromBlock
                }),
                publicClient.getLogs({
                    address: contracts.mockUsdc.address,
                    event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
                    args: { to: userAddress },
                    fromBlock
                }),
                publicClient.getLogs({
                    address: contracts.mockUsdc.address,
                    event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
                    args: { from: userAddress },
                    fromBlock
                })
            ])

            const allEvents = [
                ...depositLogs.map(l => ({ type: 'Deposit', hash: l.transactionHash, blockNumber: l.blockNumber, ...l.args })),
                ...withdrawLogs.map(l => ({ type: 'Withdraw', hash: l.transactionHash, blockNumber: l.blockNumber, ...l.args })),
                ...requestedLogs.map(l => ({ type: 'WithdrawalRequested', hash: l.transactionHash, blockNumber: l.blockNumber, ...l.args })),
                ...cancelledLogs.map(l => ({ type: 'WithdrawalCancelled', hash: l.transactionHash, blockNumber: l.blockNumber, ...l.args })),
                ...incomingLogs.map(l => ({ type: 'USDCTransfer', direction: 'in', hash: l.transactionHash, blockNumber: l.blockNumber, ...l.args })),
                ...outgoingLogs.map(l => ({ type: 'USDCTransfer', direction: 'out', hash: l.transactionHash, blockNumber: l.blockNumber, ...l.args }))
            ].sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber))

            const uniqueBlocks = [...new Set(allEvents.filter(e => !(e as any).timestamp).map(e => e.blockNumber))]
            const blockTimestamps: Record<string, bigint> = {}

            await Promise.all(uniqueBlocks.map(async (bn) => {
                try {
                    const block = await publicClient.getBlock({ blockNumber: bn })
                    blockTimestamps[bn.toString()] = block.timestamp
                } catch (e) {
                    console.error(`Failed to fetch block ${bn}:`, e)
                }
            }))

            return allEvents.map((event: any) => ({
                ...event,
                timestamp: event.timestamp || blockTimestamps[event.blockNumber.toString()]
            }))
        },
        enabled: !!userAddress && !!publicClient
    })

    return { history: history as any[], isLoading, error, refetch }
}
