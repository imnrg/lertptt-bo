'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, DollarSign, Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  code: string
  description?: string
  fuelType?: {
    name: string
    code: string
  }
  isActive: boolean
}

interface ProductPrice {
  id: string
  productId: string
  price: number
  effectiveDate: string
  endDate?: string
  isActive: boolean
  createdAt: string
  product: {
    id: string
    name: string
    code: string
    fuelType?: {
      name: string
      code: string
    }
  }
}

interface BulkPriceItem {
  productId: string
  price: number
}

export default function PriceManagementPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [prices, setPrices] = useState<ProductPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [showSingleForm, setShowSingleForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [activeTab, setActiveTab] = useState('current')

  // Single price form
  const [singleFormData, setSingleFormData] = useState({
    productId: '',
    price: 0,
    effectiveDate: '',
    endDate: ''
  })

  // Bulk price form
  const [bulkFormData, setBulkFormData] = useState({
    products: [] as BulkPriceItem[],
    effectiveDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchProducts()
    fetchPrices()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.filter((p: Product) => p.isActive))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/fuel/products/prices')
      if (response.ok) {
        const data = await response.json()
        setPrices(data)
      }
    } catch (error) {
      console.error('Error fetching prices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/fuel/products/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...singleFormData,
          price: Number(singleFormData.price),
        }),
      })

      if (response.ok) {
        await fetchPrices()
        handleCloseSingleForm()
        alert('กำหนดราคาสำเร็จ')
      } else {
        const error = await response.json()
        alert(error.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      console.error('Error saving price:', error)
      alert('เกิดข้อผิดพลาด')
    }
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (bulkFormData.products.length === 0) {
      alert('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ')
      return
    }

    try {
      const response = await fetch('/api/fuel/products/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkFormData),
      })

      if (response.ok) {
        await fetchPrices()
        handleCloseBulkForm()
        alert('อัปเดตราคาหลายรายการสำเร็จ')
      } else {
        const error = await response.json()
        alert(error.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      console.error('Error bulk updating prices:', error)
      alert('เกิดข้อผิดพลาด')
    }
  }

  const handleCloseSingleForm = () => {
    setShowSingleForm(false)
    setSingleFormData({
      productId: '',
      price: 0,
      effectiveDate: '',
      endDate: ''
    })
  }

  const handleCloseBulkForm = () => {
    setShowBulkForm(false)
    setBulkFormData({
      products: [],
      effectiveDate: '',
      endDate: ''
    })
  }

  const addProductToBulk = () => {
    setBulkFormData({
      ...bulkFormData,
      products: [...bulkFormData.products, { productId: '', price: 0 }]
    })
  }

  const updateBulkProduct = (index: number, field: keyof BulkPriceItem, value: string | number) => {
    const updatedProducts = [...bulkFormData.products]
    updatedProducts[index] = { ...updatedProducts[index], [field]: value }
    setBulkFormData({ ...bulkFormData, products: updatedProducts })
  }

  const removeBulkProduct = (index: number) => {
    const updatedProducts = bulkFormData.products.filter((_, i) => i !== index)
    setBulkFormData({ ...bulkFormData, products: updatedProducts })
  }

  const getCurrentPrices = () => {
    const now = new Date()
    return prices.filter(price => {
      const effectiveDate = new Date(price.effectiveDate)
      const endDate = price.endDate ? new Date(price.endDate) : null
      return effectiveDate <= now && (!endDate || endDate > now) && price.isActive
    })
  }

  const getFuturePrices = () => {
    const now = new Date()
    return prices.filter(price => {
      const effectiveDate = new Date(price.effectiveDate)
      return effectiveDate > now && price.isActive
    })
  }

  const getHistoricalPrices = () => {
    const now = new Date()
    return prices.filter(price => {
      const endDate = price.endDate ? new Date(price.endDate) : null
      return endDate && endDate <= now
    })
  }

  if (loading) {
    return <div className="p-6">กำลังโหลด...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">จัดการราคาผลิตภัณฑ์</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowSingleForm(true)}>
            <DollarSign className="w-4 h-4 mr-2" />
            กำหนดราคาเดี่ยว
          </Button>
          <Button onClick={() => setShowBulkForm(true)} variant="outline">
            <Package className="w-4 h-4 mr-2" />
            อัปเดตราคาหลายรายการ
          </Button>
        </div>
      </div>

      {/* Single Price Form */}
      {showSingleForm && (
        <Card>
          <CardHeader>
            <CardTitle>กำหนดราคาสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">เลือกสินค้า</label>
                  <Select
                    value={singleFormData.productId}
                    onValueChange={(value: string) => setSingleFormData({ ...singleFormData, productId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสินค้า" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.code})
                          {product.fuelType && ` - ${product.fuelType.name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ราคา (บาท)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={singleFormData.price}
                    onChange={(e) => setSingleFormData({ ...singleFormData, price: Number(e.target.value) })}
                    placeholder="38.50"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">วันที่มีผล</label>
                  <Input
                    type="datetime-local"
                    value={singleFormData.effectiveDate}
                    onChange={(e) => setSingleFormData({ ...singleFormData, effectiveDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">วันที่สิ้นสุด (ไม่บังคับ)</label>
                  <Input
                    type="datetime-local"
                    value={singleFormData.endDate}
                    onChange={(e) => setSingleFormData({ ...singleFormData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">กำหนดราคา</Button>
                <Button type="button" variant="outline" onClick={handleCloseSingleForm}>
                  ยกเลิก
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bulk Price Form */}
      {showBulkForm && (
        <Card>
          <CardHeader>
            <CardTitle>อัปเดตราคาหลายรายการ</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">วันที่มีผล</label>
                  <Input
                    type="datetime-local"
                    value={bulkFormData.effectiveDate}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, effectiveDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">วันที่สิ้นสุด (ไม่บังคับ)</label>
                  <Input
                    type="datetime-local"
                    value={bulkFormData.endDate}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium">รายการสินค้าและราคา</label>
                  <Button type="button" size="sm" onClick={addProductToBulk}>
                    <Plus className="w-4 h-4 mr-1" />
                    เพิ่มสินค้า
                  </Button>
                </div>
                
                {bulkFormData.products.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border rounded">
                    <Select
                      value={item.productId}
                      onValueChange={(value: string) => updateBulkProduct(index, 'productId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสินค้า" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="ราคา"
                      value={item.price}
                      onChange={(e) => updateBulkProduct(index, 'price', Number(e.target.value))}
                    />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm"
                      onClick={() => removeBulkProduct(index)}
                    >
                      ลบ
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button type="submit">อัปเดตราคา</Button>
                <Button type="button" variant="outline" onClick={handleCloseBulkForm}>
                  ยกเลิก
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Price Tables */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="current">ราคาปัจจุบัน</TabsTrigger>
          <TabsTrigger value="future">ราคาในอนาคต</TabsTrigger>
          <TabsTrigger value="history">ประวัติราคา</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>ราคาปัจจุบัน</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>สินค้า</TableHead>
                    <TableHead>รหัสสินค้า</TableHead>
                    <TableHead>ประเภทเชื้อเพลิง</TableHead>
                    <TableHead>ราคา (บาท)</TableHead>
                    <TableHead>วันที่มีผล</TableHead>
                    <TableHead>วันที่สิ้นสุด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCurrentPrices().map((price) => (
                    <TableRow key={price.id}>
                      <TableCell className="font-medium">{price.product.name}</TableCell>
                      <TableCell>{price.product.code}</TableCell>
                      <TableCell>
                        {price.product.fuelType ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {price.product.fuelType.name}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ฿{price.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {new Date(price.effectiveDate).toLocaleString('th-TH')}
                      </TableCell>
                      <TableCell>
                        {price.endDate ? new Date(price.endDate).toLocaleString('th-TH') : 'ไม่กำหนด'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="future">
          <Card>
            <CardHeader>
              <CardTitle>ราคาในอนาคต</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>สินค้า</TableHead>
                    <TableHead>รหัสสินค้า</TableHead>
                    <TableHead>ประเภทเชื้อเพลิง</TableHead>
                    <TableHead>ราคา (บาท)</TableHead>
                    <TableHead>วันที่มีผล</TableHead>
                    <TableHead>วันที่สิ้นสุด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFuturePrices().map((price) => (
                    <TableRow key={price.id}>
                      <TableCell className="font-medium">{price.product.name}</TableCell>
                      <TableCell>{price.product.code}</TableCell>
                      <TableCell>
                        {price.product.fuelType ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {price.product.fuelType.name}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ฿{price.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {new Date(price.effectiveDate).toLocaleString('th-TH')}
                      </TableCell>
                      <TableCell>
                        {price.endDate ? new Date(price.endDate).toLocaleString('th-TH') : 'ไม่กำหนด'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>ประวัติราคา</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>สินค้า</TableHead>
                    <TableHead>รหัสสินค้า</TableHead>
                    <TableHead>ประเภทเชื้อเพลิง</TableHead>
                    <TableHead>ราคา (บาท)</TableHead>
                    <TableHead>วันที่มีผล</TableHead>
                    <TableHead>วันที่สิ้นสุด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getHistoricalPrices().map((price) => (
                    <TableRow key={price.id}>
                      <TableCell className="font-medium">{price.product.name}</TableCell>
                      <TableCell>{price.product.code}</TableCell>
                      <TableCell>
                        {price.product.fuelType ? (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                            {price.product.fuelType.name}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        ฿{price.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {new Date(price.effectiveDate).toLocaleString('th-TH')}
                      </TableCell>
                      <TableCell>
                        {price.endDate ? new Date(price.endDate).toLocaleString('th-TH') : 'ไม่กำหนด'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}