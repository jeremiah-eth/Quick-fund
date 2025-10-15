// Mock Base Account SDK for development when the real SDK is not available
export const createMockSDK = () => {
  return {
    getProvider: () => ({
      request: async (params: any) => {
        console.log('Mock provider request:', params)
        
        if (params.method === 'eth_requestAccounts') {
          // Return mock accounts
          return [
            '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Universal Account
            '0x8ba1f109551bD432803012645Hac136c4c8b8c8'  // Sub Account
          ]
        }
        
        if (params.method === 'wallet_sendCalls') {
          // Mock transaction sending
          return '0x' + Math.random().toString(16).substr(2, 64)
        }
        
        return null
      }
    })
  }
}
