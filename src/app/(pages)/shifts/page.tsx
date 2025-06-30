import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Eye, Clock } from 'lucide-react'
import Link from 'next/link'

// Mock data
const shifts = [
  {
    id: '1',
    name: 'กะเช้า',
    startTime: '2024-01-20T06:00:00',
    endTime: '2024-01-20T14:00:00',
    user: 'สมชาย ใจดี',
    status: 'COMPLETED',
    totalSales: 45000,
    notes: 'ขายดีมาก',
  },
  {
    id: '2',
    name: 'กะบ่าย',
    startTime: '2024-01-20T14:00:00',
    endTime: '2024-01-20T22:00:00',
    user: 'สมหญิง รักงาน',
    status: 'COMPLETED',
    totalSales: 38000,
    notes: '',
  },
  {
    id: '3',
    name: 'กะดึก',
    startTime: '2024-01-20T22:00:00',
    endTime: null,
    user: 'สมศักดิ์ ขยันทำงาน',
    status: 'ACTIVE',
    totalSales: 12000,
    notes: '',
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'กำลังทำงาน'
    case 'COMPLETED':
      return 'เสร็จสิ้น'
    case 'CANCELLED':
      return 'ยกเลิก'
    default:
      return 'ไม่ทราบ'
  }
}

export default function ShiftsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">จัดการกะงาน</h1>
          <p className="mt-2 text-sm text-gray-700">
            จัดการกะการทำงานและติดตามยอดขาย
          </p>
        </div>
        <Button asChild>
          <Link href="/shifts/new">
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มกะงาน
          </Link>
        </Button>
      </div>

      {/* Active Shift Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            กะงานที่กำลังทำงาน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">1</div>
              <div className="text-sm text-green-700">กะที่กำลังทำงาน</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">฿12,000</div>
              <div className="text-sm text-blue-700">ยอดขายกะปัจจุบัน</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">6 ชม.</div>
              <div className="text-sm text-yellow-700">เวลาที่ทำงานแล้ว</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shifts Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการกะงาน</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อกะ</TableHead>
                <TableHead>พนักงาน</TableHead>
                <TableHead>เวลาเริ่ม</TableHead>
                <TableHead>เวลาสิ้นสุด</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ยอดขาย</TableHead>
                <TableHead>หมายเหตุ</TableHead>
                <TableHead>การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{shift.name}</TableCell>
                  <TableCell>{shift.user}</TableCell>
                  <TableCell>
                    {new Date(shift.startTime).toLocaleString('th-TH', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    {shift.endTime 
                      ? new Date(shift.endTime).toLocaleString('th-TH', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'กำลังทำงาน'
                    }
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getStatusColor(shift.status)
                    }`}>
                      {getStatusText(shift.status)}
                    </span>
                  </TableCell>
                  <TableCell>฿{shift.totalSales.toLocaleString()}</TableCell>
                  <TableCell className="max-w-32 truncate">{shift.notes || '-'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/shifts/${shift.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/shifts/${shift.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}