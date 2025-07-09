'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Edit, Trash2, Clock, User, DollarSign, FileText, Gauge, Fuel, ShoppingCart, Settings } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAlert } from '@/lib/use-alert'
import MeterManagement from '@/components/shifts/meter-management'
import TankComparison from '@/components/shifts/tank-comparison'
import SalesManagement from '@/components/shifts/sales-management'

interface FuelType {
  id: string
  name: string
  code: string
}

interface ShiftFuelPrice {
  id: string
  fuelTypeId: string
  price: number
  fuelType: FuelType
}

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
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  totalSales: number
  cashSales: number
  creditSales: number
  notes: string | null
  createdAt: string
  updatedAt: string
  shiftPrices: ShiftFuelPrice[]
  _count: {
    meterReadings: number
    tankReadings: number
    sales: number
  }
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
  return `${hours} ชั่วโมง ${minutes} นาที`
}

export default function ViewShiftPage() {
  const router = useRouter()
  const params = useParams()
  const { showAlert } = useAlert()
  const [loading, setLoading] = useState(true)
  const [shift, setShift] = useState<Shift | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchShift = useCallback(async () => {
    try {
      const response = await fetch(`/api/shifts/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch shift')
      
      const shiftData: Shift = await response.json()
      setShift(shiftData)
    } catch (error) {
      console.error('Error fetching shift:', error)
      showAlert('เกิดข้อผิดพลาดในการดึงข้อมูลผลัดงาน', 'error')
    } finally {
      setLoading(false)
    }
  }, [params.id, showAlert])

  useEffect(() => {
    if (params.id) {
      fetchShift()
    }
  }, [params.id, fetchShift])

  const handleDelete = async () => {
    if (!shift) return
    
    if (!confirm(`คุณต้องการลบผลัดงาน "${shift.name}" หรือไม่?`)) {
      return
    }

    try {
      setDeleting(true)
      const response = await fetch(`/api/shifts/${shift.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete shift')
      }

      showAlert('ลบผลัดงานเรียบร้อยแล้ว', 'success')
      router.push('/shifts')
    } catch (error) {
      console.error('Error deleting shift:', error)
      showAlert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบผลัดงาน', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleEndShift = async () => {
    if (!shift) return
    
    if (!confirm(`คุณต้องการจบผลัดงาน "${shift.name}" หรือไม่?`)) {
      return
    }

    try {
      const response = await fetch(`/api/shifts/${shift.id}/end`, {
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
      fetchShift() // Refresh data
    } catch (error) {
      console.error('Error ending shift:', error)
      showAlert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการจบผลัดงาน', 'error')
    }
  }

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/shifts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับ
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{shift.name}</h1>
            <p className="mt-2 text-sm text-gray-700">
              รายละเอียดผลัดการทำงาน
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {shift.status === 'ACTIVE' && (
            <Button onClick={handleEndShift}>
              <Clock className="mr-2 h-4 w-4" />
              จบกะ
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/shifts/${shift.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              แก้ไข
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleting || shift.status === 'ACTIVE'}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            ลบ
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
          getStatusColor(shift.status)
        }`}>
          {getStatusText(shift.status)}
        </span>
        {shift.status === 'ACTIVE' && (
          <span className="text-sm text-gray-500">
            • กำลังทำงานมาแล้ว {calculateWorkingHours(shift.startTime, shift.endTime)}
          </span>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger value="meters" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            จัดการมิเตอร์
            {shift._count.meterReadings > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                {shift._count.meterReadings}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tanks" className="flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            เปรียบเทียบถัง
            {shift._count.tankReadings > 0 && (
              <span className="ml-1 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                {shift._count.tankReadings}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            จัดการการขาย
            {shift._count.sales > 0 && (
              <span className="ml-1 bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">
                {shift._count.sales}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  ข้อมูลพื้นฐาน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ชื่อกะทำงาน</label>
                  <p className="text-gray-900 font-medium">{shift.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">เวลาเริ่มงาน</label>
                  <p className="text-gray-900">
                    {new Date(shift.startTime).toLocaleString('th-TH', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">เวลาสิ้นสุดงาน</label>
                  <p className="text-gray-900">
                    {shift.endTime 
                      ? new Date(shift.endTime).toLocaleString('th-TH', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'ยังไม่ได้จบกะ'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ระยะเวลาทำงาน</label>
                  <p className="text-gray-900">
                    {calculateWorkingHours(shift.startTime, shift.endTime)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Employee Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  ข้อมูลพนักงาน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ชื่อ-นามสกุล</label>
                  <p className="text-gray-900 font-medium">{shift.user.name || 'ไม่ระบุ'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ชื่อผู้ใช้</label>
                  <p className="text-gray-900">{shift.user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">อีเมล</label>
                  <p className="text-gray-900">{shift.user.email || 'ไม่ระบุ'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Sales Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  ข้อมูลยอดขาย
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ยอดขายรวม</label>
                  <p className="text-3xl font-bold text-green-600">
                    ฿{shift.totalSales.toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">ขายเงินสด</label>
                    <p className="text-xl font-semibold text-blue-600">
                      ฿{shift.cashSales.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ขายเครดิต</label>
                    <p className="text-xl font-semibold text-orange-600">
                      ฿{shift.creditSales.toLocaleString()}
                    </p>
                  </div>
                </div>
                {shift.endTime && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">ยอดขายต่อชั่วโมง</label>
                    <p className="text-gray-900">
                      ฿{(shift.totalSales / (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) * (1000 * 60 * 60)).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fuel Prices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  ราคาเชื้อเพลิงในผลัดงาน
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shift.shiftPrices.length > 0 ? (
                  <div className="space-y-2">
                    {shift.shiftPrices.map((price) => (
                      <div key={price.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <span className="font-medium">{price.fuelType.name}</span>
                        <span className="text-lg font-semibold text-green-600">
                          ฿{price.price.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">ไม่มีข้อมูลราคาเชื้อเพลิง</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes & Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                หมายเหตุและข้อมูลเพิ่มเติม
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">หมายเหตุ</label>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {shift.notes || 'ไม่มีหมายเหตุ'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">วันที่สร้าง</label>
                  <p className="text-gray-900">
                    {new Date(shift.createdAt).toLocaleString('th-TH', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">อัปเดตล่าสุด</label>
                  <p className="text-gray-900">
                    {new Date(shift.updatedAt).toLocaleString('th-TH', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meter Management Tab */}
        <TabsContent value="meters">
          <MeterManagement shiftId={shift.id} shiftStatus={shift.status} />
        </TabsContent>

        {/* Tank Comparison Tab */}
        <TabsContent value="tanks">
          <TankComparison shiftId={shift.id} shiftStatus={shift.status} />
        </TabsContent>

        {/* Sales Management Tab */}
        <TabsContent value="sales">
          <SalesManagement shiftId={shift.id} shiftStatus={shift.status} />
        </TabsContent>
      </Tabs>
    </div>
  )
}