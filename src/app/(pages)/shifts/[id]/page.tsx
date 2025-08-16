import { prisma } from '@/lib/prisma'
import MeterManagement from '@/components/shifts/meter-management'
import TankComparison from '@/components/shifts/tank-comparison'
import SalesManagement from '@/components/shifts/sales-management'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, CheckSquare, Layers, Activity } from 'lucide-react'

export async function generateMetadata({ params }: any) {
  const shift = await prisma.shift.findUnique({ where: { id: params.id } })
  return { title: `ผลัดงาน - ${shift?.name ?? 'รายละเอียด'}` }
}

export default async function ShiftDetailPage({ params }: any) {
  const { id } = params

  const shift = await (prisma.shift as any).findUnique({
    where: { id },
    include: { meters: true, tankChecks: true, sales: true },
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
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" /> แก้ไข
          </Button>
          <Button variant="ghost" size="sm">
            <CheckSquare className="mr-2 h-4 w-4" /> ปิดผลัดงาน
          </Button>
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

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>มิเตอร์</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Client component handles fetch/edit */}
            <MeterManagement shiftId={shift.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>เทียบถัง</CardTitle>
          </CardHeader>
          <CardContent>
            <TankComparison shiftId={shift.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ขายสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesManagement shiftId={shift.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
