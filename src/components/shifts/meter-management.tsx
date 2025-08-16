'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { useRouter } from 'next/navigation'

interface ShiftMeter {
  id: string
  shiftId: string
  dispenserId: string
  tankId: string
  fuelTypeId: string
  startMeter: number
  endMeter?: number | null
  testWithdraw?: number
  useWithdraw?: number
  amount?: number
  // relations returned by API (included)
  dispenser?: { id: string; name: string } | null
  tank?: { id: string; name: string } | null
  fuelType?: { id: string; name: string } | null
}

export default function MeterManagement({ shiftId }: { shiftId: string }) {
  const { alertState, loadingState, showAlert, showLoading, hideLoading, closeAlert } = useAlert()
  const router = useRouter()
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

      // use updated record from server to update local table immediately
      const updated = await res.json()
      setMeters((prev) => prev.map((row) => (row.id === updated.id ? updated : row)))

      // also refresh server components (so totals in parent server component update)
      router.refresh()
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

      {loading ? (
        <p className="text-gray-600">กำลังโหลดมิเตอร์...</p>
      ) : (
        <div>
          {meters.length === 0 ? (
            <p className="text-gray-600">ยังไม่มีมิเตอร์ในผลัดนี้</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>หัวจ่าย</TableHead>
                  <TableHead>ถัง</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>เริ่ม</TableHead>
                  <TableHead>สิ้นสุด</TableHead>
                  <TableHead>เบิกทดสอบ</TableHead>
                  <TableHead>เบิกใช้งาน</TableHead>
                  <TableHead>ขาย (ลิตร)</TableHead>
                  <TableHead>ยอด (฿)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meters.map((m) => {
                  const sold = (Number(m.endMeter ?? m.startMeter) - Number(m.startMeter) - Number(m.testWithdraw ?? 0) - Number(m.useWithdraw ?? 0)) || 0
                  const amount = m.amount ?? 0
                  return (
                    <TableRow key={m.id}>
                      <TableCell>{m.dispenser?.name ?? m.dispenserId}</TableCell>
                      <TableCell>{m.tank?.name ?? m.tankId}</TableCell>
                      <TableCell>{m.fuelType?.name ?? m.fuelTypeId}</TableCell>
                      <TableCell>{m.startMeter}</TableCell>
                      <TableCell>
                        <Input
                          defaultValue={m.endMeter ?? ''}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            const v = e.target.value
                            const parsed = v === '' ? undefined : Number(v)
                            handleUpdate({ ...m, endMeter: parsed })
                          }}
                          placeholder="มิเตอร์สิ้นสุด"
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          defaultValue={m.testWithdraw ?? ''}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            const v = e.target.value
                            const parsed = v === '' ? undefined : Number(v)
                            handleUpdate({ ...m, testWithdraw: parsed })
                          }}
                          placeholder="เบิกทดสอบ"
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          defaultValue={m.useWithdraw ?? ''}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            const v = e.target.value
                            const parsed = v === '' ? undefined : Number(v)
                            handleUpdate({ ...m, useWithdraw: parsed })
                          }}
                          placeholder="เบิกใช้งาน"
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>{sold}</TableCell>
                      <TableCell>฿{amount.toFixed(2)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  )
}
