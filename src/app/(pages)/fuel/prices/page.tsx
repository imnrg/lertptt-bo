'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertModal } from '@/components/ui/alert-modal'
import { LoadingModal } from '@/components/ui/loading-modal'
import { useAlert } from '@/lib/use-alert'
import { DollarSign, Package, Fuel } from 'lucide-react'
import { formatThaiDate, getCurrentDateForInput, inputDateToBangkokDate, getBangkokTime, handleNumericInputChange, safeNumberConversion } from '@/lib/utils'

interface FuelType {
  id: string
  name: string
  code: string
  description?: string
  isActive: boolean
  createdAt: string
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
  const [historicalPrices, setHistoricalPrices] = useState<FuelPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('current')

  // Price form data for all fuel types
  const [priceFormData, setPriceFormData] = useState<{
    [key: string]: {
      price: string
    }
  }>({})

  // Global date settings for all fuel types
  const [globalDateSettings, setGlobalDateSettings] = useState({
    effectiveDate: getCurrentDateForInput(),
    endDate: ''
  })

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

  const fetchHistoricalPrices = useCallback(async () => {
    try {
      const response = await fetch('/api/fuel/prices/history')
      if (response.ok) {
        const data = await response.json()
        setHistoricalPrices(data)
        return data
      }
    } catch (error) {
      console.error('Error fetching historical prices:', error)
    }
    return []
  }, [])

  const initializePriceFormData = useCallback((fuelTypes: FuelType[], fuelPrices: FuelPrice[]) => {
    const initialPriceData: { [key: string]: { price: string } } = {}
    fuelTypes.forEach((fuelType: FuelType) => {
      const currentPrice = fuelPrices.find(price => 
        price.fuelTypeId === fuelType.id && 
        price.isActive &&
        new Date(price.effectiveDate) <= getBangkokTime() &&
        (!price.endDate || new Date(price.endDate) > getBangkokTime())
      )
      
      initialPriceData[fuelType.id] = {
        price: currentPrice?.price.toString() || ''
      }
    })
    setPriceFormData(initialPriceData)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // โหลดข้อมูลทั้งสามแบบพร้อมกัน
        const [fuelTypesData, fuelPricesData, historicalPricesData] = await Promise.all([
          fetchFuelTypes(),
          fetchFuelPrices(),
          fetchHistoricalPrices()
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
  }, [fetchFuelTypes, fetchFuelPrices, fetchHistoricalPrices, initializePriceFormData])

  const handleBulkPriceUpdate = async () => {
    const validFormData = Object.entries(priceFormData).filter(([, data]) => {
      const priceValue = typeof data.price === 'string' ? data.price : data.price
      return priceValue && safeNumberConversion(priceValue) > 0
    })
    
    if (validFormData.length === 0) {
      showAlert('กรุณาระบุราคาอย่างน้อย 1 ประเภท', 'warning')
      return
    }

    try {
      showLoading(`กำลังอัปเดตราคาเชื้อเพลิง ${validFormData.length} ประเภท...`)
      
      const bulkData = {
        fuelTypes: validFormData.map(([fuelTypeId, data]) => ({
          fuelTypeId,
          price: safeNumberConversion(data.price)
        }))
      }

      const response = await fetch('/api/fuel/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkData),
      })

      if (response.ok) {
        // โหลดข้อมูลใหม่ทั้งราคาปัจจุบันและประวัติราคา
        await Promise.all([fetchFuelPrices(), fetchHistoricalPrices()])
        
        // อัปเดตฟอร์มข้อมูลด้วยราคาใหม่
        const updatedFuelTypes = await fetchFuelTypes()
        const updatedFuelPrices = await fetchFuelPrices()
        if (updatedFuelTypes.length > 0) {
          initializePriceFormData(updatedFuelTypes, updatedFuelPrices)
        }
        
        // เคลียร์ค่าใน input field ทั้งหมด
        const clearedFormData: { [key: string]: { price: string } } = {}
        fuelTypes.forEach((fuelType) => {
          clearedFormData[fuelType.id] = { price: '' }
        })
        setPriceFormData(clearedFormData)
        
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

  const handlePriceInputChange = (fuelTypeId: string, value: string) => {
    handleNumericInputChange(value, (formattedValue) => {
      updatePriceFormData(fuelTypeId, 'price', formattedValue)
    }, {
      allowNegative: false,
      decimalPlaces: 2,
      minValue: 0,
      maxValue: 999.99
    })
  }

  const updateGlobalDateSettings = (field: string, value: string) => {
    setGlobalDateSettings(prev => ({
      ...prev,
      [field]: value
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

  const getHistoricalPrices = () => {
    return historicalPrices.sort((a, b) => {
      // เรียงตามวันที่สร้างล่าสุดก่อน
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      return dateB.getTime() - dateA.getTime()
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              อัปเดตราคาเชื้อเพลิง
            </CardTitle>
            <Button 
              onClick={handleBulkPriceUpdate} 
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
            <div className="space-y-6">
              {/* Price Forms */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">ราคาเชื้อเพลิงแต่ละประเภท</h3>
                <p>ราคา ณ วันที่ {fuelTypes.length > 0 ? formatThaiDate(fuelTypes[0].createdAt) : '-'}</p>
                {fuelTypes.map((fuelType) => {
                  const currentPrice = getCurrentPrices().find(price => price.fuelTypeId === fuelType.id)
                  const formData = priceFormData[fuelType.id] || { price: 0 }
                  
                  return (
                    <div key={fuelType.id} className="border rounded-lg p-4 shadow-sm bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                        <div className="lg:col-span-1">
                          <div className="space-y-1">
                            <div className="font-medium">{fuelType.name}</div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs ${getFuelTypeColor(fuelType.code)}`}>
                                {fuelType.code} 
                              </span>
                            </div>
                          </div>
                        </div>                        
                        <div>
                          <label className="block text-sm font-medium mb-1">ราคาปัจจุบัน (บาท/ลิตร)</label>
                          <div className="font-medium">{currentPrice ? currentPrice.price.toFixed(2) : 'ยังไม่กำหนดราคา'}</div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">ราคาใหม่ (บาท/ลิตร)</label>
                          <Input
                            type="text"
                            value={typeof formData.price === 'string' ? formData.price : formData.price}
                            onChange={(e) => handlePriceInputChange(fuelType.id, e.target.value)}
                            placeholder="0.00"
                            disabled={loadingState.isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Tables */}
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