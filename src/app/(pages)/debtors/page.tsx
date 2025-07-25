'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'
import { Plus, Search, Edit, Trash2, Phone, Mail, Calendar, User, Users, UserCheck, UserX, Building, MapPin } from 'lucide-react'

interface Debtor {
  id: string
  customerName: string
  customerCode: string
  phone?: string
  email?: string
  address?: string
  branch?: string
  contactPerson?: string
  taxId?: string
  fax?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ZodIssue {
  path: string[]
  message: string
}

export default function DebtorsPage() {
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDebtor, setEditingDebtor] = useState<Debtor | null>(null)
  const [formData, setFormData] = useState({
    customerName: '',
    customerCode: '',
    phone: '',
    email: '',
    address: '',
    branch: '',
    contactPerson: '',
    taxId: '',
    fax: '',
    isActive: true
  })
  const [submitting, setSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const { alertState, loadingState, showAlert, showLoading, hideLoading, showConfirm, closeAlert } = useAlert()

  // Fetch debtors
  const fetchDebtors = useCallback(async () => {
    try {
      showLoading('กำลังโหลดข้อมูลลูกหนี้...')
      const response = await fetch('/api/debtors')
      if (!response.ok) throw new Error('Failed to fetch debtors')
      const data = await response.json()
      setDebtors(data)
    } catch (error) {
      console.error('Error fetching debtors:', error)
      showAlert('เกิดข้อผิดพลาดในการโหลดข้อมูลลูกหนี้', 'error')
    } finally {
      setLoading(false)
      hideLoading()
    }
  }, [showAlert, showLoading, hideLoading])

  useEffect(() => {
    fetchDebtors();
  }, []); // Removed dependencies to ensure it runs only once on mount

  // Client-side validation
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.customerName.trim()) {
      errors.customerName = "กรุณากรอกชื่อลูกค้า"
    }

    if (!formData.customerCode.trim()) {
      errors.customerCode = "กรุณากรอกรหัสลูกค้า"
    } else if (!/^[A-Z0-9-]+$/.test(formData.customerCode)) {
      errors.customerCode = "รหัสสามารถมีได้เฉพาะตัวอักษรพิมพ์ใหญ่ ตัวเลข และขีดกลาง"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "รูปแบบอีเมลไม่ถูกต้อง"
    }

    if (formData.phone && !/^[0-9-+().\s]*$/.test(formData.phone)) {
      errors.phone = "รูปแบบเบอร์โทรไม่ถูกต้อง"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous validation errors
    setValidationErrors({})
    
    // Validate form
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    showLoading(editingDebtor ? 'กำลังแก้ไขข้อมูลลูกหนี้...' : 'กำลังเพิ่มลูกหนี้...')

    try {
      const url = editingDebtor ? `/api/debtors/${editingDebtor.id}` : '/api/debtors'
      const method = editingDebtor ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Handle Zod validation errors
        if (response.status === 400 && errorData.issues) {
          const zodErrors: Record<string, string> = {}
          errorData.issues.forEach((issue: ZodIssue) => {
            if (issue.path && issue.path.length > 0) {
              zodErrors[issue.path[0]] = issue.message
            }
          })
          setValidationErrors(zodErrors)
          return
        }
        
        throw new Error(errorData.message || 'Failed to save debtor')
      }

      hideLoading()
      showAlert(
        editingDebtor ? 'แก้ไขข้อมูลลูกหนี้สำเร็จ' : 'เพิ่มลูกหนี้สำเร็จ',
        'success'
      )

      setShowAddModal(false)
      setEditingDebtor(null)
      setFormData({
        customerName: '',
        customerCode: '',
        phone: '',
        email: '',
        address: '',
        branch: '',
        contactPerson: '',
        taxId: '',
        fax: '',
        isActive: true
      })
      fetchDebtors()
    } catch (error) {
      console.error('Error saving debtor:', error)
      hideLoading()
      showAlert('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async (debtor: Debtor) => {
    showConfirm(
      `คุณต้องการลบลูกหนี้ "${debtor.customerName}" (${debtor.customerCode}) ใช่หรือไม่?`,
      async () => {
        try {
          showLoading('กำลังลบลูกหนี้...')
          
          const response = await fetch(`/api/debtors/${debtor.id}`, {
            method: 'DELETE',
          })

          if (!response.ok) throw new Error('Failed to delete debtor')

          hideLoading()
          showAlert('ลบลูกหนี้สำเร็จ', 'success')
          fetchDebtors()
        } catch (error) {
          console.error('Error deleting debtor:', error)
          hideLoading()
          showAlert('เกิดข้อผิดพลาดในการลบข้อมูล', 'error')
        }
      },
      'ยืนยันการลบ',
      'ลบ',
      'ยกเลิก'
    )
  }

  // Handle edit
  const handleEdit = (debtor: Debtor) => {
    setEditingDebtor(debtor)
    setValidationErrors({}) // Clear validation errors
    setFormData({
      customerName: debtor.customerName,
      customerCode: debtor.customerCode,
      phone: debtor.phone || '',
      email: debtor.email || '',
      address: debtor.address || '',
      branch: debtor.branch || '',
      contactPerson: debtor.contactPerson || '',
      taxId: debtor.taxId || '',
      fax: debtor.fax || '',
      isActive: debtor.isActive
    })
    setShowAddModal(true)
  }

  // Handle add new
  const handleAddNew = () => {
    setEditingDebtor(null)
    setValidationErrors({}) // Clear validation errors
    setFormData({
      customerName: '',
      customerCode: '',
      phone: '',
      email: '',
      address: '',
      branch: '',
      contactPerson: '',
      taxId: '',
      fax: '',
      isActive: true
    })
    setShowAddModal(true)
  }

  // Filter debtors based on search
  const filteredDebtors = debtors.filter(debtor =>
    debtor.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    debtor.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (debtor.phone && debtor.phone.includes(searchTerm)) ||
    (debtor.email && debtor.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const activeDebtors = debtors.filter(debtor => debtor.isActive)

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลลูกหนี้...</p>
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
            <h1 className="text-2xl font-bold">จัดการลูกหนี้</h1>
            <p className="text-gray-600">จัดการข้อมูลลูกหนี้และติดตามวงเงินเครดิต</p>
          </div>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มลูกหนี้
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ลูกหนี้ทั้งหมด</p>
                <p className="text-2xl font-bold">{debtors.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ลูกหนี้ที่ใช้งาน</p>
                <p className="text-2xl font-bold">{activeDebtors.length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ลูกหนี้ปิดใช้งาน</p>
                <p className="text-2xl font-bold">{debtors.length - activeDebtors.length}</p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">มีข้อมูลอีเมล</p>
                <p className="text-2xl font-bold">{debtors.filter(d => d.email).length}</p>
              </div>
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            ค้นหาลูกหนี้
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="ค้นหาชื่อลูกค้า, รหัสลูกค้า, เบอร์โทร หรืออีเมล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Debtors Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการลูกหนี้</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDebtors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบข้อมูลลูกหนี้</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead>ข้อมูลติดต่อ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่เพิ่ม</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDebtors.map((debtor) => (
                  <TableRow key={debtor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{debtor.customerName}</div>
                        <div className="text-sm text-gray-500">รหัส: {debtor.customerCode}</div>
                        {debtor.contactPerson && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {debtor.contactPerson}
                          </div>
                        )}
                        {debtor.branch && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {debtor.branch}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {debtor.phone && (
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {debtor.phone}
                          </div>
                        )}
                        {debtor.email && (
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {debtor.email}
                          </div>
                        )}
                        {debtor.address && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {debtor.address.length > 30 ? `${debtor.address.substring(0, 30)}...` : debtor.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        debtor.isActive 
                          ? 'text-green-800 bg-green-100' 
                          : 'text-red-800 bg-red-100'
                      }`}>
                        {debtor.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {new Date(debtor.createdAt).toLocaleDateString('th-TH')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(debtor)}
                          disabled={loadingState.isLoading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(debtor)}
                          className="text-red-600 hover:text-red-700"
                          disabled={loadingState.isLoading}
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingDebtor ? 'แก้ไขข้อมูลลูกหนี้' : 'เพิ่มลูกหนี้ใหม่'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อลูกค้า *
                    </label>
                    <Input
                      id="customerName"
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                      placeholder="กรอกชื่อลูกค้า"
                      className={validationErrors.customerName ? 'border-red-500' : ''}
                      disabled={submitting}
                    />
                    {validationErrors.customerName && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.customerName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="customerCode" className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสลูกค้า *
                    </label>
                    <Input
                      id="customerCode"
                      type="text"
                      value={formData.customerCode}
                      onChange={(e) => setFormData({ ...formData, customerCode: e.target.value.toUpperCase() })}
                      required
                      placeholder="กรอกรหัสลูกค้า"
                      className={validationErrors.customerCode ? 'border-red-500' : ''}
                      disabled={submitting}
                    />
                    {validationErrors.customerCode && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.customerCode}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      เบอร์โทร
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="กรอกเบอร์โทร"
                      className={validationErrors.phone ? 'border-red-500' : ''}
                      disabled={submitting}
                    />
                    {validationErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      อีเมล
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="กรอกอีเมล"
                      className={validationErrors.email ? 'border-red-500' : ''}
                      disabled={submitting}
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อผู้ติดต่อ
                    </label>
                    <Input
                      id="contactPerson"
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="กรอกชื่อผู้ติดต่อ"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1">
                      เลขประจำตัวผู้เสียภาษี
                    </label>
                    <Input
                      id="taxId"
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="กรอกเลขประจำตัวผู้เสียภาษี"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    ที่อยู่
                  </label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="กรอกที่อยู่"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
                    สาขา
                  </label>
                  <Input
                    id="branch"
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="กรอกสาขา"
                    disabled={submitting}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={submitting}
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    ใช้งาน
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingDebtor(null)
                      setValidationErrors({})
                      setFormData({
                        customerName: '',
                        customerCode: '',
                        phone: '',
                        email: '',
                        address: '',
                        branch: '',
                        contactPerson: '',
                        taxId: '',
                        fax: '',
                        isActive: true
                      })
                    }}
                    className="flex-1"
                    disabled={submitting}
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