import { supabase, isSupabaseConfigured } from './supabase'
import { Proposal, Donation, CreateProposalData, DonationData } from '@/types/expense'
import { sharedDataAPI } from './sharedData'

// Convert Supabase proposal to our Proposal type
const convertSupabaseProposal = (row: any): Proposal => ({
  id: row.id,
  title: row.title,
  description: row.description,
  targetAmount: row.target_amount,
  currency: row.currency,
  creator: row.creator,
  creatorBaseName: row.creator_base_name,
  createdAt: new Date(row.created_at),
  status: row.status,
  currentFunding: row.current_funding,
  donations: [], // We'll load donations separately
  category: row.category,
  imageUrl: row.image_url,
  deadline: row.deadline ? new Date(row.deadline) : undefined,
  tags: row.tags || []
})

// Convert Supabase donation to our Donation type
const convertSupabaseDonation = (row: any): Donation => ({
  id: row.id,
  donorAddress: row.donor_address,
  donorBaseName: row.donor_base_name,
  amount: row.amount,
  currency: row.currency,
  proposalId: row.proposal_id,
  transactionHash: row.transaction_hash,
  createdAt: new Date(row.created_at),
  status: row.status,
  message: row.message
})

// Convert our Proposal type to Supabase format
const convertToSupabaseProposal = (proposal: CreateProposalData & { creator: string; creatorBaseName?: string }) => ({
  title: proposal.title,
  description: proposal.description,
  target_amount: proposal.targetAmount,
  currency: proposal.currency,
  creator: proposal.creator,
  creator_base_name: proposal.creatorBaseName,
  status: 'active' as const,
  current_funding: 0,
  category: proposal.category,
  image_url: proposal.imageUrl,
  deadline: proposal.deadline?.toISOString(),
  tags: proposal.tags || []
})

// Convert our Donation type to Supabase format
const convertToSupabaseDonation = (donation: DonationData & { donorAddress: string; donorBaseName?: string }) => ({
  donor_address: donation.donorAddress,
  donor_base_name: donation.donorBaseName,
  amount: donation.amount,
  currency: donation.currency,
  proposal_id: donation.proposalId,
  status: 'pending' as const,
  message: donation.donorMessage
})

export const supabaseAPI = {
  // Get all proposals
  async getProposals(): Promise<Proposal[]> {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured, using mock API')
      return sharedDataAPI.getProposals()
    }

    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching proposals:', error)
      throw error
    }

    return data.map(convertSupabaseProposal)
  },

  // Get all donations
  async getDonations(): Promise<Donation[]> {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured, using mock API')
      return sharedDataAPI.getDonations()
    }

    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching donations:', error)
      throw error
    }

    return data.map(convertSupabaseDonation)
  },

  // Get donations for a specific proposal
  async getDonationsForProposal(proposalId: string): Promise<Donation[]> {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching donations for proposal:', error)
      throw error
    }

    return data.map(convertSupabaseDonation)
  },

  // Add a new proposal
  async addProposal(proposalData: CreateProposalData & { creator: string; creatorBaseName?: string }): Promise<Proposal> {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured, using mock API')
      return sharedDataAPI.addProposal(proposalData)
    }

    const supabaseData = convertToSupabaseProposal(proposalData)
    
    const { data, error } = await supabase
      .from('proposals')
      .insert(supabaseData)
      .select()
      .single()

    if (error) {
      console.error('Error creating proposal:', error)
      throw error
    }

    return convertSupabaseProposal(data)
  },

  // Add a new donation
  async addDonation(donationData: DonationData & { donorAddress: string; donorBaseName?: string }): Promise<Donation> {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured, using mock API')
      return sharedDataAPI.addDonation(donationData)
    }

    const supabaseData = convertToSupabaseDonation(donationData)
    
    const { data, error } = await supabase
      .from('donations')
      .insert(supabaseData)
      .select()
      .single()

    if (error) {
      console.error('Error creating donation:', error)
      throw error
    }

    // Update proposal funding
    await this.updateProposalFunding(donationData.proposalId, donationData.amount)

    return convertSupabaseDonation(data)
  },

  // Update proposal funding amount
  async updateProposalFunding(proposalId: string, additionalAmount: number): Promise<void> {
    // Get current proposal
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('current_funding, target_amount')
      .eq('id', proposalId)
      .single()

    if (fetchError) {
      console.error('Error fetching proposal for funding update:', fetchError)
      throw fetchError
    }

    const newFunding = proposal.current_funding + additionalAmount
    const newStatus = newFunding >= proposal.target_amount ? 'funded' : 'active'

    const { error: updateError } = await supabase
      .from('proposals')
      .update({ 
        current_funding: newFunding,
        status: newStatus
      })
      .eq('id', proposalId)

    if (updateError) {
      console.error('Error updating proposal funding:', updateError)
      throw updateError
    }
  },

  // Update donation status
  async updateDonationStatus(donationId: string, status: 'pending' | 'confirmed' | 'failed', transactionHash?: string): Promise<void> {
    const { error } = await supabase
      .from('donations')
      .update({ 
        status,
        transaction_hash: transactionHash
      })
      .eq('id', donationId)

    if (error) {
      console.error('Error updating donation status:', error)
      throw error
    }
  },

  // Subscribe to real-time updates for proposals
  subscribeToProposals(callback: (proposals: Proposal[]) => void) {
    return supabase
      .channel('proposals')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'proposals' },
        async () => {
          const proposals = await this.getProposals()
          callback(proposals)
        }
      )
      .subscribe()
  },

  // Subscribe to real-time updates for donations
  subscribeToDonations(callback: (donations: Donation[]) => void) {
    return supabase
      .channel('donations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'donations' },
        async () => {
          const donations = await this.getDonations()
          callback(donations)
        }
      )
      .subscribe()
  }
}
