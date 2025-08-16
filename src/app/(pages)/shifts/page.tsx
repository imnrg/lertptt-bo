import ShiftsList from '@/components/shifts/shifts-list'

export const metadata = {
  title: 'ผลัดงาน',
}

export default function ShiftsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">จัดการผลัดงาน</h1>
      <ShiftsList />
    </div>
  )
}
