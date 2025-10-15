'use client'

import { useState, useEffect } from 'react'
import { Wallet, LogOut, Copy, Check, Loader2, Shield } from 'lucide-react'
import { useBaseAccount } from '@/hooks/useBaseAccount'

export default function WalletConnection() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const {
    isConnected,
    universalAddress,
    subAccountAddress,
    universalBaseName,
    subAccountBaseName,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    spendPermissions,
  } = useBaseAccount()

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAddress(type)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatAddress = (address: string, name: string | null) => {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
    return name ? `${name} (${shortAddress})` : shortAddress
  }

  // Prevent hydration mismatch by showing loading state until mounted
  if (!mounted) {
    return (
      <div className="card">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="card">
        <div className="text-center">
          <Wallet className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600 mb-4">
            Connect your Base Account to start splitting expenses with Sub Accounts
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}
          <button
            onClick={connectWallet}
            disabled={isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Base Account'
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Connected Wallet
        </h3>
        <button
          onClick={disconnectWallet}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {universalAddress && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Universal Account</p>
              <p className="text-sm text-gray-600">
                {formatAddress(universalAddress, universalBaseName)}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(universalAddress, 'universal')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {copiedAddress === 'universal' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        {subAccountAddress ? (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Sub Account</p>
              <p className="text-sm text-gray-600">
                {formatAddress(subAccountAddress, subAccountBaseName)}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(subAccountAddress, 'sub')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {copiedAddress === 'sub' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Sub Account will be created automatically when you make your first transaction.
            </p>
          </div>
        )}
      </div>

      {/* Spend Permissions Status */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Auto Spend Permissions</span>
        </div>
        {spendPermissions.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-blue-700">
              {spendPermissions.length} active permission{spendPermissions.length !== 1 ? 's' : ''} enabled
            </p>
            <div className="flex flex-wrap gap-1">
              {spendPermissions.map((permission, index) => {
                const tokenName = permission.token === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'USDC'
                return (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {tokenName}
                  </span>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-blue-700">
            Enable auto donations for seamless transactions without repeated approvals.
          </p>
        )}
      </div>
    </div>
  )
}
