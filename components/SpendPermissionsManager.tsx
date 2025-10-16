'use client'

import { useState, useEffect } from 'react'
import { Shield, Trash2, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import { useBaseAccount } from '@/hooks/useBaseAccount'
import { SpendPermissionData } from '@/lib/spendPermissions'

export default function SpendPermissionsManager() {
  const { 
    spendPermissions, 
    fetchUserPermissions, 
    revokeSpendPermission, 
    permissionsLoading 
  } = useBaseAccount()
  
  const [isRevoking, setIsRevoking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch permissions on mount
  useEffect(() => {
    if (spendPermissions.length === 0) {
      fetchUserPermissions().catch(console.error)
    }
  }, [fetchUserPermissions, spendPermissions.length])

  const getTokenName = (tokenAddress: string) => {
    if (tokenAddress === '0x0000000000000000000000000000000000000000') return 'ETH'
    if (tokenAddress === '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') return 'USDC'
    return 'Unknown Token'
  }

  const formatAmount = (amount: bigint, token: string) => {
    const decimals = token === 'USDC' ? 6 : 18
    const formatted = Number(amount) / Math.pow(10, decimals)
    return formatted.toLocaleString()
  }

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  const isExpired = (endTime: bigint) => {
    return Number(endTime) * 1000 < Date.now()
  }

  const handleRevoke = async (permission: SpendPermissionData) => {
    try {
      setIsRevoking(permission.permissionHash)
      setError(null)
      await revokeSpendPermission(permission)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke permission')
    } finally {
      setIsRevoking(null)
    }
  }

  const handleRefresh = async () => {
    try {
      setError(null)
      await fetchUserPermissions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh permissions')
    }
  }

  if (permissionsLoading && spendPermissions.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-primary-600 animate-spin mr-2" />
          <span className="text-gray-600">Loading permissions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Spend Permissions</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={permissionsLoading}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${permissionsLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {spendPermissions.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Spend Permissions</h3>
          <p className="text-gray-600">
            You haven't granted any spend permissions yet. They will appear here when you enable auto donations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {spendPermissions.map((permission) => {
            const tokenName = getTokenName(permission.token)
            const isExpiredPermission = isExpired(permission.end)
            
            return (
              <div
                key={permission.permissionHash}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-gray-900">{tokenName} Auto Donations</h3>
                      {isExpiredPermission ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Expired
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Max Amount:</span>
                        <br />
                        {formatAmount(permission.allowance, permission.token)} {tokenName}
                      </div>
                      <div>
                        <span className="font-medium">Valid Until:</span>
                        <br />
                        {formatDate(permission.end)}
                      </div>
                      <div>
                        <span className="font-medium">Period:</span>
                        <br />
                        {permission.periodInDays} days
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      <span className="font-medium">Permission Hash:</span>
                      <br />
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        {permission.permissionHash.slice(0, 10)}...{permission.permissionHash.slice(-8)}
                      </code>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <button
                      onClick={() => handleRevoke(permission)}
                      disabled={isRevoking === permission.permissionHash}
                      className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      {isRevoking === permission.permissionHash ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Revoking...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3" />
                          <span>Revoke</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Spend Permissions</p>
            <p>
              Spend Permissions allow the app to make donations on your behalf without requiring approval for each transaction. 
              You can revoke them at any time. They automatically expire after the specified period.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
