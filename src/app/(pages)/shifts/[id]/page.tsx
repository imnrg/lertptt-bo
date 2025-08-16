import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ShiftTabs from '@/components/shifts/shift-tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, Layers, Activity, Edit } from 'lucide-react'
import ShiftFuelPrices from '@/components/shifts/shift-fuel-prices'

export async function generateMetadata({ params }: any) {
  const { id } = await params
  const shift = await prisma.shift.findUnique({ where: { id } })
  return { title: `ผลัดงาน - ${shift?.name ?? 'รายละเอียด'}` }
}

export default async function ShiftDetailPage({ params }: any) {
  const { id } = await params

  const shift = await (prisma.shift as any).findUnique({
    where: { id },
    include: { meters: true, tankChecks: true, sales: true, shiftFuelPrices: { include: { fuelType: true } } },
  }) as any

  if (!shift) return <div className="p-6">ไม่พบผลัดงาน</div>

  // summary numbers for UI cards
  const metersCount = (shift.meters ?? []).length
  const tankChecksCount = (shift.tankChecks ?? []).length
  const salesCount = (shift.sales ?? []).length
  const totalSales = (shift.sales ?? []).reduce((acc: number, s: any) => acc + (s.netTotal ?? s.total ?? 0), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{shift.name}</h1>
          <p className="text-sm text-gray-600">{new Date(shift.startTime).toLocaleString()} - {shift.endTime ? new Date(shift.endTime).toLocaleString() : 'กำลังทำงาน'}</p>
          {shift.description && <p className="mt-2 text-sm text-gray-700">{shift.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/shifts">
            <Button>ย้อนกลับ</Button>
          </Link>
          {/* actions removed: Edit and Close Shift buttons intentionally omitted */}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">หัวจ่าย (มิเตอร์)</p>
              <p className="text-2xl font-bold">{metersCount}</p>
            </div>
            <Layers className="w-8 h-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">การเทียบถัง</p>
              <p className="text-2xl font-bold">{tankChecksCount}</p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">รายการขาย</p>
              <p className="text-2xl font-bold">{salesCount}</p>
            </div>
            <Edit className="w-8 h-8 text-yellow-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ยอดขายรวม (฿)</p>
              <p className="text-2xl font-bold">{totalSales.toFixed(2)}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-red-600" />
          </CardContent>
        </Card>
      </div>

      {/* Stamped fuel prices */}
      <Card>
        <CardHeader>
          <CardTitle>ราคาน้ำมันประจำผลัด</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Client component handles edit/delete */}
          <div id="shift-fuel-prices-root">
            <ShiftFuelPrices prices={shift.shiftFuelPrices ?? []} />
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div>
        <ShiftTabs shiftId={shift.id} />
      </div>
    </div>
  )
}
