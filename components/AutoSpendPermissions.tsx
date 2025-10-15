'use client'

import { useState } from 'react'
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Participant } from '@/types/expense'

interface AutoSpendPermissionsProps {
  participants: Participant[]
  onPermissionsGranted: () => void
  onPermissionsDenied: () => void
  isVisible: boolean
}

export default function AutoSpendPermissions({
  participants,
  onPermissionsGranted,
  onPermissionsDenied,
  isVisible,
}: AutoSpendPermissionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const steps = [
    {
      title: 'Request Spend Permissions',
      description: 'Request permission to automatically process payments for this expense group',
    },
    {
      title: 'Send Payment Requests',
      description: 'Send payment requests to all participants',
    },
    {
      title: 'Process Payments',
      description: 'Automatically process approved payments',
    },
  ]

  const handleGrantPermissions = async () => {
    setIsProcessing(true)
    
    try {
      // Mock the Auto Spend Permissions flow
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i)
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        setCompletedSteps(prev => [...prev, i])
      }
      
      onPermissionsGranted()
    } catch (error) {
      console.error('Failed to grant permissions:', error)
      onPermissionsDenied()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDenyPermissions = () => {
    onPermissionsDenied()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-8 h-8 text-primary-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Auto Spend Permissions</h2>
            <p className="text-gray-600">Enable automatic payment processing for this expense group</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">What this enables:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Automatic payment processing without manual approval for each transaction</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Faster settlement of shared expenses</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Reduced friction for recurring expense groups</span>
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Participants who will receive payment requests:</h3>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span className="text-sm text-gray-700">
                  {participant.baseName || participant.address}
                </span>
                {participant.baseName && (
                  <span className="text-xs text-gray-500">
                    ({participant.address.slice(0, 6)}...{participant.address.slice(-4)})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {isProcessing && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Setting up permissions...</h3>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  {completedSteps.includes(index) ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : currentStep === index ? (
                    <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      completedSteps.includes(index) ? 'text-green-700' : 
                      currentStep === index ? 'text-primary-700' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleGrantPermissions}
            disabled={isProcessing}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Setting up...' : 'Enable Auto Spend Permissions'}
          </button>
          <button
            onClick={handleDenyPermissions}
            disabled={isProcessing}
            className="btn-secondary"
          >
            Skip for Now
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Note:</p>
              <p>You can always manage these permissions later in your wallet settings. 
              This only affects payments for this specific expense group.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
