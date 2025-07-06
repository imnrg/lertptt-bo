'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'
import { 
  Search,
  Plus,
  Edit,
  Zap,
  CheckCircle,
  AlertTriangle,
  Trash2,
  BarChart3
} from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Dispenser {
  id: string
  name: string
  code: string
  tankId: string
  fuelTypeId: string
  isActive: boolean
  tank: {
    id: string
    name: string
    code: string
    currentLevel: number
    capacity: number
  }
  fuelType: {
    id: string
    name: string
    code: string
  }
}

interface Tank {
  id: string
  name: string
  code: string
  fuelTypeId: string
  isActive: boolean
  fuelType: {
    name: string
    code: string
  }
}

interface FuelType {
  id: string
  name: string
  code: string
  isActive: boolean
}

export default function DispensersPage() {
  const { alertState, loadingState, showAlert, showConfirm, showLoading, hideLoading, closeAlert } = useAlert()
  const [dispensers, setDispensers] = useState<Dispenser[]>([])
  const [tanks, setTanks] = useState<Tank[]>([])
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingDispenser, setEditingDispenser] = useState<Dispenser | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    tankId: '',
    fuelTypeId: '',
    isActive: true
  })

  useEffect(() => {
    fetchDispensers()
    fetchTanks()
    fetchFuelTypes()
  }, [])

  const fetchDispensers = async () => {
    try {
      const response = await fetch('/api/fuel/dispensers')
      if (response.ok) {
        const data = await response.json()
        setDispensers(data)
      }
    } catch (error) {
      console.error('Error fetching dispensers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTanks = async () => {
    try {
      const response = await fetch('/api/fuel/tanks')
      if (response.ok) {
        const data = await response.json()
        setTanks(data.filter((tank: Tank) => tank.isActive))
      }
    } catch (error) {
      console.error('Error fetching tanks:', error)
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

  const handleTankChange = (tankId: string) => {
    const selectedTank = tanks.find(tank => tank.id === tankId)
    setFormData({
      ...formData,
      tankId,
      fuelTypeId: selectedTank?.fuelTypeId || ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      showLoading(editingDispenser ? 'กำลังแก้ไขหัวจ่าย...' : 'กำลังเพิ่มหัวจ่าย...')
      
      const url = editingDispenser 
        ? `/api/fuel/dispensers/${editingDispenser.id}`
        : '/api/fuel/dispensers'
      
      const method = editingDispenser ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchDispensers()
        handleCloseForm()
        hideLoading()
        showAlert(editingDispenser ? 'แก้ไขหัวจ่ายสำเร็จ' : 'เพิ่มหัวจ่ายสำเร็จ', 'success')
      } else {
        const error = await response.json()
        hideLoading()
        showAlert(error.error || 'เกิดข้อผิดพลาด', 'error')
      }
    } catch (error) {
      console.error('Error saving dispenser:', error)
      hideLoading()
      showAlert('เกิดข้อผิดพลาด', 'error')
    }
  }

  const handleEdit = (dispenser: Dispenser) => {
    setEditingDispenser(dispenser)
    setFormData({
      name: dispenser.name,
      code: dispenser.code,
      tankId: dispenser.tankId,
      fuelTypeId: dispenser.fuelTypeId,
      isActive: dispenser.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (dispenser: Dispenser) => {
    showConfirm(
      `คุณต้องการลบหัวจ่าย "${dispenser.name}" หรือไม่?`,
      async () => {
        try {
          showLoading('กำลังลบหัวจ่าย...')
          
          const response = await fetch(`/api/fuel/dispensers/${dispenser.id}`, {
            method: 'DELETE',
          })

          if (response.ok) {
            await fetchDispensers()
            hideLoading()
            showAlert('ลบหัวจ่ายสำเร็จ', 'success')
          } else {
            const error = await response.json()
            hideLoading()
            showAlert(error.error || 'เกิดข้อผิดพลาด', 'error')
          }
        } catch (error) {
          console.error('Error deleting dispenser:', error)
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
    setEditingDispenser(null)
    setFormData({
      name: '',
      code: '',
      tankId: '',
      fuelTypeId: '',
      isActive: true
    })
  }

  // Filter dispensers based on search term
  const filteredDispensers = dispensers.filter(dispenser =>
    dispenser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispenser.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispenser.tank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispenser.fuelType.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate stats
  const activeDispensers = dispensers.filter(dispenser => dispenser.isActive).length
  const lowLevelTanks = dispensers.filter(dispenser => {
    const fillPercentage = (dispenser.tank.currentLevel / dispenser.tank.capacity) * 100
    return fillPercentage <= 20
  }).length

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">จัดการหัวจ่าย</h1>
            <p className="text-gray-600">จัดการหัวจ่ายเชื้อเพลิงและการเชื่อมต่อถัง</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={loadingState.isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มหัวจ่ายใหม่
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">หัวจ่ายทั้งหมด</p>
                <p className="text-2xl font-bold">{dispensers.length}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ใช้งานอยู่</p>
                <p className="text-2xl font-bold">{activeDispensers}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ถังระดับต่ำ</p>
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
                <p className="text-sm text-gray-600">ถังเชื่อมต่อ</p>
                <p className="text-2xl font-bold">{new Set(dispensers.map(d => d.tankId)).size}</p>
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
            ค้นหาหัวจ่าย
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="ค้นหาชื่อหัวจ่าย, รหัส, ถัง, หรือประเภทเชื้อเพลิง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Dispensers Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการหัวจ่าย</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDispensers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบหัวจ่ายที่ค้นหา</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อหัวจ่าย</TableHead>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ถังที่เชื่อมต่อ</TableHead>
                  <TableHead>ประเภทเชื้อเพลิง</TableHead>
                  <TableHead>ระดับน้ำมันในถัง</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDispensers.map((dispenser) => {
                  const fillPercentage = (dispenser.tank.currentLevel / dispenser.tank.capacity) * 100
                  const isLowLevel = fillPercentage <= 20
                  
                  return (
                    <TableRow key={dispenser.id}>
                      <TableCell className="font-medium">{dispenser.name}</TableCell>
                      <TableCell>{dispenser.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{dispenser.tank.name}</div>
                          <div className="text-sm text-gray-500">{dispenser.tank.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-blue-600">{dispenser.fuelType.name}</span>
                        <div className="text-xs text-gray-500">({dispenser.fuelType.code})</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={isLowLevel ? 'text-red-600 font-semibold' : ''}>
                              {dispenser.tank.currentLevel.toLocaleString()} ลิตร
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
                          <div className="text-xs text-gray-500">
                            ความจุ: {dispenser.tank.capacity.toLocaleString()} ลิตร
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            dispenser.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {dispenser.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                          </span>
                          {isLowLevel && (
                            <div>
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                ถังระดับต่ำ
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
                            onClick={() => handleEdit(dispenser)}
                            disabled={loadingState.isLoading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(dispenser)}
                            className="text-red-600 hover:text-red-700"
                            disabled={loadingState.isLoading}
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
                {editingDispenser ? 'แก้ไขหัวจ่าย' : 'เพิ่มหัวจ่ายใหม่'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อหัวจ่าย *
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="เช่น หัวจ่าย 1A"
                      required
                      disabled={loadingState.isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสหัวจ่าย *
                    </label>
                    <Input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="เช่น DISP_01_1"
                      required
                      disabled={loadingState.isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เลือกถัง *
                  </label>
                  <Select
                    value={formData.tankId}
                    onValueChange={handleTankChange}
                    disabled={loadingState.isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกถังที่จะเชื่อมต่อ" />
                    </SelectTrigger>
                    <SelectContent>
                      {tanks.map((tank) => (
                        <SelectItem key={tank.id} value={tank.id}>
                          {tank.name} ({tank.code}) - {tank.fuelType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ประเภทเชื้อเพลิง
                  </label>
                  <Select
                    value={formData.fuelTypeId}
                    onValueChange={(value: string) => setFormData({ ...formData, fuelTypeId: value })}
                    disabled={true}
                  >
                    <SelectTrigger className="bg-gray-50">
                      <SelectValue placeholder="จะอัปเดตอัตโนมัติตามถังที่เลือก" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypes.map((fuelType) => (
                        <SelectItem key={fuelType.id} value={fuelType.id}>
                          {fuelType.name} ({fuelType.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    ประเภทเชื้อเพลิงจะถูกกำหนดอัตโนมัติตามถังที่เลือก
                  </p>
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
                    {editingDispenser ? 'บันทึกการแก้ไข' : 'เพิ่มหัวจ่าย'}
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