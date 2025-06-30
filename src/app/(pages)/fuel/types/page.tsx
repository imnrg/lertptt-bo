import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

// Mock data - in real app this would come from database
const fuelTypes = [
  {
    id: '1',
    name: 'เบนซิน 95',
    code: 'B95',
    description: 'เบนซินออกเทน 95',
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'เบนซิน 91',
    code: 'B91',
    description: 'เบนซินออกเทน 91',
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: '3',
    name: 'ดีเซล',
    code: 'DSL',
    description: 'น้ำมันดีเซล',
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: '4',
    name: 'แก๊สโซฮอล์ 95',
    code: 'E20',
    description: 'แก๊สโซฮอล์ E20',
    isActive: true,
    createdAt: '2024-01-15',
  },
]

export default function FuelTypesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">จัดการประเภทเชื้อเพลิง</h1>
          <p className="mt-2 text-sm text-gray-700">
            จัดการประเภทและรายละเอียดของเชื้อเพลิงในระบบ
          </p>
        </div>
        <Button asChild>
          <Link href="/fuel/types/new">
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มประเภทเชื้อเพลิง
          </Link>
        </Button>
      </div>

      {/* Fuel Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการประเภทเชื้อเพลิง</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อประเภท</TableHead>
                <TableHead>คำอธิบาย</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead>การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fuelTypes.map((fuelType) => (
                <TableRow key={fuelType.id}>
                  <TableCell className="font-medium">{fuelType.code}</TableCell>
                  <TableCell>{fuelType.name}</TableCell>
                  <TableCell>{fuelType.description}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      fuelType.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {fuelType.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(fuelType.createdAt).toLocaleDateString('th-TH')}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/fuel/types/${fuelType.id}/edit`}>
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