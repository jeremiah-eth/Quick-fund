'use client'

import { useState } from 'react'
import { Heart, Clock, Users, Tag, ExternalLink, Copy, Check } from 'lucide-react'
import { Proposal } from '@/types/expense'
import { useBaseName } from '@/hooks/useBaseName'

interface ProposalCardProps {
  proposal: Proposal
  onDonate: (proposal: Proposal) => void
  onViewDetails: (proposal: Proposal) => void
  currentUserAddress?: string
}

export default function ProposalCard({ 
  proposal, 
  onDonate, 
  onViewDetails, 
  currentUserAddress 
}: ProposalCardProps) {
  const [copied, setCopied] = useState(false)
  const { resolveBaseName } = useBaseName()

  const progressPercentage = Math.min((proposal.currentFunding / proposal.targetAmount) * 100, 100)
  const isCreator = currentUserAddress === proposal.creator
  const isFunded = proposal.currentFunding >= proposal.targetAmount
  const isExpired = proposal.deadline && new Date(proposal.deadline) < new Date()

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

  const getStatusColor = () => {
    if (proposal.status === 'completed') return 'bg-green-100 text-green-800'
    if (proposal.status === 'cancelled') return 'bg-red-100 text-red-800'
    if (isFunded) return 'bg-blue-100 text-blue-800'
    if (isExpired) return 'bg-gray-100 text-gray-800'
    return 'bg-primary-100 text-primary-800'
  }

  const getStatusText = () => {
    if (proposal.status === 'completed') return 'Completed'
    if (proposal.status === 'cancelled') return 'Cancelled'
    if (isFunded) return 'Funded'
    if (isExpired) return 'Expired'
    return 'Active'
  }

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }

  const getTimeRemaining = () => {
    if (!proposal.deadline) return null
    const now = new Date()
    const deadline = new Date(proposal.deadline)
    const diff = deadline.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h left`
    return `${hours}h left`
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Image */}
      {proposal.imageUrl && (
        <div className="h-48 bg-gray-200 relative">
          <img
            src={proposal.imageUrl}
            alt={proposal.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
              {proposal.title}
            </h3>
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                {proposal.category}
              </span>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(proposal.creator)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Copy creator address"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {proposal.description}
        </p>

        {/* Creator */}
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
            <Users className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {proposal.creatorBaseName || formatAddress(proposal.creator)}
            </p>
            <p className="text-xs text-gray-500">
              Created {formatDate(proposal.createdAt)}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">
              {formatCurrency(proposal.currentFunding, proposal.currency)}
            </span>
            <span className="text-gray-600">
              of {formatCurrency(proposal.targetAmount, proposal.currency)}
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

        {/* Tags */}
        {proposal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {proposal.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
            {proposal.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{proposal.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Deadline */}
        {proposal.deadline && (
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <Clock className="w-4 h-4 mr-2" />
            <span>
              {isExpired ? 'Expired' : getTimeRemaining()} • {formatDate(proposal.deadline)}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={() => onViewDetails(proposal)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Details
          </button>
          {!isCreator && proposal.status === 'active' && !isExpired && (
            <button
              onClick={() => onDonate(proposal)}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
            >
              <Heart className="w-4 h-4 mr-2" />
              Donate
            </button>
          )}
        </div>

        {/* Creator Actions */}
        {isCreator && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                Edit
              </button>
              <button className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
                Withdraw
              </button>
              <button className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
