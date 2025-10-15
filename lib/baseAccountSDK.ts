import { base } from 'viem/chains'
import { createMockSDK } from './mockBaseAccountSDK'

// Initialize SDK only on client side to avoid server-side errors
let sdk: any = null
let provider: any = null

export const initializeSDK = async () => {
  if (typeof window !== 'undefined' && !sdk) {
    try {
      // Dynamic import to avoid SSR issues
      const { createBaseAccountSDK } = await import('@base-org/account')
      
          // Initialize SDK with Sub Account configuration
          sdk = createBaseAccountSDK({
            appName: process.env.NEXT_PUBLIC_APP_NAME || 'Quick Fund',
            appLogoUrl: process.env.NEXT_PUBLIC_APP_LOGO_URL || 'https://base.org/logo.png',
            appChainIds: [base.id],
            subAccounts: {
              creation: 'on-connect',
              defaultAccount: 'sub',
            }
          })

      // Get an EIP-1193 provider
      provider = sdk.getProvider()
    } catch (error) {
      console.error('Failed to initialize Base Account SDK, using mock:', error)
      // Fallback to mock SDK for development
      const mockSDK = createMockSDK()
      sdk = mockSDK as any
      provider = mockSDK.getProvider() as any
    }
  }
  return { sdk, provider }
}

export { sdk, provider }
