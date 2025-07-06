'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Clock, User } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAlert } from '@/lib/use-alert'

interface User {
  id: string
  name: string
  username: string
  email: string
}

export default function NewShiftPage() {
  const router = useRouter()
  const { showAlert } = useAlert()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    name: '',
    userId: '',
    startTime: '',
    endTime: '',
    totalSales: 0,
    notes: '',
    status: 'ACTIVE' as 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      showAlert('เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน', 'error')
    }
  }, [showAlert])

  useEffect(() => {
    fetchUsers()
    // Set default start time to current time
    const now = new Date()
    const currentDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setFormData(prev => ({ ...prev, startTime: currentDateTime }))
  }, [fetchUsers])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณาใส่ชื่อกะทำงาน'
    }
    if (!formData.userId) {
      newErrors.userId = 'กรุณาเลือกพนักงาน'
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
        userId: formData.userId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
        totalSales: formData.totalSales,
        notes: formData.notes || null,
        status: formData.status,
      }

      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create shift')
      }

      showAlert('สร้างผลัดงานเรียบร้อยแล้ว', 'success')
      router.push('/shifts')
    } catch (error) {
      console.error('Error creating shift:', error)
      showAlert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างผลัดงาน', 'error')
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
          <h1 className="text-2xl font-semibold text-gray-900">เพิ่มผลัดงานใหม่</h1>
          <p className="mt-2 text-sm text-gray-700">
            สร้างผลัดการทำงานใหม่สำหรับพนักงาน
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

              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  พนักงาน *
                </label>
                <div className={errors.userId ? 'border border-red-500 rounded-md' : ''}>
                  <Select
                    value={formData.userId}
                    onValueChange={(value) => handleInputChange('userId', value)}
                  >
                    <option value="">เลือกพนักงาน</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.username} ({user.username})
                      </option>
                    ))}
                  </Select>
                </div>
                {errors.userId && (
                  <p className="mt-1 text-sm text-red-600">{errors.userId}</p>
                )}
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
                  onValueChange={(value) => handleInputChange('status', value as 'ACTIVE' | 'COMPLETED' | 'CANCELLED')}
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
              <Button type="submit" disabled={loading} className="w-full">
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                สร้างผลัดงาน
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}