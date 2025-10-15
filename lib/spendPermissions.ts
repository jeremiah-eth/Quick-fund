import { 
  requestSpendPermission, 
  prepareSpendCallData,
  fetchPermissions,
  fetchPermission,
  getPermissionStatus,
  requestRevoke,
  prepareRevokeCallData
} from "@base-org/account/spend-permission"

// USDC contract address on Base mainnet
const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// Native ETH address for Spend Permissions
const NATIVE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'

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

  constructor(provider: any, spenderAddress: string) {
    this.provider = provider
    this.spenderAddress = spenderAddress
  }

  /**
   * Request a new Spend Permission from a user
   */
  async requestPermission(params: PermissionRequestParams): Promise<SpendPermissionData> {
    const tokenAddress = params.token === 'USDC' ? USDC_CONTRACT_ADDRESS : NATIVE_TOKEN_ADDRESS
    
    const permission = await requestSpendPermission({
      account: params.account,
      spender: params.spender,
      token: tokenAddress,
      chainId: 8453, // Base mainnet
      allowance: BigInt(params.allowance * (params.token === 'USDC' ? 1e6 : 1e18)), // USDC has 6 decimals
      periodInDays: params.periodInDays,
      provider: this.provider,
    })

    return {
      permissionHash: permission.permissionHash,
      account: permission.account,
      spender: permission.spender,
      token: permission.token,
      allowance: permission.allowance,
      period: permission.period,
      start: permission.start,
      end: permission.end,
      salt: permission.salt,
      extraData: permission.extraData,
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
      const status = await getPermissionStatus(permission)
      return status
    } catch (error) {
      console.error('Failed to check permission status:', error)
      return { isActive: false, remainingSpend: 0n }
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

    // Prepare the spend calls
    const spendCalls = await prepareSpendCallData({
      permission,
      amount: amount ? BigInt(amount * 1e6) : undefined, // USDC has 6 decimals
    })

    // Execute the calls using the spender account
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

      return permissions.map(permission => ({
        permissionHash: permission.permissionHash,
        account: permission.account,
        spender: permission.spender,
        token: permission.token,
        allowance: permission.allowance,
        period: permission.period,
        start: permission.start,
        end: permission.end,
        salt: permission.salt,
        extraData: permission.extraData,
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

      return {
        permissionHash: permission.permissionHash,
        account: permission.account,
        spender: permission.spender,
        token: permission.token,
        allowance: permission.allowance,
        period: permission.period,
        start: permission.start,
        end: permission.end,
        salt: permission.salt,
        extraData: permission.extraData,
      }
    } catch (error) {
      console.error('Failed to fetch permission:', error)
      return null
    }
  }

  /**
   * Request user to revoke a permission
   */
  async requestRevokePermission(permission: SpendPermissionData): Promise<string> {
    try {
      const hash = await requestRevoke(permission)
      return hash
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
      const revokeCall = await prepareRevokeCallData(permission)

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
export function createSpendPermissionsManager(provider: any, spenderAddress: string): SpendPermissionsManager {
  return new SpendPermissionsManager(provider, spenderAddress)
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
