'use client'

import { useState, useEffect, useCallback } from 'react'
import { initializeSDK } from '@/lib/baseAccountSDK'
import { useReverseBaseName } from '@/hooks/useReverseBaseName'

interface BaseAccountState {
  isConnected: boolean
  universalAddress: string | null
  subAccountAddress: string | null
  universalBaseName: string | null
  subAccountBaseName: string | null
  isLoading: boolean
  error: string | null
}

export function useBaseAccount() {
  const [state, setState] = useState<BaseAccountState>(() => {
    // Try to restore state from localStorage on initialization
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('quick-pay-wallet-state')
        if (saved) {
          const parsed = JSON.parse(saved)
          return {
            isConnected: parsed.isConnected || false,
            universalAddress: parsed.universalAddress || null,
            subAccountAddress: parsed.subAccountAddress || null,
            universalBaseName: parsed.universalBaseName || null,
            subAccountBaseName: parsed.subAccountBaseName || null,
            isLoading: false,
            error: null,
          }
        }
      } catch (error) {
        console.error('Failed to restore wallet state:', error)
      }
    }
    
    return {
      isConnected: false,
      universalAddress: null,
      subAccountAddress: null,
      universalBaseName: null,
      subAccountBaseName: null,
      isLoading: false,
      error: null,
    }
  })

  const { resolveAddress: resolveUniversalName } = useReverseBaseName()
  const { resolveAddress: resolveSubAccountName } = useReverseBaseName()

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('quick-pay-wallet-state', JSON.stringify({
          isConnected: state.isConnected,
          universalAddress: state.universalAddress,
          subAccountAddress: state.subAccountAddress,
          universalBaseName: state.universalBaseName,
          subAccountBaseName: state.subAccountBaseName,
        }))
      } catch (error) {
        console.error('Failed to save wallet state:', error)
      }
    }
  }, [state.isConnected, state.universalAddress, state.subAccountAddress, state.universalBaseName, state.subAccountBaseName])

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (typeof window === 'undefined') return
      
      try {
        const { provider } = await initializeSDK()
        if (provider) {
          const accounts = await provider.request({
            method: 'eth_accounts',
            params: []
          }) as string[]
          
          if (accounts.length > 0) {
            console.log('Found existing wallet connection:', accounts)
            const universalAddress = accounts[0]
            const subAccountAddress = accounts[1] || null
            
            // Resolve Base Names with timeout
            const universalBaseName = await Promise.race([
              resolveUniversalName(universalAddress),
              new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 5000))
            ])
            const subAccountBaseName = subAccountAddress ? await Promise.race([
              resolveSubAccountName(subAccountAddress),
              new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 5000))
            ]) : null
            
            setState(prev => ({
              ...prev,
              isConnected: true,
              universalAddress,
              subAccountAddress,
              universalBaseName,
              subAccountBaseName,
              isLoading: false,
              error: null,
            }))
          }
        }
      } catch (error) {
        console.error('Failed to check existing connection:', error)
        // Don't set error state here, just log it
      }
    }
    
    checkExistingConnection()
  }, []) // Only run once on mount


  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined') {
      setState(prev => ({ ...prev, error: 'Not running in browser' }))
      return
    }

    // Initialize SDK if not already done
    const { provider } = await initializeSDK()
    
    if (!provider) {
      setState(prev => ({ ...prev, error: 'Failed to initialize Base Account SDK' }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log('Attempting to connect wallet...')
      
      // Connect to the wallet - this will automatically create a Sub Account
      // due to our SDK configuration with creation: 'on-connect'
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
        params: []
      }) as string[]

      console.log('Received accounts:', accounts)

      if (accounts.length < 1) {
        throw new Error('No accounts returned from wallet')
      }

      const universalAddress = accounts[0]
      const subAccountAddress = accounts[1] || null // Sub Account might not be created immediately

      console.log('Universal Address:', universalAddress)
      console.log('Sub Account Address:', subAccountAddress)

      // Resolve Base Names with timeout
      const universalBaseName = await Promise.race([
        resolveUniversalName(universalAddress),
        new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 5000))
      ])
      const subAccountBaseName = subAccountAddress ? await Promise.race([
        resolveSubAccountName(subAccountAddress),
        new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 5000))
      ]) : null

      setState(prev => {
        const newState = {
          ...prev,
          isConnected: true,
          universalAddress,
          subAccountAddress,
          universalBaseName,
          subAccountBaseName,
          isLoading: false,
          error: null,
        }
        return newState
      })

      console.log('Wallet connected successfully!')

    } catch (error) {
      console.error('Wallet connection failed:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }))
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setState({
      isConnected: false,
      universalAddress: null,
      subAccountAddress: null,
      universalBaseName: null,
      subAccountBaseName: null,
      isLoading: false,
      error: null,
    })
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('quick-pay-wallet-state')
      } catch (error) {
        console.error('Failed to clear wallet state:', error)
      }
    }
  }, [])

  const sendTransaction = useCallback(async (transaction: {
    to: string
    data?: string
    value?: string
    from?: 'universal' | 'sub'
  }) => {
    if (!state.isConnected) {
      throw new Error('Wallet not connected')
    }

    const { provider } = await initializeSDK()
    if (!provider) {
      throw new Error('Provider not available')
    }

    const fromAddress = transaction.from === 'universal' 
      ? state.universalAddress 
      : state.subAccountAddress

    if (!fromAddress) {
      throw new Error('Account address not available')
    }

    try {
      // Use wallet_sendCalls for better UX with Sub Accounts
      const callsId = await provider.request({
        method: 'wallet_sendCalls',
        params: [{
          version: '2.0',
          atomicRequired: true,
          from: fromAddress,
          calls: [{
            to: transaction.to,
            data: transaction.data || '0x',
            value: transaction.value || '0x0',
          }],
        }]
      }) as string

      return callsId
    } catch (error) {
      console.error('Transaction failed:', error)
      throw error
    }
  }, [state.isConnected, state.universalAddress, state.subAccountAddress])

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    sendTransaction,
  }
}
