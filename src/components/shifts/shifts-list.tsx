'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import ShiftForm from './shift-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Shift {
  id: string
  name: string
  startTime: string
  endTime?: string | null
  description?: string | null
}

export default function ShiftsList() {
  const { data: session } = useSession()
  const router = useRouter()
  const { alertState, loadingState, showAlert, showConfirm, showLoading, hideLoading, closeAlert } = useAlert()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Shift | null>(null)

  // permission checks (mirror UsersPage)
  const canAccess = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER'

  const fetchShifts = useCallback(async (q = '') => {
    // Don't fetch if session is not ready or user doesn't have access
    if (!session || !canAccess) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const url = q ? `/api/shifts?q=${encodeURIComponent(q)}` : '/api/shifts'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setShifts(data)
    } catch (err) {
      console.error(err)
      setShifts([])
      // showAlert is intentionally not a dependency of useCallback to avoid
      // recreating fetchShifts every render (which causes repeated API calls).
      // Call it here conditionally if available.
      try { if (showAlert) { showAlert('เกิดข้อผิดพลาดในการโหลดข้อมูลผลัดงาน', 'error') } } catch {}
    } finally {
      setLoading(false)
    }
  }, [session, canAccess])

  useEffect(() => {
    fetchShifts()
  }, [fetchShifts])

  const handleCreate = () => {
    setEditing(null)
    setShowForm(true)
  }

  const handleEdit = (shift: Shift) => {
    setEditing(shift)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    showConfirm(
      'คุณต้องการลบผลัดงานนี้หรือไม่?',
      async () => {
        try {
          showLoading('กำลังลบผลัดงาน...')
          const res = await fetch(`/api/shifts?id=${id}`, { method: 'DELETE' })
          hideLoading()
          if (!res.ok) {
            showAlert('การลบไม่สำเร็จ', 'error')
            return
          }
          showAlert('ลบผลัดงานสำเร็จ', 'success')
          fetchShifts()
        } catch (err) {
          console.error(err)
          hideLoading()
          showAlert('การลบไม่สำเร็จ', 'error')
        }
      },
      'ยืนยันการลบ',
      'ลบ',
      'ยกเลิก'
    )
  }

  const filtered = shifts

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดผลัดงาน...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">จัดการผลัดงาน</h1>
            <p className="text-gray-600">สร้าง แก้ไข และติดตามผลัดงาน</p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างผลัดงาน
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ผลัดงานทั้งหมด</p>
                <p className="text-2xl font-bold">{shifts.length}</p>
              </div>
              <div className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">กำลังทำงาน</p>
                <p className="text-2xl font-bold">{shifts.filter(s => !s.endTime).length}</p>
              </div>
              <div className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">มีคำอธิบาย</p>
                <p className="text-2xl font-bold">{shifts.filter(s => s.description).length}</p>
              </div>
              <div className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">มีราคาน้ำมัน</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <div className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            ค้นหาผลัดงาน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="ค้นหาชื่อผลัดงาน หรือคำอธิบาย..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>
     

      {/* Shifts Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการผลัดงาน</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>ไม่พบผลัดงาน</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อผลัดงาน</TableHead>
                  <TableHead>เวลาเริ่มต้น</TableHead>
                  <TableHead>เวลาสิ้นสุด</TableHead>
                  <TableHead>คำอธิบาย</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{s.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{new Date(s.startTime).toLocaleString('th-TH')}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{s.endTime ? new Date(s.endTime).toLocaleString('th-TH') : '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700">{s.description || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                       <Button size="sm" variant="outline" onClick={() => router.push(`/shifts/${s.id}`)} aria-label={`ดูรายละเอียด ${s.name}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(s)} disabled={loadingState.isLoading}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-700" disabled={loadingState.isLoading}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{editing ? 'แก้ไขผลัดงาน' : 'สร้างผลัดงาน'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ShiftForm
                initialData={editing}
                onClose={() => { setShowForm(false); fetchShifts() }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alert & Loading */}
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
    </div>
  )
}
