export const formatAddress = (address: string): string => {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatShares = (shares: number): string => {
  return shares.toFixed(2)
}

export const truncateNumber = (num: number, decimals = 2): number => {
  return Math.floor(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}
