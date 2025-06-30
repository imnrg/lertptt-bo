import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

// Mock data
const tanks = [
  {
    id: '1',
    name: 'ถังเก็บ A1',
    code: 'TANK-A1',
    capacity: 10000,
    currentLevel: 7500,
    minLevel: 1000,
    fuelType: 'เบนซิน 95',
    location: 'พื้นที่ A',
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'ถังเก็บ B1',
    code: 'TANK-B1',
    capacity: 8000,
    currentLevel: 3600,
    minLevel: 800,
    fuelType: 'เบนซิน 91',
    location: 'พื้นที่ B',
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: '3',
    name: 'ถังเก็บ C1',
    code: 'TANK-C1',
    capacity: 12000,
    currentLevel: 10200,
    minLevel: 1200,
    fuelType: 'ดีเซล',
    location: 'พื้นที่ C',
    isActive: true,
    createdAt: '2024-01-15',
  },
]

const getStatusColor = (currentLevel: number, minLevel: number, capacity: number) => {
  const percentage = (currentLevel / capacity) * 100
  if (percentage <= 20) return 'bg-red-100 text-red-800'
  if (percentage <= 40) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

const getStatusText = (currentLevel: number, minLevel: number, capacity: number) => {
  const percentage = (currentLevel / capacity) * 100
  if (percentage <= 20) return 'เตือน'
  if (percentage <= 40) return 'ต่ำ'
  return 'ปกติ'
}

export default function TanksPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">จัดการถังเก็บ</h1>
          <p className="mt-2 text-sm text-gray-700">
            จัดการถังเก็บน้ำมันและตรวจสอบระดับน้ำมัน
          </p>
        </div>
        <Button asChild>
          <Link href="/fuel/tanks/new">
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มถังเก็บ
          </Link>
        </Button>
      </div>

      {/* Tanks Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการถังเก็บน้ำมัน</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อถัง</TableHead>
                <TableHead>ประเภทเชื้อเพลิง</TableHead>
                <TableHead>ความจุ (ลิตร)</TableHead>
                <TableHead>ระดับปัจจุบัน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead>การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tanks.map((tank) => {
                const percentage = (tank.currentLevel / tank.capacity) * 100
                return (
                  <TableRow key={tank.id}>
                    <TableCell className="font-medium">{tank.code}</TableCell>
                    <TableCell>{tank.name}</TableCell>
                    <TableCell>{tank.fuelType}</TableCell>
                    <TableCell>{tank.capacity.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{tank.currentLevel.toLocaleString()} ลิตร</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              percentage <= 20 ? 'bg-red-500' : 
                              percentage <= 40 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{width: `${percentage}%`}}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        getStatusColor(tank.currentLevel, tank.minLevel, tank.capacity)
                      }`}>
                        {percentage <= 20 && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {getStatusText(tank.currentLevel, tank.minLevel, tank.capacity)}
                      </span>
                    </TableCell>
                    <TableCell>{tank.location}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/fuel/tanks/${tank.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}