'use client'

import { useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock,
  Heart,
  Eye,
  BarChart3
} from 'lucide-react'
import { Proposal, Donation } from '@/types/expense'
import ProposalCard from './ProposalCard'
import ProposalSubmission from './ProposalSubmission'
import DonationModal from './DonationModal'

interface FundingDashboardProps {
  proposals: Proposal[]
  donations: Donation[]
  currentUserAddress?: string
  currentUserBaseName?: string
  onCreateProposal: (data: any) => void
  onDonate: (data: any) => void
  isLoading?: boolean
}

const CATEGORIES = [
  'All',
  'Technology',
  'Art & Creative',
  'Community',
  'Education',
  'Environment',
  'Health',
  'Business',
  'Gaming',
  'Music',
  'Other'
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most-funded', label: 'Most Funded' },
  { value: 'least-funded', label: 'Least Funded' },
  { value: 'ending-soon', label: 'Ending Soon' }
]

export default function FundingDashboard({
  proposals,
  donations,
  currentUserAddress,
  currentUserBaseName,
  onCreateProposal,
  onDonate,
  isLoading = false
}: FundingDashboardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter and sort proposals
  const filteredProposals = proposals
    .filter(proposal => {
      const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           proposal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           proposal.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === 'All' || proposal.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'most-funded':
          return b.currentFunding - a.currentFunding
        case 'least-funded':
          return a.currentFunding - b.currentFunding
        case 'ending-soon':
          if (!a.deadline && !b.deadline) return 0
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        default:
          return 0
      }
    })

  // Calculate stats
  const totalProposals = proposals.length
  const activeProposals = proposals.filter(p => p.status === 'active').length
  const totalFunding = proposals.reduce((sum, p) => sum + p.currentFunding, 0)
  const totalDonations = donations.length
  const userProposals = proposals.filter(p => p.creator === currentUserAddress)
  const userDonations = donations.filter(d => d.donorAddress === currentUserAddress)

  const handleCreateProposal = (data: any) => {
    onCreateProposal(data)
    setShowCreateForm(false)
  }

  const handleDonate = (proposal: Proposal) => {
    setSelectedProposal(proposal)
  }

  const handleDonationSubmit = (data: any) => {
    onDonate(data)
    setSelectedProposal(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Funding Dashboard</h2>
          <p className="text-gray-600">Discover and support amazing projects</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="mt-4 sm:mt-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Proposal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Proposals</p>
              <p className="text-2xl font-bold text-gray-900">{totalProposals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{activeProposals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Funding</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalFunding.toLocaleString()} USDC
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Donations</p>
              <p className="text-2xl font-bold text-gray-900">{totalDonations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Stats */}
      {currentUserAddress && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-6 rounded-lg border border-primary-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">{userProposals.length}</p>
              <p className="text-sm text-gray-600">Proposals Created</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">{userDonations.length}</p>
              <p className="text-sm text-gray-600">Donations Made</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {userProposals.reduce((sum, p) => sum + p.currentFunding, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">USDC Raised</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search proposals..."
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list' 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="w-4 h-4 flex flex-col space-y-0.5">
                <div className="bg-current rounded-sm h-1"></div>
                <div className="bg-current rounded-sm h-1"></div>
                <div className="bg-current rounded-sm h-1"></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Proposals Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProposals.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredProposals.map(proposal => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onDonate={handleDonate}
              onViewDetails={(proposal) => {
                // TODO: Implement proposal details view
                console.log('View details:', proposal)
              }}
              currentUserAddress={currentUserAddress}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedCategory !== 'All' 
              ? 'Try adjusting your search or filters'
              : 'Be the first to create a funding proposal'
            }
          </p>
          {!searchQuery && selectedCategory === 'All' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create First Proposal
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateForm && (
        <ProposalSubmission
          onSubmit={handleCreateProposal}
          onCancel={() => setShowCreateForm(false)}
          isLoading={isLoading}
        />
      )}

      {selectedProposal && (
        <DonationModal
          proposal={selectedProposal}
          onDonate={handleDonationSubmit}
          onCancel={() => setSelectedProposal(null)}
          isLoading={isLoading}
          currentUserAddress={currentUserAddress}
        />
      )}
    </div>
  )
}
