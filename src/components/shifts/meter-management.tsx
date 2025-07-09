'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Gauge, Plus, Save, Calculator } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAlert } from '@/lib/use-alert'

interface FuelType {
  id: string
  name: string
  code: string
}

interface Tank {
  id: string
  name: string
  fuelType: FuelType
}

interface Dispenser {
  id: string
  name: string
  code: string
  fuelType: FuelType
  tank: Tank
}

interface MeterReading {
  id: string
  dispenserId: string
  startReading: number
  endReading: number | null
  testLiters: number
  usageLiters: number
  discount: number
  totalLiters: number | null
  totalAmount: number | null
  dispenser: Dispenser
}

interface MeterManagementProps {
  shiftId: string
  shiftStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
}

export default function MeterManagement({ shiftId, shiftStatus }: MeterManagementProps) {
  const { showAlert } = useAlert()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([])
  const [dispensers, setDispensers] = useState<Dispenser[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    dispenserId: '',
    startReading: 0,
    endReading: '',
    testLiters: 0,
    usageLiters: 0,
    discount: 0,
  })

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/shifts/${shiftId}/meters`)
      if (!response.ok) throw new Error('Failed to fetch meter data')
      
      const data = await response.json()
      setMeterReadings(data.meterReadings)
      setDispensers(data.dispensers)
    } catch (error) {
      console.error('Error fetching meter data:', error)
      showAlert('เกิดข้อผิดพลาดในการดึงข้อมูลมิเตอร์', 'error')
    } finally {
      setLoading(false)
    }
  }, [shiftId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEdit = (reading: MeterReading) => {
    setEditingId(reading.id)
    setFormData({
      dispenserId: reading.dispenserId,
      startReading: reading.startReading,
      endReading: reading.endReading?.toString() || '',
      testLiters: reading.testLiters,
      usageLiters: reading.usageLiters,
      discount: reading.discount,
    })
  }

  const handleAddNew = () => {
    setEditingId('new')
    setFormData({
      dispenserId: '',
      startReading: 0,
      endReading: '',
      testLiters: 0,
      usageLiters: 0,
      discount: 0,
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({
      dispenserId: '',
      startReading: 0,
      endReading: '',
      testLiters: 0,
      usageLiters: 0,
      discount: 0,
    })
  }

  const handleSave = async () => {
    if (!formData.dispenserId) {
      showAlert('กรุณาเลือกหัวจ่าย', 'error')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/shifts/${shiftId}/meters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dispenserId: formData.dispenserId,
          startReading: formData.startReading,
          endReading: formData.endReading ? parseFloat(formData.endReading) : null,
          testLiters: formData.testLiters,
          usageLiters: formData.usageLiters,
          discount: formData.discount,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save meter reading')
      }

      showAlert('บันทึกการอ่านมิเตอร์เรียบร้อยแล้ว', 'success')
      fetchData() // Refresh data
      handleCancel()
    } catch (error) {
      console.error('Error saving meter reading:', error)
      showAlert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึก', 'error')
    } finally {
      setSaving(false)
    }
  }

  const calculateTotalLiters = () => {
    if (!formData.endReading || !formData.startReading) return 0
    return parseFloat(formData.endReading) - formData.startReading - formData.testLiters - formData.usageLiters
  }

  const getAvailableDispensers = () => {
    const usedDispenserIds = meterReadings.map(r => r.dispenserId)
    return dispensers.filter(d => !usedDispenserIds.includes(d.id) || d.id === formData.dispenserId)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              จัดการมิเตอร์
            </div>
            {shiftStatus === 'ACTIVE' && (
              <Button onClick={handleAddNew} disabled={editingId !== null}>
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มการอ่านมิเตอร์
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            ระบุมิเตอร์เริ่มต้นและสิ้นสุดของแต่ละหัวจ่าย พร้อมทั้งลิตรที่ใช้ทดสอบและเบิกใช้งาน
          </p>

          {/* Add/Edit Form */}
          {editingId && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingId === 'new' ? 'เพิ่มการอ่านมิเตอร์ใหม่' : 'แก้ไขการอ่านมิเตอร์'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      หัวจ่าย *
                    </label>
                    <select
                      value={formData.dispenserId}
                      onChange={(e) => setFormData({ ...formData, dispenserId: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      disabled={editingId !== 'new'}
                    >
                      <option value="">เลือกหัวจ่าย</option>
                      {getAvailableDispensers().map((dispenser) => (
                        <option key={dispenser.id} value={dispenser.id}>
                          {dispenser.name} ({dispenser.fuelType.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      มิเตอร์เริ่มต้น (ลิตร) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.startReading}
                      onChange={(e) => setFormData({ ...formData, startReading: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      มิเตอร์สิ้นสุด (ลิตร)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.endReading}
                      onChange={(e) => setFormData({ ...formData, endReading: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ลิตรทดสอบ
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.testLiters}
                      onChange={(e) => setFormData({ ...formData, testLiters: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ลิตรเบิกใช้งาน
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.usageLiters}
                      onChange={(e) => setFormData({ ...formData, usageLiters: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ส่วนลด (บาท)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {formData.endReading && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">การคำนวณ</span>
                    </div>
                    <p className="text-sm text-green-700">
                      ปริมาณขายได้: {calculateTotalLiters().toLocaleString()} ลิตร
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    ยกเลิก
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meter Readings Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>หัวจ่าย</TableHead>
                  <TableHead>ประเภทเชื้อเพลิง</TableHead>
                  <TableHead>มิเตอร์เริ่มต้น</TableHead>
                  <TableHead>มิเตอร์สิ้นสุด</TableHead>
                  <TableHead>ลิตรทดสอบ</TableHead>
                  <TableHead>ลิตรเบิกใช้</TableHead>
                  <TableHead>ปริมาณขาย</TableHead>
                  <TableHead>ส่วนลด</TableHead>
                  <TableHead>จำนวนเงิน</TableHead>
                  {shiftStatus === 'ACTIVE' && <TableHead>การดำเนินการ</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {meterReadings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={shiftStatus === 'ACTIVE' ? 10 : 9} className="text-center py-8 text-gray-500">
                      ยังไม่มีข้อมูลการอ่านมิเตอร์
                    </TableCell>
                  </TableRow>
                ) : (
                  meterReadings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell className="font-medium">{reading.dispenser.name}</TableCell>
                      <TableCell>{reading.dispenser.fuelType.name}</TableCell>
                      <TableCell>{reading.startReading.toLocaleString()}</TableCell>
                      <TableCell>
                        {reading.endReading ? reading.endReading.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>{reading.testLiters.toLocaleString()}</TableCell>
                      <TableCell>{reading.usageLiters.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">
                        {reading.totalLiters ? `${reading.totalLiters.toLocaleString()} ลิตร` : '-'}
                      </TableCell>
                      <TableCell>
                        {reading.discount > 0 ? `฿${reading.discount.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {reading.totalAmount ? `฿${reading.totalAmount.toLocaleString()}` : '-'}
                      </TableCell>
                      {shiftStatus === 'ACTIVE' && (
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(reading)}
                            disabled={editingId !== null}
                          >
                            แก้ไข
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {meterReadings.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">สรุปยอดรวม</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">ปริมาณขายรวม:</span>
                  <span className="ml-2 font-semibold">
                    {meterReadings.reduce((sum, r) => sum + (r.totalLiters || 0), 0).toLocaleString()} ลิตร
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">ส่วนลดรวม:</span>
                  <span className="ml-2 font-semibold">
                    ฿{meterReadings.reduce((sum, r) => sum + r.discount, 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">จำนวนเงินรวม:</span>
                  <span className="ml-2 font-bold text-green-600">
                    ฿{meterReadings.reduce((sum, r) => sum + (r.totalAmount || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}