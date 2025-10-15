'use client'

import { useState } from 'react'
import { Heart, X, DollarSign, MessageSquare, ExternalLink, Copy, Check } from 'lucide-react'
import { Proposal, DonationData } from '@/types/expense'
import { useBaseName } from '@/hooks/useBaseName'

interface DonationModalProps {
  proposal: Proposal
  onDonate: (data: DonationData) => void
  onCancel: () => void
  isLoading?: boolean
  currentUserAddress?: string
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500]

export default function DonationModal({ 
  proposal, 
  onDonate, 
  onCancel, 
  isLoading = false,
  currentUserAddress 
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
  const { resolveBaseName } = useBaseName()

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
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
