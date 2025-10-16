'use client'

import { useState, useEffect } from 'react'
import { Heart, TrendingUp, Users, DollarSign, Wallet } from 'lucide-react'
import WalletConnection from '@/components/WalletConnection'
import FundingDashboard from '@/components/FundingDashboard'
import SpendPermissionsManager from '@/components/SpendPermissionsManager'
import ClientOnly from '@/components/ClientOnly'
import { Proposal, Donation, CreateProposalData, DonationData } from '@/types/expense'
import { useBaseAccount } from '@/hooks/useBaseAccount'
import { supabaseAPI } from '@/lib/supabaseAPI'
import { createUSDCTransaction } from '@/lib/usdcTransfer'

// Main page component with Base Account SDK integration
export default function Home() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showWalletPrompt, setShowWalletPrompt] = useState(false)
  
  const {
    isConnected,
    universalAddress,
    subAccountAddress,
    universalBaseName,
    subAccountBaseName,
    sendTransaction,
    connectWallet,
    spendPermissions,
    useSpendPermission,
  } = useBaseAccount()

  // Load data from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [proposalsData, donationsData] = await Promise.all([
          supabaseAPI.getProposals(),
          supabaseAPI.getDonations()
        ])
        
        setProposals(proposalsData)
        setDonations(donationsData)
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }
    
    loadData()
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    const proposalsSubscription = supabaseAPI.subscribeToProposals((newProposals) => {
      setProposals(newProposals)
    })

    const donationsSubscription = supabaseAPI.subscribeToDonations((newDonations) => {
      setDonations(newDonations)
    })

    return () => {
      proposalsSubscription.unsubscribe()
      donationsSubscription.unsubscribe()
    }
  }, [])

  // Debug logging (only on client side)
  if (typeof window !== 'undefined') {
    console.log('App state:', { isConnected, universalAddress, subAccountAddress });
  }

  // Crowdfunding functions
  const handleCreateProposal = async (data: CreateProposalData) => {
    if (!isConnected) {
      setShowWalletPrompt(true)
      return
    }

    if (!universalAddress) return

    setIsLoading(true)
    
    try {
      const proposalData = {
        title: data.title,
        description: data.description,
        targetAmount: data.targetAmount,
        currency: data.currency,
        creator: universalAddress,
        creatorBaseName: universalBaseName || undefined,
        status: 'active',
        currentFunding: 0,
        donations: [],
        category: data.category,
        imageUrl: data.imageUrl,
        deadline: data.deadline,
        tags: data.tags
      }

      const newProposal = await supabaseAPI.addProposal(proposalData)
      setProposals(prev => [newProposal, ...prev])
      console.log('Proposal created:', newProposal)
      
    } catch (error) {
      console.error('Failed to create proposal:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDonate = async (data: DonationData) => {
    if (!isConnected) {
      setShowWalletPrompt(true)
      return
    }

    if (!universalAddress) return

    setIsLoading(true)
    
    try {
      const donationData = {
        donorAddress: universalAddress,
        donorBaseName: universalBaseName || undefined,
        amount: data.amount,
        currency: data.currency,
        proposalId: data.proposalId,
        status: 'pending',
        message: data.donorMessage
      }

      const newDonation = await supabaseAPI.addDonation(donationData)
      
      // Update local state
      setDonations(prev => [newDonation, ...prev])
      
      // Update proposals with new funding
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

      // Send transaction
      const proposal = proposals.find(p => p.id === data.proposalId)
      if (proposal) {
        try {
          let txHash: string
          
          // Check if user has spend permission for this currency
          const tokenAddress = data.currency === 'USDC' 
            ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' 
            : '0x0000000000000000000000000000000000000000'
          
          const existingPermission = spendPermissions.find(p => p.token === tokenAddress)
          
          if (existingPermission) {
            // Use Spend Permission for seamless transaction
            console.log('Using Spend Permission for donation to:', proposal.creator)
            txHash = await useSpendPermission({
              permission: existingPermission,
              amount: data.amount,
              recipient: proposal.creator, // Send to proposal creator's wallet
            })
          } else {
            // Regular transaction flow - Only USDC supported
            if (data.currency !== 'USDC') {
              throw new Error('Only USDC donations are supported')
            }
            
            // Send USDC token transfer
            const usdcTransaction = createUSDCTransaction({
              to: proposal.creator,
              amount: data.amount,
              from: 'sub'
            })
            txHash = await sendTransaction(usdcTransaction)
          }
          
          // Update donation status to confirmed
          setDonations(prev => prev.map(donation => 
            donation.id === newDonation.id 
              ? { ...donation, status: 'confirmed', transactionHash: txHash }
              : donation
          ))
          
          console.log('Donation transaction confirmed:', txHash)
        } catch (txError) {
          console.error('Transaction failed:', txError)
          
          // Update donation status to failed
          setDonations(prev => prev.map(donation => 
            donation.id === newDonation.id 
              ? { ...donation, status: 'failed' }
              : donation
          ))
          
          // Revert the proposal funding update
          setProposals(prev => prev.map(p => 
            p.id === data.proposalId 
              ? { ...p, currentFunding: p.currentFunding - data.amount }
              : p
          ))
          
          // Show user-friendly error message
          alert('Transaction was rejected or failed. Donation not processed.')
          return
        }
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
        {/* Header with Connect Wallet Button */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Quick Fund</h1>
                <span className="ml-2 text-sm text-gray-500">Crowdfunding Platform</span>
              </div>
              <div className="flex items-center space-x-4">
                {isConnected ? (
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-600">
                      {universalBaseName || `${universalAddress?.slice(0, 6)}...${universalAddress?.slice(-4)}`}
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Connect Wallet</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Stats */}
          <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-lg p-8 text-white mb-8">
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

          {/* Spend Permissions Manager - Only show when connected */}
          {isConnected && (
            <SpendPermissionsManager />
          )}

          {/* Wallet Connection Prompt Modal */}
          {showWalletPrompt && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Your Wallet</h3>
                <p className="text-gray-600 mb-6">
                  You need to connect your wallet to create proposals or make donations.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      connectWallet()
                      setShowWalletPrompt(false)
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Connect Wallet
                  </button>
                  <button
                    onClick={() => setShowWalletPrompt(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  )
}