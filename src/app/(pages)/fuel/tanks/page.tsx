'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertModal } from '@/components/ui/alert-modal'
import { useAlert } from '@/lib/use-alert'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface Tank {
  id: string
  name: string
  code: string
  capacity: number
  currentLevel: number
  minLevel: number
  maxLevel?: number
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
  const { alertState, showAlert, showConfirm, closeAlert } = useAlert()
  const [tanks, setTanks] = useState<Tank[]>([])
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTank, setEditingTank] = useState<Tank | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    capacity: 0,
    currentLevel: 0,
    minLevel: 0,
    maxLevel: 0,
    fuelTypeId: '',
    location: '',
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
          ...formData,
          capacity: Number(formData.capacity),
          currentLevel: Number(formData.currentLevel),
          minLevel: Number(formData.minLevel),
          maxLevel: formData.maxLevel ? Number(formData.maxLevel) : undefined,
        }),
      })

      if (response.ok) {
        await fetchTanks()
        handleCloseForm()
        showAlert(editingTank ? 'แก้ไขถังสำเร็จ' : 'เพิ่มถังสำเร็จ', 'success')
      } else {
        const error = await response.json()
        showAlert(error.error || 'เกิดข้อผิดพลาด', 'error')
      }
    } catch (error) {
      console.error('Error saving tank:', error)
      showAlert('เกิดข้อผิดพลาด', 'error')
    }
  }

  const handleEdit = (tank: Tank) => {
    setEditingTank(tank)
    setFormData({
      name: tank.name,
      code: tank.code,
      capacity: tank.capacity,
      currentLevel: tank.currentLevel,
      minLevel: tank.minLevel,
      maxLevel: tank.maxLevel || 0,
      fuelTypeId: tank.fuelTypeId,
      location: tank.location || '',
      isActive: tank.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (tank: Tank) => {
    showConfirm(
      `คุณต้องการลบถัง "${tank.name}" หรือไม่?`,
      async () => {
        try {
          const response = await fetch(`/api/fuel/tanks/${tank.id}`, {
            method: 'DELETE',
          })

          if (response.ok) {
            await fetchTanks()
            showAlert('ลบถังสำเร็จ', 'success')
          } else {
            const error = await response.json()
            showAlert(error.error || 'เกิดข้อผิดพลาด', 'error')
          }
        } catch (error) {
          console.error('Error deleting tank:', error)
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
      capacity: 0,
      currentLevel: 0,
      minLevel: 0,
      maxLevel: 0,
      fuelTypeId: '',
      location: '',
      isActive: true
    })
  }

  const calculateFillPercentage = (current: number, capacity: number) => {
    return (current / capacity) * 100
  }

  if (loading) {
    return <div className="p-6">กำลังโหลด...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">จัดการถังเก็บน้ำมัน</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มถัง
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTank ? 'แก้ไขถัง' : 'เพิ่มถัง'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ชื่อถัง</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น ถังที่ 1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">รหัสถัง</label>
                  <Input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="เช่น TANK_01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ประเภทเชื้อเพลิง</label>
                <Select
                  value={formData.fuelTypeId}
                  onValueChange={(value: string) => setFormData({ ...formData, fuelTypeId: value })}
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
                  <label className="block text-sm font-medium mb-1">ความจุ (ลิตร)</label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    placeholder="50000"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ระดับปัจจุบัน (ลิตร)</label>
                  <Input
                    type="number"
                    value={formData.currentLevel}
                    onChange={(e) => setFormData({ ...formData, currentLevel: Number(e.target.value) })}
                    placeholder="25000"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ระดับขั้นต่ำ (ลิตร)</label>
                  <Input
                    type="number"
                    value={formData.minLevel}
                    onChange={(e) => setFormData({ ...formData, minLevel: Number(e.target.value) })}
                    placeholder="5000"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ระดับสูงสุด (ลิตร)</label>
                  <Input
                    type="number"
                    value={formData.maxLevel}
                    onChange={(e) => setFormData({ ...formData, maxLevel: Number(e.target.value) })}
                    placeholder="48000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ตำแหน่ง</label>
                  <Input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="โซน 1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" className="text-sm font-medium">เปิดใช้งาน</label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingTank ? 'บันทึกการแก้ไข' : 'เพิ่มถัง'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseForm}>
                  ยกเลิก
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tank Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tanks.map((tank) => {
          const fillPercentage = calculateFillPercentage(tank.currentLevel, tank.capacity)
          const isLowLevel = tank.currentLevel <= tank.minLevel
          
          return (
            <Card key={tank.id} className={`${isLowLevel ? 'border-red-300 bg-red-50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{tank.name}</CardTitle>
                    <p className="text-sm text-gray-600">{tank.code}</p>
                    <p className="text-sm text-blue-600">{tank.fuelType.name}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(tank)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(tank)}
                      disabled={tank._count.dispensers > 0}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>ระดับน้ำมัน</span>
                    <span>{fillPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        isLowLevel ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>{tank.currentLevel.toLocaleString()} ลิตร</span>
                    <span>{tank.capacity.toLocaleString()} ลิตร</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">ขั้นต่ำ:</span>
                    <span className="ml-1">{tank.minLevel.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">สูงสุด:</span>
                    <span className="ml-1">{tank.maxLevel?.toLocaleString() || '-'}</span>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-gray-600">หัวจ่าย:</span>
                  <span className="ml-1">{tank._count.dispensers} ตัว</span>
                </div>

                {tank.location && (
                  <div className="text-sm">
                    <span className="text-gray-600">ตำแหน่ง:</span>
                    <span className="ml-1">{tank.location}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    tank.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {tank.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                  
                  {isLowLevel && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                      ระดับต่ำ
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

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
    </div>
  )
}