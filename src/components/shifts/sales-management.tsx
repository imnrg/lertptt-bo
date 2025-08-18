'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

interface SaleItem {
  id?: string
  productId?: string
  productName?: string
  productType?: string // 'fuel' หรือ category name
  quantity: number
  unitPrice: number
  discount?: number
}

interface Sale {
  id: string
  debtorId?: string | null
  licensePlate?: string | null
  deliveryNote?: string | null
  items?: SaleItem[]
  productName?: string
  quantity?: number
  unitPrice?: number
  total?: number
  createdAt?: string
}

export default function SalesManagement({ shiftId }: { shiftId: string }) {
  const { alertState, loadingState, showAlert, showConfirm, showLoading, hideLoading, closeAlert } = useAlert()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [items, setItems] = useState<SaleItem[]>([])
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [debtorId, setDebtorId] = useState<string | null>(null)
  const [licensePlate, setLicensePlate] = useState<string | null>(null)
  const [deliveryNote, setDeliveryNote] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [debtorList, setDebtorList] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [fuelProducts, setFuelProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])

  // Validation state for sale form (similar pattern to debtors page)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // โหลดลูกหนี้และสินค้า (fuel / non-fuel)
  const fetchDebtors = useCallback(async () => {
    try {
      const res = await fetch('/api/debtors')
      if (!res.ok) throw new Error('Failed to load debtors')
      const data = await res.json()
      setDebtorList(data)
    } catch (err) {
      console.error('Failed to fetch debtors', err)
      setDebtorList([])
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      // เชื้อเพลิง
      const resFuel = await fetch('/api/products?fuelOnly=true')
      const fuelData = resFuel.ok ? await resFuel.json() : []
      setFuelProducts(fuelData)

      // สินค้าทั่วไป (ไม่ใช่เชื้อเพลิง)
      const resProducts = await fetch('/api/products?excludeFuel=true')
      const productsData = resProducts.ok ? await resProducts.json() : []
      setAllProducts(productsData)

      // รวบรวมหมวดหมู่จากสินค้าทั่วไป
      const cats = Array.from(new Set(((productsData as any[]) || []).map((p: any) => p.category).filter(Boolean))) as string[]
      setCategories(cats)
    } catch (err) {
      console.error('Failed to fetch products', err)
      setFuelProducts([])
      setAllProducts([])
      setCategories([])
    }
  }, [])

  useEffect(() => {
    fetchDebtors()
    fetchProducts()
  }, [fetchDebtors, fetchProducts])

  // ดึงราคาล่าสุดสำหรับสินค้าเชื้อเพลิง (ใช้ product price API)
  const fetchLatestFuelPrice = async (productId: string) => {
    try {
      const res = await fetch(`/api/fuel/products/prices?productId=${productId}`)
      if (!res.ok) return 0
      const data = await res.json()
      // API คืนรายการราคาเรียงตาม productId, effectiveDate desc -> เลือกตัวแรก
      if (Array.isArray(data) && data.length > 0) return data[0].price ?? 0
      return 0
    } catch (err) {
      console.error('Failed to fetch product price', err)
      return 0
    }
  }

  // อัพเดต item เมื่อเลือก productId หรือ field อื่น ๆ
  const handleItemChange = async (idx: number, changes: Partial<SaleItem>) => {
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], ...changes }

    // หากเลือก productId ให้ตั้งชื่อสินค้า และราคา
    if (changes.productId) {
      const pid = changes.productId as string
      // ค้นหาใน fuelProducts หรือ allProducts
      const prod = (fuelProducts.find(p => p.id === pid) || allProducts.find(p => p.id === pid)) as any
      if (prod) {
        newItems[idx].productName = prod.name
        if (prod.fuelTypeId) {
          // เชื้อเพลิง -> ดึงราคาล่าสุด
          const price = await fetchLatestFuelPrice(pid)
          newItems[idx].unitPrice = price
          newItems[idx].productType = 'fuel'
        } else {
          // หมวดหมู่ทั่วไป -> ใช้ cost เป็นค่าเริ่มต้น (ถ้ามี)
          newItems[idx].unitPrice = prod.cost ?? 0
          newItems[idx].productType = prod.category ?? ''
        }
      }
    }

    setItems(newItems)
  }

  const fetchSales = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/shifts/sales?shiftId=${shiftId}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSales(data)
    } catch (err) {
      console.error(err)
      setSales([])
    } finally {
      setLoading(false)
    }
  }, [shiftId])

  useEffect(() => { fetchSales() }, [fetchSales])

  const resetForm = () => {
    // initialize with a single empty item so modal becomes single-item form
    setItems([{ productId: '', productName: '', productType: '', quantity: 1, unitPrice: 0 }])
    setEditingSale(null)
    setDebtorId(null)
    setLicensePlate(null)
    setDeliveryNote(null)
    setShowForm(false)
  }

  // Validate sale form client-side before submitting
  const validateSaleForm = () => {
    const errors: Record<string, string> = {}

    if (!items || items.length === 0) {
      errors.items = 'กรุณาเพิ่มอย่างน้อย 1 รายการ'
    }

    items.forEach((it, idx) => {
      if (!it.productId || it.productId === '') {
        errors[`item_${idx}_product`] = 'กรุณาเลือกสินค้า'
      }
      if (!it.quantity || Number(it.quantity) <= 0) {
        errors[`item_${idx}_quantity`] = 'จำนวนต้องมากกว่า 0'
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    try {
      // Client-side validation before sending to server (mirror debtors form behavior)
      setValidationErrors({})
      if (!validateSaleForm()) {
        showAlert('กรุณาตรวจสอบข้อมูลในฟอร์ม', 'error')
        return
      }
      showLoading(editingSale ? 'กำลังอัปเดตการขาย...' : 'กำลังบันทึกการขาย...')

      if (editingSale) {
        const it = items[0]
        const payload: any = {
          id: editingSale.id,
          shiftId,
          debtorId: debtorId ?? null,
          plateNumber: licensePlate ?? null,
          deliveryNote: deliveryNote ?? null,
          productId: it.productId ?? undefined,
          productName: it.productName ?? '',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: it.discount ?? 0,
        }

        const res = await fetch('/api/shifts/sales', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        hideLoading()
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          console.error('Failed to update sale', err)
          showAlert('อัปเดตไม่สำเร็จ', 'error')
          return
        }
        showAlert('อัปเดตการขายสำเร็จ', 'success')
        resetForm()
        fetchSales()
        return
      }

      // Single-item flow
      const it = items[0]
      if (!it) {
        hideLoading()
        showAlert('กรุณาเพิ่มรายการสินค้า', 'error')
        return
      }

      const payload: any = {
        shiftId,
        debtorId: debtorId ?? null,
        plateNumber: licensePlate ?? null,
        deliveryNote: deliveryNote ?? null,
        productId: it.productId ?? undefined,
        productName: it.productName ?? '',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount ?? 0,
      }

      const res = await fetch('/api/shifts/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      hideLoading()
      if (!res.ok) {
        console.error('Failed to create sale', res)
        showAlert('บันทึกไม่สำเร็จ', 'error')
        return
      }

      showAlert('บันทึกการขายสำเร็จ', 'success')
      resetForm()
      fetchSales()
    } catch (err) {
      console.error(err)
      hideLoading()
      showAlert('บันทึกไม่สำเร็จ', 'error')
    }
  }

  const handleDelete = (sale: Sale) => {
    showConfirm(
      `คุณต้องการลบรายการขายบิล ${sale.id} ใช่หรือไม่?`,
      async () => {
        try {
          showLoading('กำลังลบรายการขาย...')
          const res = await fetch(`/api/shifts/sales?id=${sale.id}`, { method: 'DELETE' })
          hideLoading()
          if (!res.ok) {
            showAlert('การลบไม่สำเร็จ', 'error')
            return
          }
          showAlert('ลบรายการขายสำเร็จ', 'success')
          fetchSales()
        } catch (err) {
          console.error(err)
          hideLoading()
          showAlert('การลบไม่สำเร็จ', 'error')
        }
      },
      'ยืนยันการลบ',
      'ลบ',
      'ยกเลิก'
    )
  }

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale)
    setDebtorId(sale.debtorId ?? null)
    setLicensePlate(sale.licensePlate ?? null)
    setDeliveryNote(sale.deliveryNote ?? null)
    if (sale.items && sale.items.length > 0) {
      setItems(sale.items.map(it => ({ ...it })))
    } else {
      setItems([{
        id: undefined,
        productId: sale.productName ? undefined : (sale as any).productId ?? undefined,
        productName: sale.productName ?? '',
        quantity: sale.quantity ?? 1,
        unitPrice: sale.unitPrice ?? 0,
        discount: (sale as any).discount ?? 0,
      }])
    }
    setShowForm(true)
  }

  // ปรับการกรองให้ครอบคลุมตาม field ที่ต้องการค้นหา (รวม debtorId, productId และชื่อสินค้า ในรายการหลายชิ้น)
  const filtered = sales.filter(s => {
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()

    const matchesTopLevel = (
      (s.productName ?? '').toLowerCase().includes(q) ||
      (s.licensePlate ?? '').toLowerCase().includes(q) ||
      (s.deliveryNote ?? '').toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.debtorId ?? '').toLowerCase().includes(q)
    )

    const matchesItems = Array.isArray(s.items)
      ? s.items.some(it => ((it.productName ?? '').toLowerCase().includes(q) || (it.productId ?? '').toLowerCase().includes(q)))
      : false

    return matchesTopLevel || matchesItems
  })

  const totalRevenue = sales.reduce((acc, s) => acc + (s.total ?? 0), 0)
  const totalItems = sales.reduce((acc, s) => acc + (Array.isArray(s.items) ? s.items.length : 1), 0)

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดการขาย...</p>
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
            <p className="text-gray-600">บันทึกการขายสินค้าในการผลัดงาน</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มการขาย
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">รายการขาย</p>
                <p className="text-2xl font-bold">{sales.length}</p>
              </div>
              <div className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">จำนวนสินค้า</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <div className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">รายได้รวม</p>
                <p className="text-2xl font-bold">฿{totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ข้อมูลอื่นๆ</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <div className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">ค้นหาการขาย</CardTitle>
        </CardHeader>
        <CardContent>
          <Input type="text" placeholder="ค้นหา บิล, สินค้า, ทะเบียน, ใบส่งสินค้า..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการขาย</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">ไม่พบรายการขาย</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>บิล</TableHead>
                  <TableHead>ลูกค้า / รหัสลูกค้า</TableHead>
                  <TableHead>สินค้า (รหัส · ชื่อ)</TableHead>
                  <TableHead>จำนวน</TableHead>
                  <TableHead>ราคา/หน่วย</TableHead>
                  <TableHead>ยอดรวม</TableHead>
                  <TableHead>ส่วนลด</TableHead>
                  <TableHead>ยอดสุทธิ</TableHead>
                  <TableHead>ทะเบียน</TableHead>
                  <TableHead>ใบส่ง</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  // คำนวณค่าต่าง ๆ จากรายการ (รองรับกรณี items เป็น array หรือ single item fields)
                  const items = Array.isArray(s.items) && s.items.length > 0 ? s.items : [{ productId: (s as any).productId, productName: s.productName, quantity: s.quantity ?? 1, unitPrice: s.unitPrice ?? 0, discount: (s as any).discount ?? 0 }]
                  const totalAmount = items.reduce((acc, it) => acc + ((it.quantity || 0) * (it.unitPrice || 0)), 0)
                  const totalDiscount = items.reduce((acc, it) => acc + (it.discount || 0), 0)
                  const netTotal = totalAmount - totalDiscount
                  const totalQuantity = items.reduce((acc, it) => acc + (it.quantity || 0), 0)

                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="text-sm font-medium">{s.id}</div>
                        {s.debtorId && <div className="text-xs text-gray-500">รหัสลูกค้า: {s.debtorId}</div>}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">{ /* ถ้ามีข้อมูลลูกหนี้เพิ่มเติมในอนาคต สามารถแสดงชื่อ/รายละเอียดได้ที่นี่ */ '-'} </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm space-y-1">
                          {items.map((it, idx) => (
                            <div key={idx} className="text-sm text-gray-900">{(it.productId ?? '-') + ' · ' + (it.productName ?? '-')}</div>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">{totalQuantity}</div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">{(() => {
                          // ถ้ามีหลายรายการ ให้แสดงราคาของรายการแรกเป็นตัวอย่าง
                          const unit = items[0]?.unitPrice ?? 0
                          return unit.toFixed(2)
                        })()}</div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">฿{totalAmount.toFixed(2)}</div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">฿{totalDiscount.toFixed(2)}</div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm font-semibold">฿{netTotal.toFixed(2)}</div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">{s.licensePlate ?? '-'}</div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">{s.deliveryNote ?? '-'}</div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">{s.createdAt ? new Date(s.createdAt).toLocaleString('th-TH') : '-'}</div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(s)} disabled={loadingState.isLoading}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(s)} className="text-red-600 hover:text-red-700" disabled={loadingState.isLoading}>
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

      {/* Create/Edit Modal (centered like shifts-list) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{editingSale ? 'แก้ไขการขาย' : 'สร้างการขาย'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">ลูกหนี้ (เลือกรหัส)</label>
                    <div className="mt-1">
                      <Select value={debtorId ?? '__none'} onValueChange={(v) => setDebtorId(v === '__none' ? null : v)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="เลือกลูกหนี้" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">-</SelectItem>
                          {debtorList.map(d => (
                            <SelectItem key={d.id} value={d.id}>{`${d.customerName} · ${d.customerCode}`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {validationErrors.debtorId && <div className="text-sm text-red-600 mt-1">{validationErrors.debtorId}</div>}
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">ทะเบียนรถ</label>
                    <div className="mt-1">
                      <Input placeholder="กรอกทะเบียนรถ" value={licensePlate ?? ''} onChange={(e) => setLicensePlate(e.target.value || null)} />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">ใบส่งสินค้า</label>
                    <div className="mt-1">
                      <Input placeholder="กรอกใบส่งสินค้า" value={deliveryNote ?? ''} onChange={(e) => setDeliveryNote(e.target.value || null)} />
                    </div>
                  </div>
                </div>

                <fieldset className="border rounded-md p-4">
                  <legend className="text-sm font-medium px-2">ข้อมูลสินค้า</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm text-gray-700">ประเภท</label>
                      <div className="mt-1">
                        {(() => { const it = items[0] ?? { productType: '' }; return (
                          <Select value={it.productType ?? ''} onValueChange={(v) => {
                            const newItems = [...items]; newItems[0] = { ...(newItems[0] || {}), productType: v, productId: '', productName: '', unitPrice: 0 }; setItems(newItems)
                          }}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="ประเภท" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fuel">เชื้อเพลิง</SelectItem>
                              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) })()}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700">รหัสสินค้า</label>
                      <div className="mt-1">
                        {(() => { const it = items[0] ?? { productType: '', productId: '' }; return (
                          <Select value={it.productId ?? '__none'} onValueChange={(v) => { handleItemChange(0, { productId: v === '__none' ? '' : v }) }}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="เลือกรหัสสินค้า" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none">-</SelectItem>
                              { ((it.productType === 'fuel') ? fuelProducts : allProducts.filter(p => p.category === it.productType)).map((p:any) => (
                                <SelectItem key={p.id} value={p.id}>{`${p.code ?? p.id} · ${p.name}`}</SelectItem>
                              )) }
                            </SelectContent>
                          </Select>
                        ) })()}
                      </div>
                      {validationErrors[`item_0_product`] && <div className="text-sm text-red-600 mt-1">{validationErrors[`item_0_product`]}</div>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700">ชื่อสินค้า</label>
                      <div className="mt-1">
                        <Input placeholder="ชื่อสินค้า" value={(items[0] ?? { productName: '' }).productName ?? ''} readOnly />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700">จำนวน</label>
                      <div className="mt-1">
                        <Input placeholder="จำนวน" type="number" value={(items[0] ?? { quantity: 1 }).quantity} onChange={(e) => { const newItems = [...items]; newItems[0] = { ...(newItems[0] || {}), quantity: Number(e.target.value) }; setItems(newItems) }} />
                      </div>
                      {validationErrors[`item_0_quantity`] && <div className="text-sm text-red-600 mt-1">{validationErrors[`item_0_quantity`]}</div>}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700">ราคา/หน่วย</label>
                      <div className="mt-1">
                        <Input placeholder="ราคา/หน่วย" type="number" value={(items[0] ?? { unitPrice: 0 }).unitPrice} onChange={(e) => { const newItems = [...items]; newItems[0] = { ...(newItems[0] || {}), unitPrice: Number(e.target.value) }; setItems(newItems) }} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700">ส่วนลด</label>
                      <div className="mt-1">
                        <Input placeholder="ส่วนลด" type="number" value={(items[0] ?? { discount: 0 }).discount ?? 0} onChange={(e) => { const newItems = [...items]; newItems[0] = { ...(newItems[0] || {}), discount: Number(e.target.value) }; setItems(newItems) }} />
                      </div>
                    </div>
                  </div>
                </fieldset>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Button onClick={handleSave} className="w-full py-3">{editingSale ? 'อัปเดต' : 'บันทึก'}</Button>
                  <Button variant="outline" onClick={resetForm} className="w-full py-3">ยกเลิก</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alert & Loading */}
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

      <LoadingModal loadingState={loadingState} />
    </div>
  )
}
