'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table } from '@/components/ui/table'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'
import { Plus, Search, Edit, Trash2, Phone, Mail, Calendar, DollarSign, User, CreditCard } from 'lucide-react'

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
  creditLimit: number
  creditTerm: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function DebtorsPage() {
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDebtor, setEditingDebtor] = useState<Debtor | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [debtorToDelete, setDebtorToDelete] = useState<Debtor | null>(null)
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
    creditLimit: 0,
    creditTerm: 30,
    isActive: true
  })
  const [submitting, setSubmitting] = useState(false)
  const { showAlert, loadingState } = useAlert()

  // Fetch debtors
  const fetchDebtors = async () => {
    try {
      const response = await fetch('/api/debtors')
      if (!response.ok) throw new Error('Failed to fetch debtors')
      const data = await response.json()
      setDebtors(data)
    } catch (error) {
      console.error('Error fetching debtors:', error)
      showAlert('เกิดข้อผิดพลาดในการโหลดข้อมูลลูกหนี้', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebtors()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

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

      if (!response.ok) throw new Error('Failed to save debtor')

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
        creditLimit: 0,
        creditTerm: 30,
        isActive: true
      })
      fetchDebtors()
    } catch (error) {
      console.error('Error saving debtor:', error)
      showAlert('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!debtorToDelete) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/debtors/${debtorToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete debtor')

      showAlert('ลบลูกหนี้สำเร็จ', 'success')
      setShowDeleteModal(false)
      setDebtorToDelete(null)
      fetchDebtors()
    } catch (error) {
      console.error('Error deleting debtor:', error)
      showAlert('เกิดข้อผิดพลาดในการลบข้อมูล', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle edit
  const handleEdit = (debtor: Debtor) => {
    setEditingDebtor(debtor)
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
      creditLimit: debtor.creditLimit,
      creditTerm: debtor.creditTerm,
      isActive: debtor.isActive
    })
    setShowAddModal(true)
  }

  // Handle add new
  const handleAddNew = () => {
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
      creditLimit: 0,
      creditTerm: 30,
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

  const totalCreditLimit = debtors.reduce((sum, debtor) => sum + debtor.creditLimit, 0)
  const activeDebtors = debtors.filter(debtor => debtor.isActive)

  if (loading) {
    return <LoadingModal loadingState={{ isLoading: true, message: 'กำลังโหลดข้อมูลลูกหนี้...' }} />
  }

  return (
    <div className="space-y-6">
      <LoadingModal loadingState={loadingState} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการลูกหนี้</h1>
          <p className="text-gray-600 mt-1">จัดการข้อมูลลูกหนี้และติดตามวงเงินเครดิต</p>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มลูกหนี้
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">จำนวนลูกหนี้ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{debtors.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ลูกหนี้ที่ใช้งาน</p>
              <p className="text-2xl font-bold text-green-600">{activeDebtors.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <User className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">วงเงินเครดิตรวม</p>
              <p className="text-2xl font-bold text-orange-600">
                ฿{totalCreditLimit.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <CreditCard className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ค้นหาลูกหนี้..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Debtors Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <th>รหัสลูกค้า</th>
              <th>ชื่อลูกค้า</th>
              <th>เบอร์โทร</th>
              <th>อีเมล</th>
              <th>วงเงินเครดิต</th>
              <th>เทอมเครดิต</th>
              <th>สถานะ</th>
              <th>วันที่เพิ่ม</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredDebtors.map((debtor) => (
              <tr key={debtor.id}>
                <td className="font-medium">{debtor.customerCode}</td>
                <td className="font-medium">{debtor.customerName}</td>
                <td>
                  {debtor.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {debtor.phone}
                    </div>
                  )}
                </td>
                <td>
                  {debtor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {debtor.email}
                    </div>
                  )}
                </td>
                <td className="text-orange-600 font-medium">
                  ฿{debtor.creditLimit.toLocaleString()}
                </td>
                <td>{debtor.creditTerm} วัน</td>
                <td>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    debtor.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {debtor.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {new Date(debtor.createdAt).toLocaleDateString('th-TH')}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(debtor)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDebtorToDelete(debtor)
                        setShowDeleteModal(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {filteredDebtors.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">ไม่พบข้อมูลลูกหนี้</p>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editingDebtor ? 'แก้ไขข้อมูลลูกหนี้' : 'เพิ่มลูกหนี้ใหม่'}
            </h2>
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
                  />
                </div>

                <div>
                  <label htmlFor="customerCode" className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสลูกค้า *
                  </label>
                  <Input
                    id="customerCode"
                    type="text"
                    value={formData.customerCode}
                    onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                    required
                    placeholder="กรอกรหัสลูกค้า"
                  />
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
                  />
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
                  />
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
                  />
                </div>

                <div>
                  <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700 mb-1">
                    วงเงินเครดิต (บาท)
                  </label>
                  <Input
                    id="creditLimit"
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    placeholder="กรอกวงเงินเครดิต"
                  />
                </div>

                <div>
                  <label htmlFor="creditTerm" className="block text-sm font-medium text-gray-700 mb-1">
                    เทอมเครดิต (วัน)
                  </label>
                  <Input
                    id="creditTerm"
                    type="number"
                    value={formData.creditTerm}
                    onChange={(e) => setFormData({ ...formData, creditTerm: parseInt(e.target.value) || 30 })}
                    min="0"
                    placeholder="กรอกเทอมเครดิต"
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
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  ใช้งาน
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
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
                      creditLimit: 0,
                      creditTerm: 30,
                      isActive: true
                    })
                  }}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AlertModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDebtorToDelete(null)
        }}
        onConfirm={handleDelete}
        title="ยืนยันการลบ"
        message={`คุณต้องการลบลูกหนี้ "${debtorToDelete?.customerName}" (${debtorToDelete?.customerCode}) ใช่หรือไม่?`}
        confirmText="ลบ"
        cancelText="ยกเลิก"
        showCancel={true}
        type="warning"
      />
    </div>
  )
}