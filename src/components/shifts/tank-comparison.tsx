'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'

interface TankCheck {
  id: string
  tankId: string
  firstMeasure: number
  received?: number
  sold?: number
  remaining?: number
  lastMeasure?: number
}

export default function TankComparison({ shiftId }: { shiftId: string }) {
  const { alertState, loadingState, showAlert, showLoading, hideLoading, closeAlert } = useAlert()
  const [checks, setChecks] = useState<TankCheck[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChecks = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/shifts/tank-checks?shiftId=${shiftId}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setChecks(data)
    } catch (err) {
      console.error(err)
      setChecks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchChecks() }, [shiftId])

  const handleUpdate = async (c: TankCheck) => {
    try {
      showLoading('กำลังอัปเดตการเทียบถัง...')
      const res = await fetch('/api/shifts/tank-checks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      })
      hideLoading()
      if (!res.ok) {
        showAlert('อัปเดตไม่สำเร็จ', 'error')
        return
      }
      showAlert('อัปเดตการเทียบถังสำเร็จ', 'success')
      fetchChecks()
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

      {loading ? <p className="text-gray-600">กำลังโหลดเทียบถัง...</p> : (
        <div className="space-y-3">
          {checks.map((c) => {
            const remaining = (c.firstMeasure ?? 0) + (c.received ?? 0) - (c.sold ?? 0)
            const diff = remaining - (c.lastMeasure ?? remaining)
            const diffPercent = remaining ? (diff / remaining) * 100 : 0
            return (
              <div key={c.id} className="p-3 border rounded">
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm">ถัง: {c.tankId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">เริ่ม: {c.firstMeasure}</div>
                    <div className="text-sm">รับเพิ่ม: {c.received ?? 0}</div>
                    <div className="text-sm">ขาย: {c.sold ?? 0}</div>
                    <div className="text-sm">คงเหลือ: {remaining}</div>
                    <div className="text-sm">วัดครั้งสุดท้าย: {c.lastMeasure ?? '-'}</div>
                    <div className="text-sm">ส่วนต่าง: {diff}</div>
                    <div className="text-sm">% ส่วนต่าง: {diffPercent.toFixed(2)}%</div>
                  </div>
                </div>

                <div className="mt-2 flex gap-2">
                  <Input defaultValue={c.received ?? ''} onBlur={(e: unknown) => { const target = e as FocusEvent & { target: HTMLInputElement }; handleUpdate({ ...c, received: Number(target.target.value) }) }} placeholder="รับเพิ่ม" className="w-32" />
                  <Input defaultValue={c.lastMeasure ?? ''} onBlur={(e: unknown) => { const target = e as FocusEvent & { target: HTMLInputElement }; handleUpdate({ ...c, lastMeasure: Number(target.target.value) }) }} placeholder="วัดครั้งสุดท้าย" className="w-32" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
