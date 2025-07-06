'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'
import { handleNumericInputChange, safeNumberConversion } from '@/lib/utils'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Fuel, 
  Search,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Tank {
  id: string
  name: string
  code: string
  capacity: number
  currentLevel: number
  minLevel: number
  fuelTypeId: string
  isActive: boolean
  location?: string
  fuelType: {
    id: string
    name: string
    code: string
  }
  dispensers: Array<{
    id: string
    name: string
    code: string
    isActive: boolean
  }>
  _count: {
    dispensers: number
  }
}

interface FuelType {
  id: string
  name: string
  code: string
  isActive: boolean
}

export default function TanksPage() {
  const { alertState, loadingState, showAlert, showConfirm, showLoading, hideLoading, closeAlert } = useAlert()
  const [tanks, setTanks] = useState<Tank[]>([])
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTank, setEditingTank] = useState<Tank | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    capacity: '',
    currentLevel: '',
    minLevel: '',
    fuelTypeId: '',
    isActive: true
  })

  useEffect(() => {
    fetchTanks()
    fetchFuelTypes()
  }, [])

  const fetchTanks = async () => {
    try {
      const response = await fetch('/api/fuel/tanks')
      if (response.ok) {
        const data = await response.json()
        setTanks(data)
      }
    } catch (error) {
      console.error('Error fetching tanks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFuelTypes = async () => {
    try {
      const response = await fetch('/api/fuel/types')
      if (response.ok) {
        const data = await response.json()
        setFuelTypes(data.filter((ft: FuelType) => ft.isActive))
      }
    } catch (error) {
      console.error('Error fetching fuel types:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      showLoading(editingTank ? 'กำลังแก้ไขถัง...' : 'กำลังเพิ่มถัง...')
      
      const url = editingTank 
        ? `/api/fuel/tanks/${editingTank.id}`
        : '/api/fuel/tanks'
      
      const method = editingTank ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          capacity: safeNumberConversion(formData.capacity),
          currentLevel: safeNumberConversion(formData.currentLevel),
          minLevel: safeNumberConversion(formData.minLevel),
          fuelTypeId: formData.fuelTypeId,
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        await fetchTanks()
        handleCloseForm()
        hideLoading()
        showAlert(editingTank ? 'แก้ไขถังสำเร็จ' : 'เพิ่มถังสำเร็จ', 'success')
      } else {
        const error = await response.json()
        hideLoading()
        showAlert(error.error || 'เกิดข้อผิดพลาด', 'error')
      }
    } catch (error) {
      console.error('Error saving tank:', error)
      hideLoading()
      showAlert('เกิดข้อผิดพลาด', 'error')
    }
  }

  const handleEdit = (tank: Tank) => {
    setEditingTank(tank)
    setFormData({
      name: tank.name,
      code: tank.code,
      capacity: tank.capacity.toString(),
      currentLevel: tank.currentLevel.toString(),
      minLevel: tank.minLevel.toString(),
      fuelTypeId: tank.fuelTypeId,
      isActive: tank.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (tank: Tank) => {
    showConfirm(
      `คุณต้องการลบถัง "${tank.name}" หรือไม่?`,
      async () => {
        try {
          showLoading('กำลังลบถัง...')
          
          const response = await fetch(`/api/fuel/tanks/${tank.id}`, {
            method: 'DELETE',
          })

          if (response.ok) {
            await fetchTanks()
            hideLoading()
            showAlert('ลบถังสำเร็จ', 'success')
          } else {
            const error = await response.json()
            hideLoading()
            showAlert(error.error || 'เกิดข้อผิดพลาด', 'error')
          }
        } catch (error) {
          console.error('Error deleting tank:', error)
          hideLoading()
          showAlert('เกิดข้อผิดพลาด', 'error')
        }
      },
      'ยืนยันการลบ',
      'ลบ',
      'ยกเลิก'
    )
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingTank(null)
    setFormData({
      name: '',
      code: '',
      capacity: '',
      currentLevel: '',
      minLevel: '',
      fuelTypeId: '',
      isActive: true
    })
  }

  const handleCapacityChange = (value: string) => {
    handleNumericInputChange(value, (formattedValue) => {
      setFormData({ ...formData, capacity: formattedValue })
    }, {
      allowNegative: false,
      decimalPlaces: 0,
      minValue: 0,
      maxValue: 999999
    })
  }

  const handleCurrentLevelChange = (value: string) => {
    handleNumericInputChange(value, (formattedValue) => {
      setFormData({ ...formData, currentLevel: formattedValue })
    }, {
      allowNegative: false,
      decimalPlaces: 0,
      minValue: 0,
      maxValue: safeNumberConversion(formData.capacity) || 999999
    })
  }

  const handleMinLevelChange = (value: string) => {
    handleNumericInputChange(value, (formattedValue) => {
      setFormData({ ...formData, minLevel: formattedValue })
    }, {
      allowNegative: false,
      decimalPlaces: 0,
      minValue: 0,
      maxValue: safeNumberConversion(formData.capacity) || 999999
    })
  }

  const calculateFillPercentage = (current: number, capacity: number) => {
    return (current / capacity) * 100
  }

  // Filter tanks based on search term
  const filteredTanks = tanks.filter(tank =>
    tank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tank.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tank.fuelType.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate stats
  const activeTanks = tanks.filter(tank => tank.isActive).length
  const lowLevelTanks = tanks.filter(tank => tank.currentLevel <= tank.minLevel).length
  const totalCapacity = tanks.reduce((sum, tank) => sum + tank.capacity, 0)
  const totalCurrentLevel = tanks.reduce((sum, tank) => sum + tank.currentLevel, 0)

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Fuel className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p>กำลังโหลดข้อมูลถัง...</p>
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
            <h1 className="text-2xl font-bold">จัดการถังเก็บน้ำมัน</h1>
            <p className="text-gray-600">จัดการถังเก็บเชื้อเพลิงและตรวจสอบระดับน้ำมัน</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={loadingState.isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มถังใหม่
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ถังทั้งหมด</p>
                <p className="text-2xl font-bold">{tanks.length}</p>
              </div>
              <Fuel className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ใช้งานอยู่</p>
                <p className="text-2xl font-bold">{activeTanks}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ระดับต่ำ</p>
                <p className="text-2xl font-bold text-red-600">{lowLevelTanks}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ความจุรวม</p>
                <p className="text-2xl font-bold">{(totalCapacity / 1000).toFixed(0)}K ลิตร</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            ค้นหาถัง
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="ค้นหาชื่อถัง, รหัสถัง, หรือประเภทเชื้อเพลิง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Tanks Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการถังเก็บน้ำมัน</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTanks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Fuel className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบถังที่ค้นหา</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อถัง</TableHead>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ประเภทเชื้อเพลิง</TableHead>
                  <TableHead>ความจุ</TableHead>
                  <TableHead>ระดับปัจจุบัน</TableHead>
                  <TableHead>ระดับขั้นต่ำ</TableHead>
                  <TableHead>หัวจ่าย</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTanks.map((tank: Tank) => {
                  const fillPercentage = calculateFillPercentage(tank.currentLevel, tank.capacity)
                  const isLowLevel = tank.currentLevel <= tank.minLevel
                  
                  return (
                    <TableRow key={tank.id} className={isLowLevel ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{tank.name}</TableCell>
                      <TableCell>{tank.code}</TableCell>
                      <TableCell>
                        <span className="text-blue-600">{tank.fuelType.name}</span>
                        <div className="text-xs text-gray-500">({tank.fuelType.code})</div>
                      </TableCell>
                      <TableCell>{tank.capacity.toLocaleString()} ลิตร</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={isLowLevel ? 'text-red-600 font-semibold' : ''}>
                              {tank.currentLevel.toLocaleString()} ลิตร
                            </span>
                            <span className="text-xs text-gray-500">
                              ({fillPercentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                isLowLevel ? 'bg-red-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={isLowLevel ? 'text-red-600 font-semibold' : ''}>
                          {tank.minLevel.toLocaleString()} ลิตร
                        </span>
                      </TableCell>
                      <TableCell>{tank._count.dispensers} ตัว</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            tank.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {tank.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                          </span>
                          {isLowLevel && (
                            <div>
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                ระดับต่ำ
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(tank)}
                            disabled={loadingState.isLoading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(tank)}
                            className="text-red-600 hover:text-red-700"
                            disabled={loadingState.isLoading || tank._count.dispensers > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>
                {editingTank ? 'แก้ไขถัง' : 'เพิ่มถังใหม่'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อถัง *
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="เช่น ถังที่ 1"
                      required
                      disabled={loadingState.isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสถัง *
                    </label>
                    <Input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="เช่น TANK_01"
                      required
                      disabled={loadingState.isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ประเภทเชื้อเพลิง *
                  </label>
                  <Select
                    value={formData.fuelTypeId}
                    onValueChange={(value: string) => setFormData({ ...formData, fuelTypeId: value })}
                    disabled={loadingState.isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภทเชื้อเพลิง" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypes.map((fuelType) => (
                        <SelectItem key={fuelType.id} value={fuelType.id}>
                          {fuelType.name} ({fuelType.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ความจุ (ลิตร) *
                    </label>
                    <Input
                      type="text"
                      value={formData.capacity}
                      onChange={(e) => handleCapacityChange(e.target.value)}
                      placeholder="50000"
                      required
                      disabled={loadingState.isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ระดับปัจจุบัน (ลิตร) *
                    </label>
                    <Input
                      type="text"
                      value={formData.currentLevel}
                      onChange={(e) => handleCurrentLevelChange(e.target.value)}
                      placeholder="25000"
                      required
                      disabled={loadingState.isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ระดับขั้นต่ำ (ลิตร) *
                    </label>
                    <Input
                      type="text"
                      value={formData.minLevel}
                      onChange={(e) => handleMinLevelChange(e.target.value)}
                      placeholder="5000"
                      required
                      disabled={loadingState.isLoading}
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                    disabled={loadingState.isLoading}
                  />
                  <label className="text-sm font-medium text-gray-700">
                    เปิดใช้งาน
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={loadingState.isLoading}>
                    {editingTank ? 'บันทึกการแก้ไข' : 'เพิ่มถัง'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseForm}
                    className="flex-1"
                    disabled={loadingState.isLoading}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alert Modal */}
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

      {/* Loading Modal */}
      <LoadingModal loadingState={loadingState} />
    </div>
  )
}