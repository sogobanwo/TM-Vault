import { createAppKit } from '@reown/appkit-react-native'
import { WagmiAdapter } from '@reown/appkit-wagmi-react-native'
import { baseSepolia } from 'viem/chains'
import { storage } from './StorageUtil'

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

const networks = [baseSepolia] as const

export const wagmiAdapter = new WagmiAdapter({
    projectId,
    networks
})

export const appKit = createAppKit({
    projectId,
    networks: networks as any,
    adapters: [wagmiAdapter],
    metadata,
    storage
})
