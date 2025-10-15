'use client'

import { useState, useEffect } from 'react'
import { Heart, TrendingUp, Users, DollarSign } from 'lucide-react'
import WalletConnection from '@/components/WalletConnection'
import FundingDashboard from '@/components/FundingDashboard'
import ClientOnly from '@/components/ClientOnly'
import { Proposal, Donation, CreateProposalData, DonationData } from '@/types/expense'
import { useBaseAccount } from '@/hooks/useBaseAccount'

// Main page component with Base Account SDK integration
export default function Home() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    isConnected,
    universalAddress,
    subAccountAddress,
    universalBaseName,
    subAccountBaseName,
    sendTransaction,
  } = useBaseAccount()

  // Debug logging (only on client side)
  if (typeof window !== 'undefined') {
    console.log('App state:', { isConnected, universalAddress, subAccountAddress });
  }

  // Crowdfunding functions
  const handleCreateProposal = async (data: CreateProposalData) => {
    if (!universalAddress) return

    setIsLoading(true)
    
    try {
      const newProposal: Proposal = {
        id: Date.now().toString(),
        title: data.title,
        description: data.description,
        targetAmount: data.targetAmount,
        currency: data.currency,
        creator: universalAddress,
        creatorBaseName: universalBaseName || undefined,
        createdAt: new Date(),
        status: 'active',
        currentFunding: 0,
        donations: [],
        category: data.category,
        imageUrl: data.imageUrl,
        deadline: data.deadline,
        tags: data.tags
      }

      setProposals(prev => [newProposal, ...prev])
      console.log('Proposal created:', newProposal)
      
    } catch (error) {
      console.error('Failed to create proposal:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDonate = async (data: DonationData) => {
    if (!universalAddress) return

    setIsLoading(true)
    
    try {
      const newDonation: Donation = {
        id: Date.now().toString(),
        donorAddress: universalAddress,
        donorBaseName: universalBaseName || undefined,
        amount: data.amount,
        currency: data.currency,
        proposalId: data.proposalId,
        createdAt: new Date(),
        status: 'pending',
        message: data.donorMessage
      }

      // Add donation to the proposal
      setProposals(prev => prev.map(proposal => 
        proposal.id === data.proposalId 
          ? {
              ...proposal,
              donations: [...proposal.donations, newDonation],
              currentFunding: proposal.currentFunding + data.amount,
              status: (proposal.currentFunding + data.amount) >= proposal.targetAmount ? 'funded' : proposal.status
            }
          : proposal
      ))

      // Add to donations list
      setDonations(prev => [newDonation, ...prev])

      // Send transaction
      const proposal = proposals.find(p => p.id === data.proposalId)
      if (proposal) {
        const transaction = {
          to: proposal.creator,
          value: data.currency === 'ETH' ? (data.amount * 1e18).toString() : '0',
          from: 'sub' as const
        }
        
        await sendTransaction(transaction)
        
        // Update donation status
        setDonations(prev => prev.map(donation => 
          donation.id === newDonation.id 
            ? { ...donation, status: 'confirmed', transactionHash: 'mock-hash' }
            : donation
        ))
      }
      
      console.log('Donation made:', newDonation)
      
    } catch (error) {
      console.error('Failed to make donation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate stats
  const totalProposals = proposals.length
  const activeProposals = proposals.filter(p => p.status === 'active').length
  const totalFunding = proposals.reduce((sum, p) => sum + p.currentFunding, 0)
  const totalDonations = donations.length

  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Quick Fund...</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Quick Fund</h1>
            <p className="text-lg text-gray-600">
              Crowdfund projects with Base Account SDK and Auto Spend Permissions
            </p>
          </div>

          {!isConnected ? (
            <div className="max-w-md mx-auto">
              <WalletConnection />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Wallet Connection Status */}
              <div className="max-w-2xl mx-auto">
                <WalletConnection />
              </div>

              {/* Hero Stats */}
              <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-lg p-8 text-white">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Platform Statistics</h2>
                  <p className="text-primary-100">Track the growth of our crowdfunding community</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <p className="text-3xl font-bold">{totalProposals}</p>
                    <p className="text-primary-100 text-sm">Total Proposals</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="text-3xl font-bold">{activeProposals}</p>
                    <p className="text-primary-100 text-sm">Active Projects</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <p className="text-3xl font-bold">{totalFunding.toLocaleString()}</p>
                    <p className="text-primary-100 text-sm">USDC Raised</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-6 h-6" />
                    </div>
                    <p className="text-3xl font-bold">{totalDonations}</p>
                    <p className="text-primary-100 text-sm">Donations Made</p>
                  </div>
                </div>
              </div>

              {/* Funding Dashboard */}
              <FundingDashboard
                proposals={proposals}
                donations={donations}
                currentUserAddress={universalAddress || undefined}
                currentUserBaseName={universalBaseName || undefined}
                onCreateProposal={handleCreateProposal}
                onDonate={handleDonate}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  )
}