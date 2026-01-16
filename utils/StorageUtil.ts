import AsyncStorage from '@react-native-async-storage/async-storage'

export const storage = {
    getKeys: async () => {
        const keys = await AsyncStorage.getAllKeys()
        return keys as string[] // Ensure we return strictly string[]
    },
    getEntries: async <T = any>(): Promise<[string, T][]> => {
        const keys = await AsyncStorage.getAllKeys()
        const entries = await AsyncStorage.multiGet(keys)
        return entries.map(([key, value]) => [key, value ? JSON.parse(value) : undefined]) as [string, T][]
    },
    getItem: async (key: string) => {
        const value = await AsyncStorage.getItem(key)
        return value ? JSON.parse(value) : undefined
    },
    setItem: async (key: string, value: any) => {
        await AsyncStorage.setItem(key, JSON.stringify(value))
    },
    removeItem: async (key: string) => {
        await AsyncStorage.removeItem(key)
    }
}
