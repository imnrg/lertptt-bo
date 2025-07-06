'use client'

import { LoadingState } from '@/lib/use-alert'

interface LoadingModalProps {
  loadingState: LoadingState
}

export function LoadingModal({ loadingState }: LoadingModalProps) {
  if (!loadingState.isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl p-8 max-w-sm mx-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinner */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          
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