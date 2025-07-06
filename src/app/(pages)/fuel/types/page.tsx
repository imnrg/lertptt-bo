'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Fuel, 
  Search,
  CheckCircle,
  BarChart3,
  X
} from 'lucide-react'

interface FuelType {
  id: string
  name: string
  code: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    tanks: number
    dispensers: number
    products: number
  }
}

export default function FuelTypesPage() {
  const { alertState, loadingState, showAlert, showConfirm, showLoading, hideLoading, closeAlert } = useAlert()
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingFuelType, setEditingFuelType] = useState<FuelType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true
  })

  useEffect(() => {
    fetchFuelTypes()
  }, [])

  const fetchFuelTypes = async () => {
    try {
      const response = await fetch('/api/fuel/types')
      if (response.ok) {
        const data = await response.json()
        setFuelTypes(data)
      }
    } catch (error) {
      console.error('Error fetching fuel types:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      showLoading(editingFuelType ? 'กำลังแก้ไขประเภทเชื้อเพลิง...' : 'กำลังเพิ่มประเภทเชื้อเพลิง...')
      
      const url = editingFuelType 
        ? `/api/fuel/types/${editingFuelType.id}`
        : '/api/fuel/types'
      
      const method = editingFuelType ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchFuelTypes()
        handleCloseForm()
        hideLoading()
        showAlert(editingFuelType ? 'แก้ไขประเภทเชื้อเพลิงสำเร็จ' : 'เพิ่มประเภทเชื้อเพลิงสำเร็จ', 'success')
      } else {
        const error = await response.json()
        hideLoading()
        showAlert(error.error || 'เกิดข้อผิดพลาด', 'error')
      }
    } catch (error) {
      console.error('Error saving fuel type:', error)
      hideLoading()
      showAlert('เกิดข้อผิดพลาด', 'error')
    }
  }

  const handleEdit = (fuelType: FuelType) => {
    setEditingFuelType(fuelType)
    setFormData({
      name: fuelType.name,
      code: fuelType.code,
      description: fuelType.description || '',
      isActive: fuelType.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (fuelType: FuelType) => {
    showConfirm(
      `คุณต้องการลบประเภทเชื้อเพลิง "${fuelType.name}" หรือไม่?`,
      async () => {
        try {
          showLoading('กำลังลบประเภทเชื้อเพลิง...')
          
          const response = await fetch(`/api/fuel/types/${fuelType.id}`, {
            method: 'DELETE',
          })

          if (response.ok) {
            await fetchFuelTypes()
            hideLoading()
            showAlert('ลบประเภทเชื้อเพลิงสำเร็จ', 'success')
          } else {
            const error = await response.json()
            hideLoading()
            showAlert(error.error || 'เกิดข้อผิดพลาด', 'error')
          }
        } catch (error) {
          console.error('Error deleting fuel type:', error)
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
    setEditingFuelType(null)
    setFormData({
      name: '',
      code: '',
      description: '',
      isActive: true
    })
  }

  // Filter fuel types based on search term
  const filteredFuelTypes = fuelTypes.filter(fuelType =>
    fuelType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fuelType.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fuelType.description && fuelType.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Calculate stats
  const activeFuelTypes = fuelTypes.filter(fuelType => fuelType.isActive).length
  const totalTanks = fuelTypes.reduce((sum, fuelType) => sum + (fuelType._count?.tanks || 0), 0)
  const totalDispensers = fuelTypes.reduce((sum, fuelType) => sum + (fuelType._count?.dispensers || 0), 0)

  // ฟังก์ชันสำหรับแสดงสีตามประเภทน้ำมัน
  const getFuelTypeColor = (fuelTypeCode: string) => {
    const colors: Record<string, string> = {
      'GASOHOL_91': 'bg-green-100 text-green-800',
      'GASOHOL_95': 'bg-blue-100 text-blue-800',
      'BENZINE_91': 'bg-yellow-100 text-yellow-800',
      'BENZINE_95': 'bg-orange-100 text-orange-800',
      'DIESEL': 'bg-red-100 text-red-800',
      'E20': 'bg-purple-100 text-purple-800',
      'E85': 'bg-indigo-100 text-indigo-800',
    }
    return colors[fuelTypeCode] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Fuel className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p>กำลังโหลดข้อมูลประเภทเชื้อเพลิง...</p>
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
            <h1 className="text-2xl font-bold">จัดการประเภทเชื้อเพลิง</h1>
            <p className="text-gray-600">กำหนดและจัดการประเภทเชื้อเพลิงในระบบ</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={loadingState.isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มประเภทใหม่
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ประเภททั้งหมด</p>
                <p className="text-2xl font-bold">{fuelTypes.length}</p>
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
                <p className="text-2xl font-bold">{activeFuelTypes}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ถังทั้งหมด</p>
                <p className="text-2xl font-bold">{totalTanks}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">หัวจ่ายทั้งหมด</p>
                <p className="text-2xl font-bold">{totalDispensers}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            ค้นหาประเภทเชื้อเพลิง
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="ค้นหาชื่อประเภท, รหัส, หรือคำอธิบาย..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Fuel Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการประเภทเชื้อเพลิง</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFuelTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Fuel className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบประเภทเชื้อเพลิงที่ค้นหา</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อประเภท</TableHead>
                  <TableHead>รหัส</TableHead>
                  <TableHead>คำอธิบาย</TableHead>
                  <TableHead>จำนวนถัง</TableHead>
                  <TableHead>จำนวนหัวจ่าย</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFuelTypes.map((fuelType: FuelType) => (
                  <TableRow key={fuelType.id}>
                    <TableCell className="font-medium">{fuelType.name}</TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFuelTypeColor(fuelType.code)}`}>
                        {fuelType.code}
                      </span>
                    </TableCell>
                    <TableCell>{fuelType.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{fuelType._count?.tanks || 0}</span>
                        <span className="text-xs text-gray-500">ถัง</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{fuelType._count?.dispensers || 0}</span>
                        <span className="text-xs text-gray-500">หัวจ่าย</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        fuelType.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {fuelType.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(fuelType)}
                          disabled={loadingState.isLoading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(fuelType)}
                          className="text-red-600 hover:text-red-700"
                          disabled={loadingState.isLoading || 
                                   (fuelType._count?.tanks || 0) > 0 || 
                                   (fuelType._count?.dispensers || 0) > 0}
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
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingFuelType ? 'แก้ไขประเภทเชื้อเพลิง' : 'เพิ่มประเภทเชื้อเพลิงใหม่'}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseForm}
                  disabled={loadingState.isLoading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อประเภทเชื้อเพลิง *
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="เช่น เบนซิน 95"
                      required
                      disabled={loadingState.isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสประเภท *
                    </label>
                    <Input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="เช่น BENZINE_95"
                      required
                      disabled={loadingState.isLoading}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คำอธิบาย
                  </label>
                  <Input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="เช่น เบนซิน 95 ออกเทน"
                    disabled={loadingState.isLoading}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                    disabled={loadingState.isLoading}
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    เปิดใช้งาน
                  </label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={loadingState.isLoading}>
                    {editingFuelType ? 'บันทึกการแก้ไข' : 'เพิ่มประเภทเชื้อเพลิง'}
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