'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ShoppingCart, Plus, Save, Trash2, CreditCard, Banknote, Receipt, User } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAlert } from '@/lib/use-alert'

interface FuelType {
  id: string
  name: string
  code: string
}

interface Product {
  id: string
  name: string
  code: string
  unit: string
  fuelType: FuelType | null
  prices: {
    id: string
    price: number
    effectiveDate: string
  }[]
}

interface Debtor {
  id: string
  customerName: string
  customerPhone: string | null
  amount: number
}

interface SaleItem {
  id: string
  productId: string
  productCode: string
  productName: string
  unitPrice: number
  quantity: number
  discount: number
  total: number
  product: Product
}

interface Sale {
  id: string
  billNumber: string
  licensePlate: string | null
  paymentType: 'CASH' | 'CREDIT'
  subtotal: number
  discount: number
  total: number
  notes: string | null
  createdAt: string
  debtor: Debtor | null
  items: SaleItem[]
}

interface SalesManagementProps {
  shiftId: string
  shiftStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
}

interface SaleFormItem {
  productId: string
  quantity: number
  unitPrice: number
  discount: number
}

export default function SalesManagement({ shiftId, shiftStatus }: SalesManagementProps) {
  const { showAlert } = useAlert()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [summary, setSummary] = useState({
    cashSales: 0,
    creditSales: 0,
    totalSales: 0,
    totalTransactions: 0,
  })
  const [showSaleForm, setShowSaleForm] = useState(false)
  const [formData, setFormData] = useState({
    billNumber: '',
    licensePlate: '',
    paymentType: 'CASH' as 'CASH' | 'CREDIT',
    debtorId: '',
    discount: 0,
    notes: '',
  })
  const [saleItems, setSaleItems] = useState<SaleFormItem[]>([])

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/shifts/${shiftId}/sales`)
      if (!response.ok) throw new Error('Failed to fetch sales data')
      
      const data = await response.json()
      setSales(data.sales)
      setProducts(data.products)
      setDebtors(data.debtors)
      setSummary(data.summary)
    } catch (error) {
      console.error('Error fetching sales data:', error)
      showAlert('เกิดข้อผิดพลาดในการดึงข้อมูลการขาย', 'error')
    } finally {
      setLoading(false)
    }
  }, [shiftId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const generateBillNumber = () => {
    const now = new Date()
    const timestamp = now.toISOString().slice(2, 10).replace(/-/g, '') + 
                     now.toTimeString().slice(0, 8).replace(/:/g, '')
    return `BILL${timestamp}`
  }

  const handleAddNew = () => {
    setShowSaleForm(true)
    setFormData({
      billNumber: generateBillNumber(),
      licensePlate: '',
      paymentType: 'CASH',
      debtorId: '',
      discount: 0,
      notes: '',
    })
    setSaleItems([])
  }

  const handleCancel = () => {
    setShowSaleForm(false)
    setFormData({
      billNumber: '',
      licensePlate: '',
      paymentType: 'CASH',
      debtorId: '',
      discount: 0,
      notes: '',
    })
    setSaleItems([])
  }

  const addSaleItem = () => {
    setSaleItems([...saleItems, {
      productId: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
    }])
  }

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const updateSaleItem = (index: number, field: keyof SaleFormItem, value: string | number) => {
    const updatedItems = [...saleItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Auto-fill price when product is selected
    if (field === 'productId' && typeof value === 'string') {
      const product = products.find(p => p.id === value)
      if (product && product.prices.length > 0) {
        updatedItems[index].unitPrice = product.prices[0].price
      }
    }
    
    setSaleItems(updatedItems)
  }

  const calculateSubtotal = () => {
    return saleItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice - item.discount)
    }, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() - formData.discount
  }

  const handleSave = async () => {
    if (!formData.billNumber) {
      showAlert('กรุณาระบุเลขบิล', 'error')
      return
    }

    if (saleItems.length === 0) {
      showAlert('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ', 'error')
      return
    }

    if (formData.paymentType === 'CREDIT' && !formData.debtorId) {
      showAlert('กรุณาเลือกลูกหนี้สำหรับการขายแบบเครดิต', 'error')
      return
    }

    const invalidItems = saleItems.filter(item => !item.productId || item.quantity <= 0 || item.unitPrice <= 0)
    if (invalidItems.length > 0) {
      showAlert('กรุณาตรวจสอบข้อมูลรายการสินค้า', 'error')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/shifts/${shiftId}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billNumber: formData.billNumber,
          licensePlate: formData.licensePlate || null,
          paymentType: formData.paymentType,
          debtorId: formData.debtorId || null,
          discount: formData.discount,
          notes: formData.notes || null,
          items: saleItems,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save sale')
      }

      showAlert('บันทึกการขายเรียบร้อยแล้ว', 'success')
      fetchData() // Refresh data
      handleCancel()
    } catch (error) {
      console.error('Error saving sale:', error)
      showAlert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึก', 'error')
    } finally {
      setSaving(false)
    }
  }

  const getPaymentTypeIcon = (type: 'CASH' | 'CREDIT') => {
    return type === 'CASH' ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />
  }

  const getPaymentTypeText = (type: 'CASH' | 'CREDIT') => {
    return type === 'CASH' ? 'เงินสด' : 'เครดิต'
  }

  const getPaymentTypeColor = (type: 'CASH' | 'CREDIT') => {
    return type === 'CASH' ? 'text-green-600' : 'text-orange-600'
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
      {/* Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ยอดขายรวม</p>
                <p className="text-2xl font-bold text-green-600">
                  ฿{summary.totalSales.toLocaleString()}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ขายเงินสด</p>
                <p className="text-2xl font-bold text-blue-600">
                  ฿{summary.cashSales.toLocaleString()}
                </p>
              </div>
              <Banknote className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ขายเครดิต</p>
                <p className="text-2xl font-bold text-orange-600">
                  ฿{summary.creditSales.toLocaleString()}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">จำนวนรายการ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.totalTransactions}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              จัดการการขาย
            </div>
            {shiftStatus === 'ACTIVE' && (
              <Button onClick={handleAddNew} disabled={showSaleForm}>
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มการขาย
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            บันทึกรายการขายสินค้าทั้งแบบเงินสดและเครดิต
          </p>

          {/* Sale Form */}
          {showSaleForm && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">เพิ่มการขายใหม่</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      เลขบิล *
                    </label>
                    <Input
                      value={formData.billNumber}
                      onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                      placeholder="เลขบิล"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ทะเบียนรถ
                    </label>
                    <Input
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                      placeholder="ทะเบียนรถ (ถ้ามี)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ประเภทการชำระเงิน *
                    </label>
                    <select
                      value={formData.paymentType}
                      onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as 'CASH' | 'CREDIT' })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="CASH">เงินสด</option>
                      <option value="CREDIT">เครดิต</option>
                    </select>
                  </div>

                  {formData.paymentType === 'CREDIT' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ลูกหนี้ *
                      </label>
                      <select
                        value={formData.debtorId}
                        onChange={(e) => setFormData({ ...formData, debtorId: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">เลือกลูกหนี้</option>
                        {debtors.map((debtor) => (
                          <option key={debtor.id} value={debtor.id}>
                            {debtor.customerName} {debtor.customerPhone && `(${debtor.customerPhone})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Sale Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium">รายการสินค้า</h4>
                    <Button variant="outline" onClick={addSaleItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      เพิ่มรายการ
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {saleItems.map((item, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              สินค้า *
                            </label>
                            <select
                              value={item.productId}
                              onChange={(e) => updateSaleItem(index, 'productId', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="">เลือกสินค้า</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} ({product.code})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ราคา/หน่วย
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateSaleItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              จำนวน
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateSaleItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ส่วนลด
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.discount}
                              onChange={(e) => updateSaleItem(index, 'discount', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>

                          <div className="flex items-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeSaleItem(index)}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-2 text-right">
                          <span className="text-sm text-gray-500">รวม: </span>
                          <span className="font-semibold">
                            ฿{(item.quantity * item.unitPrice - item.discount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}

                    {saleItems.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        ยังไม่มีรายการสินค้า กรุณาเพิ่มรายการ
                      </div>
                    )}
                  </div>
                </div>

                {/* Total and Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ส่วนลดรวม
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      หมายเหตุ
                    </label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="หมายเหตุ (ถ้ามี)"
                    />
                  </div>
                </div>

                {/* Summary */}
                {saleItems.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>ยอดรวมย่อย:</span>
                        <span>฿{calculateSubtotal().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ส่วนลดรวม:</span>
                        <span>฿{formData.discount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>ยอดรวมสุทธิ:</span>
                        <span className="text-green-600">฿{calculateTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4">
                  <Button onClick={handleSave} disabled={saving || saleItems.length === 0}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'กำลังบันทึก...' : 'บันทึกการขาย'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    ยกเลิก
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sales Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขบิล</TableHead>
                  <TableHead>ทะเบียนรถ</TableHead>
                  <TableHead>ประเภทการชำระ</TableHead>
                  <TableHead>ลูกหนี้</TableHead>
                  <TableHead>จำนวนรายการ</TableHead>
                  <TableHead>ส่วนลด</TableHead>
                  <TableHead>ยอดรวม</TableHead>
                  <TableHead>เวลา</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      ยังไม่มีข้อมูลการขาย
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.billNumber}</TableCell>
                      <TableCell>{sale.licensePlate || '-'}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${getPaymentTypeColor(sale.paymentType)}`}>
                          {getPaymentTypeIcon(sale.paymentType)}
                          {getPaymentTypeText(sale.paymentType)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sale.debtor ? (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {sale.debtor.customerName}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{sale.items.length} รายการ</TableCell>
                      <TableCell>
                        {sale.discount > 0 ? `฿${sale.discount.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        ฿{sale.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(sale.createdAt).toLocaleString('th-TH', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}