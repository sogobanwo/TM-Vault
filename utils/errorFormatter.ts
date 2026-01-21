export function formatError(error: any): string {
    if (!error) return "An unknown error occurred"

    const message = error.message || String(error)

    // User rejection
    if (
        message.includes("User denied transaction signature") ||
        message.includes("User rejected the request") ||
        message.includes("User rejected methods")
    ) {
        return "Transaction rejected by user"
    }

    // Insufficient funds
    if (message.includes("Insufficient funds") || message.includes("insufficient funds")) {
        return "Insufficient funds for gas or transaction"
    }

    // Contract revert (generic)
    if (message.includes("execution reverted")) {
        return "Transaction failed: Contract execution reverted"
    }

    // WalletConnect specific "No matching key" often means session expired or mismatch
    if (message.includes("No matching key")) {
        return "Connection session expired. Please reconnect."
    }

    // Unable to open URL - WalletConnect deep link failed
    if (message.includes("Unable to open URL")) {
        return "Could not open wallet app. Please ensure your wallet is installed and try again."
    }

    // Network/timeout errors
    if (message.includes("timeout") || message.includes("Timeout")) {
        return "Request timed out. Please check your connection and try again."
    }

    // Connection errors
    if (message.includes("network") || message.includes("Network") || message.includes("connection")) {
        return "Network error. Please check your connection and try again."
    }

    // Try to clean up "MetaMask Tx Signature: ..." prefixes
    if (message.includes(":")) {
        
        const parts = message.split(":")
        const lastPart = parts[parts.length - 1].trim()
        if (lastPart.length < 100) return lastPart
    }

    // Fallback: Truncate very long messages
    if (message.length > 100) {
        return message.substring(0, 100) + "..."
    }

    return message
}
