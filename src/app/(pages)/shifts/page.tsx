'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Plus, Edit, Trash2, Eye, Clock, Search, Filter, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useAlert } from '@/lib/use-alert'

interface User {
  id: string
  name: string
  username: string
}

interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string | null
  user: User
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  totalSales: number
  notes: string | null
}

interface ShiftSummary {
  activeShifts: number
  totalSalesToday: number
}

interface ApiResponse {
  shifts: Shift[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  summary: ShiftSummary
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'กำลังทำงาน'
    case 'COMPLETED':
      return 'เสร็จสิ้น'
    case 'CANCELLED':
      return 'ยกเลิก'
    default:
      return 'ไม่ทราบ'
  }
}

const calculateWorkingHours = (startTime: string, endTime: string | null) => {
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : new Date()
  const diffInMs = end.getTime() - start.getTime()
  const hours = Math.floor(diffInMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours} ชม. ${minutes} นาที`
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [summary, setSummary] = useState<ShiftSummary>({ activeShifts: 0, totalSalesToday: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deletingShift, setDeletingShift] = useState<string | null>(null)
  const { showAlert } = useAlert()

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/shifts?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch shifts')
      }

      const data: ApiResponse = await response.json()
      
      // Filter by search term on client side
      const filteredShifts = searchTerm
        ? data.shifts.filter(shift => 
            shift.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shift.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shift.user.username.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : data.shifts

      setShifts(filteredShifts)
      setSummary(data.summary)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error('Error fetching shifts:', error)
      showAlert('เกิดข้อผิดพลาดในการดึงข้อมูลผลัดงาน', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, showAlert, statusFilter])

  const handleDelete = async (shiftId: string, shiftName: string) => {
    if (!confirm(`คุณต้องการลบผลัดงาน "${shiftName}" หรือไม่?`)) {
      return
    }

    try {
      setDeletingShift(shiftId)
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete shift')
      }

      showAlert('ลบผลัดงานเรียบร้อยแล้ว', 'success')
      fetchShifts()
    } catch (error) {
      console.error('Error deleting shift:', error)
      showAlert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบผลัดงาน', 'error')
    } finally {
      setDeletingShift(null)
    }
  }

  const handleEndShift = async (shiftId: string, shiftName: string) => {
    if (!confirm(`คุณต้องการจบผลัดงาน "${shiftName}" หรือไม่?`)) {
      return
    }

    try {
      const response = await fetch(`/api/shifts/${shiftId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to end shift')
      }

      showAlert('จบผลัดงานเรียบร้อยแล้ว', 'success')
      fetchShifts()
    } catch (error) {
      console.error('Error ending shift:', error)
      showAlert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการจบผลัดงาน', 'error')
    }
  }

  useEffect(() => {
    fetchShifts()
  }, [fetchShifts])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (page === 1) {
        fetchShifts()
      } else {
        setPage(1)
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, statusFilter, page, fetchShifts])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">จัดการผลัดงาน</h1>
          <p className="mt-2 text-sm text-gray-700">
            จัดการผลัดการทำงานและติดตามยอดขาย
          </p>
        </div>
        <Button asChild>
          <Link href="/shifts/new">
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มผลัดงาน
          </Link>
        </Button>
      </div>

      {/* Active Shift Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            สรุปผลัดงาน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.activeShifts}</div>
              <div className="text-sm text-green-700">ผลัดที่กำลังทำงาน</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">฿{summary.totalSalesToday.toLocaleString()}</div>
              <div className="text-sm text-blue-700">ยอดขายวันนี้</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{shifts.length}</div>
              <div className="text-sm text-yellow-700">จำนวนผลัดทั้งหมด</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาผลัดงาน, พนักงาน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="ACTIVE">กำลังทำงาน</option>
                <option value="COMPLETED">เสร็จสิ้น</option>
                <option value="CANCELLED">ยกเลิก</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shifts Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการผลัดงาน</CardTitle>
        </CardHeader>
        <CardContent>
          {shifts.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ไม่พบข้อมูลผลัดงาน</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อกะ</TableHead>
                  <TableHead>พนักงาน</TableHead>
                  <TableHead>เวลาเริ่ม</TableHead>
                  <TableHead>เวลาสิ้นสุด</TableHead>
                  <TableHead>ระยะเวลา</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ยอดขาย</TableHead>
                  <TableHead>หมายเหตุ</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell className="font-medium">{shift.name}</TableCell>
                    <TableCell>{shift.user.name || shift.user.username}</TableCell>
                    <TableCell>
                      {new Date(shift.startTime).toLocaleString('th-TH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      {shift.endTime 
                        ? new Date(shift.endTime).toLocaleString('th-TH', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'กำลังทำงาน'
                      }
                    </TableCell>
                    <TableCell>
                      {calculateWorkingHours(shift.startTime, shift.endTime)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getStatusColor(shift.status)
                      }`}>
                        {getStatusText(shift.status)}
                      </span>
                    </TableCell>
                    <TableCell>฿{shift.totalSales.toLocaleString()}</TableCell>
                    <TableCell className="max-w-32 truncate">{shift.notes || '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/shifts/${shift.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/shifts/${shift.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        {shift.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEndShift(shift.id, shift.name)}
                          >
                            จบกะ
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(shift.id, shift.name)}
                          disabled={deletingShift === shift.id || shift.status === 'ACTIVE'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                หน้า {page} จาก {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  ก่อนหน้า
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}