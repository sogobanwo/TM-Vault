import * as Linking from 'expo-linking'

/**
 * Wraps a wallet operation (like writeContract) to safely handle
 * WalletConnect URL opening errors and other common issues.
 *
 * This is needed because WalletConnect can throw "Unable to open URL" errors
 * when trying to deep link to wallet apps, and these errors can be unhandled
 * promise rejections that crash the app or get lost.
 */
export async function safeWalletCall<T>(
    operation: () => Promise<T>,
    options?: {
        onUrlError?: () => void
    }
): Promise<T> {
    try {
        return await operation()
    } catch (error: any) {
        const message = error?.message || String(error)

        // Handle WalletConnect URL opening errors
        if (message.includes('Unable to open URL')) {
            console.warn('[safeWalletCall] URL opening failed:', message)

            // Try to extract the URL and check if we can open it differently
            const urlMatch = message.match(/Unable to open URL: (.+)/)
            if (urlMatch?.[1]) {
                const url = urlMatch[1]

                // Check if it's a web wallet URL - these should work
                if (url.startsWith('https://')) {
                    try {
                        const canOpen = await Linking.canOpenURL(url)
                        if (canOpen) {
                            await Linking.openURL(url)
                            // Throw a more helpful error so the user knows to check their browser
                            throw new Error('Transaction opened in browser. Please complete it there and return to the app.')
                        }
                    } catch (linkingError) {
                        console.warn('[safeWalletCall] Failed to open URL manually:', linkingError)
                    }
                }
            }

            options?.onUrlError?.()
            throw new Error('Could not open wallet app. Please ensure your wallet is installed and try again.')
        }

        // Handle session expired errors
        if (message.includes('No matching key') || message.includes('session')) {
            throw new Error('Wallet session expired. Please reconnect your wallet.')
        }

        // Re-throw other errors as-is
        throw error
    }
}

/**
 * Sets up a global handler for unhandled promise rejections
 * to prevent crashes from WalletConnect errors.
 *
 * Call this once at app startup.
 */
export function setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    const originalHandler = (global as any).onunhandledrejection

    ;(global as any).onunhandledrejection = (event: any) => {
        const error = event?.reason || event
        const message = error?.message || String(error)

        // Log WalletConnect errors but don't crash
        if (message.includes('Unable to open URL') ||
            message.includes('WalletConnect') ||
            message.includes('No matching key')) {
            console.warn('[GlobalErrorHandler] Caught WalletConnect error:', message)
            // Prevent the error from propagating
            if (event?.preventDefault) {
                event.preventDefault()
            }
            return
        }

        // Let other errors propagate to the original handler
        if (originalHandler) {
            originalHandler(event)
        }
    }

    // Also handle ErrorUtils for React Native
    if ((global as any).ErrorUtils) {
        const originalErrorHandler = (global as any).ErrorUtils.getGlobalHandler()

        ;(global as any).ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
            const message = error?.message || String(error)

            // Don't crash on WalletConnect errors
            if (message.includes('Unable to open URL') ||
                message.includes('WalletConnect') ||
                message.includes('No matching key')) {
                console.warn('[GlobalErrorHandler] Caught WalletConnect error (ErrorUtils):', message)
                return
            }

            // Pass other errors to the original handler
            if (originalErrorHandler) {
                originalErrorHandler(error, isFatal)
            }
        })
    }
}
