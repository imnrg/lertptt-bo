'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Fuel, Plus, Save, Calculator, TrendingUp, TrendingDown, Minus } from 'lucide-react'
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
  capacity: number
  fuelType: FuelType
}

interface TankReading {
  id: string
  tankId: string
  startLevel: number
  calculatedLevel: number | null
  actualLevel: number | null
  difference: number | null
  differencePercent: number | null
  tank: Tank
}

interface TankRefill {
  id: string
  tankId: string
  amount: number
  timestamp: string
  notes: string | null
  tank: Tank
}

interface TankComparisonProps {
  shiftId: string
  shiftStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
}

export default function TankComparison({ shiftId, shiftStatus }: TankComparisonProps) {
  const { showAlert } = useAlert()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tankReadings, setTankReadings] = useState<TankReading[]>([])
  const [tankRefills, setTankRefills] = useState<TankRefill[]>([])
  const [tanks, setTanks] = useState<Tank[]>([])
  const [usageByTank, setUsageByTank] = useState<Record<string, number>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showRefillForm, setShowRefillForm] = useState(false)
  const [formData, setFormData] = useState({
    tankId: '',
    startLevel: 0,
    actualLevel: '',
  })
  const [refillData, setRefillData] = useState({
    tankId: '',
    amount: 0,
    notes: '',
  })

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/shifts/${shiftId}/tanks`)
      if (!response.ok) throw new Error('Failed to fetch tank data')
      
      const data = await response.json()
      setTankReadings(data.tankReadings)
      setTankRefills(data.tankRefills)
      setTanks(data.tanks)
      setUsageByTank(data.usageByTank)
    } catch (error) {
      console.error('Error fetching tank data:', error)
      showAlert('เกิดข้อผิดพลาดในการดึงข้อมูลถัง', 'error')
    } finally {
      setLoading(false)
    }
  }, [shiftId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEdit = (reading: TankReading) => {
    setEditingId(reading.id)
    setFormData({
      tankId: reading.tankId,
      startLevel: reading.startLevel,
      actualLevel: reading.actualLevel?.toString() || '',
    })
  }

  const handleAddNew = () => {
    setEditingId('new')
    setFormData({
      tankId: '',
      startLevel: 0,
      actualLevel: '',
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setShowRefillForm(false)
    setFormData({
      tankId: '',
      startLevel: 0,
      actualLevel: '',
    })
    setRefillData({
      tankId: '',
      amount: 0,
      notes: '',
    })
  }

  const handleSave = async () => {
    if (!formData.tankId) {
      showAlert('กรุณาเลือกถัง', 'error')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/shifts/${shiftId}/tanks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tankId: formData.tankId,
          startLevel: formData.startLevel,
          actualLevel: formData.actualLevel ? parseFloat(formData.actualLevel) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save tank reading')
      }

      showAlert('บันทึกการอ่านถังเรียบร้อยแล้ว', 'success')
      fetchData() // Refresh data
      handleCancel()
    } catch (error) {
      console.error('Error saving tank reading:', error)
      showAlert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึก', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveRefill = async () => {
    if (!refillData.tankId || refillData.amount <= 0) {
      showAlert('กรุณาเลือกถังและระบุปริมาณที่เติม', 'error')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/shifts/${shiftId}/tanks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'refill',
          tankId: refillData.tankId,
          amount: refillData.amount,
          notes: refillData.notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save tank refill')
      }

      showAlert('บันทึกการเติมถังเรียบร้อยแล้ว', 'success')
      fetchData() // Refresh data
      handleCancel()
    } catch (error) {
      console.error('Error saving tank refill:', error)
      showAlert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึก', 'error')
    } finally {
      setSaving(false)
    }
  }

  const calculateExpectedLevel = (tankId: string, startLevel: number) => {
    const usage = usageByTank[tankId] || 0
    const refills = tankRefills
      .filter(r => r.tankId === tankId)
      .reduce((sum, r) => sum + r.amount, 0)
    return startLevel + refills - usage
  }

  const getAvailableTanks = () => {
    const usedTankIds = tankReadings.map(r => r.tankId)
    return tanks.filter(t => !usedTankIds.includes(t.id) || t.id === formData.tankId)
  }

  const getDifferenceColor = (difference: number | null) => {
    if (!difference) return 'text-gray-500'
    if (Math.abs(difference) <= 5) return 'text-green-600'
    if (Math.abs(difference) <= 20) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDifferenceIcon = (difference: number | null) => {
    if (!difference) return null
    if (difference > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (difference < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-500" />
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
              <Fuel className="h-5 w-5" />
              เปรียบเทียบถัง
            </div>
            {shiftStatus === 'ACTIVE' && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowRefillForm(true)} 
                  disabled={editingId !== null || showRefillForm}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  เติมถัง
                </Button>
                <Button onClick={handleAddNew} disabled={editingId !== null || showRefillForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มการอ่านถัง
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            วัดปริมาณน้ำมันในถังก่อนและหลังผลัดงาน เพื่อเปรียบเทียบกับปริมาณที่ขาย
          </p>

          {/* Tank Refill Form */}
          {showRefillForm && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg">เติมถังระหว่างผลัด</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      เลือกถัง *
                    </label>
                    <select
                      value={refillData.tankId}
                      onChange={(e) => setRefillData({ ...refillData, tankId: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">เลือกถัง</option>
                      {tanks.map((tank) => (
                        <option key={tank.id} value={tank.id}>
                          {tank.name} ({tank.fuelType.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ปริมาณที่เติม (ลิตร) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={refillData.amount}
                      onChange={(e) => setRefillData({ ...refillData, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      หมายเหตุ
                    </label>
                    <Input
                      value={refillData.notes}
                      onChange={(e) => setRefillData({ ...refillData, notes: e.target.value })}
                      placeholder="หมายเหตุการเติม (ถ้ามี)"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <Button onClick={handleSaveRefill} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'กำลังบันทึก...' : 'บันทึกการเติม'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    ยกเลิก
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tank Reading Form */}
          {editingId && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingId === 'new' ? 'เพิ่มการอ่านถังใหม่' : 'แก้ไขการอ่านถัง'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      เลือกถัง *
                    </label>
                    <select
                      value={formData.tankId}
                      onChange={(e) => setFormData({ ...formData, tankId: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      disabled={editingId !== 'new'}
                    >
                      <option value="">เลือกถัง</option>
                      {getAvailableTanks().map((tank) => (
                        <option key={tank.id} value={tank.id}>
                          {tank.name} ({tank.fuelType.name}) - ความจุ {tank.capacity.toLocaleString()} ลิตร
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ปริมาณเริ่มต้น (ลิตร) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.startLevel}
                      onChange={(e) => setFormData({ ...formData, startLevel: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ปริมาณที่วัดได้จริง (ลิตร)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.actualLevel}
                      onChange={(e) => setFormData({ ...formData, actualLevel: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {formData.tankId && formData.actualLevel && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">การคำนวณ</span>
                    </div>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>ปริมาณที่คาดว่าจะเหลือ: {calculateExpectedLevel(formData.tankId, formData.startLevel).toLocaleString()} ลิตร</p>
                      <p>ปริมาณที่วัดได้จริง: {parseFloat(formData.actualLevel).toLocaleString()} ลิตร</p>
                      <p>ส่วนต่าง: {(parseFloat(formData.actualLevel) - calculateExpectedLevel(formData.tankId, formData.startLevel)).toLocaleString()} ลิตร</p>
                    </div>
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

          {/* Tank Refills History */}
          {tankRefills.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">ประวัติการเติมถัง</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>เวลา</TableHead>
                        <TableHead>ถัง</TableHead>
                        <TableHead>ประเภทเชื้อเพลิง</TableHead>
                        <TableHead>ปริมาณ</TableHead>
                        <TableHead>หมายเหตุ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tankRefills.map((refill) => (
                        <TableRow key={refill.id}>
                          <TableCell>
                            {new Date(refill.timestamp).toLocaleString('th-TH', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell className="font-medium">{refill.tank.name}</TableCell>
                          <TableCell>{refill.tank.fuelType.name}</TableCell>
                          <TableCell className="font-semibold text-blue-600">
                            +{refill.amount.toLocaleString()} ลิตร
                          </TableCell>
                          <TableCell>{refill.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tank Readings Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ถัง</TableHead>
                  <TableHead>ประเภทเชื้อเพลิง</TableHead>
                  <TableHead>ปริมาณเริ่มต้น</TableHead>
                  <TableHead>ปริมาณที่ใช้</TableHead>
                  <TableHead>การเติม</TableHead>
                  <TableHead>คาดว่าจะเหลือ</TableHead>
                  <TableHead>วัดได้จริง</TableHead>
                  <TableHead>ส่วนต่าง</TableHead>
                  <TableHead>%</TableHead>
                  {shiftStatus === 'ACTIVE' && <TableHead>การดำเนินการ</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tankReadings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={shiftStatus === 'ACTIVE' ? 10 : 9} className="text-center py-8 text-gray-500">
                      ยังไม่มีข้อมูลการอ่านถัง
                    </TableCell>
                  </TableRow>
                ) : (
                  tankReadings.map((reading) => {
                    const usage = usageByTank[reading.tankId] || 0
                    const refills = tankRefills
                      .filter(r => r.tankId === reading.tankId)
                      .reduce((sum, r) => sum + r.amount, 0)
                    
                    return (
                      <TableRow key={reading.id}>
                        <TableCell className="font-medium">{reading.tank.name}</TableCell>
                        <TableCell>{reading.tank.fuelType.name}</TableCell>
                        <TableCell>{reading.startLevel.toLocaleString()}</TableCell>
                        <TableCell className="text-red-600">
                          -{usage.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          {refills > 0 ? `+${refills.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          {reading.calculatedLevel ? reading.calculatedLevel.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          {reading.actualLevel ? reading.actualLevel.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className={`font-medium ${getDifferenceColor(reading.difference)}`}>
                          <div className="flex items-center gap-1">
                            {getDifferenceIcon(reading.difference)}
                            {reading.difference ? reading.difference.toLocaleString() : '-'}
                          </div>
                        </TableCell>
                        <TableCell className={getDifferenceColor(reading.differencePercent)}>
                          {reading.differencePercent ? `${reading.differencePercent.toFixed(2)}%` : '-'}
                        </TableCell>
                        {shiftStatus === 'ACTIVE' && (
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(reading)}
                              disabled={editingId !== null || showRefillForm}
                            >
                              แก้ไข
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {tankReadings.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">สรุปผล</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">จำนวนถังที่ตรวจสอบ:</span>
                  <span className="ml-2 font-semibold">{tankReadings.length} ถัง</span>
                </div>
                <div>
                  <span className="text-gray-500">ส่วนต่างรวม:</span>
                  <span className="ml-2 font-semibold">
                    {tankReadings.reduce((sum, r) => sum + (r.difference || 0), 0).toLocaleString()} ลิตร
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