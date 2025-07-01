'use client'

import { LoadingState } from '@/lib/use-alert'
import { Loader2 } from 'lucide-react'

interface LoadingModalProps {
  loadingState: LoadingState
}

export function LoadingModal({ loadingState }: LoadingModalProps) {
  if (!loadingState.isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl p-8 max-w-sm mx-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinner */}
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          
          {/* Loading Text */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              กำลังดำเนินการ
            </h3>
            <p className="text-gray-600">
              {loadingState.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}