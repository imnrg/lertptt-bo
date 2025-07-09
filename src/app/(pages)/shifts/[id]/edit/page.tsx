'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Save, Clock } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAlert } from '@/lib/use-alert'

type ShiftStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

interface User {
  id: string
  name: string
  username: string
  email: string
}

interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string | null
  user: User
  status: ShiftStatus
  totalSales: number
  notes: string | null
}

export default function EditShiftPage() {
  const router = useRouter()
  const params = useParams()
  const { showAlert } = useAlert()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [shift, setShift] = useState<Shift | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    totalSales: 0,
    notes: '',
    status: 'ACTIVE' as ShiftStatus,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchShift = useCallback(async () => {
    try {
      const response = await fetch(`/api/shifts/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch shift')
      
      const shiftData: Shift = await response.json()
      setShift(shiftData)
      
      // Format datetime for input fields
      const formatDateTime = (dateString: string) => {
        const date = new Date(dateString)
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      }

      setFormData({
        name: shiftData.name,
        startTime: formatDateTime(shiftData.startTime),
        endTime: shiftData.endTime ? formatDateTime(shiftData.endTime) : '',
        totalSales: shiftData.totalSales,
        notes: shiftData.notes || '',
        status: shiftData.status,
      })
    } catch (error) {
      console.error('Error fetching shift:', error)
      showAlert('เกิดข้อผิดพลาดในการดึงข้อมูลผลัดงาน', 'error')
    } finally {
      setInitialLoading(false)
    }
  }, [params.id, showAlert])

  useEffect(() => {
    if (params.id) {
      fetchShift()
    }
  }, [params.id, fetchShift])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณาใส่ชื่อกะทำงาน'
    }
    if (!formData.startTime) {
      newErrors.startTime = 'กรุณาเลือกเวลาเริ่มงาน'
    }
    if (formData.endTime && formData.startTime && new Date(formData.endTime) <= new Date(formData.startTime)) {
      newErrors.endTime = 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มงาน'
    }
    if (formData.totalSales < 0) {
      newErrors.totalSales = 'ยอดขายต้องไม่ติดลบ'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      
      const submitData = {
        name: formData.name,
        userId: shift?.user.id, // ใช้ userId จากข้อมูลผลัดงานเดิม
        startTime: new Date(formData.startTime).toISOString(),
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
        totalSales: formData.totalSales,
        notes: formData.notes || null,
        status: formData.status,
      }

      const response = await fetch(`/api/shifts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update shift')
      }

      showAlert('อัปเดตผลัดงานเรียบร้อยแล้ว', 'success')
      router.push('/shifts')
    } catch (error) {
      console.error('Error updating shift:', error)
      showAlert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปเดตผลัดงาน', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (!shift) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">ไม่พบข้อมูลผลัดงาน</p>
        <Button asChild className="mt-4">
          <Link href="/shifts">กลับไปหน้ารายการ</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/shifts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">แก้ไขผลัดงาน</h1>
          <p className="mt-2 text-sm text-gray-700">
            แก้ไขข้อมูลผลัดการทำงาน: {shift.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            ข้อมูลผลัดงาน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shift Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อกะทำงาน *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="เช่น กะเช้า, กะบ่าย, กะดึก"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* User Display (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  พนักงาน
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  <span className="text-gray-900">{shift.user.name || shift.user.username}</span>
                  <span className="text-gray-500 ml-2">({shift.user.username})</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  ไม่สามารถเปลี่ยนพนักงานได้
                </p>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เวลาเริ่มงาน *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className={errors.startTime ? 'border-red-500' : ''}
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                )}
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เวลาสิ้นสุดงาน
                </label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={errors.endTime ? 'border-red-500' : ''}
                />
                <p className="mt-1 text-sm text-gray-500">
                  ปล่อยว่างหากยังไม่ทราบเวลาสิ้นสุด
                </p>
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะ
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value as ShiftStatus)}
                >
                  <option value="ACTIVE">กำลังทำงาน</option>
                  <option value="COMPLETED">เสร็จสิ้น</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </Select>
              </div>

              {/* Total Sales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ยอดขาย (บาท)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalSales}
                  onChange={(e) => handleInputChange('totalSales', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={errors.totalSales ? 'border-red-500' : ''}
                />
                {errors.totalSales && (
                  <p className="mt-1 text-sm text-red-600">{errors.totalSales}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเหตุ
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="หมายเหตุเพิ่มเติม..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" asChild disabled={loading}>
                <Link href="/shifts">ยกเลิก</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    บันทึกการเปลี่ยนแปลง
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}