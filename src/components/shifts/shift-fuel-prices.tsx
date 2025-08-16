"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Save } from 'lucide-react'

export default function ShiftFuelPrices({ prices }: { prices: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const p of prices) map[p.id] = p.price
    return map
  })
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

  const startEdit = (id: string) => setEditingId(id)
  const cancelEdit = () => setEditingId(null)

  const onChange = (id: string, v: string) => {
    const num = parseFloat(v)
    setValues(prev => ({ ...prev, [id]: isNaN(num) ? 0 : num }))
  }

  const save = async (id: string) => {
    const price = values[id]
    setLoadingMap(prev => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/shifts/fuel-prices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price })
      })
      if (!res.ok) throw new Error('Failed')
      const updated = await res.json()
      setValues(prev => ({ ...prev, [id]: updated.price }))
      setEditingId(null)
    } catch (err) {
      console.error(err)
      alert('การบันทึกราคาล้มเหลว')
    } finally {
      setLoadingMap(prev => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      {prices.map(p => (
        <div key={p.id} className="p-2 border rounded flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">{p.fuelType?.name || 'ไม่ระบุ'}</div>
            {editingId === p.id ? (
              <input
                type="number"
                step="0.01"
                value={values[p.id] ?? 0}
                onChange={(e) => onChange(p.id, e.target.value)}
                className="w-32 border px-2 py-1 rounded"
                aria-label={`ราคา ${p.fuelType?.name}`}
              />
            ) : (
              <div className="text-lg font-semibold">{(values[p.id] ?? p.price).toFixed(2)} ฿</div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {editingId === p.id ? (
              <>
                <Button size="sm" onClick={() => save(p.id)} disabled={loadingMap[p.id]}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                  ยกเลิก
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => startEdit(p.id)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
