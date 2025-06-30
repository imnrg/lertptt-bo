import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'

// Mock data
const products = [
  {
    id: '1',
    name: 'เบนซิน 95',
    code: 'PROD-B95',
    category: 'เชื้อเพลิง',
    price: 35.50,
    cost: 32.00,
    stockQuantity: 10000,
    minStock: 1000,
    unit: 'ลิตร',
    isActive: true,
  },
  {
    id: '2',
    name: 'น้ำมันเครื่อง Shell 10W-40',
    code: 'PROD-OIL01',
    category: 'น้ำมันเครื่อง',
    price: 350.00,
    cost: 280.00,
    stockQuantity: 25,
    minStock: 10,
    unit: 'ขวด',
    isActive: true,
  },
  {
    id: '3',
    name: 'น้ำมันเกียร์ ATF',
    code: 'PROD-ATF01',
    category: 'น้ำมันเกียร์',
    price: 280.00,
    cost: 220.00,
    stockQuantity: 8,
    minStock: 5,
    unit: 'ขวด',
    isActive: true,
  },
]

const getStockStatus = (current: number, min: number) => {
  if (current <= min) return { color: 'bg-red-100 text-red-800', text: 'ต่ำ' }
  if (current <= min * 1.5) return { color: 'bg-yellow-100 text-yellow-800', text: 'เตือน' }
  return { color: 'bg-green-100 text-green-800', text: 'ปกติ' }
}

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">จัดการสินค้า</h1>
          <p className="mt-2 text-sm text-gray-700">
            จัดการสินค้าและตรวจสอบสต็อกสินค้า
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มสินค้า
          </Link>
        </Button>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัสสินค้า</TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead>ราคาขาย</TableHead>
                <TableHead>ราคาต้นทุน</TableHead>
                <TableHead>สต็อก</TableHead>
                <TableHead>สถานะสต็อก</TableHead>
                <TableHead>การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const stockStatus = getStockStatus(product.stockQuantity, product.minStock)
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>฿{product.price.toFixed(2)}</TableCell>
                    <TableCell>฿{product.cost.toFixed(2)}</TableCell>
                    <TableCell>
                      {product.stockQuantity.toLocaleString()} {product.unit}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/products/${product.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/products/${product.id}/edit`}>
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