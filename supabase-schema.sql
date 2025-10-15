-- Quick Fund Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_amount DECIMAL(18,2) NOT NULL CHECK (target_amount > 0),
  currency TEXT NOT NULL CHECK (currency IN ('ETH', 'USDC')),
  creator TEXT NOT NULL,
  creator_base_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'funded', 'cancelled', 'completed')),
  current_funding DECIMAL(18,2) DEFAULT 0 CHECK (current_funding >= 0),
  category TEXT NOT NULL,
  image_url TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_address TEXT NOT NULL,
  donor_base_name TEXT,
  amount DECIMAL(18,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL CHECK (currency IN ('ETH', 'USDC')),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_creator ON proposals(creator);
CREATE INDEX IF NOT EXISTS idx_donations_proposal_id ON donations(proposal_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_donor_address ON donations(donor_address);

-- Enable Row Level Security
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public can view proposals" ON proposals
  FOR SELECT USING (true);

CREATE POLICY "Public can view donations" ON donations
  FOR SELECT USING (true);

-- Create policies for authenticated users to insert
CREATE POLICY "Authenticated users can create proposals" ON proposals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can create donations" ON donations
  FOR INSERT WITH CHECK (true);

-- Create policies for users to update their own proposals
CREATE POLICY "Users can update their own proposals" ON proposals
  FOR UPDATE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data
INSERT INTO proposals (title, description, target_amount, currency, creator, creator_base_name, category, image_url, deadline, tags, current_funding) VALUES
(
  'Build a Decentralized Art Gallery',
  'Create a platform where artists can showcase and sell their digital art as NFTs, with automatic royalty distribution.',
  5000.00,
  'USDC',
  '0x1234567890123456789012345678901234567890',
  'artist.base',
  'Art',
  'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
  NOW() + INTERVAL '30 days',
  ARRAY['art', 'nft', 'gallery', 'web3'],
  1250.00
),
(
  'Community Garden Initiative',
  'Transform an empty lot into a thriving community garden with sustainable farming practices and educational programs.',
  2500.00,
  'USDC',
  '0x0987654321098765432109876543210987654321',
  'green.base',
  'Community',
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
  NOW() + INTERVAL '45 days',
  ARRAY['community', 'sustainability', 'education', 'local'],
  1800.00
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
