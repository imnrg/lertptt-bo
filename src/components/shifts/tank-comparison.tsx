'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { formatNumber } from '@/lib/utils'

interface TankCheck {
  id: string
  tankId: string
  firstMeasure: number
  received?: number
  sold?: number
  remaining?: number
  lastMeasure?: number
}

// added: meter interface to compute sold per tank
interface ShiftMeter {
  id: string
  tankId: string
  startMeter: number
  endMeter?: number | null
  testWithdraw?: number
  useWithdraw?: number
  // include tank relation returned by API
  tank?: { id: string; name: string } | null
}

export default function TankComparison({ shiftId }: { shiftId: string }) {
  const { alertState, loadingState, showAlert, showLoading, hideLoading, closeAlert } = useAlert()
  const router = useRouter()
  const [checks, setChecks] = useState<TankCheck[]>([])
  const [meters, setMeters] = useState<ShiftMeter[]>([])
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

  // fetch meters for the shift so we can compute sold per tank
  const fetchMeters = async () => {
    try {
      const res = await fetch(`/api/shifts/meters?shiftId=${shiftId}`)
      if (!res.ok) throw new Error('Failed to fetch meters')
      const data = await res.json()
      setMeters(data)
    } catch (err) {
      console.error(err)
      setMeters([])
    }
  }

  useEffect(() => {
    fetchChecks()
    fetchMeters()
  }, [shiftId])

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

      // use updated record from server to update local table immediately
      const updated = await res.json()
      setChecks((prev) => prev.map((row) => (row.id === updated.id ? updated : row)))

      // also refresh meters in case something changed and refresh server components
      fetchMeters()
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

      {loading ? <p className="text-gray-600">กำลังโหลดเทียบถัง...</p> : (
        <div>
          {checks.length === 0 ? (
            <p className="text-gray-600">ยังไม่มีการเทียบถังในผลัดนี้</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ถัง</TableHead>
                  <TableHead>เริ่ม</TableHead>
                  <TableHead>รับเพิ่ม</TableHead>
                  <TableHead>ขาย</TableHead>
                  <TableHead>คงเหลือ</TableHead>
                  <TableHead>วัดครั้งสุดท้าย</TableHead>
                  <TableHead>ส่วนต่าง</TableHead>
                  <TableHead>% ส่วนต่าง</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map((c) => {
                  // compute sold using meters for this tank
                  const soldFromMeters = meters
                    .filter((m) => m.tankId === c.tankId)
                    .reduce((acc, m) => {
                      const start = Number(m.startMeter ?? 0)
                      const end = m.endMeter == null ? start : Number(m.endMeter)
                      const test = Number(m.testWithdraw ?? 0)
                      const use = Number(m.useWithdraw ?? 0)
                      const sold = Math.max(0, end - start - test - use)
                      return acc + sold
                    }, 0)

                  // prefer tank name from meters' included tank relation
                  const tankName = meters.find((m) => m.tankId === c.tankId)?.tank?.name ?? c.tankId

                  const remaining = (c.firstMeasure ?? 0) + (c.received ?? 0) - (soldFromMeters ?? 0)
                  const diff = remaining - (c.lastMeasure ?? remaining)
                  const diffPercent = remaining ? (diff / remaining) * 100 : 0

                  return (
                    <TableRow key={c.id}>
                      <TableCell>{tankName}</TableCell>
                      <TableCell>{formatNumber(c.firstMeasure)}</TableCell>
                      <TableCell>
                        <Input
                          defaultValue={c.received ?? ''}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            const v = e.target.value
                            const parsed = v === '' ? undefined : Number(v)
                            if (parsed !== undefined && !Number.isFinite(parsed)) {
                              showAlert('กรุณากรอกตัวเลขที่ถูกต้อง', 'error')
                              return
                            }
                            handleUpdate({ ...c, received: parsed })
                          }}
                          placeholder="รับเพิ่ม"
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>{formatNumber(soldFromMeters)}</TableCell>
                      <TableCell>{formatNumber(remaining)}</TableCell>
                      <TableCell>
                        <Input
                          defaultValue={c.lastMeasure ?? ''}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            const v = e.target.value
                            const parsed = v === '' ? undefined : Number(v)
                            if (parsed !== undefined && !Number.isFinite(parsed)) {
                              showAlert('กรุณากรอกตัวเลขที่ถูกต้อง', 'error')
                              return
                            }
                            handleUpdate({ ...c, lastMeasure: parsed })
                          }}
                          placeholder="วัดครั้งสุดท้าย"
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>{formatNumber(diff)}</TableCell>
                      <TableCell>{formatNumber(diffPercent, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</TableCell>
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
