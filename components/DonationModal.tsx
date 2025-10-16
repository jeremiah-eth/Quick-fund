'use client'

import { useState, useEffect } from 'react'
import { Heart, X, DollarSign, MessageSquare, ExternalLink, Copy, Check, Shield, AlertCircle } from 'lucide-react'
import { Proposal, DonationData } from '@/types/expense'
import { useBaseName } from '@/hooks/useBaseName'
import { useBaseAccount } from '@/hooks/useBaseAccount'
import { SpendPermissionData } from '@/lib/spendPermissions'

interface DonationModalProps {
  proposal: Proposal
  onDonate: (data: DonationData) => void
  onCancel: () => void
  isLoading?: boolean
  currentUserAddress?: string
  transactionStatus?: 'pending' | 'confirmed' | 'failed' | null
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500]

export default function DonationModal({ 
  proposal, 
  onDonate, 
  onCancel, 
  isLoading = false,
  currentUserAddress,
  transactionStatus = null
}: DonationModalProps) {
  const [donationData, setDonationData] = useState<DonationData>({
    proposalId: proposal.id,
    amount: 0,
    currency: proposal.currency,
    donorMessage: ''
  })
  const [customAmount, setCustomAmount] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const [showPermissionRequest, setShowPermissionRequest] = useState(false)
  const [permissionRequested, setPermissionRequested] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  
  const { resolveBaseName } = useBaseName()
  const { 
    spendPermissions, 
    requestSpendPermission, 
    useSpendPermission, 
    permissionsLoading 
  } = useBaseAccount()

  // Check if user has existing spend permission for this currency
  const existingPermission = spendPermissions.find(p => 
    p.token === (proposal.currency === 'USDC' ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' : '0x0000000000000000000000000000000000000000')
  )

  // Check if we should request permission
  useEffect(() => {
    if (donationData.amount > 0 && !existingPermission && !permissionRequested) {
      setShowPermissionRequest(true)
    }
  }, [donationData.amount, existingPermission, permissionRequested])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handlePresetAmount = (amount: number) => {
    setDonationData(prev => ({ ...prev, amount }))
    setCustomAmount('')
    setErrors(prev => ({ ...prev, amount: '' }))
  }

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value)
    const amount = parseFloat(value) || 0
    setDonationData(prev => ({ ...prev, amount }))
    setErrors(prev => ({ ...prev, amount: '' }))
  }

  const handleInputChange = (field: keyof DonationData, value: any) => {
    setDonationData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (donationData.amount <= 0) {
      newErrors.amount = 'Donation amount must be greater than 0'
    }

    if (donationData.amount > 10000) {
      newErrors.amount = 'Donation amount cannot exceed 10,000'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRequestPermission = async () => {
    try {
      setPermissionError(null)
      await requestSpendPermission({
        token: 'USDC', // Only USDC supported
        allowance: Math.max(donationData.amount * 10, 1000), // 10x the amount or 1000 minimum
        periodInDays: 30, // 30 days
      })
      setPermissionRequested(true)
      setShowPermissionRequest(false)
    } catch (error) {
      console.error('Failed to request spend permission:', error)
      setPermissionError(error instanceof Error ? error.message : 'Failed to request permission')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    // If user has spend permission, use it for seamless donation
    if (existingPermission) {
      try {
        await useSpendPermission({
          permission: existingPermission,
          amount: donationData.amount,
        })
        // Still call onDonate to update the UI
        onDonate(donationData)
      } catch (error) {
        console.error('Failed to use spend permission:', error)
        // Fallback to regular donation flow
        onDonate(donationData)
      }
    } else {
      // Regular donation flow
      onDonate(donationData)
    }
  }

  const progressPercentage = Math.min((proposal.currentFunding / proposal.targetAmount) * 100, 100)
  const remainingAmount = proposal.targetAmount - proposal.currentFunding

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Heart className="w-6 h-6 mr-2 text-primary-600" />
              Support This Project
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Proposal Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {proposal.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {proposal.description}
            </p>
            
            {/* Creator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs font-medium text-primary-600">
                    {proposal.creatorBaseName?.charAt(0) || proposal.creator.charAt(2)}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {proposal.creatorBaseName || formatAddress(proposal.creator)}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(proposal.creator)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy creator address"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Progress */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {proposal.currentFunding.toLocaleString()} {proposal.currency}
                </span>
                <span className="text-gray-600">
                  of {proposal.targetAmount.toLocaleString()} {proposal.currency}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{progressPercentage.toFixed(1)}% funded</span>
                <span>{proposal.donations.length} donations</span>
              </div>
            </div>

            {/* Remaining Amount */}
            {remainingAmount > 0 && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">{remainingAmount.toLocaleString()} {proposal.currency}</span> still needed
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Donation Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Donation Amount ({proposal.currency})
              </label>
              
              {/* Preset Amounts */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {PRESET_AMOUNTS.map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handlePresetAmount(amount)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      donationData.amount === amount
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => handleCustomAmount(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter custom amount"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Donor Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (optional)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  value={donationData.donorMessage}
                  onChange={(e) => handleInputChange('donorMessage', e.target.value)}
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Leave a message of support..."
                  maxLength={200}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {donationData.donorMessage?.length || 0}/200 characters
              </p>
            </div>

            {/* Donation Summary */}
            {donationData.amount > 0 && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h4 className="font-medium text-primary-900 mb-2">Donation Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primary-700">Amount:</span>
                    <span className="font-medium text-primary-900">
                      {donationData.amount.toLocaleString()} {donationData.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-700">Network:</span>
                    <span className="font-medium text-primary-900">Base</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-700">Gas Fee:</span>
                    <span className="font-medium text-primary-900">~$0.01</span>
                  </div>
                </div>
              </div>
            )}

            {/* Spend Permission Request */}
            {showPermissionRequest && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-2">Enable Auto Donations</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      Enable automatic donations for a smoother experience. You'll only need to approve once, 
                      then all future donations will be processed automatically.
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleRequestPermission}
                        disabled={permissionsLoading}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {permissionsLoading ? 'Requesting...' : 'Enable Auto Donations'}
                      </button>
                      <button
                        onClick={() => setShowPermissionRequest(false)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                      >
                        Skip
                      </button>
                    </div>
                    {permissionError && (
                      <p className="text-xs text-red-600 mt-2">{permissionError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Existing Permission Status */}
            {existingPermission && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Auto donations enabled for {proposal.currency}
                  </span>
                </div>
              </div>
            )}

            {/* Transaction Status */}
            {transactionStatus && (
              <div className={`p-3 rounded-lg border ${
                transactionStatus === 'confirmed' 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : transactionStatus === 'failed'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}>
                <div className="flex items-center">
                  {transactionStatus === 'confirmed' && (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {transactionStatus === 'failed' && (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  {transactionStatus === 'pending' && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                  )}
                  <span className="text-sm font-medium">
                    {transactionStatus === 'confirmed' && 'Transaction confirmed! Donation successful.'}
                    {transactionStatus === 'failed' && 'Transaction failed. Please try again.'}
                    {transactionStatus === 'pending' && 'Transaction pending... Please wait.'}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || donationData.amount <= 0}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Donate {donationData.amount > 0 ? `${donationData.amount} ${donationData.currency}` : ''}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Security:</strong> This donation will be sent directly to the project creator's wallet. 
              Make sure you trust this project before donating.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
