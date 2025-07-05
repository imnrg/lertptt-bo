'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Fuel } from 'lucide-react'

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">จัดการประเภทเชื้อเพลิง</h1>
        <Button onClick={() => setShowForm(true)} disabled={loadingState.isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มประเภทเชื้อเพลิง
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingFuelType ? 'แก้ไขประเภทเชื้อเพลิง' : 'เพิ่มประเภทเชื้อเพลิง'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ชื่อประเภทเชื้อเพลิง</label>
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
                  <label className="block text-sm font-medium mb-1">รหัสประเภท</label>
                  <Input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="เช่น E95"
                    required
                    disabled={loadingState.isLoading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">คำอธิบาย</label>
                <Input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="เช่น เบนซิน 95 ออกเทน"
                  disabled={loadingState.isLoading}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  disabled={loadingState.isLoading}
                />
                <label htmlFor="isActive" className="text-sm font-medium">เปิดใช้งาน</label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loadingState.isLoading}>
                  {editingFuelType ? 'บันทึกการแก้ไข' : 'เพิ่มประเภทเชื้อเพลิง'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseForm} disabled={loadingState.isLoading}>
                  ยกเลิก
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Fuel Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการประเภทเชื้อเพลิง</CardTitle>
        </CardHeader>
        <CardContent>
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
              {fuelTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    ไม่มีข้อมูลประเภทเชื้อเพลิง
                  </TableCell>
                </TableRow>
              ) : (
                fuelTypes.map((fuelType: FuelType) => (
                  <TableRow key={fuelType.id}>
                    <TableCell className="font-medium">{fuelType.name}</TableCell>
                    <TableCell>{fuelType.code}</TableCell>
                    <TableCell>{fuelType.description || '-'}</TableCell>
                    <TableCell>{fuelType._count?.tanks || 0}</TableCell>
                    <TableCell>{fuelType._count?.dispensers || 0}</TableCell>
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
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(fuelType)}
                          disabled={loadingState.isLoading}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(fuelType)}
                          disabled={loadingState.isLoading || 
                                   (fuelType._count?.tanks || 0) > 0 || 
                                   (fuelType._count?.dispensers || 0) > 0}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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