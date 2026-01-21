import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useWalletKit } from "../contexts/WalletKitContext"
import { contracts } from "../utils/contracts"
import { baseSepolia } from "viem/chains"
import { safeWalletCall } from "../utils/safeWalletCall"

export function useMintUSDC() {
    const queryClient = useQueryClient()
    const { walletClient, publicClient, address } = useWalletKit()

    const mutation = useMutation({
        mutationFn: async ({ to, amount }: { to: `0x${string}`, amount: bigint }) => {
            if (!walletClient || !publicClient || !address) throw new Error("Wallet not connected")

            const hash = await safeWalletCall(() =>
                walletClient.writeContract({
                    ...contracts.mockUsdc,
                    functionName: "mint",
                    args: [to, amount],
                    account: address as `0x${string}`,
                    chain: baseSepolia
                })
            )

            const receipt = await publicClient.waitForTransactionReceipt({ hash })
            return { hash, receipt }
        },
        onSuccess: () => {
            console.log("[useMintUSDC] Transaction confirmed, invalidating queries...")
            queryClient.invalidateQueries()
        },
        onError: (error) => {
            console.error("[useMintUSDC] Transaction failed:", error)
        }
    })

    const mint = (to: `0x${string}`, amount: bigint) => {
        mutation.mutate({ to, amount })
    }

    return {
        mint,
        hash: mutation.data?.hash,
        isPending: mutation.isPending,
        isConfirming: mutation.isPending,
        isConfirmed: mutation.isSuccess,
        isLoading: mutation.isPending,
        error: mutation.error,
        reset: mutation.reset
    }
}

export function useApproveUSDC() {
    const queryClient = useQueryClient()
    const { walletClient, publicClient, address } = useWalletKit()

    const mutation = useMutation({
        mutationFn: async ({ spender, amount }: { spender: `0x${string}`, amount: bigint }) => {
            if (!walletClient || !publicClient || !address) throw new Error("Wallet not connected")

            const hash = await safeWalletCall(() =>
                walletClient.writeContract({
                    ...contracts.mockUsdc,
                    functionName: "approve",
                    args: [spender, amount],
                    account: address as `0x${string}`,
                    chain: baseSepolia
                })
            )

            const receipt = await publicClient.waitForTransactionReceipt({ hash })
            return { hash, receipt }
        },
        onSuccess: () => {
            console.log("[useApproveUSDC] Transaction confirmed, invalidating queries...")
            queryClient.invalidateQueries()
        },
        onError: (error) => {
            console.error("[useApproveUSDC] Transaction failed:", error)
        }
    })

    const approve = (spender: `0x${string}`, amount: bigint) => {
        mutation.mutate({ spender, amount })
    }

    return {
        approve,
        hash: mutation.data?.hash,
        isPending: mutation.isPending,
        isConfirming: mutation.isPending,
        isConfirmed: mutation.isSuccess,
        isLoading: mutation.isPending,
        error: mutation.error,
        reset: mutation.reset
    }
}

export function useUSDCBalance(address?: `0x${string}`) {
    const { publicClient } = useWalletKit()

    const { data: balance, isLoading, error, refetch } = useQuery({
        queryKey: ["usdcBalance", address],
        queryFn: async () => {
            if (!publicClient || !address) return 0n
            return await publicClient.readContract({
                ...contracts.mockUsdc,
                functionName: "balanceOf",
                args: [address],
            })
        },
        enabled: !!publicClient && !!address
    })

    console.log("[useUSDCBalance] Result:", { balance: balance?.toString(), isLoading, error: error?.message })

    return { balance: balance as bigint | undefined, isLoading, error, refetch }
}

export function useUSDCAllowance(owner?: `0x${string}`, spender?: `0x${string}`) {
    const { publicClient } = useWalletKit()

    const { data: allowance, isLoading, error, refetch } = useQuery({
        queryKey: ["usdcAllowance", owner, spender],
        queryFn: async () => {
            if (!publicClient || !owner || !spender) return 0n
            return await publicClient.readContract({
                ...contracts.mockUsdc,
                functionName: "allowance",
                args: [owner, spender],
            })
        },
        enabled: !!publicClient && !!owner && !!spender
    })

    console.log("[useUSDCAllowance] Result:", { allowance: allowance?.toString(), isLoading, error: error?.message })

    return { allowance: allowance as bigint | undefined, isLoading, error, refetch }
}
