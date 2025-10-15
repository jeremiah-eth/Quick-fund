// Mock shared data storage for proposals and donations
// In a real app, this would be a database

interface SharedData {
  proposals: any[]
  donations: any[]
  lastUpdated: number
}

// In-memory storage (resets on server restart)
let sharedData: SharedData = {
  proposals: [],
  donations: [],
  lastUpdated: Date.now()
}

// Simulate API calls with delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const sharedDataAPI = {
  // Get all proposals
  async getProposals() {
    await delay(100) // Simulate network delay
    return sharedData.proposals
  },

  // Get all donations
  async getDonations() {
    await delay(100)
    return sharedData.donations
  },

  // Add a new proposal
  async addProposal(proposal: any) {
    await delay(200)
    const newProposal = {
      ...proposal,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    sharedData.proposals.unshift(newProposal)
    sharedData.lastUpdated = Date.now()
    return newProposal
  },

  // Add a new donation
  async addDonation(donation: any) {
    await delay(200)
    const newDonation = {
      ...donation,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    sharedData.donations.unshift(newDonation)
    
    // Update proposal funding
    const proposal = sharedData.proposals.find(p => p.id === donation.proposalId)
    if (proposal) {
      proposal.currentFunding += donation.amount
      proposal.donations = proposal.donations || []
      proposal.donations.push(newDonation)
      
      // Check if funded
      if (proposal.currentFunding >= proposal.targetAmount) {
        proposal.status = 'funded'
      }
    }
    
    sharedData.lastUpdated = Date.now()
    return newDonation
  },

  // Update a proposal
  async updateProposal(id: string, updates: any) {
    await delay(200)
    const index = sharedData.proposals.findIndex(p => p.id === id)
    if (index !== -1) {
      sharedData.proposals[index] = { ...sharedData.proposals[index], ...updates }
      sharedData.lastUpdated = Date.now()
      return sharedData.proposals[index]
    }
    return null
  },

  // Get last updated timestamp
  getLastUpdated() {
    return sharedData.lastUpdated
  }
}

// Initialize with some sample data
if (sharedData.proposals.length === 0) {
  sharedData.proposals = [
    {
      id: '1',
      title: 'Build a Decentralized Art Gallery',
      description: 'Create a platform where artists can showcase and sell their digital art as NFTs, with automatic royalty distribution.',
      targetAmount: 5000,
      currency: 'USDC',
      creator: '0x1234567890123456789012345678901234567890',
      creatorBaseName: 'artist.base',
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      status: 'active',
      currentFunding: 1250,
      donations: [],
      category: 'Art',
      imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
      deadline: new Date(Date.now() + 30 * 86400000), // 30 days from now
      tags: ['art', 'nft', 'gallery', 'web3']
    },
    {
      id: '2',
      title: 'Community Garden Initiative',
      description: 'Transform an empty lot into a thriving community garden with sustainable farming practices and educational programs.',
      targetAmount: 2500,
      currency: 'USDC',
      creator: '0x0987654321098765432109876543210987654321',
      creatorBaseName: 'green.base',
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      status: 'active',
      currentFunding: 1800,
      donations: [],
      category: 'Community',
      imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
      deadline: new Date(Date.now() + 45 * 86400000), // 45 days from now
      tags: ['community', 'sustainability', 'education', 'local']
    }
  ]
  sharedData.lastUpdated = Date.now()
}
