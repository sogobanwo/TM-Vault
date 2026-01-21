import { createAppKit } from '@reown/appkit-react-native'
import { WagmiAdapter } from '@reown/appkit-wagmi-react-native'
import { baseSepolia } from '@reown/appkit/networks'
import { storage } from './StorageUtil'
import { http, fallback } from 'viem'

const projectId = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || ""

if (!projectId) {
    throw new Error('Project ID is not defined')
}

const metadata = {
    name: 'TM Vault',
    description: 'Token Metrics Vault App',
    url: 'https://tokenmetrics.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
    redirect: {
        native: 'tmvault://',
        universal: 'https://tokenmetrics.com'
    }
}

// Custom Base Sepolia with fallback RPCs for reliability
const customBaseSepolia = {
    ...baseSepolia,
    rpcUrls: {
        default: {
            http: ['https://base-sepolia-rpc.publicnode.com']
        }
    }
}

const networks = [customBaseSepolia] as const

// Configure transports with fallbacks for reliability
const transports = {
    [baseSepolia.id]: fallback([
        http('https://base-sepolia-rpc.publicnode.com'),
        http('https://base-sepolia.publicnode.com'),
        http('https://sepolia.base.org'),
    ])
}

export const wagmiAdapter = new WagmiAdapter({
    projectId,
    networks,
    transports
})

export const appKit = createAppKit({
    projectId,
    networks: [...networks],
    defaultNetwork: customBaseSepolia,
    adapters: [wagmiAdapter],
    metadata,
    storage
})
