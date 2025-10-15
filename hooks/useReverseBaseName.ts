'use client'

import { useState, useCallback } from 'react'
import { createPublicClient, http, isAddress } from 'viem'
import { base } from 'viem/chains'

// Cache for reverse resolved names
const reverseNameCache = new Map<string, string | null>()

export interface ReverseBaseNameResult {
  name: string | null
  isLoading: boolean
  error: string | null
}

export function useReverseBaseName() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolveAddress = useCallback(async (address: string): Promise<string | null> => {
    if (!address || !isAddress(address)) {
      return null
    }

    // Check cache first
    if (reverseNameCache.has(address)) {
      return reverseNameCache.get(address) || null
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create Base client
      const client = createPublicClient({
        chain: base,
        transport: http()
      })

      // Try to resolve the address to a name
      const name = await client.getEnsName({
        address: address as `0x${string}`,
      })

      reverseNameCache.set(address, name)
      return name
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve address'
      setError(errorMessage)
      reverseNameCache.set(address, null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    resolveAddress,
    isLoading,
    error,
  }
}
