import { parseUnits } from 'viem'

// USDC contract address on Base mainnet
const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// USDC transfer function signature
const TRANSFER_FUNCTION_SIGNATURE = '0xa9059cbb' // transfer(address,uint256)

export interface USDCTransferParams {
  to: string
  amount: number // Amount in USDC (not wei)
  from: string
}

export function createUSDCTransferData(params: USDCTransferParams): string {
  // Convert USDC amount to 6 decimals (USDC uses 6 decimals, not 18)
  const amountInUnits = parseUnits(params.amount.toString(), 6)
  
  // Encode the transfer function call
  // transfer(address to, uint256 amount)
  // Function signature: 0xa9059cbb
  // Parameters: 32-byte padded address + 32-byte padded amount
  
  const toAddress = params.to.slice(2).padStart(64, '0') // Remove 0x and pad to 64 chars
  const amountHex = amountInUnits.toString(16).padStart(64, '0') // Convert to hex and pad
  
  return TRANSFER_FUNCTION_SIGNATURE + toAddress + amountHex
}

export function createUSDCTransaction(params: USDCTransferParams) {
  return {
    to: USDC_CONTRACT_ADDRESS,
    value: '0x0', // No ETH value for token transfers
    data: createUSDCTransferData(params),
    from: params.from as 'universal' | 'sub'
  }
}

// Note: In a real implementation, you would also need:
// 1. Check USDC balance before transfer
// 2. Handle USDC approval if needed
// 3. Handle different USDC contract addresses for different networks
// 4. Proper error handling for insufficient balance/allowance
