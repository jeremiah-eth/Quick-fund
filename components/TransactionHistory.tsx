'use client'

import { useState } from 'react'
import { History, Filter, Search, ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Expense } from '@/types/expense'

interface TransactionHistoryProps {
  expenses: Expense[]
  currentUserAddress?: string
  currentUserBaseName?: string
}

export default function TransactionHistory({
  expenses,
  currentUserAddress,
  currentUserBaseName,
}: TransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'failed'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')

  const filteredExpenses = expenses
    .filter(expense => {
      const matchesSearch = expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.participants.some(p => 
          p.baseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.address.toLowerCase().includes(searchTerm.toLowerCase())
        )
      
      const matchesStatus = statusFilter === 'all' || 
        Object.values(expense.payments).some(payment => payment.status === statusFilter)
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.createdAt.getTime() - a.createdAt.getTime()
      } else {
        return b.amount - a.amount
      }
    })

  const getStatusIcon = (status: 'pending' | 'paid' | 'failed') => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: 'pending' | 'paid' | 'failed') => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatParticipantList = (participants: Expense['participants']) => {
    if (participants.length <= 2) {
      return participants.map(p => p.baseName || p.address.slice(0, 6) + '...' + p.address.slice(-4)).join(', ')
    }
    const first = participants[0]
    const remaining = participants.length - 1
    return `${first.baseName || first.address.slice(0, 6) + '...' + first.address.slice(-4)} +${remaining} others`
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <History className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
        </div>
        <span className="text-sm text-gray-500">{filteredExpenses.length} transactions</span>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="input-field"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="input-field"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
        </select>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => (
            <div key={expense.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-gray-900">{expense.name}</h3>
                    <span className="text-sm font-medium text-gray-600">
                      {expense.amount} {expense.currency}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <p>Created by: {expense.creatorBaseName || expense.creator.slice(0, 6)}...{expense.creator.slice(-4)}</p>
                    <p>Participants: {formatParticipantList(expense.participants)}</p>
                    <p>Date: {expense.createdAt.toLocaleDateString()} at {expense.createdAt.toLocaleTimeString()}</p>
                  </div>

                  {/* Payment Status */}
                  <div className="flex items-center space-x-2">
                    {Object.entries(expense.payments).map(([participantId, payment]) => {
                      const participant = expense.participants.find(p => p.id === participantId)
                      if (!participant) return null
                      
                      return (
                        <div key={participantId} className="flex items-center space-x-1">
                          {getStatusIcon(payment.status)}
                          <span className="text-xs text-gray-600">
                            {participant.baseName || participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    Object.values(expense.payments).some(p => p.status === 'paid') ? 'paid' : 
                    Object.values(expense.payments).some(p => p.status === 'failed') ? 'failed' : 'pending'
                  )}`}>
                    {Object.values(expense.payments).some(p => p.status === 'paid') ? 'Completed' : 
                     Object.values(expense.payments).some(p => p.status === 'failed') ? 'Failed' : 'Pending'}
                  </span>
                  
                  {Object.values(expense.payments).some(p => p.transactionHash) && (
                    <button className="text-xs text-primary-600 hover:text-primary-700 flex items-center space-x-1">
                      <ExternalLink className="w-3 h-3" />
                      <span>View on Explorer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
