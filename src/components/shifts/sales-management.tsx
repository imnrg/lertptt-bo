'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'

interface SaleItem {
  id?: string
  productId: string
  productName?: string
  quantity: number
  unitPrice: number
  discount?: number
}

interface Sale {
  id: string
  debtorId?: string | null
  licensePlate?: string | null
  deliveryNote?: string | null
  items: SaleItem[]
  total: number
}

export default function SalesManagement({ shiftId }: { shiftId: string }) {
  const { alertState, loadingState, showAlert, showConfirm, showLoading, hideLoading, closeAlert } = useAlert()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [items, setItems] = useState<SaleItem[]>([])

  const fetchSales = async () => {
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
  }

  useEffect(() => { fetchSales() }, [shiftId])

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0 }])
  }

  const handleSave = async () => {
    try {
      showLoading('กำลังบันทึกการขาย...')
      const payload = {
        shiftId,
        debtorId: null,
        licensePlate: null,
        deliveryNote: null,
        // flatten items into individual sale records for API shape
        items: items.map(it => ({ ...it }))
      }
      const res = await fetch('/api/shifts/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      hideLoading()
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Failed to save sales', err)
        showAlert('บันทึกไม่สำเร็จ', 'error')
        return
      }
      showAlert('บันทึกการขายสำเร็จ', 'success')
      setShowForm(false)
      setItems([])
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

  return (
    <div>
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

      <div className="flex justify-between mb-4">
        <div className="text-sm text-gray-600">จำนวนรายการ: {sales.length}</div>
        <Button onClick={() => setShowForm(true)} className="bg-green-600">เพิ่มการขาย</Button>
      </div>

      {loading ? (
        <p className="text-gray-600">กำลังโหลดการขาย...</p>
      ) : (
        <div className="space-y-3">
          {sales.map((s) => (
            <div key={s.id} className="p-3 border rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm">บิล: {s.id}</div>
                  <div className="text-sm">ทะเบียน: {s.licensePlate ?? '-'}</div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <div className="text-sm">รายการ: {s.items.length}</div>
                    <div className="text-sm font-semibold">฿{s.total.toFixed(2)}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(s)}>ลบ</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="p-3 border rounded bg-gray-50 mt-3">
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex gap-2">
                <Input placeholder="รหัสสินค้า" value={it.productId} onChange={(e) => { const newItems = [...items]; newItems[idx].productId = e.target.value; setItems(newItems) }} className="w-40" />
                <Input placeholder="จำนวน" type="number" value={it.quantity} onChange={(e) => { const newItems = [...items]; newItems[idx].quantity = Number(e.target.value); setItems(newItems) }} className="w-24" />
                <Input placeholder="ราคา/หน่วย" type="number" value={it.unitPrice} onChange={(e) => { const newItems = [...items]; newItems[idx].unitPrice = Number(e.target.value); setItems(newItems) }} className="w-32" />
                <Input placeholder="ส่วนลด" type="number" value={it.discount ?? 0} onChange={(e) => { const newItems = [...items]; newItems[idx].discount = Number(e.target.value); setItems(newItems) }} className="w-24" />
              </div>
            ))}

            <div className="flex gap-2">
              <Button onClick={handleAddItem} className="bg-blue-600">เพิ่ม</Button>
              <Button onClick={handleSave} className="bg-green-600">บันทึก</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>ยกเลิก</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
