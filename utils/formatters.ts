export const formatAddress = (address: string): string => {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatCurrency = (amount: number | undefined): string => {
  const safeAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount)
}

export const formatShares = (shares: number | undefined): string => {
  const safeShares = typeof shares === "number" && !isNaN(shares) ? shares : 0
  return safeShares.toFixed(2)
}

export const truncateNumber = (num: number, decimals = 2): number => {
  if (isNaN(num)) return 0
  return Math.floor(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

export const fromBigInt = (value: bigint | undefined, decimals = 6): number => {
  if (value === undefined || value === null) return 0
  return Number(value) / 10 ** decimals
}

export const safeNumber = (value: any): number => {
  if (value === undefined || value === null) return 0
  const num = Number(value)
  return isNaN(num) ? 0 : num
}
