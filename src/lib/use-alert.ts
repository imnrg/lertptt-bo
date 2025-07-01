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

const initialState: AlertState = {
  isOpen: false,
  message: '',
  type: 'info',
  showCancel: false
}

export function useAlert() {
  const [alertState, setAlertState] = useState<AlertState>(initialState)

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

  const closeAlert = () => {
    setAlertState(initialState)
  }

  return {
    alertState,
    showAlert,
    showConfirm,
    closeAlert
  }
}