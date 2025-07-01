import { useState } from 'react'

export interface AlertState {
  isOpen: boolean
  title?: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  showCancel: boolean
}

export interface LoadingState {
  isLoading: boolean
  message: string
}

const initialState: AlertState = {
  isOpen: false,
  message: '',
  type: 'info',
  showCancel: false
}

const initialLoadingState: LoadingState = {
  isLoading: false,
  message: ''
}

export function useAlert() {
  const [alertState, setAlertState] = useState<AlertState>(initialState)
  const [loadingState, setLoadingState] = useState<LoadingState>(initialLoadingState)

  const showAlert = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    title?: string
  ) => {
    setAlertState({
      isOpen: true,
      message,
      type,
      title,
      showCancel: false,
      confirmText: 'ตกลง'
    })
  }

  const showConfirm = (
    message: string,
    onConfirm: () => void,
    title?: string,
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก'
  ) => {
    setAlertState({
      isOpen: true,
      message,
      type: 'warning',
      title: title || 'ยืนยันการดำเนินการ',
      showCancel: true,
      confirmText,
      cancelText,
      onConfirm
    })
  }

  const showLoading = (message: string = 'กำลังประมวลผล...') => {
    setLoadingState({
      isLoading: true,
      message
    })
  }

  const hideLoading = () => {
    setLoadingState(initialLoadingState)
  }

  const closeAlert = () => {
    setAlertState(initialState)
  }

  return {
    alertState,
    loadingState,
    showAlert,
    showConfirm,
    showLoading,
    hideLoading,
    closeAlert
  }
}