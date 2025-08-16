'use client'

import { useState } from 'react'

interface Props {
  initialData?: any
  onClose: () => void
}

export default function ShiftForm({ initialData, onClose }: Props) {
  const [name, setName] = useState(initialData?.name || '')
  const [startTime, setStartTime] = useState(initialData ? new Date(initialData.startTime).toISOString().slice(0,16) : '')
  const [endTime, setEndTime] = useState(initialData && initialData.endTime ? new Date(initialData.endTime).toISOString().slice(0,16) : '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        name,
        startTime: new Date(startTime).toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        description,
      }

      const res = await fetch('/api/shifts', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialData ? { id: initialData.id, ...payload } : payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }

      onClose()
    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">ชื่อผลัดงาน</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border px-3 py-2 rounded" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">เวลาเริ่มต้น</label>
          <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">เวลาสิ้นสุด</label>
          <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">คำอธิบาย</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border px-3 py-2 rounded" />
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-3 py-2 border rounded">ยกเลิก</button>
        <button type="submit" disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded">{loading ? 'กำลังบันทึก...' : 'บันทึก'}</button>
      </div>
    </form>
  )
}
