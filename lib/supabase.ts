import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      proposals: {
        Row: {
          id: string
          title: string
          description: string
          target_amount: number
          currency: 'ETH' | 'USDC'
          creator: string
          creator_base_name?: string
          created_at: string
          status: 'active' | 'funded' | 'cancelled' | 'completed'
          current_funding: number
          category: string
          image_url?: string
          deadline?: string
          tags: string[]
        }
        Insert: {
          id?: string
          title: string
          description: string
          target_amount: number
          currency: 'ETH' | 'USDC'
          creator: string
          creator_base_name?: string
          created_at?: string
          status?: 'active' | 'funded' | 'cancelled' | 'completed'
          current_funding?: number
          category: string
          image_url?: string
          deadline?: string
          tags: string[]
        }
        Update: {
          id?: string
          title?: string
          description?: string
          target_amount?: number
          currency?: 'ETH' | 'USDC'
          creator?: string
          creator_base_name?: string
          created_at?: string
          status?: 'active' | 'funded' | 'cancelled' | 'completed'
          current_funding?: number
          category?: string
          image_url?: string
          deadline?: string
          tags?: string[]
        }
      }
      donations: {
        Row: {
          id: string
          donor_address: string
          donor_base_name?: string
          amount: number
          currency: 'ETH' | 'USDC'
          proposal_id: string
          transaction_hash?: string
          created_at: string
          status: 'pending' | 'confirmed' | 'failed'
          message?: string
        }
        Insert: {
          id?: string
          donor_address: string
          donor_base_name?: string
          amount: number
          currency: 'ETH' | 'USDC'
          proposal_id: string
          transaction_hash?: string
          created_at?: string
          status?: 'pending' | 'confirmed' | 'failed'
          message?: string
        }
        Update: {
          id?: string
          donor_address?: string
          donor_base_name?: string
          amount?: number
          currency?: 'ETH' | 'USDC'
          proposal_id?: string
          transaction_hash?: string
          created_at?: string
          status?: 'pending' | 'confirmed' | 'failed'
          message?: string
        }
      }
    }
  }
}
