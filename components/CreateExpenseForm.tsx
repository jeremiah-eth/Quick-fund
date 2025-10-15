'use client'

import { useState } from 'react'
import { Plus, DollarSign, Users, FileText } from 'lucide-react'
import ParticipantInput from '@/components/ParticipantInput'
import { Participant, CreateExpenseData } from '@/types/expense'

interface CreateExpenseFormProps {
  onSubmit: (data: CreateExpenseData) => void
  onCancel: () => void
  isLoading?: boolean
  creatorAddress?: string
  creatorBaseName?: string
}

export default function CreateExpenseForm({
  onSubmit,
  onCancel,
  isLoading = false,
  creatorAddress,
  creatorBaseName,
}: CreateExpenseFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    currency: 'ETH' as 'ETH' | 'USDC',
  })
  const [participants, setParticipants] = useState<Participant[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.amount || participants.length === 0) {
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      return
    }

    onSubmit({
      name: formData.name.trim(),
      amount,
      currency: formData.currency,
      participants,
    })
  }

  const perPersonAmount = participants.length > 0 
    ? (parseFloat(formData.amount) || 0) / participants.length 
    : 0

  const isValid = formData.name.trim() && 
                  formData.amount && 
                  !isNaN(parseFloat(formData.amount)) && 
                  parseFloat(formData.amount) > 0 && 
                  participants.length > 0 &&
                  participants.every(p => p.isValid)

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-6">
        <Plus className="w-6 h-6 text-primary-600" />
        <h2 className="text-xl font-semibold text-gray-900">Create New Expense</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Expense Description
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Dinner at Restaurant, Gas for Road Trip"
            className="input-field"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Amount
            </label>
            <input
              type="number"
              step="0.000001"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                currency: e.target.value as 'ETH' | 'USDC' 
              }))}
              className="input-field"
            >
              <option value="ETH">ETH</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
        </div>

        <ParticipantInput
          participants={participants}
          onParticipantsChange={setParticipants}
          disabled={isLoading}
        />

        {participants.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Split Summary</h4>
            <div className="text-sm text-blue-800">
              <p>Total: {formData.amount} {formData.currency}</p>
              <p>Participants: {participants.length}</p>
              <p className="font-medium">
                Per person: {perPersonAmount.toFixed(6)} {formData.currency}
              </p>
            </div>
          </div>
        )}

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Auto Spend Permissions</h4>
          <p className="text-sm text-yellow-800">
            When you create this expense, payment requests will be sent to each participant's Sub Account. 
            The first payment will require approval, but subsequent payments can be automatically processed 
            using approved spend permissions for a smoother experience.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex-1"
          >
            {isLoading ? 'Creating...' : 'Create Expense'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
