'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'

interface ShiftMeter {
  id: string
  dispenserId: string
  tankId: string
  fuelTypeId: string
  startMeter: number
  endMeter?: number | null
  testWithdraw?: number
  useWithdraw?: number
}

export default function MeterManagement({ shiftId }: { shiftId: string }) {
  const { alertState, loadingState, showAlert, showLoading, hideLoading, closeAlert } = useAlert()
  const [meters, setMeters] = useState<ShiftMeter[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMeters = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/shifts/meters?shiftId=${shiftId}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setMeters(data)
    } catch (err) {
      console.error(err)
      setMeters([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMeters() }, [shiftId])

  const handleUpdate = async (m: ShiftMeter) => {
    try {
      showLoading('กำลังอัปเดตมิเตอร์...')
      const res = await fetch('/api/shifts/meters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(m),
      })
      hideLoading()
      if (!res.ok) {
        showAlert('อัปเดตไม่สำเร็จ', 'error')
        return
      }
      showAlert('อัปเดตมิเตอร์สำเร็จ', 'success')
      fetchMeters()
    } catch (err) {
      console.error(err)
      hideLoading()
      showAlert('อัปเดตไม่สำเร็จ', 'error')
    }
  }

  return (
    <div>
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        onConfirm={alertState.onConfirm}
        showCancel={alertState.showCancel}
      />

      <LoadingModal loadingState={loadingState} />

      {loading ? <p className="text-gray-600">กำลังโหลดมิเตอร์...</p> : (
        <div className="space-y-3">
          {meters.map((m) => {
            const sold = (m.endMeter ?? m.startMeter) - m.startMeter - (m.testWithdraw ?? 0) - (m.useWithdraw ?? 0)
            const amount = (sold || 0) * 0
            return (
              <div key={m.id} className="p-3 border rounded">
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm">หัวจ่าย: {m.dispenserId}</div>
                    <div className="text-sm">ถัง: {m.tankId}</div>
                    <div className="text-sm">ประเภท: {m.fuelTypeId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">เริ่ม: {m.startMeter}</div>
                    <div className="text-sm">สิ้นสุด: {m.endMeter ?? '-'}</div>
                    <div className="text-sm">ขาย: {sold}</div>
                    <div className="text-sm font-semibold">฿{amount.toFixed(2)}</div>
                  </div>
                </div>

                <div className="mt-2 flex gap-2">
                  <Input defaultValue={m.endMeter ?? ''} onBlur={(e: unknown) => { const target = e as FocusEvent & { target: HTMLInputElement }; handleUpdate({ ...m, endMeter: Number(target.target.value) }) }} placeholder="มิเตอร์สิ้นสุด" className="w-32" />
                  <Input defaultValue={m.testWithdraw ?? ''} onBlur={(e: unknown) => { const target = e as FocusEvent & { target: HTMLInputElement }; handleUpdate({ ...m, testWithdraw: Number(target.target.value) }) }} placeholder="เบิกทดสอบ" className="w-32" />
                  <Input defaultValue={m.useWithdraw ?? ''} onBlur={(e: unknown) => { const target = e as FocusEvent & { target: HTMLInputElement }; handleUpdate({ ...m, useWithdraw: Number(target.target.value) }) }} placeholder="เบิกใช้งาน" className="w-32" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
