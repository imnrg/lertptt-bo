'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'
import { DollarSign, Package, Fuel } from 'lucide-react'
import { formatThaiDate, getCurrentDateForInput, inputDateToBangkokDate, getBangkokTime } from '@/lib/utils'

interface FuelType {
  id: string
  name: string
  code: string
  description?: string
  isActive: boolean
}

interface FuelPrice {
  id: string
  fuelTypeId: string
  price: number
  effectiveDate: string
  endDate?: string
  isActive: boolean
  createdAt: string
  fuelType: {
    id: string
    name: string
    code: string
  }
}

export default function FuelPriceManagementPage() {
  const { alertState, loadingState, showAlert, showLoading, hideLoading, closeAlert } = useAlert()
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('current')

  // Price form data for all fuel types
  const [priceFormData, setPriceFormData] = useState<{
    [key: string]: {
      price: number
      effectiveDate: string
      endDate: string
    }
  }>({})

  const fetchFuelTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/fuel/types')
      if (response.ok) {
        const data = await response.json()
        const activeFuelTypes = data.filter((fuelType: FuelType) => fuelType.isActive)
        setFuelTypes(activeFuelTypes)
        return activeFuelTypes
      }
    } catch (error) {
      console.error('Error fetching fuel types:', error)
    }
    return []
  }, [])

  const fetchFuelPrices = useCallback(async () => {
    try {
      const response = await fetch('/api/fuel/prices')
      if (response.ok) {
        const data = await response.json()
        setFuelPrices(data)
        return data
      }
    } catch (error) {
      console.error('Error fetching fuel prices:', error)
    }
    return []
  }, [])

  const initializePriceFormData = useCallback((fuelTypes: FuelType[], fuelPrices: FuelPrice[]) => {
    const initialPriceData: { [key: string]: { price: number; effectiveDate: string; endDate: string } } = {}
    fuelTypes.forEach((fuelType: FuelType) => {
      const currentPrice = fuelPrices.find(price => 
        price.fuelTypeId === fuelType.id && 
        price.isActive &&
        new Date(price.effectiveDate) <= getBangkokTime() &&
        (!price.endDate || new Date(price.endDate) > getBangkokTime())
      )
      
      initialPriceData[fuelType.id] = {
        price: currentPrice?.price || 0,
        effectiveDate: getCurrentDateForInput(),
        endDate: ''
      }
    })
    setPriceFormData(initialPriceData)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // โหลดข้อมูลทั้งสองแบบพร้อมกัน
        const [fuelTypesData, fuelPricesData] = await Promise.all([
          fetchFuelTypes(),
          fetchFuelPrices()
        ])
        
        // กำหนดค่าเริ่มต้นสำหรับฟอร์มราคา
        if (fuelTypesData.length > 0) {
          initializePriceFormData(fuelTypesData, fuelPricesData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [fetchFuelTypes, fetchFuelPrices, initializePriceFormData])

  const handlePriceUpdate = async (fuelTypeId: string) => {
    const formData = priceFormData[fuelTypeId]
    if (!formData || formData.price <= 0) {
      showAlert('กรุณาระบุราคาที่ถูกต้อง', 'warning')
      return
    }

    try {
      showLoading('กำลังอัปเดตราคาเชื้อเพลิง...')
      
      // Convert input date to Bangkok timezone
      const effectiveDate = inputDateToBangkokDate(formData.effectiveDate)
      const endDate = formData.endDate ? inputDateToBangkokDate(formData.endDate) : undefined

      const response = await fetch('/api/fuel/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fuelTypeId,
          price: Number(formData.price),
          effectiveDate: effectiveDate.toISOString(),
          endDate: endDate?.toISOString(),
        }),
      })

      if (response.ok) {
        await fetchFuelPrices()
        hideLoading()
        showAlert('อัปเดตราคาเชื้อเพลิงสำเร็จ', 'success')
      } else {
        const error = await response.json()
        hideLoading()
        showAlert(error.error || 'เกิดข้อผิดพลาด', 'error')
      }
    } catch (error) {
      console.error('Error updating fuel price:', error)
      hideLoading()
      showAlert('เกิดข้อผิดพลาด', 'error')
    }
  }

  const handleBulkPriceUpdate = async () => {
    const validFormData = Object.entries(priceFormData).filter(([, data]) => data.price > 0)
    
    if (validFormData.length === 0) {
      showAlert('กรุณาระบุราคาอย่างน้อย 1 ประเภท', 'warning')
      return
    }

    try {
      showLoading(`กำลังอัปเดตราคาเชื้อเพลิง ${validFormData.length} ประเภท...`)
      
      // Convert input dates to Bangkok timezone
      const effectiveDate = inputDateToBangkokDate(validFormData[0][1].effectiveDate)
      const endDate = validFormData[0][1].endDate ? inputDateToBangkokDate(validFormData[0][1].endDate) : undefined

      const bulkData = {
        fuelTypes: validFormData.map(([fuelTypeId, data]) => ({
          fuelTypeId,
          price: Number(data.price)
        })),
        effectiveDate: effectiveDate.toISOString(),
        endDate: endDate?.toISOString()
      }

      const response = await fetch('/api/fuel/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkData),
      })

      if (response.ok) {
        await fetchFuelPrices()
        hideLoading()
        showAlert('อัปเดตราคาเชื้อเพลิงทั้งหมดสำเร็จ', 'success')
      } else {
        const error = await response.json()
        hideLoading()
        showAlert(error.error || 'เกิดข้อผิดพลาด', 'error')
      }
    } catch (error) {
      console.error('Error bulk updating fuel prices:', error)
      hideLoading()
      showAlert('เกิดข้อผิดพลาด', 'error')
    }
  }

  const updatePriceFormData = (fuelTypeId: string, field: string, value: string | number) => {
    setPriceFormData(prev => ({
      ...prev,
      [fuelTypeId]: {
        ...prev[fuelTypeId],
        [field]: value
      }
    }))
  }

  const getCurrentPrices = () => {
    const now = getBangkokTime()
    return fuelPrices.filter(price => {
      const effectiveDate = new Date(price.effectiveDate)
      const endDate = price.endDate ? new Date(price.endDate) : null
      return effectiveDate <= now && (!endDate || endDate > now) && price.isActive
    })
  }

  const getFuturePrices = () => {
    const now = getBangkokTime()
    return fuelPrices.filter(price => {
      const effectiveDate = new Date(price.effectiveDate)
      return effectiveDate > now && price.isActive
    })
  }

  const getHistoricalPrices = () => {
    const now = getBangkokTime()
    return fuelPrices.filter(price => {
      const endDate = price.endDate ? new Date(price.endDate) : null
      return endDate && endDate <= now
    })
  }

  // ฟังก์ชันสำหรับแสดงสีตามประเภทน้ำมัน
  const getFuelTypeColor = (fuelTypeCode: string) => {
    const colors: Record<string, string> = {
      'GASOHOL_91': 'bg-green-100 text-green-800',
      'GASOHOL_95': 'bg-blue-100 text-blue-800',
      'BENZINE_91': 'bg-yellow-100 text-yellow-800',
      'BENZINE_95': 'bg-orange-100 text-orange-800',
      'DIESEL': 'bg-red-100 text-red-800',
      'E20': 'bg-purple-100 text-purple-800',
      'E85': 'bg-indigo-100 text-indigo-800',
    }
    return colors[fuelTypeCode] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Fuel className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p>กำลังโหลดข้อมูลราคาเชื้อเพลิง...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">จัดการราคาเชื้อเพลิง</h1>
            <p className="text-gray-600">กำหนดและควบคุมราคาเชื้อเพลิงแต่ละประเภท</p>
          </div>
        </div>
      </div>

      {/* สถิติราคาน้ำมันปัจจุบัน */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ราคาปัจจุบัน</p>
                <p className="text-2xl font-bold">{getCurrentPrices().length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ราคาในอนาคต</p>
                <p className="text-2xl font-bold">{getFuturePrices().length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ประเภทเชื้อเพลิง</p>
                <p className="text-2xl font-bold">{fuelTypes.length}</p>
              </div>
              <Fuel className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Update Form */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              อัปเดตราคาเชื้อเพลิง
            </CardTitle>
            <Button 
              onClick={handleBulkPriceUpdate} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loadingState.isLoading}
            >
              <Package className="w-4 h-4 mr-2" />
              อัปเดตราคาทั้งหมด
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fuelTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Fuel className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบประเภทเชื้อเพลิง</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fuelTypes.map((fuelType) => {
                const currentPrice = getCurrentPrices().find(price => price.fuelTypeId === fuelType.id)
                const formData = priceFormData[fuelType.id] || { price: 0, effectiveDate: '', endDate: '' }
                
                return (
                  <div key={fuelType.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-end">
                      <div className="lg:col-span-1">
                        <label className="block text-sm font-medium mb-1">ประเภทเชื้อเพลิง</label>
                        <div className="space-y-1">
                          <div className="font-medium">{fuelType.name}</div>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${getFuelTypeColor(fuelType.code)}`}>
                            {fuelType.code}
                          </span>
                          {currentPrice && (
                            <div className="text-sm text-gray-600">
                              ปัจจุบัน: ฿{currentPrice.price.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">ราคาใหม่ (บาท/ลิตร)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => updatePriceFormData(fuelType.id, 'price', Number(e.target.value))}
                          placeholder="0.00"
                          disabled={loadingState.isLoading}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">วันที่มีผล</label>
                        <Input
                          type="date"
                          value={formData.effectiveDate}
                          onChange={(e) => updatePriceFormData(fuelType.id, 'effectiveDate', e.target.value)}
                          disabled={loadingState.isLoading}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">วันที่สิ้นสุด (ไม่บังคับ)</label>
                        <Input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => updatePriceFormData(fuelType.id, 'endDate', e.target.value)}
                          disabled={loadingState.isLoading}
                        />
                      </div>
                      
                      <div className="lg:col-span-2">
                        <Button 
                          onClick={() => handlePriceUpdate(fuelType.id)}
                          disabled={!formData.price || formData.price <= 0 || loadingState.isLoading}
                          className="w-full"
                          variant="outline"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          อัปเดตราคา {fuelType.code}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
              <CardTitle>ราคาเชื้อเพลิงปัจจุบัน</CardTitle>
            </CardHeader>
            <CardContent>
              {getCurrentPrices().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Fuel className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่มีราคาเชื้อเพลิงปัจจุบัน</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ประเภทเชื้อเพลิง</TableHead>
                      <TableHead>รหัส</TableHead>
                      <TableHead className="text-right">ราคา (บาท/ลิตร)</TableHead>
                      <TableHead>วันที่มีผล</TableHead>
                      <TableHead>วันที่สิ้นสุด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentPrices().map((price) => (
                      <TableRow key={price.id}>
                        <TableCell className="font-medium">{price.fuelType.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-sm ${getFuelTypeColor(price.fuelType.code)}`}>
                            {price.fuelType.code}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium text-lg">
                          ฿{price.price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {formatThaiDate(price.effectiveDate)}
                        </TableCell>
                        <TableCell>
                          {price.endDate ? formatThaiDate(price.endDate) : 'ไม่กำหนด'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="future">
          <Card>
            <CardHeader>
              <CardTitle>ราคาเชื้อเพลิงในอนาคต</CardTitle>
            </CardHeader>
            <CardContent>
              {getFuturePrices().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Fuel className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่มีราคาเชื้อเพลิงที่กำหนดไว้ในอนาคต</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ประเภทเชื้อเพลิง</TableHead>
                      <TableHead>รหัส</TableHead>
                      <TableHead className="text-right">ราคา (บาท/ลิตร)</TableHead>
                      <TableHead>วันที่มีผล</TableHead>
                      <TableHead>วันที่สิ้นสุด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFuturePrices().map((price) => (
                      <TableRow key={price.id}>
                        <TableCell className="font-medium">{price.fuelType.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-sm ${getFuelTypeColor(price.fuelType.code)}`}>
                            {price.fuelType.code}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium text-lg">
                          ฿{price.price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {formatThaiDate(price.effectiveDate)}
                        </TableCell>
                        <TableCell>
                          {price.endDate ? formatThaiDate(price.endDate) : 'ไม่กำหนด'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>ประวัติราคาเชื้อเพลิง</CardTitle>
            </CardHeader>
            <CardContent>
              {getHistoricalPrices().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Fuel className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่มีประวัติราคาเชื้อเพลิง</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ประเภทเชื้อเพลิง</TableHead>
                      <TableHead>รหัส</TableHead>
                      <TableHead className="text-right">ราคา (บาท/ลิตร)</TableHead>
                      <TableHead>วันที่มีผล</TableHead>
                      <TableHead>วันที่สิ้นสุด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getHistoricalPrices().map((price) => (
                      <TableRow key={price.id}>
                        <TableCell className="font-medium">{price.fuelType.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-sm ${getFuelTypeColor(price.fuelType.code)}`}>
                            {price.fuelType.code}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          ฿{price.price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {formatThaiDate(price.effectiveDate)}
                        </TableCell>
                        <TableCell>
                          {price.endDate ? formatThaiDate(price.endDate) : 'ไม่กำหนด'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        onConfirm={alertState.onConfirm}
        showCancel={alertState.showCancel}
      />

      {/* Loading Modal */}
      <LoadingModal loadingState={loadingState} />
    </div>
  )
}