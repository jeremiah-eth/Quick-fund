export interface Participant {
  id: string
  address: string
  baseName?: string
  isValid: boolean
  isResolving: boolean
  error?: string
}

export interface Expense {
  id: string
  name: string
  amount: number
  currency: 'ETH' | 'USDC'
  participants: Participant[]
  creator: string
  creatorBaseName?: string
  createdAt: Date
  payments: {
    [participantId: string]: {
      status: 'pending' | 'paid' | 'failed'
      transactionHash?: string
      paidAt?: Date
    }
  }
}

export interface CreateExpenseData {
  name: string
  amount: number
  currency: 'ETH' | 'USDC'
  participants: Participant[]
}

// Crowdfunding Types
export interface Donation {
  id: string
  donorAddress: string
  donorBaseName?: string
  amount: number
  currency: 'ETH' | 'USDC'
  proposalId: string
  transactionHash?: string
  createdAt: Date
  status: 'pending' | 'confirmed' | 'failed'
  message?: string
}

export interface Proposal {
  id: string
  title: string
  description: string
  targetAmount: number
  currency: 'ETH' | 'USDC'
  creator: string
  creatorBaseName?: string
  createdAt: Date
  status: 'active' | 'funded' | 'cancelled' | 'completed'
  currentFunding: number
  donations: Donation[]
  category: string
  imageUrl?: string
  deadline?: Date
  tags: string[]
}

export interface CreateProposalData {
  title: string
  description: string
  targetAmount: number
  currency: 'ETH' | 'USDC'
  category: string
  imageUrl?: string
  deadline?: Date
  tags: string[]
}

export interface DonationData {
  proposalId: string
  amount: number
  currency: 'ETH' | 'USDC'
  donorMessage?: string
}
