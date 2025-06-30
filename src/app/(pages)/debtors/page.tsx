import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Eye, AlertCircle, DollarSign } from 'lucide-react'
import Link from 'next/link'

// Mock data
const debtors = [
  {
    id: '1',
    customerName: 'บริษัท ABC จำกัด',
    customerPhone: '02-123-4567',
    customerEmail: 'contact@abc.com',
    amount: 25000,
    description: 'ซื้อน้ำมันดีเซล 1,000 ลิตร',
    dueDate: '2024-02-15',
    status: 'PENDING',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    customerName: 'ร้านสมชาย',
    customerPhone: '081-234-5678',
    customerEmail: '',
    amount: 8500,
    description: 'ซื้อน้ำมันเบนซิน 95',
    dueDate: '2024-02-10',
    status: 'OVERDUE',
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    customerName: 'คุณสมหญิง ใจดี',
    customerPhone: '089-876-5432',
    customerEmail: 'somying@email.com',
    amount: 5000,
    description: 'ซื้อน้ำมันเครื่อง',
    dueDate: '2024-01-25',
    status: 'PARTIAL',
    createdAt: '2024-01-05',
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'PARTIAL':
      return 'bg-blue-100 text-blue-800'
    case 'PAID':
      return 'bg-green-100 text-green-800'
    case 'OVERDUE':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'รอชำระ'
    case 'PARTIAL':
      return 'ชำระบางส่วน'
    case 'PAID':
      return 'ชำระแล้ว'
    case 'OVERDUE':
      return 'เกินกำหนด'
    default:
      return 'ไม่ทราบ'
  }
}

const isOverdue = (dueDate: string) => {
  return new Date(dueDate) < new Date()
}

export default function DebtorsPage() {
  const totalDebt = debtors.reduce((sum, debtor) => sum + debtor.amount, 0)
  const overdueCount = debtors.filter(d => d.status === 'OVERDUE').length
  const pendingCount = debtors.filter(d => d.status === 'PENDING').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">จัดการลูกหนี้</h1>
          <p className="mt-2 text-sm text-gray-700">
            จัดการข้อมูลลูกหนี้และติดตามการชำระเงิน
          </p>
        </div>
        <Button asChild>
          <Link href="/debtors/new">
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มลูกหนี้
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    หนี้รวมทั้งหมด
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ฿{totalDebt.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-yellow-500 p-3 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    รายการรอชำระ
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {pendingCount} รายการ
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-red-500 p-3 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    เกินกำหนดชำระ
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {overdueCount} รายการ
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debtors Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการลูกหนี้</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อลูกค้า</TableHead>
                <TableHead>เบอร์โทร</TableHead>
                <TableHead>จำนวนเงิน</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead>กำหนดชำระ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead>การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debtors.map((debtor) => (
                <TableRow key={debtor.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{debtor.customerName}</div>
                      {debtor.customerEmail && (
                        <div className="text-sm text-gray-500">{debtor.customerEmail}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{debtor.customerPhone}</TableCell>
                  <TableCell className="font-medium">
                    ฿{debtor.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="max-w-48 truncate">
                    {debtor.description}
                  </TableCell>
                  <TableCell>
                    <div className={`${isOverdue(debtor.dueDate) && debtor.status !== 'PAID' ? 'text-red-600 font-medium' : ''}`}>
                      {new Date(debtor.dueDate).toLocaleDateString('th-TH')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getStatusColor(debtor.status)
                    }`}>
                      {getStatusText(debtor.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(debtor.createdAt).toLocaleDateString('th-TH')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/debtors/${debtor.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/debtors/${debtor.id}/edit`}>
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