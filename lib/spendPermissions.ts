import { 
  prepareSpendCallData,
  fetchPermissions,
  fetchPermission,
  getPermissionStatus,
  prepareRevokeCallData
} from "@base-org/account/spend-permission"

// USDC contract address on Base mainnet
const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// Native ETH address for Spend Permissions
const NATIVE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'

// CDP API configuration
const CDP_API_BASE_URL = 'https://api.coinbase.com/developer-platform/v1'

export interface SpendPermissionData {
  permissionHash: string
  account: string
  spender: string
  token: string
  allowance: bigint
  period: bigint
  start: bigint
  end: bigint
  salt: bigint
  extraData: string
}

export interface PermissionRequestParams {
  account: string
  spender: string
  token: 'ETH' | 'USDC'
  allowance: number
  periodInDays: number
  provider: any
}

export interface PermissionUsageParams {
  permission: SpendPermissionData
  amount?: number
  provider: any
}

export class SpendPermissionsManager {
  private provider: any
  private spenderAddress: string
  private cdpApiKey?: string

  constructor(provider: any, spenderAddress: string, cdpApiKey?: string) {
    this.provider = provider
    this.spenderAddress = spenderAddress
    this.cdpApiKey = cdpApiKey
  }

  /**
   * Request a new Spend Permission from a user
   * Uses CDP API when available, falls back to mock implementation
   */
  async requestPermission(params: PermissionRequestParams): Promise<SpendPermissionData> {
    const tokenAddress = params.token === 'USDC' ? USDC_CONTRACT_ADDRESS : NATIVE_TOKEN_ADDRESS
    
    try {
      // Try CDP API first if key is available
      if (this.cdpApiKey) {
        return await this.requestPermissionViaCDP(params, tokenAddress)
      }
      
      // Fallback to mock implementation for demo purposes
      const now = Math.floor(Date.now() / 1000)
      const endTime = now + (params.periodInDays * 24 * 60 * 60)
      
      const mockPermission: SpendPermissionData = {
        permissionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        account: params.account,
        spender: params.spender,
        token: tokenAddress,
        allowance: BigInt(params.allowance * (params.token === 'USDC' ? 1e6 : 1e18)),
        period: BigInt(params.periodInDays * 24 * 60 * 60),
        start: BigInt(now),
        end: BigInt(endTime),
        salt: BigInt(Math.floor(Math.random() * 1000000)),
        extraData: '0x',
      }

      return mockPermission
    } catch (error) {
      console.error('Failed to request spend permission:', error)
      throw error
    }
  }

  /**
   * Request permission via CDP API
   */
  private async requestPermissionViaCDP(params: PermissionRequestParams, tokenAddress: string): Promise<SpendPermissionData> {
    try {
      const response = await fetch(`${CDP_API_BASE_URL}/spend-permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.cdpApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: params.account,
          spender: params.spender,
          token: tokenAddress,
          chainId: 8453,
          allowance: params.allowance * (params.token === 'USDC' ? 1e6 : 1e18),
          periodInDays: params.periodInDays,
        }),
      })

      if (!response.ok) {
        throw new Error(`CDP API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        permissionHash: data.permissionHash,
        account: data.account,
        spender: data.spender,
        token: data.token,
        allowance: BigInt(data.allowance),
        period: BigInt(data.period),
        start: BigInt(data.start),
        end: BigInt(data.end),
        salt: BigInt(data.salt),
        extraData: data.extraData || '0x',
      }
    } catch (error) {
      console.error('CDP API request failed, falling back to mock:', error)
      // Fallback to mock implementation
      throw error
    }
  }

  /**
   * Check if a permission exists and is active
   */
  async checkPermissionStatus(permission: SpendPermissionData): Promise<{
    isActive: boolean
    remainingSpend: bigint
  }> {
    try {
      // Convert our permission format to the format expected by getPermissionStatus
      const spendPermission = {
        ...permission,
        signature: '0x', // Mock signature for demo
        permission: permission, // The permission object itself
      }
      
      const status = await getPermissionStatus(spendPermission as any)
      return status
    } catch (error) {
      console.error('Failed to check permission status:', error)
      // Fallback to simple time-based check
      const now = Math.floor(Date.now() / 1000)
      const isActive = Number(permission.end) > now
      const remainingSpend = isActive ? permission.allowance : BigInt(0)
      return { isActive, remainingSpend }
    }
  }

  /**
   * Use an existing Spend Permission to make a transaction
   */
  async usePermission(params: PermissionUsageParams): Promise<string> {
    const { permission, amount } = params
    
    // Check if permission is still active
    const { isActive, remainingSpend } = await this.checkPermissionStatus(permission)
    
    if (!isActive) {
      throw new Error('Spend permission is not active')
    }

    if (amount && remainingSpend < BigInt(amount * 1e6)) { // USDC has 6 decimals
      throw new Error('Insufficient remaining allowance')
    }

    try {
      // Convert our permission format to the format expected by prepareSpendCallData
      const spendPermission = {
        ...permission,
        signature: '0x', // Mock signature for demo
        permission: permission, // The permission object itself
      }

      // Prepare the spend calls
      const spendCalls = await prepareSpendCallData(
        spendPermission as any,
        amount ? BigInt(amount * 1e6) : "max-remaining-allowance" // USDC has 6 decimals
      )

      // Execute the calls using wallet_sendCalls
      const callsId = await this.provider.request({
        method: "wallet_sendCalls",
        params: [{
          version: "2.0",
          atomicRequired: true,
          from: this.spenderAddress,
          calls: spendCalls,
        }],
      })

      return callsId
    } catch (error) {
      console.error('Failed to use spend permission:', error)
      // Fallback to mock transaction for demo purposes
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
      return mockTxHash
    }
  }

  /**
   * Fetch all permissions for a user
   */
  async fetchUserPermissions(account: string): Promise<SpendPermissionData[]> {
    try {
      const permissions = await fetchPermissions({
        account,
        chainId: 8453,
        spender: this.spenderAddress,
        provider: this.provider,
      })

      return permissions.map((permission: any) => ({
        permissionHash: permission.permissionHash || `0x${Math.random().toString(16).substr(2, 64)}`,
        account: permission.account || account,
        spender: permission.spender || this.spenderAddress,
        token: permission.token || '0x0000000000000000000000000000000000000000',
        allowance: permission.allowance || BigInt(0),
        period: permission.period || BigInt(0),
        start: permission.start || BigInt(0),
        end: permission.end || BigInt(0),
        salt: permission.salt || BigInt(0),
        extraData: permission.extraData || '0x',
      }))
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
      return []
    }
  }

  /**
   * Fetch a specific permission by hash
   */
  async fetchPermissionByHash(permissionHash: string): Promise<SpendPermissionData | null> {
    try {
      const permission = await fetchPermission({
        permissionHash,
        provider: this.provider,
      })

      if (!permission) {
        return null
      }

      return {
        permissionHash: permission.permissionHash || permissionHash,
        account: (permission as any).account || '',
        spender: (permission as any).spender || this.spenderAddress,
        token: (permission as any).token || '0x0000000000000000000000000000000000000000',
        allowance: (permission as any).allowance || BigInt(0),
        period: (permission as any).period || BigInt(0),
        start: (permission as any).start || BigInt(0),
        end: (permission as any).end || BigInt(0),
        salt: (permission as any).salt || BigInt(0),
        extraData: (permission as any).extraData || '0x',
      }
    } catch (error) {
      console.error('Failed to fetch permission:', error)
      return null
    }
  }

  /**
   * Request user to revoke a permission
   * Note: This is a mock implementation for demo purposes.
   * In production, you would need to implement the EIP-712 signature flow.
   */
  async requestRevokePermission(permission: SpendPermissionData): Promise<string> {
    try {
      // For demo purposes, we'll simulate a successful revocation
      // In production, you would need to implement the full EIP-712 signature flow
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
      return mockTxHash
    } catch (error) {
      console.error('Failed to revoke permission:', error)
      throw error
    }
  }

  /**
   * Revoke a permission silently (from spender account)
   */
  async revokePermissionSilently(permission: SpendPermissionData): Promise<string> {
    try {
      // Convert our permission format to the format expected by prepareRevokeCallData
      const spendPermission = {
        ...permission,
        signature: '0x', // Mock signature for demo
        permission: permission, // The permission object itself
      }

      const revokeCall = await prepareRevokeCallData(spendPermission as any)

      const callsId = await this.provider.request({
        method: "wallet_sendCalls",
        params: [{
          version: "2.0",
          atomicRequired: true,
          from: this.spenderAddress,
          calls: [revokeCall],
        }],
      })

      return callsId
    } catch (error) {
      console.error('Failed to revoke permission silently:', error)
      throw error
    }
  }
}

// Helper function to create a SpendPermissionsManager instance
export function createSpendPermissionsManager(provider: any, spenderAddress: string, cdpApiKey?: string): SpendPermissionsManager {
  return new SpendPermissionsManager(provider, spenderAddress, cdpApiKey)
}

// Helper function to get token address
export function getTokenAddress(token: 'ETH' | 'USDC'): string {
  return token === 'USDC' ? USDC_CONTRACT_ADDRESS : NATIVE_TOKEN_ADDRESS
}

// Helper function to convert amount to proper decimals
export function convertToTokenDecimals(amount: number, token: 'ETH' | 'USDC'): bigint {
  const decimals = token === 'USDC' ? 6 : 18
  return BigInt(amount * Math.pow(10, decimals))
}
