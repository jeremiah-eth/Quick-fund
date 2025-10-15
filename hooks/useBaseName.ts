'use client'

import { useState, useCallback } from 'react'
import { createPublicClient, http, isAddress } from 'viem'
import { base } from 'viem/chains'

// Cache for resolved names to avoid repeated API calls
const nameCache = new Map<string, string>()

export interface BaseNameResult {
  address: string | null
  isLoading: boolean
  error: string | null
}

export function useBaseName() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolveBaseName = useCallback(async (input: string): Promise<string | null> => {
    if (!input) return null

    // Check if it's already a valid address
    if (isAddress(input)) {
      return input
    }

    // Check if it looks like a Base Name
    if (!input.includes('.base')) {
      return null
    }

    // Check cache first
    if (nameCache.has(input)) {
      return nameCache.get(input) || null
    }

    setIsLoading(true)
    setError(null)

    try {
      // Simple normalization - convert to lowercase and trim
      const normalizedName = input.toLowerCase().trim()
      
      // Create Base client
      const client = createPublicClient({
        chain: base,
        transport: http()
      })

      // Resolve the name
      const address = await client.getEnsAddress({
        name: normalizedName,
      })

      if (address) {
        nameCache.set(input, address)
        return address
      }

      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve Base Name'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    resolveBaseName,
    isLoading,
    error,
  }
}
