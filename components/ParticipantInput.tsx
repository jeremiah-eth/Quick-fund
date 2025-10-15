'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useBaseName } from '@/hooks/useBaseName'
import { useReverseBaseName } from '@/hooks/useReverseBaseName'

interface Participant {
  id: string
  address: string
  baseName?: string
  isValid: boolean
  isResolving: boolean
  error?: string
}

interface ParticipantInputProps {
  participants: Participant[]
  onParticipantsChange: (participants: Participant[]) => void
  disabled?: boolean
}

export default function ParticipantInput({
  participants,
  onParticipantsChange,
  disabled = false,
}: ParticipantInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const { resolveBaseName, isLoading: isResolvingName, error: nameError } = useBaseName()
  const { resolveAddress } = useReverseBaseName()

  const validateInput = async (input: string): Promise<{
    address: string | null
    baseName?: string
    error?: string
  }> => {
    if (!input.trim()) {
      return { address: null, error: 'Please enter an address or Base Name' }
    }

    // Check if it's already a valid address
    if (input.match(/^0x[a-fA-F0-9]{40}$/)) {
      // Try to resolve to Base Name for display
      const baseName = await resolveAddress(input)
      return { address: input, baseName: baseName || undefined }
    }

    // Check if it looks like a Base Name
    if (input.includes('.base')) {
      const address = await resolveBaseName(input)
      if (address) {
        return { address, baseName: input }
      }
      return { address: null, error: 'Base Name not found' }
    }

    return { address: null, error: 'Invalid address or Base Name format' }
  }

  const handleAddParticipant = async () => {
    if (!inputValue.trim() || disabled) return

    // Check for duplicates
    const isDuplicate = participants.some(p => 
      p.address.toLowerCase() === inputValue.toLowerCase() ||
      p.baseName?.toLowerCase() === inputValue.toLowerCase()
    )

    if (isDuplicate) {
      setInputValue('')
      return
    }

    setIsValidating(true)
    
    try {
      const result = await validateInput(inputValue)
      
      if (result.address) {
        const newParticipant: Participant = {
          id: Date.now().toString(),
          address: result.address,
          baseName: result.baseName,
          isValid: true,
          isResolving: false,
        }
        
        onParticipantsChange([...participants, newParticipant])
        setInputValue('')
      } else {
        // Show error but don't add participant
        console.error('Validation error:', result.error)
      }
    } catch (error) {
      console.error('Error validating participant:', error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveParticipant = (id: string) => {
    onParticipantsChange(participants.filter(p => p.id !== id))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddParticipant()
    }
  }

  const getInputStatus = () => {
    if (isValidating || isResolvingName) return 'validating'
    if (nameError) return 'error'
    return 'idle'
  }

  const inputStatus = getInputStatus()

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Participants
      </label>
      
      <div className="space-y-2">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              {participant.isValid ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : participant.error ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              )}
              
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {participant.baseName || participant.address}
                </p>
                {participant.baseName && (
                  <p className="text-xs text-gray-500">
                    {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                  </p>
                )}
                {participant.error && (
                  <p className="text-xs text-red-500">{participant.error}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => handleRemoveParticipant(participant.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter address (0x...) or Base Name (username.base)"
            className={`input-field pr-10 ${
              inputStatus === 'error' ? 'border-red-300 focus:ring-red-500' : ''
            }`}
            disabled={disabled || isValidating}
          />
          
          {inputStatus === 'validating' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
        
        <button
          onClick={handleAddParticipant}
          disabled={disabled || !inputValue.trim() || isValidating}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="text-xs text-gray-500">
        <p>• Enter wallet addresses (0x...) or Base Names (username.base)</p>
        <p>• Base Names will be automatically resolved to addresses</p>
        <p>• Duplicate participants will be ignored</p>
      </div>

      {nameError && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {nameError}
        </div>
      )}
    </div>
  )
}
