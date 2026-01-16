// Mock USDC Contract ABI (ERC20 + approve)
export const USDC_ABI = [
  "function balanceOf(address owner) public view returns (uint256)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function transfer(address to, uint256 amount) public returns (bool)",
]

// Mock Vault Contract ABI
export const VAULT_ABI = [
  "function deposit(uint256 amount) public",
  "function balanceOf(address owner) public view returns (uint256)",
  "function totalSupply() public view returns (uint256)",
]

export const HYPEREVM_CONFIG = {
  chainId: 12345,
  rpcUrl: "https://testnet-rpc.hyperevm.network",
  name: "HyperEVM Testnet",
}

export const CONTRACTS = {
  USDC: "0x1234567890123456789012345678901234567890",
  STABLE_VAULT: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  GROWTH_VAULT: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  TURBO_VAULT: "0xcccccccccccccccccccccccccccccccccccccccc",
}

// Mock vault data
export const MOCK_VAULTS = [
  {
    id: "stable",
    name: "Stable",
    riskLevel: "low" as const,
    targetApy: { min: 5, max: 8 },
    balance: 0,
    tvl: 1200000,
    shares: 0,
    sharePrice: 1.0,
  },
  {
    id: "growth",
    name: "Growth",
    riskLevel: "medium" as const,
    targetApy: { min: 12, max: 18 },
    balance: 0,
    tvl: 850000,
    shares: 0,
    sharePrice: 1.05,
  },
  {
    id: "turbo",
    name: "Turbo",
    riskLevel: "high" as const,
    targetApy: { min: 25, max: 50 },
    balance: 0,
    tvl: 420000,
    shares: 0,
    sharePrice: 0.98,
  },
]
