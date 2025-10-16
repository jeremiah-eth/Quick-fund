import {
  requestSpendPermission,
  prepareSpendCallData,
  fetchPermissions,
  getPermissionStatus,
  requestRevoke,
} from '@base-org/account/spend-permission'
import { createBaseAccountSDK } from '@base-org/account'

export interface SpendPermission {
  account: string
  spender: string
  token: string
  chainId: number
  allowance: bigint
  periodInDays: number
  signature?: string
}

export const USDC_BASE_ADDRESS = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'

export async function requestUserSpendPermission(
  userAccount: string,
  spenderAccount: string,
  dailyLimitUSD: number = 2
): Promise<SpendPermission> {
  try {
    // Convert USD to USDC (6 decimals)
    const allowanceUSDC = BigInt(dailyLimitUSD * 1_000_000)

    const permission = await requestSpendPermission({
      account: userAccount as `0x${string}`,
      spender: spenderAccount as `0x${string}`,
      token: USDC_BASE_ADDRESS as `0x${string}`,
      chainId: 8453, // Base mainnet
      allowance: allowanceUSDC,
      periodInDays: 30, // 30 days for crowdfunding
      provider: createBaseAccountSDK({
        appName: "Quick Fund",
      }).getProvider(),
    })

    return {
      account: userAccount,
      spender: spenderAccount,
      token: USDC_BASE_ADDRESS,
      chainId: 8453,
      allowance: allowanceUSDC,
      periodInDays: 30,
      ...permission
    }
  } catch (error) {
    console.error('Failed to request spend permission:', error)
    throw new Error('Failed to request spend permission')
  }
}

export async function getUserSpendPermissions(
  userAccount: string,
  spenderAccount: string
) {
  try {
    console.log('🔧 Creating Base Account SDK...')
    const sdk = createBaseAccountSDK({
      appName: "Quick Fund",
    })
    const provider = sdk.getProvider()
    console.log('✅ SDK and provider created')

    console.log('📡 Calling fetchPermissions with:')
    console.log('  - account:', userAccount)
    console.log('  - chainId: 8453')
    console.log('  - spender:', spenderAccount)
    console.log('  - USDC_BASE_ADDRESS:', USDC_BASE_ADDRESS)

    const permissions = await fetchPermissions({
      account: userAccount as `0x${string}`,
      chainId: 8453,
      spender: spenderAccount as `0x${string}`,
      provider,
    })

    console.log('📋 Raw fetchPermissions result:', permissions)
    console.log('📊 Total permissions returned:', permissions.length)

    // Log each permission before filtering
    if (permissions.length > 0) {
      permissions.forEach((permission, index) => {
        const tokenAddress = permission.permission?.token?.toLowerCase()
        const usdcAddress = USDC_BASE_ADDRESS.toLowerCase()
        console.log(`🔍 Permission ${index + 1} before filtering:`, {
          token: permission.permission?.token,
          tokenLowercase: tokenAddress,
          usdcLowercase: usdcAddress,
          isUSDC: tokenAddress === usdcAddress,
          allowance: permission.permission?.allowance?.toString(),
          account: permission.permission?.account,
          spender: permission.permission?.spender,
        })
      })
    }

    const filteredPermissions = permissions.filter(p => 
      p.permission?.token?.toLowerCase() === USDC_BASE_ADDRESS.toLowerCase()
    )
    console.log('✅ Filtered USDC permissions:', filteredPermissions.length)

    return filteredPermissions
  } catch (error) {
    console.error('❌ Failed to fetch spend permissions:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return []
  }
}

export async function checkSpendPermissionStatus(permission: any) {
  try {
    const status = await getPermissionStatus(permission)
    return status
  } catch (error) {
    console.error('Failed to check permission status:', error)
    return { isActive: false, remainingSpend: BigInt(0) }
  }
}

export async function prepareSpendTransaction(
  permission: any,
  amountUSD: number
) {
  try {
    // Convert USD to USDC (6 decimals)
    const amountUSDC = BigInt(Math.floor(amountUSD * 1_000_000))

    const spendCalls = await prepareSpendCallData(permission, amountUSDC)

    return spendCalls
  } catch (error) {
    console.error('Failed to prepare spend transaction:', error)
    throw new Error('Failed to prepare spend transaction')
  }
}

export async function revokeSpendPermission(permission: any): Promise<string> {
  try {
    console.log('🔄 Revoking spend permission:', permission)
    
    // Ensure the permission object has the correct structure for requestRevoke
    const normalizedPermission = {
      permission: permission,
      provider: createBaseAccountSDK({
        appName: "Quick Fund",
      }).getProvider(),
    }
    
    console.log('🔧 Normalized permission for revoke:', normalizedPermission)
    
    // Use requestRevoke for user-initiated revoke (shows wallet popup)
    const result = await requestRevoke(normalizedPermission)
    
    console.log('✅ Spend permission revoked successfully, result:', result)
    console.log('🔍 Result type:', typeof result)
    console.log('🔍 Result structure:', result)
    
    // requestRevoke returns an object with an 'id' property containing the transaction hash
    const hash: string = (result as any).id
    
    console.log('✅ Final hash:', hash)
    return hash
  } catch (error) {
    console.error('❌ Failed to revoke spend permission:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      permission: permission
    })
    throw new Error(`Failed to revoke spend permission: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Legacy interfaces for backward compatibility
export interface SpendPermissionData {
  permissionHash: string
  account: string
  spender: string
  token: string
  chainId: number
  allowance: bigint
  periodInDays: number
  start: bigint
  end: bigint
  salt: bigint
  extraData: string
  signature?: string
  permission?: any
}

export interface PermissionRequestParams {
  account: string
  spender: string
  token: 'USDC'
  allowance: number
  periodInDays: number
  provider: any
}

export interface PermissionUsageParams {
  permission: SpendPermissionData
  amount?: number
  recipient?: string // The proposal creator's wallet address
  provider: any
}

// Legacy SpendPermissionsManager class for backward compatibility
export class SpendPermissionsManager {
  private provider: any
  private spenderAddress: string

  constructor(provider: any, spenderAddress: string) {
    this.provider = provider
    this.spenderAddress = spenderAddress
  }

  async requestPermission(params: PermissionRequestParams): Promise<SpendPermissionData> {
    try {
      // Only support USDC
      if (params.token !== 'USDC') {
        throw new Error('Only USDC tokens are supported')
      }

      const permission = await requestUserSpendPermission(
        params.account,
        params.spender,
        params.allowance
      )

      // Convert to our SpendPermissionData format
      const spendPermissionData: SpendPermissionData = {
        permissionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        account: permission.account,
        spender: permission.spender,
        token: permission.token,
        chainId: permission.chainId,
        allowance: permission.allowance,
        periodInDays: permission.periodInDays,
        start: BigInt(Math.floor(Date.now() / 1000)),
        end: BigInt(Math.floor(Date.now() / 1000) + (permission.periodInDays * 24 * 60 * 60)),
        salt: BigInt(Math.floor(Math.random() * 1000000)),
        extraData: '0x',
        signature: permission.signature,
        permission: permission
      }

      console.log('Created USDC Spend Permission with Base Account SDK:', { 
        spendPermissionData,
        universalAccount: params.account,
        subAccount: params.spender
      })
      return spendPermissionData
    } catch (error) {
      console.error('Failed to request spend permission:', error)
      throw error
    }
  }

  async checkPermissionStatus(permission: SpendPermissionData): Promise<{
    isActive: boolean
    remainingSpend: bigint
  }> {
    try {
      const status = await checkSpendPermissionStatus(permission)
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

  async usePermission(params: PermissionUsageParams): Promise<string> {
    const { permission, amount, recipient } = params

    try {
      // Use the working prepareSpendTransaction function
      const spendCalls = await prepareSpendTransaction(permission, amount || 0)

      // If we have a recipient address, we need to modify the calls to send to that address
      // This is a simplified implementation - in production you'd need to properly construct
      // the transfer call to send tokens to the recipient
      let finalCalls = spendCalls
      
      if (recipient) {
        // For now, we'll add a note that the recipient should be the proposal creator
        // In a full implementation, you'd modify the spendCalls to include the recipient
        console.log('Sub Account Spend Permission will send to recipient:', recipient)
      }

      // Execute the calls using the Sub Account via wallet_sendCalls
      const callsId = await this.provider.request({
        method: "wallet_sendCalls",
        params: [{
          version: "2.0",
          chainId: 8453, // Base mainnet chain ID
          atomicRequired: true,
          from: this.spenderAddress, // Sub Account address
          calls: finalCalls,
        }],
      })

      console.log('Sub Account executed Spend Permission transaction:', {
        callsId,
        subAccount: this.spenderAddress,
        universalAccount: permission.account,
        recipient
      })

      return callsId
    } catch (error) {
      console.error('Failed to use spend permission:', error)
      throw error
    }
  }

  async fetchUserPermissions(account: string): Promise<SpendPermissionData[]> {
    try {
      const permissions = await getUserSpendPermissions(account, this.spenderAddress)
      
      // Convert to SpendPermissionData format
      return permissions.map((permission: any) => ({
        permissionHash: permission.permissionHash || `0x${Math.random().toString(16).substr(2, 64)}`,
        account: permission.permission?.account || account,
        spender: permission.permission?.spender || this.spenderAddress,
        token: permission.permission?.token || USDC_BASE_ADDRESS,
        chainId: 8453,
        allowance: permission.permission?.allowance || BigInt(0),
        periodInDays: 30, // Default to 30 days
        start: permission.permission?.start || BigInt(0),
        end: permission.permission?.end || BigInt(0),
        salt: permission.permission?.salt || BigInt(0),
        extraData: permission.permission?.extraData || '0x',
      }))
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
      return []
    }
  }

  async fetchPermissionByHash(permissionHash: string): Promise<SpendPermissionData | null> {
    try {
      // This would need to be implemented based on your specific needs
      // For now, return null as we don't have a direct hash lookup
      return null
    } catch (error) {
      console.error('Failed to fetch permission:', error)
      return null
    }
  }

  async requestRevokePermission(permission: SpendPermissionData): Promise<string> {
    try {
      const hash = await revokeSpendPermission(permission)
      return hash
    } catch (error) {
      console.error('Failed to revoke permission:', error)
      throw error
    }
  }

  async revokePermissionSilently(permission: SpendPermissionData): Promise<string> {
    try {
      // For silent revoke, we could implement a different approach
      // For now, use the same revoke function
      const hash = await revokeSpendPermission(permission)
      return hash
    } catch (error) {
      console.error('Failed to revoke permission silently:', error)
      throw error
    }
  }
}

// Factory function for creating SpendPermissionsManager
export function createSpendPermissionsManager(provider: any, spenderAddress: string): SpendPermissionsManager {
  return new SpendPermissionsManager(provider, spenderAddress)
}